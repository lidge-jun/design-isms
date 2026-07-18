#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { evidenceRootAbs, run, shaFile, treeFingerprint, writeJsonAtomic } from './final-qa-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const evidenceRoot = evidenceRootAbs(root); mkdirSync(evidenceRoot, { recursive: true });
const receiptPath = join(evidenceRoot, '115_final_static_receipt.json');
const steps = [
  ['npm-ci', 'npm', ['ci']], ['verify', 'npm', ['run', 'verify']], ['images-audit', 'npm', ['run', 'images:audit']],
  ['pages-stage', 'npm', ['run', 'pages:stage']], ['diff-check', 'git', ['diff', '--check']]
];
const commands = [];
for (const [id, command, args] of steps) {
  const evidence = run(root, command, args); commands.push({ id, ...evidence });
  process.stdout.write(evidence.outputTail);
  if (evidence.exitCode !== 0) throw new Error(`${id} failed with ${evidence.exitCode}`);
}
const manifest = JSON.parse(readFileSync(join(root, '.pages/manifest.json'), 'utf8'));
const expectedCounts = { html: 3, png: 211, webp: 211, forbidden: 0 };
if (JSON.stringify(manifest.counts) !== JSON.stringify(expectedCounts)) throw new Error(`stage counts drift: ${JSON.stringify(manifest.counts)}`);
const tree = treeFingerprint(root);
const receipt = { schemaVersion: 1, createdAt: new Date().toISOString(), commands,
  stage: { counts: manifest.counts, files: manifest.files.length, manifestSha256: shaFile(join(root, '.pages/manifest.json')) },
  governedTreeSha256: tree.sha256, governedFileCount: tree.files.length };
writeJsonAtomic(receiptPath, receipt);
console.log(`final static qa ok: tree=${tree.sha256} commands=${commands.length} stage=${manifest.files.length}`);
