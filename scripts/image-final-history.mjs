import { closeSync, fsyncSync, linkSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync,
  realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { CELL, assertContainedRegular, safeRelativePath, sha256Bytes, sha256File, stableJson } from './image-quality-lib.mjs';

const BASE = 'devlog/_fin/260715_production_upgrade';
const RECEIPT = `${BASE}/098_image_final_sheet_receipts.json`;
const SHA = /^[a-f0-9]{64}$/;
const SHEETS = ['ism-slot-0', 'ism-slot-1', 'ism-slot-2', 'effects-guide'];
function demand(value, message) { if (!value) throw new Error(message); }
function hash(value) { demand(typeof value === 'string' && SHA.test(value), 'invalid receipt SHA256'); return value; }
function exists(path) { try { lstatSync(path); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; } }
function exactKeys(value, keys, label) {
  demand(value && typeof value === 'object' && !Array.isArray(value) && stableJson(Object.keys(value).sort()) === stableJson([...keys].sort()), `${label}: invalid fields`);
}
function sync(path) { const fd = openSync(path, 'r'); try { fsyncSync(fd); } finally { closeSync(fd); } }
function directory(root, path, create = false) {
  const rel = relative(root, path);
  demand(rel && !rel.startsWith(`..${sep}`) && rel !== '..' && !resolve(path).startsWith(`${root}${sep}..`), 'directory escapes root');
  demand(realpathSync(root) === root && !lstatSync(root).isSymbolicLink(), 'unsafe root');
  let cursor = root;
  for (const part of rel.split(sep)) {
    cursor = join(cursor, part);
    if (!exists(cursor) && create) { mkdirSync(cursor); sync(dirname(cursor)); }
    demand(exists(cursor) && lstatSync(cursor).isDirectory() && !lstatSync(cursor).isSymbolicLink(), `unsafe directory: ${cursor}`);
  }
  return path;
}
function regular(root, path) { return assertContainedRegular(root, path); }
function archiveDir(root, sha) { return join(root, BASE, '098_image_final_history', hash(sha)); }

export function finalSheetDirectory(root, receipt) {
  return receipt.header.supersedes
    ? join(root, BASE, '095_image_sheets/final-revisions', hash(receipt.header.aggregateSha256))
    : join(root, BASE, '095_image_sheets/final');
}

// Checks receipt-internal maps and hashes without substituting current source data.
export function validateFinalReceipt(receipt) {
  exactKeys(receipt, ['header', 'sheets'], 'receipt');
  const h = receipt.header;
  exactKeys(h, ['schemaVersion', 'runId', 'baselineSha256', 'acceptedAttempts', 'sheetCount', 'cellCount', 'aggregateSha256',
    ...(Object.hasOwn(h ?? {}, 'supersedes') ? ['supersedes'] : [])], 'receipt header');
  demand(h.schemaVersion === 1 && typeof h.runId === 'string' && h.runId.length > 0 && h.sheetCount === 4 && h.cellCount === 211, 'invalid final receipt identity');
  hash(h.baselineSha256); hash(h.aggregateSha256);
  demand(Array.isArray(h.acceptedAttempts) && h.acceptedAttempts.every(id => /^img-\d{6}$/.test(id)) &&
    new Set(h.acceptedAttempts).size === h.acceptedAttempts.length && stableJson(h.acceptedAttempts) === stableJson([...h.acceptedAttempts].sort()), 'invalid accepted attempts');
  if (Object.hasOwn(h, 'supersedes')) {
    exactKeys(h.supersedes, ['receiptSha256', 'aggregateSha256'], 'supersedes');
    hash(h.supersedes.receiptSha256); hash(h.supersedes.aggregateSha256);
  }
  demand(Array.isArray(receipt.sheets) && receipt.sheets.length === 4, 'invalid sheet count');
  const keys = new Set();
  for (const [index, s] of receipt.sheets.entries()) {
    exactKeys(s, ['id', 'file', 'fileSha256', 'imagePixelSha256', 'mapSha256', 'cols', 'rows', 'cell', 'sharp', 'vips', 'maps'], 'sheet');
    const side = index === 3 ? 8 : 7;
    demand(s.id === SHEETS[index] && s.file === `${s.id}.webp` && s.cols === side && s.rows === side &&
      stableJson(s.cell) === stableJson(CELL) && typeof s.sharp === 'string' && typeof s.vips === 'string', 'invalid sheet identity');
    hash(s.fileSha256); hash(s.imagePixelSha256); hash(s.mapSha256);
    demand(Array.isArray(s.maps) && s.maps.length === side * side && sha256Bytes(JSON.stringify(s.maps)) === s.mapSha256, 'sheet map hash/count mismatch');
    for (const [cellIndex, m] of s.maps.entries()) {
      exactKeys(m, ['sheetId', 'cellIndex', 'label', 'key', 'source', 'preview', 'sourceSha256', 'previewSha256'], 'cell map');
      demand(m.sheetId === s.id && m.cellIndex === cellIndex && typeof m.label === 'string' && typeof m.key === 'string' &&
        !keys.has(m.key) && safeRelativePath(m.source) && safeRelativePath(m.preview), 'invalid cell identity');
      const match = index === 3 ? /^effect:([a-z0-9-]+):guide:guide\.png$/.exec(m.key)
        : new RegExp(`^ism:([a-z0-9-]+):${index}:([a-z0-9-]+\\.png)$`).exec(m.key);
      demand(match, 'invalid cell key');
      const suffix = index === 3 ? `effects/${match[1]}/guide` : `${match[1]}/${match[2].slice(0, -4)}`;
      demand(m.source === `assets/images/${suffix}.png` && m.preview === `assets/images/thumbs/${suffix}.webp`, 'cell path/key mismatch');
      hash(m.sourceSha256); hash(m.previewSha256); keys.add(m.key);
    }
  }
  const aggregate = sha256Bytes(stableJson(receipt.sheets.map(s => ({ id: s.id, imagePixelSha256: s.imagePixelSha256, mapSha256: s.mapSha256 }))));
  demand(aggregate === h.aggregateSha256 && keys.size === 211, 'final aggregate mismatch');
  return receipt;
}

function verifySheetFiles(root, receipt, dir) {
  directory(root, dir);
  for (const sheet of receipt.sheets) demand(sha256File(regular(root, join(dir, sheet.file))) === sheet.fileSha256, `sheet bytes drift: ${sheet.id}`);
}
function cells(receipt) { return new Map(receipt.sheets.flatMap(s => s.maps).map(m => [m.key, m])); }
function verifyAttempts(receipt, approved) {
  const maps = cells(receipt); const seen = new Set();
  for (const id of receipt.header.acceptedAttempts) {
    const a = approved.get(id); const cell = maps.get(a?.key);
    demand(a && cell && !seen.has(a.key) && cell.sourceSha256 === a.sourceSha256 && cell.previewSha256 === a.previewSha256, `receipt attempt mismatch: ${id}`);
    seen.add(a.key);
  }
}

export function validateFinalSuccessor(previous, next, approved) {
  validateFinalReceipt(previous); validateFinalReceipt(next);
  demand(next.header.runId === previous.header.runId && next.header.baselineSha256 === previous.header.baselineSha256, 'successor baseline/run mismatch');
  verifyAttempts(previous, approved); verifyAttempts(next, approved);
  const prior = new Set(previous.header.acceptedAttempts); const current = new Set(next.header.acceptedAttempts);
  demand([...prior].every(id => current.has(id)), 'successor removed accepted attempt');
  const added = [...current].filter(id => !prior.has(id));
  demand(added.length > 0, 'successor requires new approved attempts');
  const allowed = new Map(added.map(id => [approved.get(id).key, approved.get(id)]));
  const before = cells(previous); const after = cells(next);
  for (const [key, old] of before) {
    const value = after.get(key); demand(value, `successor missing cell: ${key}`);
    if (!allowed.has(key)) demand(stableJson(old) === stableJson(value), `non-target cell drift: ${key}`);
    else {
      const { sourceSha256, previewSha256, ...identity } = value;
      demand(stableJson({ ...identity, sourceSha256: old.sourceSha256, previewSha256: old.previewSha256 }) === stableJson(old), `target identity drift: ${key}`);
      demand(allowed.get(key).beforeSha256 === old.sourceSha256 && sourceSha256 !== old.sourceSha256, `target before/source mismatch: ${key}`);
    }
  }
  for (const s of previous.sheets) {
    const n = next.sheets.find(v => v.id === s.id);
    if (s.maps.every(m => !allowed.has(m.key))) demand(stableJson(s) === stableJson(n), `non-target sheet drift: ${s.id}`);
  }
}

export function verifyFinalHistory(root, receipt, approved) {
  root = resolve(root); validateFinalReceipt(receipt); verifyAttempts(receipt, approved);
  const liveDir = finalSheetDirectory(root, receipt);
  verifySheetFiles(root, receipt, liveDir);
  let current = receipt; const seen = new Set();
  while (current.header.supersedes) {
    const link = current.header.supersedes;
    demand(!seen.has(link.receiptSha256) && seen.size < 211, 'cyclic or excessive receipt history'); seen.add(link.receiptSha256);
    const dir = archiveDir(root, link.receiptSha256);
    const path = regular(root, join(dir, 'receipt.json'));
    demand(sha256File(path) === link.receiptSha256, 'predecessor receipt hash mismatch');
    const previous = validateFinalReceipt(JSON.parse(readFileSync(path, 'utf8')));
    demand(previous.header.aggregateSha256 === link.aggregateSha256, 'predecessor aggregate mismatch');
    verifySheetFiles(root, previous, join(dir, 'sheets'));
    validateFinalSuccessor(previous, current, approved);
    current = previous;
  }
  return liveDir;
}

export function readFinalizationState(root, { supersede = false, expectedPreviousSha, approvedAttempts } = {}) {
  root = resolve(root);
  demand(typeof supersede === 'boolean', 'invalid supersede flag');
  demand(supersede === (expectedPreviousSha !== undefined), '--supersede requires --expected-previous-sha (and vice versa)');
  if (supersede) hash(expectedPreviousSha);
  const path = join(root, RECEIPT);
  if (!exists(path)) { demand(!supersede, 'cannot supersede missing receipt'); return null; }
  const bytes = readFileSync(regular(root, path)); const sha = sha256Bytes(bytes);
  if (supersede) demand(sha === expectedPreviousSha, 'stale expected previous receipt SHA');
  const receipt = validateFinalReceipt(JSON.parse(bytes));
  const sheetDir = verifyFinalHistory(root, receipt, approvedAttempts);
  return { bytes, sha, receipt, sheetDir };
}

function immutableBundle(root, target, files) {
  directory(root, dirname(target), true);
  if (exists(target)) {
    directory(root, target);
    const actual = [];
    for (const name of readdirSync(target)) {
      const path = join(target, name);
      if (lstatSync(path).isDirectory()) {
        directory(root, path);
        for (const child of readdirSync(path)) actual.push(`${name}/${child}`);
      } else actual.push(name);
    }
    demand(stableJson(actual.sort()) === stableJson([...files.keys()].sort()), 'existing immutable bundle file set mismatch');
    for (const [name, bytes] of files) demand(readFileSync(regular(root, join(target, name))).equals(bytes), `existing immutable bundle bytes mismatch: ${name}`);
    return;
  }
  const stage = mkdtempSync(join(dirname(target), '.pending-'));
  try {
    for (const [name, bytes] of files) {
      const path = join(stage, name); directory(root, dirname(path), true);
      writeFileSync(path, bytes, { flag: 'wx' }); sync(path); sync(dirname(path));
    }
    sync(stage); renameSync(stage, target); sync(dirname(target));
  } finally { rmSync(stage, { recursive: true, force: true }); }
}

function receiptPayload(receipt) {
  const copy = structuredClone(receipt); delete copy.header.supersedes; return stableJson(copy);
}

// Caller holds finalize.lock. All artifacts precede the single current-receipt rename.
export function publishFinalReceipt(root, candidate, generatedDir, options = {}) {
  root = resolve(root); validateFinalReceipt(candidate); verifyAttempts(candidate, options.approvedAttempts);
  const previous = readFinalizationState(root, options);
  if (previous && receiptPayload(previous.receipt) === receiptPayload(candidate)) return { status: 'unchanged', receipt: previous.receipt, receiptSha256: previous.sha };
  demand(!previous || options.supersede, 'final receipt exists with different bytes; use --supersede');
  demand(!Object.hasOwn(candidate.header, 'supersedes'), 'candidate must not supply predecessor');
  const next = structuredClone(candidate);
  const sheets = new Map();
  for (const sheet of next.sheets) {
    const path = assertContainedRegular(generatedDir, join(generatedDir, sheet.file), generatedDir);
    const bytes = readFileSync(path); demand(sha256Bytes(bytes) === sheet.fileSha256, `generated sheet hash mismatch: ${sheet.id}`);
    sheets.set(sheet.file, bytes);
  }
  if (previous) {
    validateFinalSuccessor(previous.receipt, next, options.approvedAttempts);
    const files = new Map([['receipt.json', previous.bytes]]);
    for (const sheet of previous.receipt.sheets) files.set(`sheets/${sheet.file}`, readFileSync(regular(root, join(previous.sheetDir, sheet.file))));
    immutableBundle(root, archiveDir(root, previous.sha), files);
    next.header.supersedes = { receiptSha256: previous.sha, aggregateSha256: previous.receipt.header.aggregateSha256 };
  }
  immutableBundle(root, finalSheetDirectory(root, next), sheets);
  verifyFinalHistory(root, next, options.approvedAttempts);
  const path = join(root, RECEIPT); directory(root, dirname(path), true);
  const stage = mkdtempSync(join(dirname(path), '.pending-receipt-')); const temporary = join(stage, 'receipt.json');
  const text = ['{', `  "header": ${JSON.stringify(next.header)},`, '  "sheets": [',
    ...next.sheets.map((s, i) => `    ${JSON.stringify(s)}${i + 1 === next.sheets.length ? '' : ','}`), '  ]', '}', ''].join('\n');
  try {
    writeFileSync(temporary, text, { flag: 'wx' }); sync(temporary); sync(stage);
    if (previous) {
      demand(sha256File(regular(root, path)) === previous.sha, 'current receipt changed during finalization');
      renameSync(temporary, path);
    } else { demand(!exists(path), 'current receipt appeared during finalization'); linkSync(temporary, path); }
    sync(dirname(path));
  } finally { rmSync(stage, { recursive: true, force: true }); }
  return { status: 'published', receipt: next, receiptSha256: sha256Bytes(text) };
}
