#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { treeFingerprint, writeJsonAtomic } from './final-qa-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const receiptPath = join(root, 'devlog/260715_production_upgrade/113_final_server_receipt.json');
const expectedRoot = realpathSync(join(root, '.pages'));
const child = spawn(process.execPath, ['scripts/serve-static.mjs', '--root', '.pages', '--host', '127.0.0.1', '--port', '0'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
let output = '';
child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { output += chunk; });
function waitForServer() {
  return new Promise((resolveWait, reject) => {
    const started = Date.now(); const timer = setInterval(() => {
      const match = output.match(/static server http:\/\/127\.0\.0\.1:(\d+) root=(.+)/);
      if (match) { clearInterval(timer); resolveWait({ port: Number(match[1]), servedRoot: match[2].trim() }); }
      else if (Date.now() - started > 8000) { clearInterval(timer); reject(new Error(`server readiness timeout: ${output}`)); }
    }, 25);
    child.once('exit', code => { clearInterval(timer); reject(new Error(`server exited before ready: ${code} ${output}`)); });
  });
}
async function probe(base, id, path, options, expected) {
  const response = await fetch(base + path, options); const body = Buffer.from(await response.arrayBuffer());
  const row = { id, method: options?.method ?? 'GET', path, status: response.status, bodyBytes: body.length, allow: response.headers.get('allow') };
  if (row.status !== expected.status) throw new Error(`${id}: ${row.status} != ${expected.status}`);
  if (expected.bodyBytes !== undefined && row.bodyBytes !== expected.bodyBytes) throw new Error(`${id}: body ${row.bodyBytes} != ${expected.bodyBytes}`);
  if (expected.allow !== undefined && row.allow !== expected.allow) throw new Error(`${id}: Allow ${row.allow}`);
  return row;
}
let port; const probes = []; let exitCode = null; let exitSignal = null; let forced = false; let portClosed = false;
try {
  const ready = await waitForServer(); port = ready.port;
  if (ready.servedRoot !== expectedRoot || child.pid <= 0) throw new Error(`server ownership mismatch pid=${child.pid} root=${ready.servedRoot}`);
  const base = `http://127.0.0.1:${port}`;
  probes.push(await probe(base, 'get-index', '/index.html', {}, { status: 200 }));
  probes.push(await probe(base, 'head-index', '/index.html', { method: 'HEAD' }, { status: 200, bodyBytes: 0 }));
  probes.push(await probe(base, 'post-index', '/index.html', { method: 'POST' }, { status: 405, allow: 'GET, HEAD' }));
  probes.push(await probe(base, 'missing', '/missing.txt', {}, { status: 404 }));
  probes.push(await probe(base, 'encoded-traversal', '/%252e%252e%252fpackage.json', {}, { status: 404 }));
  probes.push(await probe(base, 'encoded-slash', '/..%2fpackage.json', {}, { status: 404 }));
  probes.push(await probe(base, 'malformed-encoding', '/%ZZ', {}, { status: 400 }));
} finally {
  const exited = new Promise(resolveExit => child.once('exit', (code, signal) => { exitCode = code; exitSignal = signal; resolveExit(true); }));
  child.kill('SIGTERM'); const graceful = await Promise.race([exited, new Promise(resolveWait => setTimeout(() => resolveWait(false), 4000))]);
  if (!graceful) { forced = true; child.kill('SIGKILL'); await Promise.race([exited, new Promise((_, reject) => setTimeout(() => reject(new Error('server SIGKILL timeout')), 2000))]); }
  if (port) { try { await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(500) }); } catch { portClosed = true; } }
}
if (!portClosed || exitCode !== 0 || forced) throw new Error(`server teardown failed exit=${exitCode} signal=${exitSignal} forced=${forced} closed=${portClosed}`);
const receipt = { schemaVersion: 1, createdAt: new Date().toISOString(), governedTreeSha256: treeFingerprint(root).sha256, pid: child.pid, host: '127.0.0.1', port, root: expectedRoot, probes, exitCode, exitSignal, forced, portClosed };
writeJsonAtomic(receiptPath, receipt);
console.log(`final server qa ok: pid=${child.pid} port=${port} probes=${probes.length} closed=${portClosed}`);
