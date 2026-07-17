#!/usr/bin/env node
import { closeSync, existsSync, fsyncSync, openSync, readFileSync, writeSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AUDIT_COLUMNS, RUBRICS, escapeCsv, loadInventory } from './image-quality-lib.mjs';

const args = process.argv.slice(2); const runIndex = args.indexOf('--run-id');
const runId = runIndex >= 0 ? args[runIndex + 1] : '';
if (!runId) throw new Error('--run-id is required');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'devlog/260715_production_upgrade/091_image_quality_audit.csv');
if (existsSync(output)) throw new Error('audit CSV already exists');
const receipt = JSON.parse(readFileSync(join(root, 'devlog/260715_production_upgrade/095_image_baseline_sheet_receipts.json'), 'utf8'));
if (receipt.header?.runId !== runId) throw new Error('run ID does not match baseline receipt');
const mapByKey = new Map(receipt.sheets.flatMap(sheet => sheet.maps).map(item => [item.key, item]));
const replacements = new Map();
for (let index = 0; index < args.length; index += 1) {
  if (args[index] !== '--replace') continue;
  const [key, rubric, reason] = (args[index + 1] ?? '').split('|');
  if (!RUBRICS.includes(rubric) || !reason) throw new Error(`invalid --replace ${args[index + 1]}`);
  replacements.set(key, { rubric, reason });
}
const rows = [];
for (const item of loadInventory(root)) {
  const map = mapByKey.get(item.key); if (!map) throw new Error(`baseline sheet map missing ${item.key}`);
  const replacement = replacements.get(item.key);
  const row = {
    run_id: runId, key: item.key, catalog: item.catalog, id: item.id, slot: item.slot, file: item.file,
    source_path: item.source, preview_path: item.preview, sheet_id: map.sheetId, cell_index: map.cellIndex,
    baseline_source_sha256: map.sourceSha256, baseline_preview_sha256: map.previewSha256,
    decision: replacement ? 'replace' : 'keep', reason: replacement?.reason ?? 'Baseline sheet reviewed; no rubric defect observed.',
    current_source_sha256: map.sourceSha256, current_preview_sha256: map.previewSha256
  };
  for (const rubric of RUBRICS) row[rubric] = replacement?.rubric === rubric ? 'fail' : 'pass';
  rows.push(AUDIT_COLUMNS.map(column => escapeCsv(row[column])).join(','));
}
for (const key of replacements.keys()) if (!rows.some(row => row.includes(escapeCsv(key)))) throw new Error(`replace key not found ${key}`);
const text = `${AUDIT_COLUMNS.join(',')}\n${rows.join('\n')}\n`;
const handle = openSync(output, 'wx');
try { writeSync(handle, text); fsyncSync(handle); } finally { closeSync(handle); }
console.log(`image audit initialized: ${rows.length} rows, ${replacements.size} replacements`);
