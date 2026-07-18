#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const rootIndex = args.indexOf('--root');
const hostRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(rootIndex >= 0 ? args[rootIndex + 1] : hostRoot);
const errors = [];
const pages = ['index.html', 'effects.html', 'faq.html', 'color.html', 'typography.html', 'layout.html', 'motion.html'];

function read(rel) {
  const path = join(root, rel);
  if (!existsSync(path)) { errors.push(`missing ${rel}`); return ''; }
  return readFileSync(path, 'utf8');
}
function publicFiles(dir, extensions, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) publicFiles(path, extensions, acc);
    else if (entry.isFile() && extensions.has(extname(entry.name))) acc.push(path);
  }
  return acc;
}
function localTarget(raw, owner) {
  const value = raw.trim().replace(/^['"]|['"]$/g, '');
  if (!value || /^(?:https?:|data:|mailto:|tel:|#|\/\/)/i.test(value)) return null;
  const clean = value.split(/[?#]/)[0];
  if (!clean) return null;
  return resolve(dirname(owner), clean);
}
function inside(parent, child) { return child === parent || child.startsWith(parent + '/'); }

const htmlByPage = new Map(pages.map(page => [page, read(page)]));
const faq = JSON.parse(read('assets/data/faq.json') || '{}');
const categories = Array.isArray(faq.categories) ? faq.categories : [];
const faqItems = categories.flatMap(category => Array.isArray(category.items) ? category.items : []);
if (categories.length !== 3 || faqItems.length !== 18) errors.push(`FAQ contract ${categories.length} categories/${faqItems.length} items != 3/18`);
if (new Set(faqItems.map(item => item.id)).size !== faqItems.length) errors.push('FAQ item ids are not unique');

const sotResult = spawnSync(process.execPath, [join(hostRoot, 'scripts/sync-sot.mjs'), '--check', '--root', root], { encoding: 'utf8' });
if (sotResult.status !== 0) errors.push((sotResult.stderr || sotResult.stdout || 'SoT check failed').trim());

const requiredOrder = {
  'index.html': ['assets/js/app-dialog.js', 'assets/js/app-runtime.js', 'assets/js/nav-dropdown.js', 'assets/js/app.js'],
  'effects.html': ['assets/js/app-dialog.js', 'assets/js/app-runtime.js', 'assets/js/nav-dropdown.js', 'assets/js/catalog-shell.js', 'assets/js/app-export.js', 'assets/js/effects-filters.js', 'assets/js/effects-interactions.js', 'assets/js/effects-demos.js', 'assets/js/effects-docs.js', 'assets/js/effects.js'],
  'faq.html': ['assets/js/app-runtime.js', 'assets/js/nav-dropdown.js', 'assets/js/faq.js'],
  'color.html': ['assets/js/app-dialog.js', 'assets/js/app-runtime.js', 'assets/js/nav-dropdown.js', 'assets/js/catalog-shell.js', 'assets/js/color.js'],
  'typography.html': ['assets/js/app-dialog.js', 'assets/js/app-runtime.js', 'assets/js/nav-dropdown.js', 'assets/js/catalog-shell.js', 'assets/js/typography-fonts.js', 'assets/js/typography.js'],
  'layout.html': ['assets/js/app-runtime.js', 'assets/js/nav-dropdown.js', 'assets/js/catalog-shell.js'],
  'motion.html': ['assets/js/app-runtime.js', 'assets/js/nav-dropdown.js', 'assets/js/catalog-shell.js']
};
for (const [page, order] of Object.entries(requiredOrder)) {
  const html = htmlByPage.get(page) ?? '';
  let previous = -1;
  for (const needle of order) {
    const index = html.indexOf(needle);
    if (index < 0) errors.push(`${page}: missing script ${needle}`);
    else if (index <= previous) errors.push(`${page}: script order violation at ${needle}`);
    previous = index;
  }
}

for (const [page, html] of htmlByPage) {
  const owner = join(root, page);
  for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    const target = localTarget(match[1], owner);
    if (target && !inside(root, target)) errors.push(`${page}: local reference escapes public root ${match[1]}`);
    else if (target && !existsSync(target)) errors.push(`${page}: unresolved local reference ${match[1]}`);
  }
  if (/\s(?:on[a-z]+)\s*=/i.test(html)) errors.push(`${page}: authored inline event handler`);
  if (/javascript:/i.test(html)) errors.push(`${page}: javascript URL`);
}

const cssFiles = publicFiles(join(root, 'assets/css'), new Set(['.css']));
for (const path of cssFiles) {
  const css = readFileSync(path, 'utf8');
  for (const match of css.matchAll(/url\(([^)]+)\)/g)) {
    const target = localTarget(match[1], path);
    if (target && !inside(root, target)) errors.push(`${relative(root, path)}: url escapes public root (${match[1]})`);
    else if (target && !existsSync(target)) errors.push(`${relative(root, path)}: unresolved url(${match[1]})`);
  }
}

const shippedTextFiles = [
  ...pages.map(page => join(root, page)),
  ...publicFiles(join(root, 'assets/data'), new Set(['.json'])),
  ...publicFiles(join(root, 'assets/js'), new Set(['.js']))
];
const forbidden = [
  [/generating\.\.\./i, 'generating...'],
  [/coming soon/i, 'coming soon'],
  [/lorem ipsum/i, 'lorem ipsum'],
  [/\bTODO\b/, 'TODO'],
  [/\bTBD\b/, 'TBD']
];
for (const path of shippedTextFiles) {
  const text = readFileSync(path, 'utf8');
  for (const [pattern, label] of forbidden) if (pattern.test(text)) errors.push(`${relative(root, path)}: forbidden placeholder ${label}`);
  if (/javascript:/i.test(text)) errors.push(`${relative(root, path)}: javascript URL`);
}

if (errors.length) {
  console.error('content verification failed:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log(`content ok: ${pages.length} pages, ${faqItems.length} FAQ items, local references and metadata verified`);
