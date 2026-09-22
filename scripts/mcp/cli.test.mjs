import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { cliFile, readyClient, execute } from './test-client.mjs';

function run(input = '', { file = cliFile, args = [], cwd = tmpdir() } = {}) {
  const child = spawnSync(process.execPath, [file, ...args], {
    cwd, input, encoding: 'utf8', timeout: 12000, maxBuffer: 2 * 1024 * 1024
  });
  assert.ifError(child.error);
  const lines = child.stdout.split('\n').filter(Boolean);
  for (const line of lines) assert.ok(Buffer.byteLength(line) + 1 <= 65536);
  return { ...child, values: lines.map(line => JSON.parse(line)) };
}

function invocation(op, args) { return JSON.stringify({ op, ...(args === undefined ? {} : { args }) }) + '\n'; }

test('NDJSON successes are plain values, and errors do not eat following lines', () => {
  const result = run('not-json\n' + invocation('design.search', { query: '아래 팝업', domains: ['effects'] }));
  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  assert.equal(result.values.length, 2);
  assert.equal(result.values[0].error.code, 'INVALID_JSON');
  assert.equal(result.values[1].items[0].ref.id, 'bottom-sheet');
  assert.equal('result' in result.values[1], false);
  assert.equal('ok' in result.values[1], false);
});

test('CLI recovers from oversized/invalid UTF-8 lines and rejects unknown invocations', () => {
  const input = Buffer.concat([
    Buffer.from('x'.repeat(65537) + '\n'), Buffer.from([0xc3, 0x28, 10]),
    Buffer.from(invocation('no-such-operation') + invocation('actions.find', 'brief'))
  ]);
  const result = run(input);
  assert.equal(result.status, 1);
  assert.equal(result.values.length, 4);
  assert.deepEqual(result.values.slice(0,3).map(value => value.error.code), ['INPUT_TOO_LARGE', 'INVALID_UTF8', 'UNKNOWN_OPERATION']);
  assert.ok(result.values[3].some(value => value.name === 'design.brief'));
  assert.equal(run('').status, 0);
  assert.equal(run('{}\n').status, 1);
});

test('compose values replay into brief in a separate process with no duplicated payload', () => {
  const first = run(invocation('design.compose', { recipeId: 'settings-workspace', lang: 'en' }));
  assert.equal(first.status, 0);
  const value = first.values[0];
  assert.equal(value.lang, 'en');
  assert.equal('brief' in value, false);
  const second = run(invocation('design.brief', { composition: value }));
  assert.equal(second.status, 0);
  assert.equal(second.values[0].lang, 'en');
  assert.ok(second.values[0].text.includes('## Composition'));
  assert.equal('slots' in second.values[0], false);
  const forged = { ...value, title: 'Forged provenance' };
  assert.equal(run(invocation('design.brief', { composition: forged })).values[0].error.code, 'INVALID_COMPOSITION');
});

test('CLI and real MCP expose equivalent operation values on the same snapshot', { timeout: 20000 }, async t => {
  const client = await readyClient(t);
  for (const [op, args] of [
    ['design.search', { query: '바텀 시트', limit: 2 }],
    ['design.get', { domain: 'motion', id: 'motion-fade', view: 'code' }],
    ['design.recipes', {}],
    ['design.compose', { recipeId: 'product-landing', lang: 'en' }],
    ['actions.find', 'code'],
    ['actions.describe', 'design.search']
  ]) {
    const terminal = run(invocation(op, args));
    assert.equal(terminal.status, 0, op);
    const mcp = await execute(client, `return ${op}(${JSON.stringify(args)});`, { maxBytes: 65536 });
    assert.equal(mcp.body.ok, true, op);
    assert.deepEqual(mcp.body.result, terminal.values[0], op);
  }
});

test('metadata-only CLI and MCP work when no catalog or loader is packaged', { timeout: 20000 }, async t => {
  const root = mkdtempSync(join(tmpdir(), 'design-metadata-only-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const scripts = join(root, 'scripts');
  mkdirSync(scripts);
  cpSync(join(dirname(cliFile), 'mcp'), join(scripts, 'mcp'), { recursive: true });
  cpSync(cliFile, join(scripts, 'design-query.mjs'));
  writeFileSync(join(root, 'package.json'), readFileSync(new URL('../../package.json', import.meta.url)));
  const help = run('', { file: join(scripts, 'design-query.mjs'), args: ['--help'] });
  assert.equal(help.status, 0, help.stderr);
  assert.ok(help.values[0].operations.some(spec => spec.name === 'design.compose'));
  const meta = run(invocation('actions.describe', 'design.get'), { file: join(scripts, 'design-query.mjs') });
  assert.equal(meta.status, 0, meta.stderr);
  assert.equal(meta.values[0].name, 'design.get');
  const client = await readyClient(t, { server: join(scripts, 'mcp/server.mjs') });
  const tools = await client.request('tools/list', {});
  assert.deepEqual(tools.message.result.tools.map(tool => tool.name), ['execute_code']);
  assert.deepEqual((await client.request('ping')).message.result, {});
  await client.close();
});

test('every discovery example is an executable Code Mode request', { timeout: 20000 }, async t => {
  const specs = run('', { args: ['--help'] }).values[0].operations;
  const client = await readyClient(t);
  for (const spec of specs) {
    assert.equal(typeof spec.example.code, 'string', spec.name);
    const reply = await client.request('tools/call', { name: 'execute_code', arguments: spec.example });
    assert.equal(reply.message.error, undefined, spec.name);
    const body = JSON.parse(reply.message.result.content[0].text);
    assert.equal(body.ok, true, `${spec.name}: ${JSON.stringify(body.error)}`);
  }
});
