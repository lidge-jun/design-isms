#!/usr/bin/env node
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const rootIndex = args.indexOf('--root');
const hostRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(rootIndex >= 0 ? args[rootIndex + 1] : hostRoot);
const tsconfig = join(root, 'tsconfig.json');
const expectedDir = join(root, 'assets/js');
const compiler = join(hostRoot, 'node_modules/typescript/bin/tsc');
const temp = mkdtempSync(join(tmpdir(), 'design-isms-generated-'));

function filesUnder(dir, base = dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) filesUnder(path, base, acc);
    else if (entry.isFile() && entry.name.endsWith('.js')) acc.push(relative(base, path));
  }
  return acc.sort();
}

try {
  for (const path of [tsconfig, expectedDir, compiler]) if (!existsSync(path)) throw new Error(`missing ${relative(root, path)}`);
  const result = spawnSync(process.execPath, [compiler, '-p', tsconfig, '--outDir', temp, '--pretty', 'false'], {
    cwd: root, encoding: 'utf8', env: { ...process.env }
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout); process.stderr.write(result.stderr);
    throw new Error(`fixture TypeScript compile failed with exit ${result.status}`);
  }
  const actualFiles = filesUnder(temp);
  const expectedFiles = filesUnder(expectedDir);
  const errors = [];
  for (const file of actualFiles) if (!expectedFiles.includes(file)) errors.push(`missing committed output assets/js/${file}`);
  for (const file of expectedFiles) if (!actualFiles.includes(file)) errors.push(`extra committed output assets/js/${file}`);
  for (const file of actualFiles.filter(file => expectedFiles.includes(file))) {
    if (!readFileSync(join(temp, file)).equals(readFileSync(join(expectedDir, file)))) errors.push(`stale assets/js/${file}`);
  }
  if (errors.length) {
    console.error('generated verification failed:');
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`generated ok: ${actualFiles.length} TypeScript outputs match committed browser JS`);
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
