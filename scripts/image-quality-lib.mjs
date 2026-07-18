import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import sharp from 'sharp';

export const CELL = { width: 320, height: 213, labelHeight: 27 };
export const RUBRICS = ['anatomy', 'text', 'feasible_state', 'style_identity', 'composition', 'contrast', 'forbidden_content', 'provenance'];
export const AUDIT_COLUMNS = [
  'run_id', 'key', 'catalog', 'id', 'slot', 'file', 'source_path', 'preview_path', 'sheet_id', 'cell_index',
  'baseline_source_sha256', 'baseline_preview_sha256', ...RUBRICS, 'decision', 'reason',
  'current_source_sha256', 'current_preview_sha256'
];

export function sha256Bytes(value) { return createHash('sha256').update(value).digest('hex'); }
export function sha256File(path) { return sha256Bytes(readFileSync(path)); }
export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
export function parseCsv(text) {
  const rows = []; let row = []; let field = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (char !== '\r') field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export function assertContainedRegular(root, path, allowedRoot = root) {
  const absolute = resolve(path); const boundary = resolve(allowedRoot);
  if (absolute !== boundary && !absolute.startsWith(boundary + sep)) throw new Error(`path escapes boundary: ${path}`);
  if (!existsSync(boundary) || lstatSync(boundary).isSymbolicLink() || realpathSync(boundary) !== boundary) throw new Error(`unsafe path boundary: ${allowedRoot}`);
  if (!existsSync(absolute) || !lstatSync(absolute).isFile() || lstatSync(absolute).isSymbolicLink()) throw new Error(`not a regular file: ${path}`);
  let cursor = dirname(absolute);
  while (cursor !== boundary) {
    if (!cursor.startsWith(boundary + sep) || lstatSync(cursor).isSymbolicLink()) throw new Error(`symlinked or escaped ancestor: ${path}`);
    cursor = dirname(cursor);
  }
  if (realpathSync(absolute) !== absolute) throw new Error(`canonical path mismatch: ${path}`);
  return absolute;
}

export function safeRelativePath(value) {
  return typeof value === 'string' && !isAbsolute(value) && !value.split('/').some(part => !part || part === '.' || part === '..') && value.split('/').every(part => /^[A-Za-z0-9._-]+$/.test(part));
}

export function loadInventory(root) {
  const isms = JSON.parse(readFileSync(join(root, 'assets/data/isms.json'), 'utf8'));
  const effects = JSON.parse(readFileSync(join(root, 'assets/data/effects.json'), 'utf8'));
  const inventory = [];
  for (const ism of isms) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(ism.id)) throw new Error(`unsafe ism id ${ism.id}`);
    if (!Array.isArray(ism.images) || ism.images.length !== 3) throw new Error(`${ism.id}: expected three image slots`);
    for (let slot = 0; slot < 3; slot += 1) {
      const image = ism.images[slot];
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.png$/.test(image.file)) throw new Error(`${ism.id}: unsafe image file ${image.file}`);
      const prompt = (ism.prompts ?? []).find(item => item.file === image.file)?.prompt;
      if (!prompt) throw new Error(`${ism.id}/${image.file}: prompt missing`);
      const source = `assets/images/${ism.id}/${image.file}`;
      const preview = `assets/images/thumbs/${ism.id}/${image.file.replace(/\.png$/, '.webp')}`;
      inventory.push({ key: `ism:${ism.id}:${slot}:${image.file}`, catalog: 'ism', id: ism.id, slot: String(slot), file: image.file, source, preview, prompt });
    }
  }
  for (const effect of effects) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(effect.id)) throw new Error(`unsafe effect id ${effect.id}`);
    const file = effect.guide?.file ?? 'guide.png'; const prompt = effect.guide?.prompt;
    if (file !== 'guide.png') throw new Error(`${effect.id}: unsafe effect guide file ${file}`);
    if (!prompt) throw new Error(`${effect.id}/${file}: prompt missing`);
    inventory.push({ key: `effect:${effect.id}:guide:${file}`, catalog: 'effect', id: effect.id, slot: 'guide', file, source: `assets/images/effects/${effect.id}/${file}`, preview: `assets/images/thumbs/effects/${effect.id}/guide.webp`, prompt });
  }
  if (inventory.length !== 211 || new Set(inventory.map(item => item.key)).size !== 211) throw new Error(`canonical inventory ${inventory.length}/211 or duplicate key`);
  for (const item of inventory) for (const rel of [item.source, item.preview]) {
    if (!safeRelativePath(rel)) throw new Error(`${item.key}: unsafe ${rel}`);
    assertContainedRegular(root, join(root, rel));
  }
  return inventory;
}

export function verifyBaseline(root) {
  const devlog = join(root, 'devlog/_fin/260715_production_upgrade');
  const receiptPath = join(devlog, '095_image_baseline_sheet_receipts.json');
  const receipt = JSON.parse(readFileSync(receiptPath, 'utf8')); const header = receipt.header ?? {};
  if (header.schemaVersion !== 1 || header.sheetCount !== 4 || header.cellCount !== 211 || receipt.sheets?.length !== 4 || !header.sharp || !header.vips) throw new Error('baseline receipt header invalid');
  const assetsPath = join(devlog, '093_image_baseline_assets.jsonl'); const pairsPath = join(devlog, '094_image_baseline_pairs.json');
  const runtimePath = join(devlog, '096_image_baseline_runtime.json'); const ledgerDir = join(devlog, '097_effect_ledger_baseline');
  const sheetDir = join(devlog, '095_image_sheets/baseline');
  for (const path of [receiptPath, assetsPath, pairsPath, runtimePath]) assertContainedRegular(root, path);
  const assetRows = readFileSync(assetsPath, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
  if (assetRows.length !== 422 || new Set(assetRows.map(row => row.path)).size !== 422) throw new Error('baseline asset inventory invalid');
  const pairs = JSON.parse(readFileSync(pairsPath, 'utf8')); if (pairs.runId !== header.runId || pairs.manifest?.pairs?.length !== 211) throw new Error('baseline pair snapshot invalid');
  const assetMap = new Map(assetRows.map(row => [row.path, row.sha256])); const pairMap = new Map(pairs.manifest.pairs.map(pair => [pair.source, pair]));
  const runtime = JSON.parse(readFileSync(runtimePath, 'utf8')); if (runtime.runId !== header.runId) throw new Error('baseline runtime run mismatch');
  const ledgerIndexPath = join(ledgerDir, 'index.json'); assertContainedRegular(root, ledgerIndexPath);
  const ledgerIndex = JSON.parse(readFileSync(ledgerIndexPath, 'utf8')); if (ledgerIndex.runId !== header.runId || ledgerIndex.files?.length !== 2) throw new Error('baseline ledger index invalid');
  for (const file of ledgerIndex.files) {
    if (!/^(031\.before\.csv|032\.before\.jsonl)$/.test(file.name)) throw new Error(`unsafe baseline ledger ${file.name}`);
    const path = assertContainedRegular(root, join(ledgerDir, file.name), ledgerDir);
    if (sha256File(path) !== file.sha256 || readFileSync(path).length !== file.bytes) throw new Error(`baseline ledger drift ${file.name}`);
  }
  const sheetIds = new Set(); const mapKeys = new Set(); let cells = 0;
  for (const sheet of receipt.sheets) {
    if (!/^(ism-slot-[012]|effects-guide)$/.test(sheet.id) || sheet.file !== `${sheet.id}.webp` || sheetIds.has(sheet.id)) throw new Error(`baseline sheet identity invalid ${sheet.id}`);
    sheetIds.add(sheet.id); const path = assertContainedRegular(root, join(sheetDir, sheet.file), sheetDir);
    if (sha256File(path) !== sheet.fileSha256 || sha256Bytes(JSON.stringify(sheet.maps)) !== sheet.mapSha256) throw new Error(`baseline sheet drift ${sheet.id}`);
    if (sheet.maps?.length !== sheet.cols * sheet.rows) throw new Error(`baseline sheet cells invalid ${sheet.id}`); cells += sheet.maps.length;
    for (const map of sheet.maps) {
      const pair = pairMap.get(map.source);
      if (mapKeys.has(map.key) || map.sheetId !== sheet.id || map.sourceSha256 !== assetMap.get(map.source) || map.previewSha256 !== assetMap.get(map.preview) ||
          !pair || pair.preview !== map.preview || pair.sourceSha256 !== map.sourceSha256 || pair.previewSha256 !== map.previewSha256) throw new Error(`baseline map binding invalid ${map.key}`);
      mapKeys.add(map.key);
    }
  }
  if (cells !== 211 || mapKeys.size !== 211 || pairMap.size !== 211) throw new Error('baseline sheet map total invalid');
  const aggregateInput = { runId: header.runId, assetsSha256: sha256File(assetsPath), pairsSha256: sha256File(pairsPath), runtimeSha256: sha256File(runtimePath),
    ledgers: ledgerIndex.files, sheets: receipt.sheets.map(item => ({ id: item.id, file: item.file, fileSha256: item.fileSha256, imagePixelSha256: item.imagePixelSha256, mapSha256: item.mapSha256 })) };
  if (sha256Bytes(stableJson(aggregateInput)) !== header.aggregateSha256) throw new Error('baseline aggregate drift');
  return { receipt, assetRows, pairs, runtime, ledgerIndex };
}

export function sheetSpecs(inventory) {
  return [0, 1, 2].map(slot => ({ id: `ism-slot-${slot}`, cols: 7, rows: 7, entries: inventory.filter(item => item.catalog === 'ism' && item.slot === String(slot)) }))
    .concat([{ id: 'effects-guide', cols: 8, rows: 8, entries: inventory.filter(item => item.catalog === 'effect') }]);
}

function escapeXml(value) { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
export async function buildSheet(root, spec, outDir) {
  if (spec.entries.length !== spec.cols * spec.rows) throw new Error(`${spec.id}: ${spec.entries.length} entries leaves blank cells`);
  mkdirSync(outDir, { recursive: true });
  const composites = []; const maps = []; const pixelHash = createHash('sha256');
  for (let index = 0; index < spec.entries.length; index += 1) {
    const item = spec.entries[index]; const col = index % spec.cols; const row = Math.floor(index / spec.cols);
    const left = col * CELL.width; const top = row * (CELL.height + CELL.labelHeight);
    const previewPath = join(root, item.preview);
    const image = sharp(previewPath, { failOn: 'error' }).resize({ width: CELL.width, height: CELL.height, fit: 'fill', kernel: 'nearest' }).removeAlpha().toColourspace('srgb');
    const [encoded, raw] = await Promise.all([image.clone().png({ compressionLevel: 9 }).toBuffer(), image.clone().raw().toBuffer()]);
    pixelHash.update(raw); composites.push({ input: encoded, left, top });
    const label = `${String(index + 1).padStart(3, '0')} ${item.id} · ${item.file}`;
    const svg = `<svg width="${CELL.width}" height="${CELL.labelHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#11120f"/><text x="6" y="18" font-family="monospace" font-size="11" fill="#f1f1eb">${escapeXml(label)}</text></svg>`;
    composites.push({ input: Buffer.from(svg), left, top: top + CELL.height });
    maps.push({ sheetId: spec.id, cellIndex: index, label, key: item.key, source: item.source, preview: item.preview, sourceSha256: sha256File(join(root, item.source)), previewSha256: sha256File(previewPath) });
  }
  const output = join(outDir, `${spec.id}.webp`);
  await sharp({ create: { width: spec.cols * CELL.width, height: spec.rows * (CELL.height + CELL.labelHeight), channels: 3, background: '#f1f1eb' } })
    .composite(composites).webp({ quality: 82, effort: 6 }).toFile(output);
  const mapText = JSON.stringify(maps);
  writeFileSync(join(outDir, `${spec.id}.map.json`), mapText + '\n');
  return { id: spec.id, file: basename(output), fileSha256: sha256File(output), imagePixelSha256: pixelHash.digest('hex'), mapSha256: sha256Bytes(mapText), cols: spec.cols, rows: spec.rows, cell: CELL, sharp: sharp.versions.sharp, vips: sharp.versions.vips, maps };
}

export function attemptRows(root) {
  const dir = join(root, 'devlog/_fin/260715_production_upgrade/092_image_generation_attempts');
  if (!existsSync(dir)) return [];
  const indexPath = assertContainedRegular(root, join(dir, 'index.json'), dir); const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  const actual = readdirSync(dir).filter(file => /^shard-\d{3}\.jsonl$/.test(file)).sort();
  if (!Array.isArray(index.shards) || index.shards.some(file => !/^shard-\d{3}\.jsonl$/.test(file)) || new Set(index.shards).size !== index.shards.length ||
      stableJson(index.shards) !== stableJson([...index.shards].sort()) || stableJson(index.shards) !== stableJson(actual)) throw new Error('attempt shard index invalid');
  return index.shards.flatMap(file => readFileSync(assertContainedRegular(root, join(dir, file), dir), 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)));
}

export function promptSha(prompt) { return sha256Bytes(Buffer.from(prompt)); }
export function stem(file) { return basename(file, extname(file)); }
