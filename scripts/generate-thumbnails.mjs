import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const sourceDir = join(root, 'assets/images');
const outputDir = join(sourceDir, 'thumbs');
const width = process.env.THUMB_WIDTH || '768';
const quality = process.env.THUMB_QUALITY || '58';

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
  const folder = join(outputDir, dirname(rel));
  return join(folder, basename(rel, ext) + '.webp');
}

function isFresh(sourcePath, outputPath) {
  try {
    return statSync(outputPath).mtimeMs >= statSync(sourcePath).mtimeMs;
  } catch {
    return false;
  }
}

const images = collectPngs(sourceDir);
let generated = 0;
let skipped = 0;

for (const sourcePath of images) {
  const outputPath = outputPathFor(sourcePath);
  if (isFresh(sourcePath, outputPath)) {
    skipped += 1;
    continue;
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  const result = spawnSync('cwebp', [
    '-quiet',
    '-q', quality,
    '-resize', width, '0',
    sourcePath,
    '-o', outputPath
  ], { stdio: 'inherit' });

  if (result.status !== 0) {
    throw new Error('cwebp failed for ' + sourcePath);
  }
  generated += 1;
}

console.log(`thumbnails ok: ${generated} generated, ${skipped} fresh, ${images.length} total`);
