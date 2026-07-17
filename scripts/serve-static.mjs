#!/usr/bin/env node
import { createReadStream, existsSync, lstatSync, realpathSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
function option(name, fallback) { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; }
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = realpathSync(resolve(option('--root', join(repo, '.pages'))));
const host = option('--host', '127.0.0.1');
const port = Number(option('--port', '4173'));
if (!['127.0.0.1', '::1', 'localhost'].includes(host)) throw new Error(`host must be loopback, got ${host}`);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`invalid port ${port}`);

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.css', 'text/css; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'], ['.svg', 'image/svg+xml'], ['.png', 'image/png'],
  ['.webp', 'image/webp'], ['.txt', 'text/plain; charset=utf-8'], ['.xml', 'application/xml; charset=utf-8']
]);
function inside(parent, child) { return child === parent || child.startsWith(parent + sep); }
function respond(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': Buffer.byteLength(body), ...headers });
  res.end(body);
}
function decodePath(rawPath) {
  if (/[\\\0]/.test(rawPath) || /%(?:2f|5c)/i.test(rawPath)) return { error: 404 };
  let value = rawPath;
  for (let depth = 0; depth < 3; depth += 1) {
    let decoded;
    try { decoded = decodeURIComponent(value); } catch { return { error: 400 }; }
    if (/[\\\0]/.test(decoded) || decoded.split('/').includes('..')) return { error: 404 };
    if (/%(?:2f|5c)/i.test(decoded)) return { error: 404 };
    if (decoded === value) return { value: decoded };
    value = decoded;
  }
  if (/%[0-9a-f]{2}/i.test(value)) return { error: 404 };
  return { value };
}

const server = createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method ?? '')) {
    respond(res, 405, 'Method Not Allowed\n', { Allow: 'GET, HEAD' }); return;
  }
  const rawTarget = req.url ?? '/';
  const rawPath = rawTarget.split('?')[0] || '/';
  const decoded = decodePath(rawPath);
  if (decoded.error) { respond(res, decoded.error, decoded.error === 400 ? 'Bad Request\n' : 'Not Found\n'); return; }
  const requestPath = decoded.value === '/' ? '/index.html' : decoded.value;
  let candidate = resolve(root, '.' + requestPath);
  if (!inside(root, candidate)) { respond(res, 404, 'Not Found\n'); return; }
  if (existsSync(candidate) && lstatSync(candidate).isDirectory()) candidate = join(candidate, 'index.html');
  if (!existsSync(candidate) || !lstatSync(candidate).isFile()) { respond(res, 404, 'Not Found\n'); return; }
  const real = realpathSync(candidate);
  if (!inside(root, real)) { respond(res, 404, 'Not Found\n'); return; }
  const size = statSync(real).size;
  res.writeHead(200, { 'Content-Type': mime.get(extname(real).toLowerCase()) ?? 'application/octet-stream', 'Content-Length': size, 'X-Content-Type-Options': 'nosniff' });
  if (req.method === 'HEAD') res.end();
  else createReadStream(real).pipe(res);
});

server.listen(port, host, () => {
  const address = server.address();
  const activePort = typeof address === 'object' && address ? address.port : port;
  console.log(`static server http://${host}:${activePort} root=${root}`);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
