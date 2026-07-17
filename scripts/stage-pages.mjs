#!/usr/bin/env node
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, parse, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const rootIndex = args.indexOf('--root');
const outIndex = args.indexOf('--out');
const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootInput = resolve(rootIndex >= 0 ? args[rootIndex + 1] : defaultRoot);
const root = realpathSync(rootInput);
const outInput = resolve(outIndex >= 0 ? args[outIndex + 1] : join(rootInput, '.pages'));
const out = outInput === rootInput || outInput.startsWith(rootInput + sep)
  ? resolve(root, relative(rootInput, outInput))
  : outInput;
const publicFiles = ['index.html', 'effects.html', 'faq.html', 'favicon.svg'];
const optionalFiles = ['robots.txt', 'sitemap.xml', 'CNAME'];
const assetDirs = ['css', 'data', 'icons', 'images', 'js'].map(name => join(root, 'assets', name));

function within(parent, child) { return child === parent || child.startsWith(parent + sep); }
function assertSafeOutput() {
  const allowedInRepoOut = join(root, '.pages');
  const sources = [...publicFiles.map(file => join(root, file)), ...optionalFiles.map(file => join(root, file)), ...assetDirs];
  const protectedPaths = [root, join(root, 'assets'), ...sources].filter(path => existsSync(path));
  const protectedIds = protectedPaths.map(path => { const stat = statSync(path); return { path, dev: stat.dev, ino: stat.ino }; });
  const assertIntersections = candidate => {
    if (candidate === root || within(candidate, root)) throw new Error(`unsafe --out intersects repository root: ${candidate}`);
    if (within(root, candidate) && candidate !== allowedInRepoOut) throw new Error(`unsafe in-repository --out (only .pages is allowed): ${candidate}`);
    for (const source of sources) if (within(source, candidate) || within(candidate, source)) throw new Error(`unsafe --out intersects public source ${source}`);
  };
  assertIntersections(out);
  const parsed = parse(out); let cursor = parsed.root;
  const parts = out.slice(parsed.root.length).split(sep).filter(Boolean);
  let existingCount = 0; let canonicalBase = parsed.root; let rootAliasDepth = null;
  for (const part of parts) {
    cursor = join(cursor, part);
    if (!existsSync(cursor)) break;
    if (lstatSync(cursor).isSymbolicLink()) throw new Error(`unsafe --out symlink component ${cursor}`);
    const identity = statSync(cursor);
    for (const item of protectedIds) {
      if (identity.dev !== item.dev || identity.ino !== item.ino) continue;
      if (item.path === root && existingCount + 1 < parts.length) { rootAliasDepth = existingCount + 1; break; }
      throw new Error(`unsafe --out aliases protected source ${item.path}`);
    }
    canonicalBase = realpathSync(cursor); existingCount += 1;
  }
  assertIntersections(resolve(canonicalBase, ...parts.slice(existingCount)));
  if (rootAliasDepth !== null) assertIntersections(resolve(root, ...parts.slice(rootAliasDepth)));
}
assertSafeOutput();

function safeName(name, rel) {
  if (name === '.DS_Store') return false;
  if (name.startsWith('.')) throw new Error(`unsafe dotfile ${join(rel, name)}`);
  if (name === '..' || name.includes('/') || name.includes('\\') || /[\0-\x1f]/.test(name)) throw new Error(`unsafe name ${join(rel, name)}`);
  return true;
}

function copyTree(source, destination, relBase) {
  if (lstatSync(source).isSymbolicLink()) throw new Error(`symlink source ${relBase}`);
  mkdirSync(destination, { recursive: true });
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (!safeName(entry.name, relBase)) continue;
    const sourcePath = join(source, entry.name); const destinationPath = join(destination, entry.name);
    const rel = join(relBase, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`symlink source ${rel}`);
    if (entry.isDirectory()) copyTree(sourcePath, destinationPath, rel);
    else if (entry.isFile()) copyFileSync(sourcePath, destinationPath);
    else throw new Error(`unsupported source entry ${rel}`);
  }
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const file of publicFiles) {
  const source = join(root, file);
  if (!existsSync(source) || !lstatSync(source).isFile()) throw new Error(`missing public file ${file}`);
  copyFileSync(source, join(out, file));
}
for (const file of optionalFiles) {
  const source = join(root, file);
  if (!existsSync(source)) continue;
  if (lstatSync(source).isSymbolicLink() || !lstatSync(source).isFile()) throw new Error(`unsafe optional public file ${file}`);
  copyFileSync(source, join(out, file));
}
for (const source of assetDirs) {
  if (!existsSync(source) || !lstatSync(source).isDirectory()) throw new Error(`missing public directory ${relative(root, source)}`);
  copyTree(source, join(out, 'assets', source.split(sep).at(-1)), relative(root, source));
}
writeFileSync(join(out, '.nojekyll'), '');

function collect(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) collect(path, acc);
    else if (entry.isFile() && entry.name !== 'manifest.json') acc.push(path);
  }
  return acc;
}
const staged = collect(out).sort((a, b) => relative(out, a).localeCompare(relative(out, b)));
const entries = staged.map(path => {
  const bytes = readFileSync(path);
  return { path: relative(out, path).split(sep).join('/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
});
const htmlCount = entries.filter(entry => entry.path.endsWith('.html')).length;
const pngCount = entries.filter(entry => entry.path.endsWith('.png')).length;
const webpCount = entries.filter(entry => entry.path.endsWith('.webp')).length;
if (htmlCount !== 3 || pngCount !== 211 || webpCount !== 211) {
  throw new Error(`stage counts ${htmlCount} HTML/${pngCount} PNG/${webpCount} WebP != 3/211/211`);
}
const forbiddenTop = new Set(['.git', '.github', 'src', 'scripts', 'tests', 'docs', 'devlog', 'node_modules', 'package.json', 'package-lock.json', 'tsconfig.json', '.codexclaw', 'Archive.zip']);
for (const entry of entries) if (forbiddenTop.has(entry.path.split('/')[0])) throw new Error(`forbidden staged path ${entry.path}`);
const manifest = { schemaVersion: 1, hashAlgorithm: 'sha256', counts: { html: htmlCount, png: pngCount, webp: webpCount, forbidden: 0 }, files: entries };
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`pages staged: ${htmlCount} HTML, ${pngCount} PNG, ${webpCount} WebP, 0 forbidden; ${entries.length} files + manifest`);
