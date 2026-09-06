import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishFinalReceipt, readFinalizationState, validateFinalReceipt, validateFinalSuccessor, verifyFinalHistory } from './image-final-history.mjs';

const base = 'devlog/_fin/260715_production_upgrade';
const currentPath = `${base}/098_image_final_sheet_receipts.json`;
const digest = value => createHash('sha256').update(value).digest('hex');
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
function seal(receipt) {
  for (const s of receipt.sheets) s.mapSha256 = digest(JSON.stringify(s.maps));
  receipt.header.aggregateSha256 = digest(JSON.stringify(canonical(receipt.sheets.map(s => ({ id: s.id, imagePixelSha256: s.imagePixelSha256, mapSha256: s.mapSha256 })))));
  return receipt;
}
function put(path, bytes) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, bytes); }
// These are file/hash-contract fixtures, not assertions about image decoding/rendering.
function fixture(t) {
  const root = mkdtempSync(join(realpathSync(tmpdir()), 'image-final-history-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const blobs = new Map();
  const sheets = ['ism-slot-0', 'ism-slot-1', 'ism-slot-2', 'effects-guide'].map((id, slot) => {
    const side = slot === 3 ? 8 : 7; const bytes = Buffer.from(`original sheet ${id}`); blobs.set(`${id}.webp`, bytes);
    return { id, file: `${id}.webp`, fileSha256: digest(bytes), imagePixelSha256: digest(`pixels ${id}`), mapSha256: '',
      cols: side, rows: side, cell: { width: 320, height: 213, labelHeight: 27 }, sharp: '0.35.3', vips: '8.18.3',
      maps: Array.from({ length: side * side }, (_, i) => {
        const name = `example-${i}`; const file = slot === 3 ? 'guide' : `image-${slot}`;
        const suffix = `${slot === 3 ? 'effects/' : ''}${name}/${file}`;
        return { sheetId: id, cellIndex: i, label: `${i + 1} ${name}`, key: slot === 3 ? `effect:${name}:guide:guide.png` : `ism:${name}:${slot}:${file}.png`,
          source: `assets/images/${suffix}.png`, preview: `assets/images/thumbs/${suffix}.webp`, sourceSha256: digest(`source ${suffix}`), previewSha256: digest(`preview ${suffix}`) };
      }) };
  });
  const previous = seal({ header: { schemaVersion: 1, runId: 'fixture', baselineSha256: digest('immutable baseline'),
    acceptedAttempts: ['img-000001'], sheetCount: 4, cellCount: 211, aggregateSha256: '' }, sheets });
  const old = previous.sheets[2].maps[0];
  const approved = new Map([['img-000001', { key: old.key, beforeSha256: digest('old original'), sourceSha256: old.sourceSha256, previewSha256: old.previewSha256 }]]);
  const bytes = Buffer.from(JSON.stringify(previous, null, 2) + '\n'); const previousSha = digest(bytes);
  put(join(root, currentPath), bytes);
  for (const [file, value] of blobs) put(join(root, base, '095_image_sheets/final', file), value);
  const next = structuredClone(previous); next.header.acceptedAttempts.push('img-000002');
  const map = next.sheets[0].maps[0]; const beforeSha256 = map.sourceSha256;
  map.sourceSha256 = digest('new source'); map.previewSha256 = digest('new preview');
  approved.set('img-000002', { key: map.key, beforeSha256, sourceSha256: map.sourceSha256, previewSha256: map.previewSha256 });
  blobs.set('ism-slot-0.webp', Buffer.from('new sheet ism-slot-0'));
  next.sheets[0].fileSha256 = digest(blobs.get('ism-slot-0.webp')); next.sheets[0].imagePixelSha256 = digest('new pixel hash'); seal(next);
  const generated = join(root, 'generated');
  for (const [file, value] of blobs) put(join(generated, file), value);
  const options = { supersede: true, expectedPreviousSha: previousSha, approvedAttempts: approved };
  const archive = join(root, base, '098_image_final_history', previousSha);
  const successorDir = join(root, base, '095_image_sheets/final-revisions', next.header.aggregateSha256);
  return { root, previous, next, approved, bytes, previousSha, generated, options, archive, successorDir, blobs };
}

test('valid successor preserves exact previous bytes and sheets, publishes linked immutable finals', t => {
  const f = fixture(t); const oldSheet = readFileSync(join(f.root, base, '095_image_sheets/final/ism-slot-0.webp'));
  const result = publishFinalReceipt(f.root, f.next, f.generated, f.options);
  assert.equal(result.status, 'published');
  assert.deepEqual(result.receipt.header.supersedes, { receiptSha256: f.previousSha, aggregateSha256: f.previous.header.aggregateSha256 });
  assert.deepEqual(readFileSync(join(f.archive, 'receipt.json')), f.bytes);
  assert.deepEqual(readFileSync(join(f.archive, 'sheets/ism-slot-0.webp')), oldSheet);
  assert.deepEqual(readFileSync(join(f.root, base, '095_image_sheets/final/ism-slot-0.webp')), oldSheet);
  assert.deepEqual(readdirSync(f.successorDir).sort(), ['effects-guide.webp', 'ism-slot-0.webp', 'ism-slot-1.webp', 'ism-slot-2.webp']);
  assert.equal(verifyFinalHistory(f.root, result.receipt, f.approved), f.successorDir);
  assert.equal(result.receiptSha256, digest(readFileSync(join(f.root, currentPath))));
});

test('default rejects changed receipt; identical legacy and successor payloads are no-op', t => {
  const f = fixture(t);
  assert.throws(() => publishFinalReceipt(f.root, f.next, f.generated, { approvedAttempts: f.approved }), /different bytes/);
  assert.deepEqual(readFileSync(join(f.root, currentPath)), f.bytes);
  assert.equal(publishFinalReceipt(f.root, f.previous, f.generated, { approvedAttempts: f.approved }).status, 'unchanged');
  const result = publishFinalReceipt(f.root, f.next, f.generated, f.options);
  const before = readFileSync(join(f.root, currentPath));
  assert.equal(publishFinalReceipt(f.root, f.next, f.generated, { approvedAttempts: f.approved }).status, 'unchanged');
  assert.equal(publishFinalReceipt(f.root, f.next, f.generated, { ...f.options, expectedPreviousSha: result.receiptSha256 }).status, 'unchanged');
  assert.deepEqual(readFileSync(join(f.root, currentPath)), before);
  assert.throws(() => publishFinalReceipt(f.root, f.next, f.generated, f.options), /stale expected/);
});

test('expected SHA is mandatory with supersede, stale values fail before writing artifacts', t => {
  const f = fixture(t);
  for (const options of [{ supersede: true }, { expectedPreviousSha: f.previousSha }, { supersede: true, expectedPreviousSha: '../escape' }]) {
    assert.throws(() => readFinalizationState(f.root, { ...options, approvedAttempts: f.approved }), /requires|invalid/);
  }
  assert.throws(() => publishFinalReceipt(f.root, f.next, f.generated, { ...f.options, expectedPreviousSha: digest('wrong') }), /stale expected/);
  assert.equal(existsSync(f.archive), false); assert.equal(existsSync(f.successorDir), false);
});

test('non-target cell drift rejects even with recomputed map/aggregate hashes', t => {
  const f = fixture(t); f.next.sheets[0].maps[1].previewSha256 = digest('unauthorized'); seal(f.next);
  assert.throws(() => publishFinalReceipt(f.root, f.next, f.generated, f.options), /non-target cell drift/);
  assert.deepEqual(readFileSync(join(f.root, currentPath)), f.bytes);
});

test('accepted continuity, target identity, before hash and applied hashes cannot be bypassed', t => {
  const f = fixture(t);
  const removed = structuredClone(f.next); removed.header.acceptedAttempts.shift();
  assert.throws(() => validateFinalSuccessor(f.previous, removed, f.approved), /removed accepted/);
  const identity = structuredClone(f.next); identity.sheets[0].maps[0].label = 'different identity'; seal(identity);
  assert.throws(() => validateFinalSuccessor(f.previous, identity, f.approved), /target identity/);
  const badBefore = new Map(f.approved); badBefore.set('img-000002', { ...badBefore.get('img-000002'), beforeSha256: digest('wrong') });
  assert.throws(() => validateFinalSuccessor(f.previous, f.next, badBefore), /before\/source/);
  const wrong = structuredClone(f.next); wrong.sheets[0].maps[0].sourceSha256 = digest('not applied'); seal(wrong);
  assert.throws(() => validateFinalSuccessor(f.previous, wrong, f.approved), /attempt mismatch/);
  const unknown = structuredClone(f.next); unknown.header.acceptedAttempts.push('img-000999');
  assert.throws(() => validateFinalSuccessor(f.previous, unknown, f.approved), /attempt mismatch/);
});

test('untouched sheet bytes and pixel metadata cannot drift', t => {
  const f = fixture(t); f.next.sheets[1].imagePixelSha256 = digest('changed'); seal(f.next);
  assert.throws(() => validateFinalSuccessor(f.previous, f.next, f.approved), /non-target sheet drift/);
});

test('predecessor tamper, missing sheets and malformed links fail verification', t => {
  const f = fixture(t); const result = publishFinalReceipt(f.root, f.next, f.generated, f.options);
  put(join(f.archive, 'receipt.json'), Buffer.concat([f.bytes, Buffer.from(' ')]));
  assert.throws(() => verifyFinalHistory(f.root, result.receipt, f.approved), /predecessor receipt hash/);
  put(join(f.archive, 'receipt.json'), f.bytes);
  rmSync(join(f.archive, 'sheets/effects-guide.webp'));
  assert.throws(() => verifyFinalHistory(f.root, result.receipt, f.approved), /not a regular file/);
  const escaped = structuredClone(result.receipt); escaped.header.supersedes.receiptSha256 = '../escape';
  assert.throws(() => verifyFinalHistory(f.root, escaped, f.approved), /invalid receipt SHA/);
  const extra = structuredClone(result.receipt); extra.header.supersedes.path = '/tmp/other';
  assert.throws(() => verifyFinalHistory(f.root, extra, f.approved), /invalid fields/);
});

test('existing archive requires exact bytes, including serialization and all sheet files', t => {
  const f = fixture(t);
  publishFinalReceipt(f.root, f.next, f.generated, f.options);
  put(join(f.root, currentPath), f.bytes); // Simulate interruption just before publication.
  put(join(f.archive, 'receipt.json'), JSON.stringify(f.previous));
  assert.throws(() => publishFinalReceipt(f.root, f.next, f.generated, f.options), /immutable bundle bytes mismatch/);
  put(join(f.archive, 'receipt.json'), f.bytes);
  put(join(f.archive, 'unexpected'), 'extra');
  assert.throws(() => publishFinalReceipt(f.root, f.next, f.generated, f.options), /file set mismatch/);
});

test('completed pre-publication artifacts allow safe retry; altered artifacts never overwrite', t => {
  const f = fixture(t); publishFinalReceipt(f.root, f.next, f.generated, f.options);
  put(join(f.root, currentPath), f.bytes); // Archive and successor dir persisted, old 098 retained.
  assert.equal(verifyFinalHistory(f.root, f.previous, f.approved), join(f.root, base, '095_image_sheets/final'));
  assert.equal(publishFinalReceipt(f.root, f.next, f.generated, f.options).status, 'published');
  put(join(f.root, currentPath), f.bytes);
  put(join(f.successorDir, 'ism-slot-0.webp'), 'tampered');
  assert.throws(() => publishFinalReceipt(f.root, f.next, f.generated, f.options), /immutable bundle bytes mismatch/);
  assert.deepEqual(readFileSync(join(f.root, currentPath)), f.bytes);
  assert.equal(readFileSync(join(f.successorDir, 'ism-slot-0.webp'), 'utf8'), 'tampered');
});

test('symlinked history and current receipt are rejected', t => {
  const f = fixture(t); const outside = join(f.root, 'outside'); mkdirSync(outside);
  symlinkSync(outside, join(f.root, base, '098_image_final_history'));
  assert.throws(() => publishFinalReceipt(f.root, f.next, f.generated, f.options), /unsafe directory/);
  const current = join(f.root, currentPath); rmSync(current); put(join(outside, 'receipt.json'), f.bytes); symlinkSync(join(outside, 'receipt.json'), current);
  assert.throws(() => readFinalizationState(f.root, f.options), /not a regular file/);
});

test('generated sheet mismatch cannot publish; receipt map/count/header changes reject', t => {
  const f = fixture(t); put(join(f.generated, 'ism-slot-0.webp'), 'wrong');
  assert.throws(() => publishFinalReceipt(f.root, f.next, f.generated, f.options), /generated sheet hash mismatch/);
  assert.deepEqual(readFileSync(join(f.root, currentPath)), f.bytes);
  const badMap = structuredClone(f.next); badMap.sheets[0].maps[0].sourceSha256 = digest('tampered');
  assert.throws(() => validateFinalReceipt(badMap), /map hash/);
  const count = structuredClone(f.next); count.header.cellCount = 212;
  assert.throws(() => validateFinalReceipt(count), /identity/);
  const run = structuredClone(f.next); run.header.runId = 'other';
  assert.throws(() => validateFinalSuccessor(f.previous, run, f.approved), /baseline\/run/);
});

test('multiple successors retain the full chain and ancestor sheet integrity', t => {
  const f = fixture(t); const first = publishFinalReceipt(f.root, f.next, f.generated, f.options);
  const third = structuredClone(f.next); third.header.acceptedAttempts.push('img-000003');
  const m = third.sheets[1].maps[0]; const beforeSha256 = m.sourceSha256;
  m.sourceSha256 = digest('third source'); m.previewSha256 = digest('third preview');
  f.approved.set('img-000003', { key: m.key, beforeSha256, sourceSha256: m.sourceSha256, previewSha256: m.previewSha256 });
  const bytes = Buffer.from('third sheet'); put(join(f.generated, 'ism-slot-1.webp'), bytes);
  third.sheets[1].fileSha256 = digest(bytes); third.sheets[1].imagePixelSha256 = digest('third pixels'); seal(third);
  const result = publishFinalReceipt(f.root, third, f.generated, { ...f.options, expectedPreviousSha: first.receiptSha256 });
  assert.equal(result.receipt.header.supersedes.receiptSha256, first.receiptSha256);
  assert.doesNotThrow(() => verifyFinalHistory(f.root, result.receipt, f.approved));
  put(join(f.archive, 'sheets/ism-slot-2.webp'), 'ancestor tampered');
  assert.throws(() => verifyFinalHistory(f.root, result.receipt, f.approved), /sheet bytes drift/);
});

test('repository receipt and persisted attempts satisfy the history reader without writes', () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const bytes = readFileSync(join(root, currentPath)); const receipt = JSON.parse(bytes);
  const ledger = join(root, base, '092_image_generation_attempts');
  const index = JSON.parse(readFileSync(join(ledger, 'index.json')));
  const rows = index.shards.flatMap(file => readFileSync(join(ledger, file), 'utf8').trim().split('\n').map(JSON.parse));
  const approved = new Map(rows.filter(row => row.state === 'applied').map(row => {
    const prepared = rows.find(p => p.state === 'prepared' && p.attemptId === row.attemptId);
    return [row.attemptId, { key: row.key, beforeSha256: prepared.beforeSha256, sourceSha256: row.sourceSha256, previewSha256: row.previewSha256 }];
  }));
  assert.doesNotThrow(() => verifyFinalHistory(root, receipt, approved));
  assert.deepEqual(readFileSync(join(root, currentPath)), bytes);
});
