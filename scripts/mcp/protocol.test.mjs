import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Writable } from 'node:stream';
import test from 'node:test';
import { readLines, createLineWriter } from './protocol.mjs';
import { startClient, readyClient, execute } from './test-client.mjs';

async function collect(chunks, cap) {
  async function* input() { for (const chunk of chunks) yield chunk; }
  const rows = [];
  for await (const row of readLines(input(), cap)) rows.push(row);
  return rows;
}

test('line framing preserves split UTF-8 and recovers after invalid or oversized input', async () => {
  const text = '{"query":"한글 😀"}';
  const bytes = Buffer.from(text + '\n');
  assert.deepEqual(await collect([...bytes].map(value => Buffer.from([value])), 100), [{ text }]);
  const rows = await collect([Buffer.from('123456789\n12345678\n{}\n')], 8);
  assert.equal(rows[0].error.code, 'INPUT_TOO_LARGE');
  assert.deepEqual(rows.slice(1), [{ text: '12345678' }, { text: '{}' }]);
  const invalid = await collect([Buffer.from([0xc3, 0x28, 10]), Buffer.from('{}')], 100);
  assert.equal(invalid[0].error.code, 'INVALID_UTF8');
  assert.deepEqual(invalid[1], { text: '{}' });
});

test('line writer waits for completion and preserves order under backpressure', async () => {
  const lines = [];
  let active = 0, peak = 0;
  const stream = new Writable({ highWaterMark: 1, write(chunk, encoding, callback) {
    active++; peak = Math.max(peak, active);
    setImmediate(() => { lines.push(String(chunk)); active--; callback(); });
  } });
  const writer = createLineWriter(stream);
  await Promise.all([writer.write({ n: 1 }), writer.write({ n: 2 }), writer.write({ n: 3 })]);
  await writer.close();
  assert.equal(peak, 1);
  assert.deepEqual(lines, ['{"n":1}\n', '{"n":2}\n', '{"n":3}\n']);
});

test('initialization negotiates versions and lists exactly one compact tool', async t => {
  const client = startClient();
  t.after(() => client.close());
  assert.ok((await client.request('tools/list', {})).message.error);
  assert.deepEqual((await client.request('ping')).message.result, {});
  const initialized = await client.initialize('2099-01-01');
  assert.equal(initialized.message.result.protocolVersion, '2025-06-18');
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.equal(initialized.message.result.serverInfo.version, pkg.version);
  const listing = await client.request('tools/list', {});
  assert.deepEqual(listing.message.result.tools.map(tool => tool.name), ['execute_code']);
  const tool = listing.message.result.tools[0];
  assert.ok(Buffer.byteLength(tool.description) <= 2000);
  assert.equal(tool.inputSchema.additionalProperties, false);
  assert.equal(tool.inputSchema.properties.maxBytes.maximum, 65536);
  assert.equal(tool.inputSchema.properties.timeoutMs.maximum, 10000);
  assert.equal((await client.request('no-such-method')).message.error.code, -32601);
});

test('malformed, invalid-ID and oversized frames do not poison the next request', async t => {
  const client = await readyClient(t);
  for (const line of ['{not-json}', '[]', JSON.stringify({ jsonrpc: '2.0', id: 'x'.repeat(65), method: 'ping' })]) {
    const reply = client.next(null);
    client.child.stdin.write(line + '\n');
    assert.ok((await reply).message.error);
  }
  const oversized = client.next(null);
  client.child.stdin.write(' '.repeat(131073) + '\n');
  assert.equal((await oversized).message.error.code, -32700);
  assert.deepEqual((await client.request('ping')).message.result, {});
  const before = client.messages.length;
  client.write({ jsonrpc: '2.0', method: 'notifications/unknown' });
  client.write({ jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 'missing' } });
  await client.request('ping');
  assert.equal(client.messages.length, before + 1);
});

test('tool argument ranges and unknown fields are protocol errors', async t => {
  const client = await readyClient(t);
  for (const args of [{ code: '' }, { code: null }, { code: ' '.repeat(33000) },
    { code: 'return 1;', maxBytes: 1023 }, { code: 'return 1;', maxBytes: 65537 },
    { code: 'return 1;', maxBytes: null }, { code: 'return 1;', timeoutMs: 49 },
    { code: 'return 1;', timeoutMs: 10001 }, { code: 'return 1;', timeoutMs: null },
    { code: 'return 1;', path: '/not-an-argument' }]) {
    const reply = await client.request('tools/call', { name: 'execute_code', arguments: args });
    assert.equal(reply.message.error.code, -32602);
  }
  assert.equal((await client.request('tools/call', { name: 'other', arguments: {} })).message.error.code, -32602);
});

test('sync, async and serialization stalls time out and leave the server usable', { timeout: 15000 }, async t => {
  const client = await readyClient(t);
  for (const code of [
    'while(true) {}', 'await Promise.resolve(); while(true) {}',
    'return new Promise(()=>{});',
    'return new Proxy({}, {ownKeys(){while(true){}}});'
  ]) {
    const pending = execute(client, code, { timeoutMs: 300 });
    assert.deepEqual((await client.request('ping')).message.result, {});
    const result = await pending;
    assert.equal(result.body.ok, false, code);
    assert.equal(result.body.error.code, 'EXECUTION_TIMEOUT', code);
    assert.equal((await execute(client, 'return 17;')).body.result, 17);
  }
});

test('concurrency cap and cancellation release all four slots', { timeout: 15000 }, async t => {
  const client = await readyClient(t);
  const pending = [];
  for (let id = 100; id < 104; id++) pending.push(client.request('tools/call', {
    name: 'execute_code', arguments: { code: 'return new Promise(()=>{});', timeoutMs: 5000 }
  }, id));
  await client.request('ping');
  const extra = await client.request('tools/call', { name: 'execute_code', arguments: { code: 'return 1;' } }, 104);
  assert.equal(extra.message.error.code, -32001);
  for (let requestId = 100; requestId < 104; requestId++) client.write({
    jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId }
  });
  for (const reply of await Promise.all(pending)) {
    const body = JSON.parse(reply.message.result.content[0].text);
    assert.equal(body.error.code, 'EXECUTION_CANCELLED');
  }
  assert.equal((await execute(client, 'return 19;')).body.result, 19);
});

test('duplicate active IDs are refused without replacing the owned call', { timeout: 10000 }, async t => {
  const client = await readyClient(t);
  client.write({ jsonrpc: '2.0', id: 50, method: 'tools/call', params: {
    name: 'execute_code', arguments: { code: 'return new Promise(()=>{});', timeoutMs: 5000 }
  } });
  await client.request('ping');
  assert.equal((await client.request('ping', {}, 50)).message.error.code, -32600);
  client.write({ jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 50 } });
  const cancelled = await client.next(50);
  assert.equal(JSON.parse(cancelled.message.result.content[0].text).error.code, 'EXECUTION_CANCELLED');
});

test('EOF cancels owned work and exits without forced termination', { timeout: 7000 }, async t => {
  const client = await readyClient(t);
  client.write({ jsonrpc: '2.0', id: 90, method: 'tools/call', params: {
    name: 'execute_code', arguments: { code: 'return new Promise(()=>{});', timeoutMs: 10000 }
  } });
  await client.request('ping');
  const closed = await client.close();
  assert.deepEqual(closed, { code: 0, signal: null, forced: false });
});
