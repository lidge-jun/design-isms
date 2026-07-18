#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const args = process.argv.slice(2);
const rootIndex = args.indexOf('--root');
const root = resolve(rootIndex >= 0 ? args[rootIndex + 1] : join(dirname(fileURLToPath(import.meta.url)), '..'));
const errors = [];

function readJson(rel) {
  const path = join(root, rel);
  if (!existsSync(path)) throw new Error(`missing ${rel}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}
function hash(path) { return createHash('sha256').update(readFileSync(path)).digest('hex'); }
function portable(rel) { return rel.split(sep).join('/'); }
function safePath(rel) {
  return rel.split('/').every(segment => /^[a-z0-9][a-z0-9._-]*$/.test(segment) && segment !== '.' && segment !== '..');
}
function collect(dir, extension, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink()) { errors.push(`symlink asset ${portable(relative(root, path))}`); continue; }
    if (entry.isDirectory()) collect(path, extension, acc);
    else if (entry.isFile() && entry.name.endsWith(extension)) acc.push(portable(relative(root, path)));
  }
  return acc;
}
async function visualMae(sourcePath, previewPath) {
  const [sourcePixels, previewPixels] = await Promise.all([
    sharp(sourcePath, { failOn: 'error' }).resize({ width: 768, height: 512, fit: 'cover', position: 'centre' }).removeAlpha().toColourspace('srgb').raw().toBuffer(),
    sharp(previewPath, { failOn: 'error' }).removeAlpha().toColourspace('srgb').raw().toBuffer()
  ]);
  if (sourcePixels.length !== previewPixels.length) return Number.POSITIVE_INFINITY;
  let difference = 0;
  for (let index = 0; index < sourcePixels.length; index += 1) difference += Math.abs(sourcePixels[index] - previewPixels[index]);
  return difference / sourcePixels.length;
}

const isms = readJson('assets/data/isms.json');
const effects = readJson('assets/data/effects.json');
const manifest = readJson('assets/data/image-pairs-manifest.json');
const expectedThumbnailContract = { width: 768, height: 512, fit: 'cover', position: 'centre', format: 'webp', quality: 72, effort: 6, smartSubsample: true };
const expected = [];
for (const ism of isms) {
  for (const image of ism.images ?? []) {
    expected.push({
      source: `assets/images/${ism.id}/${image.file}`,
      preview: `assets/images/thumbs/${ism.id}/${image.file.replace(/\.png$/, '.webp')}`
    });
  }
}
for (const effect of effects) {
  const file = effect.guide?.file ?? 'guide.png';
  expected.push({ source: `assets/images/effects/${effect.id}/${file}`, preview: `assets/images/thumbs/effects/${effect.id}/guide.webp` });
}
// New catalog domains (guide.png per card) join the expected inventory once their data lands.
const catalogDomains = ['color', 'typography', 'layout', 'motion'];
for (const domain of catalogDomains) {
  const dataPath = join(root, `assets/data/${domain}.json`);
  if (!existsSync(dataPath)) continue;
  for (const card of readJson(`assets/data/${domain}.json`)) {
    if (!card.guide) continue;
    expected.push({ source: `assets/images/${domain}/${card.id}/guide.png`, preview: `assets/images/thumbs/${domain}/${card.id}/guide.webp` });
  }
}
expected.sort((a, b) => a.source.localeCompare(b.source));

if (manifest.schemaVersion !== 1 || manifest.hashAlgorithm !== 'sha256') errors.push('manifest schema/hash contract invalid');
if (JSON.stringify(manifest.thumbnailContract) !== JSON.stringify(expectedThumbnailContract)) errors.push('manifest thumbnail contract invalid');
if (manifest.visualRelation?.metric !== 'mean-absolute-error-srgb' || manifest.visualRelation?.max !== 18) errors.push('manifest visual relation contract invalid');
if (!Array.isArray(manifest.pairs)) errors.push('manifest pairs must be an array');
const records = Array.isArray(manifest.pairs) ? manifest.pairs : [];
const sources = records.map(record => record.source);
if (new Set(sources).size !== sources.length) errors.push('manifest duplicate source records');
if (JSON.stringify(sources) !== JSON.stringify([...sources].sort())) errors.push('manifest records are not source-sorted');
const recordMap = new Map(records.map(record => [record.source, record]));
for (const record of records) if (!expected.some(pair => pair.source === record.source)) errors.push(`manifest extra record ${record.source}`);

const originalHashes = new Map();
for (const pair of expected) {
  if (!safePath(pair.source) || !safePath(pair.preview)) errors.push(`unsafe asset path ${pair.source}`);
  const sourcePath = join(root, pair.source); const previewPath = join(root, pair.preview);
  if (!existsSync(sourcePath)) { errors.push(`missing ${pair.source}`); continue; }
  if (!existsSync(previewPath)) { errors.push(`missing ${pair.preview}`); continue; }
  if (!lstatSync(sourcePath).isFile() || !lstatSync(previewPath).isFile()) { errors.push(`non-file asset ${pair.source}`); continue; }
  const record = recordMap.get(pair.source);
  if (!record) { errors.push(`manifest missing record ${pair.source}`); continue; }
  if (record.preview !== pair.preview) errors.push(`${pair.source}: manifest preview path mismatch`);
  const sourceHash = hash(sourcePath); const previewHash = hash(previewPath);
  if (record.sourceSha256 !== sourceHash) errors.push(`${pair.source}: source hash drift`);
  if (record.previewSha256 !== previewHash) errors.push(`${pair.preview}: preview hash drift`);
  const duplicate = originalHashes.get(sourceHash);
  if (duplicate) errors.push(`duplicate original hash: ${duplicate} and ${pair.source}`);
  else originalHashes.set(sourceHash, pair.source);
  try {
    const [sourceMeta, previewMeta] = await Promise.all([
      sharp(sourcePath, { failOn: 'error' }).metadata(), sharp(previewPath, { failOn: 'error' }).metadata()
    ]);
    if (sourceMeta.format !== 'png' || sourceMeta.width !== 1536 || sourceMeta.height !== 1024 || (sourceMeta.pages ?? 1) !== 1) {
      errors.push(`${pair.source}: expected static 1536x1024 PNG`);
    }
    if (previewMeta.format !== 'webp' || previewMeta.width !== 768 || previewMeta.height !== 512 || (previewMeta.pages ?? 1) !== 1) {
      errors.push(`${pair.preview}: expected static 768x512 WebP`);
    }
    if (JSON.stringify(record.sourceSize) !== '[1536,1024]' || JSON.stringify(record.previewSize) !== '[768,512]') {
      errors.push(`${pair.source}: manifest dimensions invalid`);
    }
    const mae = await visualMae(sourcePath, previewPath);
    if (mae > 18) errors.push(`${pair.preview}: source/preview visual drift (MAE ${mae.toFixed(2)} > 18)`);
  } catch (error) { errors.push(`${pair.source}: decode failed (${error.message})`); }
}
if (records.length !== expected.length) errors.push(`manifest pair count ${records.length} != expected ${expected.length}`);

const actual = [];
for (const ism of isms) {
  collect(join(root, 'assets/images', ism.id), '.png', actual);
  collect(join(root, 'assets/images/thumbs', ism.id), '.webp', actual);
}
collect(join(root, 'assets/images/effects'), '.png', actual);
collect(join(root, 'assets/images/thumbs/effects'), '.webp', actual);
for (const domain of catalogDomains) {
  collect(join(root, 'assets/images', domain), '.png', actual);
  collect(join(root, 'assets/images/thumbs', domain), '.webp', actual);
}
const expectedPaths = new Set(expected.flatMap(pair => [pair.source, pair.preview]));
for (const path of actual) if (!expectedPaths.has(path)) errors.push(`orphan raster ${path}`);

if (errors.length) {
  console.error('asset verification failed:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log(`assets ok: ${expected.length} PNG/WebP pairs, hashes and dimensions verified`);
