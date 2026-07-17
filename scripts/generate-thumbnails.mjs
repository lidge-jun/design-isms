/**
 * generate-thumbnails.mjs — deterministic WebP preview pipeline (sharp).
 * Mirrors every PNG under assets/images into assets/images/thumbs as 768×512 WebP.
 *
 * Flags:
 *   --force           rebuild every preview
 *   --scope <name>    effects | isms | all (default all)
 *   --bootstrap-manifest  audited one-time migration only; refuses overwrite
 */
import { mkdirSync, readdirSync, statSync, renameSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const sourceDir = join(root, 'assets/images');
const outputDir = join(sourceDir, 'thumbs');
const manifestPath = join(root, 'assets/data/image-pairs-manifest.json');
const width = Number(process.env.THUMB_WIDTH ?? 768);
const height = Number(process.env.THUMB_HEIGHT ?? 512);
const quality = Number(process.env.THUMB_QUALITY ?? 72);
const relationMaeLimit = 18;
const thumbnailContract = { width, height, fit: 'cover', position: 'centre', format: 'webp', quality, effort: 6, smartSubsample: true };

const args = process.argv.slice(2);
const force = args.includes('--force');
const bootstrapManifest = args.includes('--bootstrap-manifest');
const scopeIndex = args.indexOf('--scope');
const scope = scopeIndex !== -1 ? (args[scopeIndex + 1] ?? 'all') : 'all';
if (!['effects', 'isms', 'all'].includes(scope)) {
  console.error(`unknown --scope "${scope}" (expected effects | isms | all)`);
  process.exit(1);
}

function inScope(sourcePath) {
  const rel = relative(sourceDir, sourcePath);
  const isEffects = rel.startsWith('effects/');
  if (scope === 'effects') return isEffects;
  if (scope === 'isms') return !isEffects;
  return true;
}

function collectPngs(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (fullPath === outputDir) continue;
      collectPngs(fullPath, acc);
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function outputPathFor(sourcePath) {
  const rel = relative(sourceDir, sourcePath);
  const ext = extname(rel);
  return join(outputDir, dirname(rel), basename(rel, ext) + '.webp');
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

const hasManifest = existsSync(manifestPath);
if (!hasManifest && !bootstrapManifest) {
  throw new Error('image pair manifest missing; use --bootstrap-manifest only for an audited one-time migration');
}
if (hasManifest && bootstrapManifest) throw new Error('refusing to bootstrap over an existing image pair manifest');
const manifestData = hasManifest ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;

const allImages = collectPngs(sourceDir).sort();
const images = allImages.filter(inScope);
const manifestRecords = new Map((manifestData?.pairs ?? []).map(record => [record.source, record]));
let generated = 0;
let skipped = 0;
let encodedBytes = 0;
const concurrency = 4;

async function visualMae(sourcePath, outputPath) {
  const [sourcePixels, previewPixels] = await Promise.all([
    sharp(sourcePath, { failOn: 'error' }).resize({ width, height, fit: 'cover', position: 'centre' }).removeAlpha().toColourspace('srgb').raw().toBuffer(),
    sharp(outputPath, { failOn: 'error' }).resize({ width, height, fit: 'fill' }).removeAlpha().toColourspace('srgb').raw().toBuffer()
  ]);
  if (sourcePixels.length !== previewPixels.length) return Number.POSITIVE_INFINITY;
  let difference = 0;
  for (let index = 0; index < sourcePixels.length; index += 1) difference += Math.abs(sourcePixels[index] - previewPixels[index]);
  return difference / sourcePixels.length;
}

async function isFresh(sourcePath, outputPath) {
  if (!existsSync(outputPath)) return false;
  const record = manifestRecords.get(relative(root, sourcePath));
  if (record && (record.sourceSha256 !== sha256(sourcePath) || record.previewSha256 !== sha256(outputPath))) return false;
  if (record && JSON.stringify(manifestData?.thumbnailContract) !== JSON.stringify(thumbnailContract)) return false;
  return await visualMae(sourcePath, outputPath) <= relationMaeLimit;
}

if (hasManifest) {
  for (const sourcePath of allImages.filter(path => !inScope(path))) {
    const previewPath = outputPathFor(sourcePath);
    if (!await isFresh(sourcePath, previewPath)) {
      throw new Error(`out-of-scope image drift ${relative(root, sourcePath)}; rerun with the matching scope or --scope all`);
    }
  }
}

async function processOne(sourcePath) {
  const outputPath = outputPathFor(sourcePath);
  if (!force && await isFresh(sourcePath, outputPath)) {
    skipped += 1;
    return;
  }
  const meta = await sharp(sourcePath, { failOn: 'error' }).metadata();
  if ((meta.width ?? 0) < width || (meta.height ?? 0) < height) {
    throw new Error(`refusing to upscale ${relative(root, sourcePath)} (${meta.width}x${meta.height} < ${width}x${height})`);
  }
  mkdirSync(dirname(outputPath), { recursive: true });
  const tempPath = outputPath + '.tmp';
  await sharp(sourcePath, { failOn: 'error' })
    .resize({ width, height, fit: 'cover', position: 'centre' })
    .webp({ quality, effort: 6, smartSubsample: true })
    .toFile(tempPath);
  renameSync(tempPath, outputPath);
  encodedBytes += statSync(outputPath).size;
  generated += 1;
}

const queue = [...images];
async function worker() {
  while (queue.length > 0) {
    const next = queue.shift();
    if (next) await processOne(next);
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));

async function buildManifest() {
  const pairs = [];
  for (const sourcePath of allImages) {
    const previewPath = outputPathFor(sourcePath);
    if (!existsSync(previewPath)) throw new Error(`missing preview ${relative(root, previewPath)}`);
    const [sourceMeta, previewMeta] = await Promise.all([
      sharp(sourcePath, { failOn: 'error' }).metadata(),
      sharp(previewPath, { failOn: 'error' }).metadata()
    ]);
    pairs.push({
      source: relative(root, sourcePath),
      preview: relative(root, previewPath),
      sourceSha256: sha256(sourcePath),
      previewSha256: sha256(previewPath),
      sourceSize: [sourceMeta.width, sourceMeta.height],
      previewSize: [previewMeta.width, previewMeta.height]
    });
  }
  const manifest = {
    schemaVersion: 1,
    hashAlgorithm: 'sha256',
    manifestToolVersion: 1,
    thumbnailContract,
    visualRelation: { metric: 'mean-absolute-error-srgb', max: relationMaeLimit },
    pairs
  };
  const tempPath = manifestPath + '.tmp';
  const manifestText = [
    '{',
    `  "schemaVersion": ${manifest.schemaVersion},`,
    `  "hashAlgorithm": ${JSON.stringify(manifest.hashAlgorithm)},`,
    `  "manifestToolVersion": ${manifest.manifestToolVersion},`,
    `  "thumbnailContract": ${JSON.stringify(manifest.thumbnailContract)},`,
    `  "visualRelation": ${JSON.stringify(manifest.visualRelation)},`,
    '  "pairs": [',
    ...pairs.map((pair, index) => `    ${JSON.stringify(pair)}${index + 1 === pairs.length ? '' : ','}`),
    '  ]',
    '}',
    ''
  ].join('\n');
  writeFileSync(tempPath, manifestText);
  renameSync(tempPath, manifestPath);
}

await buildManifest();

console.log(`thumbnails ok: ${generated} generated, ${skipped} fresh, ${images.length} scoped, ${allImages.length} manifested, ${encodedBytes} bytes encoded (scope=${scope})`);
