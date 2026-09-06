#!/usr/bin/env node
import { closeSync, existsSync, fsyncSync, mkdirSync, mkdtempSync, openSync, readFileSync, realpathSync, rmSync, writeSync } from 'node:fs';
import { hostname, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { AUDIT_COLUMNS, attemptRows, buildSheet, loadInventory, parseCsv, sha256Bytes, sha256File, sheetSpecs, stableJson, verifyBaseline } from './image-quality-lib.mjs';
import { publishFinalReceipt, readFinalizationState } from './image-final-history.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const devlog = join(root, 'devlog/_fin/260715_production_upgrade');
const args = process.argv.slice(2);
let supersede = false; let expectedPreviousSha;
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === '--supersede' && !supersede) supersede = true;
  else if (args[index] === '--expected-previous-sha' && expectedPreviousSha === undefined) {
    expectedPreviousSha = args[++index];
    if (!/^[a-f0-9]{64}$/.test(expectedPreviousSha ?? '')) throw new Error('invalid --expected-previous-sha');
  } else throw new Error(`unknown or duplicate finalization argument: ${args[index]}`);
}
if (supersede !== (expectedPreviousSha !== undefined)) throw new Error('--supersede and --expected-previous-sha must be supplied together');
const baseline = verifyBaseline(root).receipt.header;
const inventory = loadInventory(root); const rows = attemptRows(root);
const lockPath = join(root, '.tmp/image-quality/finalize.lock'); mkdirSync(dirname(lockPath), { recursive: true });
if (existsSync(lockPath)) {
  const owner = JSON.parse(readFileSync(lockPath, 'utf8')); if (owner.host !== hostname() || owner.runId !== baseline.runId) throw new Error('finalize lock owner mismatch');
  let alive = false; try { process.kill(owner.pid, 0); alive = true; } catch { alive = false; } if (alive) throw new Error(`finalize lock held by ${owner.pid}`); rmSync(lockPath, { force: true });
}
const lock = openSync(lockPath, 'wx'); try { writeSync(lock, JSON.stringify({ pid: process.pid, host: hostname(), runId: baseline.runId }) + '\n'); fsyncSync(lock); } finally { closeSync(lock); }
try {
const groups = new Map();
for (const row of rows) { const list = groups.get(row.attemptId) ?? []; list.push(row); groups.set(row.attemptId, list); }
const accepted = [...groups.values()].filter(states => states.some(row => row.state === 'review' && row.decision === 'accepted'));
for (const states of accepted) if (!states.some(row => row.state === 'applied')) throw new Error(`${states[0].attemptId}: accepted but not applied`);
for (const states of groups.values()) if (!states.some(row => row.state === 'review')) throw new Error(`${states[0].attemptId}: open attempt`);
const approvedAttempts = new Map(accepted.map(states => {
  const prepared = states.find(row => row.state === 'prepared'); const applied = states.find(row => row.state === 'applied');
  return [prepared.attemptId, { key: prepared.key, beforeSha256: prepared.beforeSha256, sourceSha256: applied.sourceSha256, previewSha256: applied.previewSha256 }];
}));
const publication = { supersede, expectedPreviousSha, approvedAttempts };
readFinalizationState(root, publication);
const acceptedKeys = new Set(accepted.map(states => states.find(row => row.state === 'prepared').key));
const audit = parseCsv(readFileSync(join(devlog, '091_image_quality_audit.csv'), 'utf8')); const headerRow = audit[0];
if (stableJson(headerRow) !== stableJson(AUDIT_COLUMNS) || audit.length !== 212) throw new Error('audit ledger incomplete');
const col = Object.fromEntries(headerRow.map((name, index) => [name, index])); const audited = new Set();
for (const row of audit.slice(1)) {
  const key = row[col.key]; const item = inventory.find(value => value.key === key); if (!item || audited.has(key)) throw new Error(`invalid audit key ${key}`); audited.add(key);
  if (!row[col.reason]?.trim() || !['keep', 'replace'].includes(row[col.decision])) throw new Error(`${key}: non-terminal audit row`);
  if (row[col.current_source_sha256] !== sha256File(join(root, item.source)) || row[col.current_preview_sha256] !== sha256File(join(root, item.preview))) throw new Error(`${key}: audit current hash drift`);
  if ((row[col.decision] === 'replace') !== acceptedKeys.has(key)) throw new Error(`${key}: audit/accepted mismatch`);
}
if (audited.size !== 211) throw new Error('audit key set incomplete');
const preflight = spawnSync(process.execPath, [join(root, 'scripts/verify-image-quality.mjs'), '--pre-final'], { cwd: root, encoding: 'utf8' });
if (preflight.status !== 0) throw new Error(`image quality pre-final verification failed:\n${preflight.stderr || preflight.stdout}`);

const temp = mkdtempSync(join(realpathSync(tmpdir()), 'design-isms-final-sheets-'));
try {
  const sheets = [];
  for (const spec of sheetSpecs(inventory)) sheets.push(await buildSheet(root, spec, temp));
  const header = { schemaVersion: 1, runId: baseline.runId, baselineSha256: baseline.aggregateSha256,
    acceptedAttempts: accepted.map(states => states[0].attemptId).sort(), sheetCount: sheets.length,
    cellCount: sheets.reduce((sum, sheet) => sum + sheet.maps.length, 0),
    aggregateSha256: sha256Bytes(stableJson(sheets.map(sheet => ({ id: sheet.id, imagePixelSha256: sheet.imagePixelSha256, mapSha256: sheet.mapSha256 })))) };
  const result = publishFinalReceipt(root, { header, sheets }, temp, publication);
  console.log(`image quality ${result.status === 'unchanged' ? 'already finalized' : 'finalized'}: ${header.aggregateSha256}, ${header.cellCount} cells, receipt=${result.receiptSha256}`);
} finally { rmSync(temp, { recursive: true, force: true }); }
} finally { rmSync(lockPath, { force: true }); }
