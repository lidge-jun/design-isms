/**
 * audit-effect-guides.mjs — machine audit for effect guide image pairs.
 * Derives the ID set from assets/data/effects.json (single source of truth),
 * then verifies original PNG / preview WebP existence, dimensions, format,
 * manifest-bound hashes, duplicate hashes, and orphan directories.
 *
 * Flags: --json  emit full JSON results
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const effectsPath = join(root, 'assets/data/effects.json');
const manifestPath = join(root, 'assets/data/image-pairs-manifest.json');
const originalsRoot = join(root, 'assets/images/effects');
const previewsRoot = join(root, 'assets/images/thumbs/effects');
const wantJson = process.argv.includes('--json');

const effects = JSON.parse(readFileSync(effectsPath, 'utf8'));
const imageManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const pairBySource = new Map(imageManifest.pairs.map((pair) => [pair.source, pair]));
const errors = [];
const results = [];

const ids = effects.map((e) => e.id);
if (new Set(ids).size !== ids.length) errors.push('duplicate effect ids in effects.json');
// The catalog count gate lives in verify-effects.mjs; this audit derives the
// expected set from effects.json itself and validates every pair it declares.
for (const effect of effects) {
  if (!effect.demo || effect.demo.type !== effect.id) {
    errors.push(`${effect.id}: demo.type mismatch`);
  }
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

const originalHashes = new Map();

for (const effect of effects) {
  const guideFile = effect.guide?.file ?? 'guide.png';
  const originalPath = join(originalsRoot, effect.id, guideFile);
  const previewPath = join(previewsRoot, effect.id, 'guide.webp');
  const row = { id: effect.id, machineStatus: 'pass' };

  if (!existsSync(originalPath)) {
    errors.push(`${effect.id}: original missing (${guideFile})`);
    row.machineStatus = 'fail';
    results.push(row);
    continue;
  }
  if (!existsSync(previewPath)) {
    errors.push(`${effect.id}: preview missing`);
    row.machineStatus = 'fail';
    results.push(row);
    continue;
  }

  const origMeta = await sharp(originalPath, { failOn: 'error' }).metadata();
  if (origMeta.format !== 'png') errors.push(`${effect.id}: original is ${origMeta.format}, not png`);
  if (origMeta.width !== 1536 || origMeta.height !== 1024) {
    errors.push(`${effect.id}: original ${origMeta.width}x${origMeta.height} != 1536x1024`);
  }
  if ((origMeta.pages ?? 1) > 1) errors.push(`${effect.id}: original is animated`);
  if (origMeta.channels !== 3 && origMeta.channels !== 4) {
    errors.push(`${effect.id}: original has ${origMeta.channels} channels`);
  }

  const prevMeta = await sharp(previewPath, { failOn: 'error' }).metadata();
  if (prevMeta.format !== 'webp') errors.push(`${effect.id}: preview is ${prevMeta.format}, not webp`);
  if (prevMeta.width !== 768 || prevMeta.height !== 512) {
    errors.push(`${effect.id}: preview ${prevMeta.width}x${prevMeta.height} != 768x512`);
  }
  if ((prevMeta.pages ?? 1) > 1) errors.push(`${effect.id}: preview is animated`);

  const origHash = sha256(originalPath);
  const sourceRel = `assets/images/effects/${effect.id}/${guideFile}`;
  const previewRel = `assets/images/thumbs/effects/${effect.id}/guide.webp`;
  const pair = pairBySource.get(sourceRel);
  if (!pair || pair.preview !== previewRel || pair.sourceSha256 !== origHash || pair.previewSha256 !== sha256(previewPath)) {
    errors.push(`${effect.id}: image pair manifest mismatch`);
  }
  if (originalHashes.has(origHash)) {
    errors.push(`${effect.id}: original hash duplicates ${originalHashes.get(origHash)}`);
  }
  originalHashes.set(origHash, effect.id);

  row.original = { path: originalPath, width: origMeta.width, height: origMeta.height, format: origMeta.format, sha256: origHash };
  row.preview = { path: previewPath, width: prevMeta.width, height: prevMeta.height, format: prevMeta.format, sha256: sha256(previewPath) };
  if (errors.some((e) => e.startsWith(`${effect.id}:`))) row.machineStatus = 'fail';
  results.push(row);
}

// orphan directories not present in JSON
const idSet = new Set(ids);
for (const dirRoot of [originalsRoot, previewsRoot]) {
  if (!existsSync(dirRoot)) {
    errors.push(`missing directory: ${dirRoot}`);
    continue;
  }
  for (const entry of readdirSync(dirRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && !idSet.has(entry.name)) {
      errors.push(`orphan guide directory: ${join(dirRoot, entry.name)}`);
    }
  }
}

if (wantJson) {
  console.log(JSON.stringify({ ok: errors.length === 0, errors, results }, null, 2));
} else if (errors.length > 0) {
  console.error('effect guide audit failed:');
  for (const e of errors) console.error(`  - ${e}`);
} else {
  console.log(`effect guides ok: ${results.length} pairs, hashes manifest-bound, 0 invalid, 0 orphan`);
}
process.exit(errors.length > 0 ? 1 : 0);
