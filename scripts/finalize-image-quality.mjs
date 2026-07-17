#!/usr/bin/env node
import { closeSync, existsSync, fsyncSync, linkSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, realpathSync, rmSync, unlinkSync, writeSync } from 'node:fs';
import { hostname, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { AUDIT_COLUMNS, attemptRows, buildSheet, loadInventory, parseCsv, sha256Bytes, sha256File, sheetSpecs, stableJson, verifyBaseline } from './image-quality-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const devlog = join(root, 'devlog/260715_production_upgrade');
const receiptPath = join(devlog, '098_image_final_sheet_receipts.json');
const finalDir = join(devlog, '095_image_sheets/final');
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

const temp = mkdtempSync(join(tmpdir(), 'design-isms-final-sheets-'));
try {
  const sheets = [];
  for (const spec of sheetSpecs(inventory)) sheets.push(await buildSheet(root, spec, temp));
  const header = { schemaVersion: 1, runId: baseline.runId, baselineSha256: baseline.aggregateSha256,
    acceptedAttempts: accepted.map(states => states[0].attemptId).sort(), sheetCount: sheets.length,
    cellCount: sheets.reduce((sum, sheet) => sum + sheet.maps.length, 0),
    aggregateSha256: sha256Bytes(stableJson(sheets.map(sheet => ({ id: sheet.id, imagePixelSha256: sheet.imagePixelSha256, mapSha256: sheet.mapSha256 })))) };
  const receipt = { header, sheets };
  let createReceipt = true;
  if (existsSync(receiptPath)) {
    if (lstatSync(receiptPath).isSymbolicLink() || realpathSync(receiptPath) !== receiptPath) throw new Error('unsafe final receipt path');
    const current = JSON.parse(readFileSync(receiptPath, 'utf8'));
    if (stableJson(current) !== stableJson(receipt)) throw new Error('final receipt exists with different bytes');
    for (const sheet of sheets) if (sha256File(join(finalDir, sheet.file)) !== sheet.fileSha256) throw new Error(`${sheet.id}: committed final sheet drift`);
    console.log(`image quality already finalized: ${header.aggregateSha256}`); createReceipt = false;
  }
  if (createReceipt) {
  mkdirSync(finalDir, { recursive: true });
  if (lstatSync(finalDir).isSymbolicLink() || realpathSync(finalDir) !== finalDir) throw new Error('unsafe final sheet directory');
  for (const sheet of sheets) {
    const target = join(finalDir, sheet.file); const bytes = readFileSync(join(temp, sheet.file));
    if (existsSync(target)) { if (sha256File(target) !== sheet.fileSha256) throw new Error(`${sheet.id}: conflicting final sheet`); }
    else { const fd = openSync(target, 'wx'); try { writeSync(fd, bytes); fsyncSync(fd); } finally { closeSync(fd); } }
  }
  const sheetDir = openSync(finalDir, 'r'); try { fsyncSync(sheetDir); } finally { closeSync(sheetDir); }
  const sheetParent = openSync(dirname(finalDir), 'r'); try { fsyncSync(sheetParent); } finally { closeSync(sheetParent); }
  const text = ['{', `  "header": ${JSON.stringify(header)},`, '  "sheets": [',
    ...sheets.map((sheet, index) => `    ${JSON.stringify(sheet)}${index + 1 === sheets.length ? '' : ','}`), '  ]', '}', ''].join('\n');
  const tempReceipt = `${receiptPath}.${process.pid}.tmp`; const fd = openSync(tempReceipt, 'wx');
  try { writeSync(fd, text); fsyncSync(fd); } finally { closeSync(fd); }
  try { linkSync(tempReceipt, receiptPath); const dir = openSync(devlog, 'r'); try { fsyncSync(dir); } finally { closeSync(dir); } } finally { unlinkSync(tempReceipt); }
  console.log(`image quality finalized: ${header.aggregateSha256}, ${header.cellCount} cells`);
  }
} finally { rmSync(temp, { recursive: true, force: true }); }
} finally { rmSync(lockPath, { force: true }); }
