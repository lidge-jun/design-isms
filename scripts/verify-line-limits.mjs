#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const rootIndex = args.indexOf('--root');
const root = resolve(rootIndex >= 0 ? args[rootIndex + 1] : join(dirname(fileURLToPath(import.meta.url)), '..'));
const errors = [];
const exceptions = new Map([
  ['src/app.ts', 1050],
  ['src/effects.ts', 450],
  ['assets/css/style.css', 1000]
]);

function collect(dir, extension, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) collect(path, extension, acc);
    else if (entry.isFile() && extname(entry.name) === extension) acc.push(path);
  }
  return acc;
}

const governed = [
  ...collect(join(root, 'src'), '.ts'),
  ...collect(join(root, 'scripts'), '.mjs'),
  ...collect(join(root, 'assets/css'), '.css')
];
for (const path of governed) {
  const rel = relative(root, path).split('\\').join('/');
  const limit = exceptions.get(rel) ?? 500;
  const text = readFileSync(path, 'utf8');
  const lines = text === '' ? 0 : (text.endsWith('\n') ? text.slice(0, -1) : text).split('\n').length;
  if (lines > limit) errors.push(`${rel} ${lines} lines > ${limit}`);
}

const git = spawnSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'utf8' });
if (git.status === 0) {
  const tracked = git.stdout.split('\0').filter(Boolean);
  const forbidden = /(^|\/)(?:\.pages|\.tmp|node_modules|coverage)(?:\/|$)|(^|\/)\.DS_Store$|(?:~|\.swp|\.swo|\.bak|\.tmp)$/;
  for (const path of tracked) if (forbidden.test(path)) errors.push(`tracked hygiene violation ${path}`);
}

if (errors.length) {
  console.error('line/hygiene verification failed:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log(`lines ok: ${governed.length} governed files, ${exceptions.size} explicit legacy ceilings`);
