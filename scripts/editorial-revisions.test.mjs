import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { editorialDigest, editorialRevisionDigest, replayEditorialRevisions } from './editorial-revisions.mjs';

const ID = 'refractive-glass-ui';
// Independent fixture hashing: JSON's replacer sorts objects, rather than calling
// either production digest helper or its recursive stableJson serializer.
const hash = value => createHash('sha256').update(JSON.stringify(value, (_key, entry) =>
  entry && !Array.isArray(entry) && typeof entry === 'object'
    ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : entry)).digest('hex');
const present = value => ({ present: true, value });
const emptyPolicy = () => ({ schemaVersion: 1, allowedFields: {}, revisionIds: [], finalRevisionSha256: null });
const baseline = () => ({ runId: 'fixture-run', isms: [
  { id: ID, name: 'Refractive Glass', description: null, keywords: ['glass'], palette: ['#000000'],
    images: [{ file: 'landing.png' }], prompts: [{ file: 'landing.png', prompt: 'original image prompt' }] },
  { id: 'glassmorphism', name: 'Glassmorphism' }, { id: 'minimalism', name: 'Minimalism' },
], effects: [{ id: 'glow', guide: { prompt: 'original effect prompt' } }] });

function change(field = 'name', before = present('Refractive Glass'), after = present('Liquid Glass')) {
  return { catalog: 'isms', id: ID, field, before, beforeSha256: hash(before), after, afterSha256: hash(after) };
}

function fixture(changes = [change()]) {
  const runtime = baseline();
  const options = { baselineRuntime: runtime, baselineRunId: runtime.runId, baselineAggregateSha256: 'a'.repeat(64) };
  const row = { schemaVersion: 1, revisionId: 'fixture-001', parentRevisionSha256: null,
    baselineRunId: options.baselineRunId, baselineAggregateSha256: options.baselineAggregateSha256,
    baselineRuntimeSha256: hash(runtime), reason: 'Reviewed material terminology',
    evidenceRefs: ['https://example.test/materials'], reviewedBy: 'fixture-reviewer',
    reviewedAt: '2026-09-06T03:00:00Z', changes };
  const result = { options, rows: [row], policy: { schemaVersion: 1,
    allowedFields: { [ID]: [...new Set(changes.map(entry => entry.field))] },
    revisionIds: ['fixture-001'], finalRevisionSha256: null } };
  seal(result); return result;
}

function seal(f) {
  for (const row of f.rows) {
    const payload = { ...row }; delete payload.revisionSha256;
    row.revisionSha256 = hash(payload);
  }
  f.policy.finalRevisionSha256 = f.rows.at(-1)?.revisionSha256 ?? null;
}

function run(f, ledgerText = f.rows.map(row => JSON.stringify(row)).join('\n') + '\n') {
  return replayEditorialRevisions({ ...f.options, policy: f.policy, ledgerText });
}

function rejectsRow(name, mutate, expected, reseal = true) {
  test(name, () => {
    const f = fixture(); mutate(f.rows[0], f);
    if (reseal) seal(f);
    assert.throws(() => run(f), expected);
  });
}

test('digest helpers use canonical UTF-8 JSON and exclude only the revision digest', () => {
  const literal = '{"present":true,"value":"리퀴드 글래스"}';
  const expected = createHash('sha256').update(literal, 'utf8').digest('hex');
  assert.equal(editorialDigest({ value: '리퀴드 글래스', present: true }), expected);
  const f = fixture(); assert.equal(editorialRevisionDigest(f.rows[0]), f.rows[0].revisionSha256);
  assert.notEqual(editorialDigest({ present: false }), editorialDigest(present(null)));
  assert.equal(editorialRevisionDigest({ b: 2, a: 1, revisionSha256: 'ignored' }), hash({ a: 1, b: 2 }));
});

test('absent/empty ledger is allowed only with a fully empty policy and returns a deep copy', () => {
  const f = fixture();
  for (const ledgerText of [undefined, '']) {
    const replay = replayEditorialRevisions({ ...f.options, policy: emptyPolicy(), ledgerText });
    assert.deepEqual(replay, f.options.baselineRuntime);
    replay.isms[0].prompts[0].prompt = 'mutated';
    assert.equal(f.options.baselineRuntime.isms[0].prompts[0].prompt, 'original image prompt');
  }
  assert.throws(() => replayEditorialRevisions({ ...f.options, policy: f.policy }), /required ledger is missing/);
  assert.throws(() => run(f, ''), /revision count/);
});

test('empty policy rejects pending grants, tips and unpinned ledger rows', () => {
  const f = fixture();
  for (const policy of [
    { ...emptyPolicy(), allowedFields: { [ID]: ['name'] } },
    { ...emptyPolicy(), finalRevisionSha256: 'b'.repeat(64) },
  ]) assert.throws(() => replayEditorialRevisions({ ...f.options, policy }), /empty policy/);
  f.policy = emptyPolicy(); assert.throws(() => run(f), /revision count/);
});

test('reviewed replay changes only recorded fields, preserving baseline and receipt objects', () => {
  const f = fixture(); const before = structuredClone(f);
  const result = run(f); const expected = baseline(); expected.isms[0].name = 'Liquid Glass';
  assert.deepEqual(result, expected); assert.deepEqual(f, before);
});

test('all nine 012 fields replay including complete arrays, without merging', () => {
  const values = { name: 'Liquid Glass', nameKr: '리퀴드 글래스', tagline: 'Controls in motion',
    description: 'Reviewed description', descriptionEn: 'Reviewed English description', history: 'Reviewed history',
    sources: [{ label: 'Materials', url: 'https://example.test/materials' }, { label: 'Overview', url: 'https://example.test/overview' }],
    examples: Array.from({ length: 10 }, (_, i) => ({ name: `Product ${i}`, url: `https://example.test/product-${i}` })),
    reviewedOn: '2026-09-06' };
  const original = baseline().isms[0];
  const f = fixture(Object.entries(values).map(([field, value]) => change(field,
    Object.hasOwn(original, field) ? present(original[field]) : { present: false }, present(value))));
  const result = run(f); assert.deepEqual(result.isms[0], { ...original, ...values });
  result.isms[0].sources[0].label = 'mutated';
  assert.equal(f.rows[0].changes.find(c => c.field === 'sources').after.value[0].label, 'Materials');
});

test('missing and null before states remain distinct', () => {
  const missing = fixture([change('descriptionEn', { present: false }, present('Added'))]);
  assert.equal(run(missing).isms[0].descriptionEn, 'Added');
  const nullable = fixture([change('description', present(null), present('Revised'))]);
  assert.equal(run(nullable).isms[0].description, 'Revised');
  for (const [field, before] of [['description', { present: false }], ['descriptionEn', present(null)]]) {
    assert.throws(() => run(fixture([change(field, before, present('Revised'))])), /before value mismatch/);
  }
});

for (const [label, text] of [['null', null], ['array argument', []], ['truncated JSON', '{'],
  ['blank line', '\n'], ['whitespace', '  '], ['null row', 'null'], ['array row', '[]'],
  ['primitive row', '1']]) {
  test(`malformed ledger fails closed: ${label}`, () => assert.throws(() => run(fixture(), text), /editorial revisions:/));
}

test('duplicate JSON keys, including escaped names and nested snapshot keys, are rejected', () => {
  const f = fixture(); const text = JSON.stringify(f.rows[0]);
  for (const modified of [text.replace('{', '{"schemaVersion":0,'),
    text.replace('{', '{"schema\\u0056ersion":0,'),
    text.replace('"present":true', '"present":false,"present":true')]) {
    assert.throws(() => run(f, modified), /duplicate JSON key/);
  }
});

test('CRLF and quoted JSON-looking content are parsed without false duplicate detection', () => {
  const f = fixture(); f.rows[0].reason = 'Text: {"key": 1, "key": "two"}'; seal(f);
  assert.equal(run(f, JSON.stringify(f.rows[0]) + '\r\n').isms[0].name, 'Liquid Glass');
});

test('overflowed JSON numbers cannot masquerade as a null snapshot', () => {
  const f = fixture([change('description', present(null), present('Reviewed'))]);
  assert.throws(() => run(f, JSON.stringify(f.rows[0]).replace('"value":null', '"value":1e400')), /malformed JSONL/);
});

test('invalid review metadata fails even when its digest and tip are resealed', () => {
  for (const [key, value, pattern] of [
    ['reason', ' ', /reason\/reviewedBy/], ['reviewedBy', null, /reason\/reviewedBy/],
    ['evidenceRefs', [], /evidenceRefs/], ['evidenceRefs', ['same', 'same'], /evidenceRefs/],
    ['reviewedAt', null, /reviewedAt/], ['reviewedAt', '2026-02-30T03:00:00Z', /reviewedAt/],
    ['reviewedAt', '2026-09-06', /reviewedAt/],
  ]) { const f = fixture(); f.rows[0][key] = value; seal(f); assert.throws(() => run(f), pattern); }
  const f = fixture(); f.rows[0].reviewedAt = '2026-09-06T03:00:00.123Z'; seal(f);
  assert.equal(run(f).isms[0].name, 'Liquid Glass');
});

test('field-specific malformed after values fail with otherwise valid receipts', () => {
  for (const [field, value] of [
    ['sources', []], ['examples', []], ['reviewedOn', '2026-02-30'],
    ['sources', [{ label: 'A', url: 'http://example.test' }, { label: 'B', url: 'https://example.test' }]],
    ['sources', [{ label: 'A', url: 'https://example.test', extra: true }, { label: 'B', url: 'https://example.test' }]],
  ]) assert.throws(() => run(fixture([change(field, { present: false }, present(value))])), /editorial revisions:/);
});

for (const key of ['schemaVersion', 'revisionId', 'parentRevisionSha256', 'baselineRunId',
  'baselineAggregateSha256', 'baselineRuntimeSha256', 'reason', 'evidenceRefs', 'reviewedBy', 'reviewedAt', 'changes']) {
  rejectsRow(`missing revision field: ${key}`, row => { delete row[key]; }, /unknown or missing keys/);
}
rejectsRow('missing revisionSha256', row => { delete row.revisionSha256; }, /unknown or missing keys/, false);
rejectsRow('unknown row key', row => { row.approved = true; }, /unknown or missing keys/);
rejectsRow('unknown change key', row => { row.changes[0].path = '/isms/0/name'; }, /unknown or missing keys/);
rejectsRow('unsupported version', row => { row.schemaVersion = 2; }, /unsupported revision/);
rejectsRow('unpinned revision ID', row => { row.revisionId = 'unexpected'; }, /ID\/order/);
rejectsRow('changed parent', row => { row.parentRevisionSha256 = 'b'.repeat(64); }, /parent revision/);
for (const key of ['baselineRunId', 'baselineAggregateSha256', 'baselineRuntimeSha256']) {
  rejectsRow(`changed ${key}`, row => { row[key] = 'forged'; }, new RegExp(`${key} mismatch`));
}
rejectsRow('metadata tampering without resealing', row => { row.reason = 'Unreviewed'; }, /revision hash/, false);
rejectsRow('empty changes', row => { row.changes = []; }, /must not be empty/);
rejectsRow('duplicate change', row => { row.changes.push(structuredClone(row.changes[0])); }, /duplicate change/);
for (const id of ['minimalism', 'glassmorphism', 'missing', '__proto__']) {
  rejectsRow(`other ID rejected: ${id}`, row => { row.changes[0].id = id; }, /catalog\/ID/);
}
rejectsRow('effects cannot be editorially patched', row => { row.changes[0].catalog = 'effects'; }, /catalog\/ID/);
for (const field of ['id', 'kind', 'keywords', 'palette', 'images', 'prompts', '/name', '*', 'name.value', '__proto__']) {
  rejectsRow(`forbidden field: ${field}`, row => { row.changes[0].field = field; }, /field not allowed/);
}
for (const name of ['before', 'after']) {
  rejectsRow(`forged ${name} payload`, row => { row.changes[0][name].value = 'Forged'; }, new RegExp(`${name} hash mismatch`));
  rejectsRow(`forged ${name} hash`, row => { row.changes[0][`${name}Sha256`] = 'b'.repeat(64); }, new RegExp(`${name} hash mismatch`));
  rejectsRow(`missing ${name} hash`, row => { delete row.changes[0][`${name}Sha256`]; }, /unknown or missing keys/);
  rejectsRow(`missing ${name} value`, row => { delete row.changes[0][name].value; }, /unknown or missing keys/);
  rejectsRow(`unknown ${name} key`, row => { row.changes[0][name].extra = true; }, /unknown or missing keys/);
}
rejectsRow('self-consistent forged before still differs from baseline', row => {
  row.changes[0].before = present('Wrong baseline'); row.changes[0].beforeSha256 = hash(row.changes[0].before);
}, /before value mismatch/);
rejectsRow('fully resealed after payload fails pinned tip', (row, f) => {
  row.changes[0].after = present('Unreviewed'); row.changes[0].afterSha256 = hash(row.changes[0].after);
  const tip = f.policy.finalRevisionSha256; seal(f); f.policy.finalRevisionSha256 = tip;
}, /final revision hash/, false);
rejectsRow('deletion is forbidden', row => { row.changes[0].after = { present: false }; }, /deletion/);
rejectsRow('absent before must not have a value', row => { row.changes[0].before = { present: false, value: null }; }, /unknown or missing keys/);
rejectsRow('no-op receipt is rejected', row => { row.changes[0].after = row.changes[0].before; row.changes[0].afterSha256 = row.changes[0].beforeSha256; }, /no-op/);
for (const after of [null, '', {}, []]) {
  test(`invalid after type/value ${JSON.stringify(after)}`, () => {
    assert.throws(() => run(fixture([change('name', present('Refractive Glass'), present(after))])), /after value/);
  });
}

test('policy rejects broad/unknown/duplicate/missing grants and unused field grants', () => {
  for (const mutate of [
    p => { p.schemaVersion = 2; }, p => { p.extra = true; }, p => { delete p.revisionIds; },
    p => { p.allowedFields = null; }, p => { p.allowedFields.minimalism = ['name']; },
    p => { p.allowedFields[ID] = ['prompts']; }, p => { p.allowedFields[ID] = ['name', 'name']; },
    p => { p.revisionIds.push(p.revisionIds[0]); }, p => { p.finalRevisionSha256 = null; },
    p => { p.allowedFields[ID].push('history'); },
  ]) { const f = fixture(); mutate(f.policy); assert.throws(() => run(f), /editorial revisions:/); }
});

function chainFixture() {
  const f = fixture(); const row = structuredClone(f.rows[0]);
  row.revisionId = 'fixture-002'; row.parentRevisionSha256 = f.rows[0].revisionSha256;
  row.changes = [change('name', present('Liquid Glass'), present('Reviewed Liquid Glass'))];
  f.rows.push(row); f.policy.revisionIds.push(row.revisionId); seal(f); return f;
}

test('ordered chain checks each before against the preceding replay result', () => {
  const f = chainFixture(); assert.equal(run(f).isms[0].name, 'Reviewed Liquid Glass');
  f.rows[1].changes[0] = change(); seal(f);
  assert.throws(() => run(f), /before value mismatch/);
});
for (const [label, mutate, pattern] of [
  ['deleted row', f => f.rows.pop(), /revision count/],
  ['reordered rows', f => f.rows.reverse(), /ID\/order/],
  ['duplicated row', f => { f.rows[1] = f.rows[0]; }, /ID\/order/],
  ['broken parent', f => { f.rows[1].parentRevisionSha256 = null; seal(f); }, /parent revision/],
  ['stale tip', f => { f.policy.finalRevisionSha256 = f.rows[0].revisionSha256; }, /final revision/],
  ['extra row', f => { f.rows.push(f.rows[1]); }, /revision count/],
]) test(`chain rejects ${label}`, () => { const f = chainFixture(); mutate(f); assert.throws(() => run(f), pattern); });

test('changed runtime binding and duplicate/missing baseline IDs fail', () => {
  const changed = fixture(); changed.options.baselineRuntime.isms[1].name = 'Changed';
  assert.throws(() => run(changed), /baselineRuntimeSha256 mismatch/);
  const duplicate = fixture(); duplicate.options.baselineRuntime.isms.push({ id: ID });
  assert.throws(() => run(duplicate), /IDs invalid or duplicated/);
  const missing = fixture(); missing.options.baselineRuntime.isms.shift();
  missing.rows[0].baselineRuntimeSha256 = hash(missing.options.baselineRuntime); seal(missing);
  assert.throws(() => run(missing), /baseline ID missing/);
});

test('whole-runtime comparison catches outside drift and coexists with approved prompt substitutions', () => {
  const f = fixture(); const expected = run(f); const current = baseline(); current.isms[0].name = 'Liquid Glass';
  assert.deepEqual(expected, current);
  for (const mutate of [r => { r.effects[0].guide.prompt = 'unapproved'; },
    r => { r.isms[1].name = 'unapproved'; }, r => { r.isms[0].keywords.push('unapproved'); },
    r => { r.isms[0].images[0].file = 'unapproved.png'; }, r => { r.isms[0].prompts[0].prompt = 'unapproved'; }]) {
    const tampered = structuredClone(current); mutate(tampered); assert.notDeepEqual(expected, tampered);
  }
  current.isms[0].prompts[0].prompt = 'approved image prompt';
  current.effects[0].guide.prompt = 'approved effect prompt';
  // Existing consumer applies separately validated image approvals after replay.
  expected.isms[0].prompts[0] = structuredClone(current.isms[0].prompts[0]);
  expected.effects[0].guide.prompt = current.effects[0].guide.prompt;
  assert.deepEqual(expected, current);
  assert.equal(f.options.baselineRuntime.isms[0].prompts[0].prompt, 'original image prompt');
});
