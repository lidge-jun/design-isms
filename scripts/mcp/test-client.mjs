// Independent wire client: no server/runtime implementation imports.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

export const serverFile = fileURLToPath(new URL('./server.mjs', import.meta.url));
export const cliFile = fileURLToPath(new URL('../design-query.mjs', import.meta.url));

export function startClient({ server = serverFile, cwd = tmpdir() } = {}) {
  const child = spawn(process.execPath, [server], { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
  const queue = [];
  const waiting = [];
  const messages = [];
  let buffer = '', stderr = '', sequence = 0, ended = false, failure = null;
  const closed = new Promise(resolve => child.once('close', (code, signal) => {
    ended = true;
    for (const waiter of waiting.splice(0)) { clearTimeout(waiter.timer); waiter.reject(new Error(`Server closed: ${code}/${signal}: ${stderr}`)); }
    resolve({ code, signal });
  }));
  function rejectAll(error) {
    failure = error;
    for (const waiter of waiting.splice(0)) { clearTimeout(waiter.timer); waiter.reject(error); }
  }
  child.on('error', rejectAll);
  child.stdin.on('error', error => { if (!ended) rejectAll(error); });
  child.stderr.setEncoding('utf8').on('data', text => { stderr = (stderr + text).slice(-10000); });
  child.stdout.setEncoding('utf8').on('data', text => {
    buffer += text;
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      if (!line) continue;
      let message;
      try { message = JSON.parse(line); } catch { rejectAll(new Error(`Non-protocol stdout: ${line.slice(0,300)}`)); continue; }
      const received = { message, bytes: Buffer.byteLength(line) + 1, line };
      messages.push(received);
      const index = waiting.findIndex(waiter => waiter.id === message.id);
      if (index < 0) queue.push(received);
      else {
        const [waiter] = waiting.splice(index, 1);
        clearTimeout(waiter.timer);
        waiter.resolve(received);
      }
    }
  });
  function next(id, timeout = 8000) {
    if (failure) return Promise.reject(failure);
    const index = queue.findIndex(item => item.message.id === id);
    if (index >= 0) return Promise.resolve(queue.splice(index, 1)[0]);
    if (ended) return Promise.reject(new Error(`Server already closed: ${stderr}`));
    return new Promise((resolve, reject) => {
      const waiter = { id, resolve, reject, timer: null };
      waiter.timer = setTimeout(() => {
        waiting.splice(waiting.indexOf(waiter), 1);
        reject(new Error(`No reply for ${String(id)}: ${stderr}`));
      }, timeout);
      waiting.push(waiter);
    });
  }
  function write(value) { child.stdin.write(JSON.stringify(value) + '\n'); }
  function request(method, params, id = ++sequence) {
    const reply = next(id);
    write({ jsonrpc: '2.0', id, method, ...(params === undefined ? {} : { params }) });
    return reply;
  }
  async function initialize(version = '2025-06-18') {
    const reply = await request('initialize', {
      protocolVersion: version, capabilities: {}, clientInfo: { name: 'independent-test-client', version: '1' }
    });
    write({ jsonrpc: '2.0', method: 'notifications/initialized' });
    return reply;
  }
  async function close() {
    if (!ended) child.stdin.end();
    let forced = false;
    const timer = setTimeout(() => { forced = true; child.kill('SIGKILL'); }, 3000);
    const outcome = await closed;
    clearTimeout(timer);
    return { ...outcome, forced };
  }
  return { child, request, next, write, initialize, close, messages, get stderr() { return stderr; } };
}

export async function readyClient(t, options) {
  const client = startClient(options);
  t.after(() => client.close());
  const init = await client.initialize();
  if (init.message.error) throw new Error(JSON.stringify(init.message.error));
  return client;
}

export async function execute(client, code, options = {}, id) {
  const reply = await client.request('tools/call', { name: 'execute_code', arguments: { code, ...options } }, id);
  if (reply.message.error) return { ...reply, body: null };
  const content = reply.message.result?.content;
  if (!Array.isArray(content) || content.length !== 1 || content[0].type !== 'text') {
    throw new Error('Expected one text content block');
  }
  return { ...reply, body: JSON.parse(content[0].text) };
}
