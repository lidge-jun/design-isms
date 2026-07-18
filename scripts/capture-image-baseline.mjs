#!/usr/bin/env node
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, rmSync, writeSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSheet, loadInventory, sha256Bytes, sha256File, sheetSpecs, stableJson, verifyBaseline } from './image-quality-lib.mjs';

const args = process.argv.slice(2); const runIndex = args.indexOf('--run-id');
if (runIndex < 0 || !/^[a-z0-9][a-z0-9-]{5,80}$/.test(args[runIndex + 1] ?? '')) throw new Error('--run-id is required (lowercase letters, digits, hyphen)');
const runId = args[runIndex + 1];
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const devlog = join(root, 'devlog/_fin/260715_production_upgrade');
const paths = {
  assets: join(devlog, '093_image_baseline_assets.jsonl'), pairs: join(devlog, '094_image_baseline_pairs.json'),
  sheets: join(devlog, '095_image_baseline_sheet_receipts.json'), runtime: join(devlog, '096_image_baseline_runtime.json'),
  ledgers: join(devlog, '097_effect_ledger_baseline'), sheetDir: join(devlog, '095_image_sheets/baseline')
};
const captureMarker = join(devlog, '.image-baseline-capture.json');

function writeExclusive(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const handle = openSync(path, 'wx');
  try { writeSync(handle, value); fsyncSync(handle); } finally { closeSync(handle); }
}
function copyExclusive(source, target) { writeExclusive(target, readFileSync(source)); }
function fsyncDir(path) { const handle = openSync(path, 'r'); try { fsyncSync(handle); } finally { closeSync(handle); } }

const partialPaths = [paths.assets, paths.pairs, paths.runtime, paths.ledgers, paths.sheetDir];
if (existsSync(captureMarker) && !existsSync(paths.sheets)) {
  const marker = JSON.parse(readFileSync(captureMarker, 'utf8'));
  if (marker.runId !== runId) throw new Error(`baseline capture lock belongs to ${marker.runId}`);
  for (const path of partialPaths) rmSync(path, { recursive: true, force: true });
} else if (!existsSync(captureMarker) && !existsSync(paths.sheets) && partialPaths.some(existsSync)) {
  throw new Error('partial baseline artifacts exist without capture marker');
}

if (existsSync(paths.sheets)) {
  const checked = verifyBaseline(root); const existing = checked.receipt; const header = existing.header ?? {};
  if (header.runId !== runId) throw new Error(`baseline already belongs to ${header.runId}`);
  rmSync(captureMarker, { force: true });
  console.log(`image baseline reused: run=${runId} aggregate=${header.aggregateSha256}`);
  process.exit(0);
}
if (!existsSync(captureMarker)) writeExclusive(captureMarker, JSON.stringify({ runId, state: 'capturing' }) + '\n');

const inventory = loadInventory(root);
const assetRows = inventory.flatMap(item => [item.source, item.preview]).sort().map(path => ({ path, sha256: sha256File(join(root, path)) }));
if (assetRows.length !== 422 || new Set(assetRows.map(row => row.path)).size !== 422) throw new Error('baseline asset inventory is not exactly 422 unique paths');
writeExclusive(paths.assets, assetRows.map(row => JSON.stringify(row)).join('\n') + '\n');

const pairManifest = JSON.parse(readFileSync(join(root, 'assets/data/image-pairs-manifest.json'), 'utf8'));
writeExclusive(paths.pairs, JSON.stringify({ runId, manifest: pairManifest }) + '\n');
const runtime = {
  runId,
  isms: JSON.parse(readFileSync(join(root, 'assets/data/isms.json'), 'utf8')),
  effects: JSON.parse(readFileSync(join(root, 'assets/data/effects.json'), 'utf8'))
};
writeExclusive(paths.runtime, JSON.stringify(runtime) + '\n');

mkdirSync(paths.ledgers, { recursive: false });
const ledgerSources = [
  ['031.before.csv', join(devlog, '031_effect_guide_audit.csv')],
  ['032.before.jsonl', join(devlog, '032_effect_guide_manifest.jsonl')]
];
const ledgerRows = [];
for (const [name, source] of ledgerSources) {
  if (!existsSync(source)) throw new Error(`effect ledger missing: ${source}`);
  const target = join(paths.ledgers, name); copyExclusive(source, target);
  ledgerRows.push({ name, sha256: sha256File(target), bytes: readFileSync(target).length });
}
writeExclusive(join(paths.ledgers, 'index.json'), JSON.stringify({ runId, files: ledgerRows }, null, 2) + '\n');
fsyncDir(paths.ledgers);

const tempDir = join(root, `.tmp/image-quality/baseline-${runId}`);
const receipts = [];
for (const spec of sheetSpecs(inventory)) receipts.push(await buildSheet(root, spec, tempDir));
mkdirSync(paths.sheetDir, { recursive: true });
for (const receipt of receipts) copyExclusive(join(tempDir, receipt.file), join(paths.sheetDir, receipt.file));
fsyncDir(paths.sheetDir);

const aggregateInput = {
  runId,
  assetsSha256: sha256File(paths.assets), pairsSha256: sha256File(paths.pairs), runtimeSha256: sha256File(paths.runtime),
  ledgers: ledgerRows,
  sheets: receipts.map(item => ({ id: item.id, file: item.file, fileSha256: sha256File(join(paths.sheetDir, item.file)), imagePixelSha256: item.imagePixelSha256, mapSha256: item.mapSha256 }))
};
const aggregateSha256 = sha256Bytes(stableJson(aggregateInput));
const header = { schemaVersion: 1, runId, aggregateSha256, sharp: receipts[0]?.sharp, vips: receipts[0]?.vips, sheetCount: receipts.length, cellCount: receipts.reduce((sum, item) => sum + item.maps.length, 0) };
const sheetText = ['{', `  "header": ${JSON.stringify(header)},`, '  "sheets": [',
  ...receipts.map((item, index) => `    ${JSON.stringify({ ...item, fileSha256: sha256File(join(paths.sheetDir, item.file)) })}${index + 1 === receipts.length ? '' : ','}`),
  '  ]', '}', ''].join('\n');
writeExclusive(paths.sheets, sheetText);
for (const path of [devlog, dirname(paths.sheetDir)]) fsyncDir(path);
rmSync(captureMarker, { force: true }); fsyncDir(devlog);
console.log(`image baseline captured: run=${runId}, assets=${assetRows.length}, cells=${header.cellCount}, aggregate=${aggregateSha256}`);
