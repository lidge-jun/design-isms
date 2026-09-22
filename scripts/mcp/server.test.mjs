import assert from 'node:assert/strict';
import test from 'node:test';
import { loadDesignCore } from '../design-core-loader.mjs';
import { readyClient, execute } from './test-client.mjs';

const core = loadDesignCore();
const key = item => `${item.ref.domain}/${item.ref.id}`;
const expectedRefs = Object.entries(core.source.catalogs).flatMap(([domain, rows]) => rows
  .filter(row => row.kind !== 'anti-pattern').map(row => `${domain}/${row.id}`)).sort();

test('real Code Mode primitives return canonical data and complete code', { timeout: 20000 }, async t => {
  const client = await readyClient(t);
  const found = await execute(client, 'return design.search({query:"아래 팝업",domains:["effects"]});');
  assert.equal(found.body.ok, true);
  assert.equal(found.body.result.items[0].ref.id, 'bottom-sheet');
  assert.equal(found.body.result.version, core.snapshot.version);
  const code = await execute(client, 'return design.get({domain:"effects",id:"bottom-sheet",view:"code"});');
  assert.equal(code.body.ok, true);
  assert.deepEqual(code.body.result.data, core.source.effectSnippets.snippets['bottom-sheet']);
  const recipes = await execute(client, 'return design.recipes();');
  assert.deepEqual(recipes.body.result.items.map(item => item.id), ['product-landing', 'editorial-reading', 'settings-workspace']);
  const detail = await execute(client, 'return design.recipes({id:"product-landing"});', { maxBytes: 65536 });
  assert.equal(detail.body.result.recipe.slots.length, 6);
  assert.ok(detail.body.result.recipe.slots[0].alternatives.length);
});

test('composition is a value and English brief conversion survives JSON and key order', { timeout: 20000 }, async t => {
  const client = await readyClient(t);
  const result = await execute(client, `
    const value = design.compose({recipeId:'settings-workspace',lang:'en'});
    const replay = JSON.parse(JSON.stringify(value));
    const reordered = Object.fromEntries(Object.entries(replay).reverse());
    return design.brief({composition:reordered});
  `);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.result.lang, 'en');
  assert.ok(result.body.result.text.includes('## Composition'));
  assert.ok(result.body.result.text.includes('Settings editing and save state'));
  assert.equal('composition' in result.body.result, false);
  assert.ok(result.bytes <= 8192);
});

test('brief refuses stale, tampered, incomplete and duplicate-slot compositions', { timeout: 20000 }, async t => {
  const client = await readyClient(t);
  for (const [change, errorCode] of [
    ['c.version="old";', 'STALE_COMPOSITION'],
    ['c.title="Fabricated title";', 'INVALID_COMPOSITION'],
    ['c.checks=[];', 'INVALID_COMPOSITION'],
    ['c.slots.pop();', 'INVALID_COMPOSITION'],
    ['c.slots[1]=c.slots[0];', 'INVALID_COMPOSITION'],
    ['c.extra=true;', 'INVALID_COMPOSITION']
  ]) {
    const result = await execute(client, `const c=JSON.parse(JSON.stringify(design.compose({recipeId:'product-landing'})));${change} return design.brief({composition:c});`);
    assert.equal(result.body.ok, false, change);
    assert.equal(result.body.error.code, errorCode, change);
    assert.equal(result.message.result.isError, true);
  }
});

test('introspection returns data and each call has isolated execution state', { timeout: 20000 }, async t => {
  const client = await readyClient(t);
  const spec = await execute(client, 'return actions.describe("design.get");');
  assert.equal(spec.body.result.name, 'design.get');
  assert.equal(spec.body.result.requiresData, true);
  assert.equal(typeof spec.body.result.inputSchema, 'object');
  const list = await execute(client, 'return actions.find("code");');
  assert.ok(list.body.result.some(item => item.name === 'design.get'));
  assert.equal((await execute(client, 'globalThis.taskMarker=123; return 1;')).body.result, 1);
  assert.equal((await execute(client, 'return typeof taskMarker;')).body.result, 'undefined');
});

test('small wire budgets retain only whole search entries and continue without gaps', { timeout: 20000 }, async t => {
  const client = await readyClient(t);
  const first = await execute(client, 'return design.search({query:"",limit:30});', { maxBytes: 2048 });
  assert.equal(first.body.ok, true);
  assert.ok(first.bytes <= 2048);
  const page = first.body.result;
  assert.ok(page.items.length > 0 && page.items.length < 30);
  assert.equal(page.complete, false);
  assert.equal(page.total, expectedRefs.length);
  assert.deepEqual(page.items.map(key), expectedRefs.slice(0, page.items.length));
  assert.equal('searchContext' in first.body, false);
  const next = await execute(client, `return design.search({query:"",limit:30,cursor:${JSON.stringify(page.nextCursor)}});`, { maxBytes: 2048 });
  assert.equal(next.body.ok, true);
  assert.ok(next.bytes <= 2048);
  assert.deepEqual(next.body.result.items.map(key), expectedRefs.slice(page.items.length, page.items.length + next.body.result.items.length));
});

test('refitting uses call-time search arguments even after caller mutation', { timeout: 15000 }, async t => {
  const client = await readyClient(t);
  const result = await execute(client, `
    const args={query:'',domains:['effects'],limit:30};
    const page=design.search(args);
    args.query='not-a-match'; args.domains[0]='color'; args.cursor='bad';
    return page;
  `, { maxBytes: 2048 });
  assert.equal(result.body.ok, true);
  assert.ok(result.body.result.items.length > 0);
  assert.ok(result.body.result.items.every(item => item.ref.domain === 'effects'));
  assert.equal(result.body.result.total, 94);
  assert.ok(result.bytes <= 2048);
});

test('oversized code, copied pages and composite output fail instead of becoming clipped data', { timeout: 20000 }, async t => {
  const client = await readyClient(t);
  for (const code of [
    'return design.get({domain:"effects",id:"bottom-sheet",view:"code"});',
    'return {...design.search({query:"",limit:30})};',
    'return {page:design.search({query:"",limit:30})};',
    'return "\\u0000".repeat(10000);'
  ]) {
    const result = await execute(client, code, { maxBytes: 1024 }, '"\\\nquoted-id');
    assert.equal(result.body.ok, false, code);
    assert.equal(result.body.error.code, 'RESPONSE_TOO_LARGE');
    assert.ok(result.bytes <= 1024, `${result.bytes} wire bytes`);
  }
});

test('Korean, emoji and escapes survive exact wire envelopes at each budget', { timeout: 20000 }, async t => {
  const client = await readyClient(t);
  const text = '한글 😀 "quote" \\ slash\nline';
  for (const maxBytes of [1024, 2048, 8192, 65536]) {
    const result = await execute(client, `return ${JSON.stringify(text)};`, { maxBytes }, '한글-😀');
    assert.equal(result.body.ok, true);
    assert.equal(result.body.result, text);
    assert.ok(result.bytes <= maxBytes);
  }
});

test('Node capabilities and host constructors are not exposed to the guest', { timeout: 20000 }, async t => {
  const client = await readyClient(t);
  const visible = await execute(client, 'return [typeof process,typeof require,typeof fetch,typeof Buffer,typeof setTimeout,typeof DesignCatalog];');
  assert.deepEqual(visible.body.result, Array(6).fill('undefined'));
  for (const code of [
    'return (()=>{}).constructor("return process.versions.node")();',
    'return design.search.constructor("return process.versions.node")();',
    'return globalThis.constructor.constructor("return process.versions.node")();',
    'const fs=await import("node:fs"); return typeof fs.readFile;'
  ]) {
    const result = await execute(client, code);
    assert.equal(result.body.ok, false, code);
  }
});

test('operation counts, invalid data results and logs are bounded with recovery', { timeout: 20000 }, async t => {
  const client = await readyClient(t);
  const overflow = await execute(client, 'for(let n=0;n<101;n++) design.search({query:"minimalism"}); return true;');
  assert.equal(overflow.body.ok, false);
  assert.equal(overflow.body.error.code, 'OPERATION_LIMIT');
  for (const code of [
    'const a={};a.self=a;return a;', 'return ()=>1;', 'return 1n;',
    'return {get value(){throw Error("getter-sentinel")}};',
    'return {toJSON(){throw Error("toJSON-sentinel")}};'
  ]) assert.equal((await execute(client, code)).body.ok, false, code);
  const logged = await execute(client, 'for(let i=0;i<500;i++) console.log("한글".repeat(100)); return 7;', { maxBytes: 1024 });
  assert.equal(logged.body.ok, true);
  assert.equal(logged.body.result, 7);
  assert.ok(logged.bytes <= 1024);
  assert.equal(logged.body.logsTruncated, true);
  assert.equal((await execute(client, 'return 2;')).body.result, 2);
});
