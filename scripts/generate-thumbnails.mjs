/**
 * generate-thumbnails.mjs — deterministic WebP preview pipeline (sharp).
 * Mirrors every PNG under assets/images into assets/images/thumbs as 768×512 WebP.
 *
 * Flags:
 *   --force           rebuild every preview
 *   --scope <name>    effects | isms | all (default all)
 */
import { mkdirSync, readdirSync, statSync, renameSync, existsSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const sourceDir = join(root, 'assets/images');
const outputDir = join(sourceDir, 'thumbs');
const width = Number(process.env.THUMB_WIDTH ?? 768);
const height = Number(process.env.THUMB_HEIGHT ?? 512);
const quality = Number(process.env.THUMB_QUALITY ?? 72);

const args = process.argv.slice(2);
const force = args.includes('--force');
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

function isFresh(sourcePath, outputPath) {
  try {
    return statSync(outputPath).mtimeMs >= statSync(sourcePath).mtimeMs;
  } catch {
    return false;
  }
}

const images = collectPngs(sourceDir).filter(inScope).sort();
let generated = 0;
let skipped = 0;
let encodedBytes = 0;
const concurrency = 4;

async function processOne(sourcePath) {
  const outputPath = outputPathFor(sourcePath);
  if (!force && isFresh(sourcePath, outputPath)) {
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

console.log(`thumbnails ok: ${generated} generated, ${skipped} fresh, ${images.length} total, ${encodedBytes} bytes encoded (scope=${scope})`);
