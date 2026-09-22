import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { DOMAINS, SOURCE_FILES, REPOSITORY_ROOT, loadDesignCore, readSourceSnapshot, snapshotFromFiles } from './design-core-loader.mjs';

const core = loadDesignCore();
const { catalog, recipes, snapshot, recipeList } = core;
const plain = value => JSON.parse(JSON.stringify(value));
const freshSource = () => plain(core.source);
const keys = page => page.items.map(item => `${item.ref.domain}/${item.ref.id}`);
const rejects = (fn, code) => assert.throws(fn, error => code ? error.code === code : typeof error.code === 'string' && error.code.length > 0);

test('invalid snapshot boundaries fail with coded errors', () => {
  for (const input of [null, [], {}, { ...freshSource(), version: '' }]) rejects(() => catalog.create(input));
  const duplicated = freshSource();
  duplicated.catalogs.isms.push(duplicated.catalogs.isms[0]);
  rejects(() => catalog.create(duplicated));
  const malformed = freshSource();
  malformed.catalogs.effects[0].id = '../escape';
  rejects(() => catalog.create(malformed));
});

test('query boundaries reject malformed types, limits and unknown keys', () => {
  for (const input of [null, { query: 1 }, { query: '', limit: 0 }, { query: '', limit: 31 },
    { query: '', limit: 1.5 }, { query: '', domains: ['unknown'] }, { domains: Array(1) },
    { query: '', path: '/tmp' }]) {
    rejects(() => catalog.search(snapshot, input));
  }
  for (const ref of [{ domain: 'unknown', id: 'minimalism' }, { domain: 'isms', id: 'missing' },
    { domain: 'isms', id: '__proto__' }, { domain: 'isms', id: 'minimalism', view: 'whatever' }]) {
    rejects(() => catalog.get(snapshot, ref));
  }
});

test('accessor inputs are refused without executing the getter', () => {
  let calls = 0;
  const args = Object.defineProperty({}, 'query', { enumerable: true, get() { calls++; return 'minimalism'; } });
  rejects(() => catalog.search(snapshot, args));
  const source = freshSource();
  Object.defineProperty(source.catalogs.isms[0], 'name', { enumerable: true, get() { calls++; return 'bad'; } });
  rejects(() => catalog.create(source));
  const inherited = Object.create(Object.defineProperty(Object.create(null), 'query', {
    get() { calls++; return 'bottom-sheet'; }
  }));
  rejects(() => catalog.search(snapshot, inherited), 'INVALID_ARGUMENT');
  const domains = [];
  Object.defineProperty(domains, '0', { enumerable: true, get() { calls++; throw new Error('nested-getter-sentinel'); } });
  rejects(() => catalog.search(snapshot, { domains }), 'INVALID_ARGUMENT');
  assert.equal(calls, 0);
});

test('unknown, changed-query and stale cursors fail rather than restart silently', () => {
  const first = catalog.search(snapshot, { query: '', limit: 2 });
  assert.ok(first.nextCursor);
  rejects(() => catalog.search(snapshot, { query: '', cursor: 'not-a-cursor' }), 'INVALID_CURSOR');
  rejects(() => catalog.search(snapshot, { query: 'different', cursor: first.nextCursor }), 'INVALID_CURSOR');
  rejects(() => catalog.search(snapshot, { query: '', cursor: first.nextCursor + ' ' }), 'INVALID_CURSOR');
  const changed = catalog.create({ ...freshSource(), version: 'different-snapshot' });
  rejects(() => catalog.search(changed, { query: '', cursor: first.nextCursor }), 'STALE_CURSOR');
});

test('anti-patterns are explicit-lookup-only', () => {
  const result = catalog.get(snapshot, { domain: 'isms', id: 'ai-slop', view: 'full' });
  assert.equal(result.data.kind, 'anti-pattern');
  assert.equal(catalog.search(snapshot, { query: 'ai-slop' }).items.length, 0);
});

test('snapshots and returned entries cannot be mutated by a consumer', () => {
  const source = freshSource();
  const isolated = catalog.create(source);
  source.catalogs.isms[0].name = 'changed input';
  const entry = catalog.resolve(isolated, { domain: 'isms', id: 'minimalism' });
  assert.equal(entry.name, 'Minimalism');
  assert.ok(Object.isFrozen(entry));
  assert.throws(() => { entry.name = 'changed output'; }, TypeError);
});

test('real catalog has six domains and the current 233-entry source corpus', () => {
  assert.deepEqual(DOMAINS.map(domain => snapshot.catalogs[domain].length), [49, 94, 25, 20, 25, 20]);
  assert.equal(catalog.search(snapshot, { query: '' }).total, 232);
  assert.equal(snapshot.version, core.source.version);
});

test('Korean alias, English name and exact ID resolve the intended effect', () => {
  for (const query of ['바텀 시트', '아래 팝업', 'Bottom Sheet', 'bottom-sheet']) {
    const page = catalog.search(snapshot, { query, domains: ['effects'] });
    assert.equal(page.items[0].ref.id, 'bottom-sheet', query);
  }
  const nfd = catalog.search(snapshot, { query: '바텀 시트'.normalize('NFD'), domains: ['effects'] });
  assert.equal(nfd.items[0].ref.id, 'bottom-sheet');
});

test('empty matches and normalized queries report truthful deterministic results', () => {
  assert.deepEqual(keys(catalog.search(snapshot, { query: ' MINImaLISM ' })), keys(catalog.search(snapshot, { query: 'minimalism' })));
  const none = catalog.search(snapshot, { query: 'not-a-real-design-9z9z9z' });
  assert.equal(none.total, 0);
  assert.equal(none.nextCursor, null);
  assert.equal(none.complete, true);
  assert.equal(none.items.length, 0);
});

test('pagination visits every discoverable reference exactly once', () => {
  const refs = [];
  let cursor;
  let complete = false;
  for (let step = 0; step < 100 && !complete; step++) {
    const page = catalog.search(snapshot, { query: '', limit: step % 2 ? 3 : 7, ...(cursor ? { cursor } : {}) });
    refs.push(...keys(page));
    complete = page.complete;
    cursor = page.nextCursor;
    assert.equal(complete, cursor === null);
  }
  assert.equal(complete, true);
  assert.equal(refs.length, 232);
  assert.equal(new Set(refs).size, 232);
});

test('views preserve complete source code, guidance and domain-specific fields', () => {
  const effects = catalog.get(snapshot, { domain: 'effects', id: 'bottom-sheet', view: 'code' });
  assert.deepEqual(plain(effects.data), core.source.effectSnippets.snippets['bottom-sheet']);
  const guide = catalog.get(snapshot, { domain: 'isms', id: 'minimalism', view: 'guide' });
  assert.deepEqual(plain(guide.data), core.source.guides.minimalism);
  const history = catalog.get(snapshot, { domain: 'effects', id: 'bottom-sheet', view: 'guide' });
  assert.deepEqual(plain(history.data), core.source.effectDocs['bottom-sheet']);
  for (const domain of ['layout', 'motion']) {
    const entry = core.source.catalogs[domain][0];
    assert.deepEqual(plain(catalog.get(snapshot, { domain, id: entry.id, view: 'code' }).data), entry.snippet);
  }
  for (const domain of ['isms', 'color', 'typography']) {
    const entry = core.source.catalogs[domain][0];
    rejects(() => catalog.get(snapshot, { domain, id: entry.id, view: 'code' }), 'VIEW_UNAVAILABLE');
  }
  for (const domain of ['color', 'typography', 'layout', 'motion']) {
    const entry = core.source.catalogs[domain][0];
    const data = catalog.get(snapshot, { domain, id: entry.id, view: 'guide' }).data;
    assert.equal('guide' in data, false, 'implementation guide must not return image-generation guide');
    assert.ok(Object.keys(data).length > 0);
  }
});

test('each served source file contributes to the snapshot version', () => {
  assert.deepEqual([...SOURCE_FILES], [
    'color', 'dev-guides', 'effects', 'effects-docs', 'effects-snippets',
    'isms', 'layout', 'motion', 'recipes', 'typography'
  ].map(name => `assets/data/${name}.json`).sort());
  const files = new Map(SOURCE_FILES.map(path => [path, readFileSync(join(REPOSITORY_ROOT, path))]));
  const original = snapshotFromFiles(files).version;
  for (const path of SOURCE_FILES) {
    const changed = new Map(files);
    changed.set(path, Buffer.concat([files.get(path), Buffer.from('\n')]));
    assert.notEqual(snapshotFromFiles(changed).version, original, path);
  }
  assert.equal(readSourceSnapshot().version, original);
  assert.equal(snapshotFromFiles(new Map([...files].reverse())).version, original);
});

test('recipe source URLs, sparse slots and unsafe dictionary keys fail closed', () => {
  const source = freshSource().recipes;
  source.recipes[0].sources[0].url = 'javascript:alert(1)';
  rejects(() => recipes.parse(source, snapshot));
  const sparse = freshSource().recipes;
  delete sparse.recipes[0].slots[0];
  rejects(() => recipes.parse(sparse, snapshot));
  const options = JSON.parse('{"recipeId":"product-landing","selections":{"__proto__":{"domain":"isms","id":"minimalism"}}}');
  rejects(() => recipes.compose(snapshot, recipeList, options));
});

test('recipes reject unknown selections, languages, duplicates and anti-pattern refs', () => {
  for (const input of [{ recipeId: 'missing' }, { recipeId: 'product-landing', lang: 'fr' },
    { recipeId: 'product-landing', selections: { unknown: { domain: 'isms', id: 'minimalism' } } },
    { recipeId: 'product-landing', unexpected: true }]) rejects(() => recipes.compose(snapshot, recipeList, input));
  const duplicate = freshSource().recipes;
  duplicate.recipes.push(duplicate.recipes[0]);
  rejects(() => recipes.parse(duplicate, snapshot));
  const bad = freshSource().recipes;
  bad.recipes[0].slots[0].default = { domain: 'isms', id: 'ai-slop' };
  rejects(() => recipes.parse(bad, snapshot));
  const wrongDomain = freshSource().recipes;
  wrongDomain.recipes[0].slots[0].alternatives.push({ domain: 'effects', id: 'bottom-sheet' });
  rejects(() => recipes.parse(wrongDomain, snapshot));
  rejects(() => recipes.compose(snapshot, recipeList, { recipeId: 'product-landing', selections: {
    effect: { domain: 'effects', id: 'bottom-sheet' }
  } }), 'INVALID_SELECTION');
});

test('three recipes resolve their defaults and only declared alternatives', () => {
  for (const recipe of core.source.recipes.recipes) {
    const composition = recipes.compose(snapshot, recipeList, { recipeId: recipe.id, lang: 'ko' });
    assert.equal(composition.recipeId, recipe.id);
    assert.equal(composition.slots.length, recipe.slots.length);
    assert.equal(composition.version, snapshot.version);
    const slot = recipe.slots.find(value => value.alternatives.length);
    const selected = recipes.compose(snapshot, recipeList, { recipeId: recipe.id, selections: { [slot.id]: slot.alternatives[0] } });
    assert.deepEqual(plain(selected.slots.find(value => value.id === slot.id).ref), slot.alternatives[0]);
    const brief = recipes.formatBrief(composition, 'ko');
    assert.ok(brief.includes(recipe.title.ko));
    assert.ok(brief.includes(recipe.slots[0].default.id));
    assert.ok(brief.includes('https://github.com/changeroa/StyleGallery/'));
  }
});

test('recipe discovery and English brief expose the authored contract without claiming execution', () => {
  assert.deepEqual(plain(recipes.list(recipeList)).map(item => item.id), ['product-landing', 'editorial-reading', 'settings-workspace']);
  const recipe = recipes.detail(recipeList, 'settings-workspace');
  assert.equal(recipe.slots.length, 6);
  const composition = recipes.compose(snapshot, recipeList, { recipeId: recipe.id, lang: 'en' });
  assert.equal(composition.title, recipe.title.en);
  const authored = core.source.recipes.recipes.find(item => item.id === recipe.id);
  assert.deepEqual(plain(composition.checks), authored.checks.map(item => item.en));
  assert.ok(recipes.formatBrief(composition, 'en').includes(recipe.title.en));
  assert.equal(composition.lang, 'en');
  assert.ok(recipes.formatBrief(plain(composition)).includes('## Composition'));
  rejects(() => recipes.formatBrief(composition, 'ko'), 'INVALID_LANGUAGE');
});

test('recipe arguments reject constructor-name getters without invoking them', () => {
  let calls = 0;
  const constructor = function () {};
  Object.defineProperty(constructor, 'name', { get() { calls++; return 'Object'; } });
  const prototype = Object.create(null);
  Object.defineProperty(prototype, 'constructor', { value: constructor });
  const options = Object.assign(Object.create(prototype), { recipeId: 'product-landing' });
  rejects(() => recipes.compose(snapshot, recipeList, options), 'INVALID_SELECTION');
  assert.equal(calls, 0);
  rejects(() => recipes.compose(snapshot, recipeList, { recipeId: 'x'.repeat(129) }), 'RECIPE_NOT_FOUND');
});

test('all declared slot combinations preserve selected references in both languages', () => {
  let checked = 0;
  for (const recipe of core.source.recipes.recipes) {
    let combinations = [{}];
    for (const slot of recipe.slots) {
      combinations = combinations.flatMap(previous => [slot.default, ...slot.alternatives]
        .map(ref => ({ ...previous, [slot.id]: ref })));
    }
    for (const selections of combinations) for (const lang of ['ko', 'en']) {
      const composition = recipes.compose(snapshot, recipeList, { recipeId: recipe.id, selections, lang });
      assert.equal(composition.title, recipe.title[lang]);
      for (const slot of composition.slots) assert.deepEqual(plain(slot.ref), selections[slot.id]);
      checked++;
    }
  }
  assert.equal(checked, 384);
});

test('a browser-like realm and the Node adapter run the same compiled core', () => {
  const context = vm.createContext(Object.create(null));
  for (const file of core.coreSources) vm.runInContext(file.source, context);
  vm.runInContext(`globalThis.source = JSON.parse(${JSON.stringify(JSON.stringify(core.source))});`, context);
  const page = vm.runInContext('DesignCatalog.search(DesignCatalog.create(source), {query:"bottom sheet",domains:["effects"]})', context);
  assert.deepEqual(plain(page), plain(catalog.search(snapshot, { query: 'bottom sheet', domains: ['effects'] })));
  for (const recipe of core.source.recipes.recipes) {
    const args = { recipeId: recipe.id, lang: 'en' };
    const composition = vm.runInContext(`(() => {
      const snapshot = DesignCatalog.create(source);
      return DesignRecipes.compose(snapshot, DesignRecipes.parse(source.recipes, snapshot), ${JSON.stringify(args)});
    })()`, context);
    assert.deepEqual(plain(composition), plain(recipes.compose(snapshot, recipeList, args)));
  }
  assert.equal(vm.runInContext('typeof document + "/" + typeof window + "/" + typeof require', context), 'undefined/undefined/undefined');
});
