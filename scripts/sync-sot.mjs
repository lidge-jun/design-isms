#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const args = process.argv.slice(2);
const rootIndex = args.indexOf('--root');
const root = resolve(rootIndex >= 0 ? args[rootIndex + 1] : join(dirname(fileURLToPath(import.meta.url)), '..'));
const journalPath = join(root, '.sot-transaction.json');
const write = args.includes('--write');
const check = args.includes('--check') || !write;

function loadCounts() {
  const isms = JSON.parse(readFileSync(join(root, 'assets/data/isms.json'), 'utf8')).length;
  const effects = JSON.parse(readFileSync(join(root, 'assets/data/effects.json'), 'utf8')).length;
  const faq = JSON.parse(readFileSync(join(root, 'assets/data/faq.json'), 'utf8'));
  const answers = faq.categories.reduce((sum, category) => sum + category.items.length, 0);
  return { isms, effects, answers };
}

const counts = loadCounts();
const specs = [
  ['index.html', 'index-description', () => `<meta name="description" content="${counts.isms}개 디자인 ism의 시각적 레퍼런스 보드. Minimalism부터 AI Slop 진단까지.">`],
  ['index.html', 'index-nav-count', () => `<span class="header-count" data-nav-axis="count">${counts.isms} isms</span>`],
  ['effects.html', 'effects-og-description', () => `<meta property="og:description" content="${counts.effects}개 모바일, 데스크탑, 공통 UI 패턴/이펙트를 데모, guide 이미지, 접근성/성능 체크로 정리한 프런트엔드 후보군 레퍼런스.">`],
  ['effects.html', 'effects-twitter-description', () => `<meta name="twitter:description" content="${counts.effects}개 프런트엔드 UI 패턴/이펙트를 이름, 별칭, 데모, 구현 체크로 훑는 레퍼런스 페이지.">`],
  ['effects.html', 'effects-nav-count', () => `<span class="header-count" data-nav-axis="count">${counts.effects} effects</span>`],
  ['faq.html', 'faq-nav-count', () => `<span class="header-count" data-nav-axis="count">${counts.answers} answers</span>`],
  ['README.md', 'readme-counts', () => `Catalog source-of-truth counts: ${counts.isms} ISMs / ${counts.effects} effects / ${counts.answers} FAQ answers.`],
  ['AGENTS.md', 'agents-counts', () => `카탈로그 source-of-truth 카운트: ${counts.isms} ISMs / ${counts.effects} effects / ${counts.answers} FAQ answers.`],
  ['structure/README.md', 'structure-counts', () => `Catalog source-of-truth counts: ${counts.isms} ISMs / ${counts.effects} effects / ${counts.answers} FAQ answers.`]
];

const byFile = new Map();
for (const spec of specs) {
  const list = byFile.get(spec[0]) ?? [];
  list.push(spec);
  byFile.set(spec[0], list);
}

function token(name, side) { return `<!-- data-sot:${name}:${side} -->`; }
function occurrences(text, needle) { return text.split(needle).length - 1; }
function digest(text) { return createHash('sha256').update(text).digest('hex'); }

function validateLayout(file, text, fileSpecs) {
  const known = new Set(fileSpecs.map(spec => spec[1]));
  const tokens = [...text.matchAll(/<!-- data-sot:([a-z0-9-]+):(start|end) -->/g)];
  for (const match of tokens) if (!known.has(match[1])) throw new Error(`${file}: unknown marker ${match[1]}`);
  let open = null;
  for (const match of tokens) {
    const [, name, side] = match;
    if (side === 'start') {
      if (open) throw new Error(`${file}: nested/overlapping marker ${name} inside ${open}`);
      open = name;
    } else {
      if (open !== name) throw new Error(`${file}: reversed/unbalanced marker ${name}`);
      open = null;
    }
  }
  if (open) throw new Error(`${file}: unclosed marker ${open}`);
  for (const [, name] of fileSpecs) {
    if (occurrences(text, token(name, 'start')) !== 1 || occurrences(text, token(name, 'end')) !== 1) {
      throw new Error(`${file}: marker ${name} must have exactly one start/end pair`);
    }
  }
}

function maskBodies(text, fileSpecs) {
  let masked = text;
  for (const [, name] of fileSpecs) {
    const start = token(name, 'start'); const end = token(name, 'end');
    const a = masked.indexOf(start) + start.length; const b = masked.indexOf(end, a);
    masked = masked.slice(0, a) + `__SOT_BODY_${name}__` + masked.slice(b);
  }
  return masked;
}

function writeJournal(phase, records) {
  const temp = `${journalPath}.tmp`;
  writeFileSync(temp, JSON.stringify({ version: 1, phase, files: records }) + '\n');
  renameSync(temp, journalPath);
}

function recoverInterruptedTransaction(paths) {
  rmSync(`${journalPath}.tmp`, { force: true });
  if (!existsSync(journalPath)) {
    const orphans = paths.filter(path => existsSync(`${path}.sot-backup`));
    if (orphans.length) throw new Error(`orphan SoT backups without journal: ${orphans.map(path => relative(root, path)).join(', ')}`);
    for (const path of paths) rmSync(`${path}.sot-tmp`, { force: true });
    return;
  }
  const journal = JSON.parse(readFileSync(journalPath, 'utf8'));
  const expected = paths.map(path => relative(root, path)).sort();
  const records = Array.isArray(journal.files) ? journal.files : [];
  const recorded = records.map(record => record.file).sort();
  const recordMap = new Map(records.map(record => [record.file, record]));
  const recordsValid = records.every(record => typeof record.file === 'string' && /^[a-f0-9]{64}$/.test(record.beforeSha256) && /^[a-f0-9]{64}$/.test(record.afterSha256));
  if (journal.version !== 1 || !['prepared', 'committed'].includes(journal.phase) || !recordsValid || JSON.stringify(recorded) !== JSON.stringify(expected)) {
    throw new Error('invalid SoT transaction journal');
  }
  if (journal.phase === 'prepared') {
    for (const path of paths) {
      const record = recordMap.get(relative(root, path)); const backup = `${path}.sot-backup`; const temp = `${path}.sot-tmp`;
      if (existsSync(backup) && digest(readFileSync(backup, 'utf8')) !== record.beforeSha256) throw new Error(`unsafe prepared SoT backup: ${relative(root, path)}`);
      if (!existsSync(backup) && (!existsSync(path) || digest(readFileSync(path, 'utf8')) !== record.beforeSha256)) throw new Error(`unsafe prepared SoT current file: ${relative(root, path)}`);
      if (existsSync(temp) && digest(readFileSync(temp, 'utf8')) !== record.afterSha256) throw new Error(`unsafe prepared SoT temp: ${relative(root, path)}`);
    }
    for (const path of paths) {
      const backup = `${path}.sot-backup`;
      if (existsSync(backup)) renameSync(backup, path);
      rmSync(`${path}.sot-tmp`, { force: true });
    }
    console.warn('recovered prepared SoT transaction by complete rollback');
  } else {
    for (const path of paths) {
      const record = recordMap.get(relative(root, path));
      if (!existsSync(path) || digest(readFileSync(path, 'utf8')) !== record.afterSha256) throw new Error(`unsafe committed SoT transaction state: ${relative(root, path)}`);
    }
    for (const path of paths) {
      rmSync(`${path}.sot-backup`, { force: true });
      rmSync(`${path}.sot-tmp`, { force: true });
    }
    console.warn('recovered committed SoT transaction by roll-forward cleanup');
  }
  rmSync(journalPath, { force: true });
}

const outputs = new Map();
const beforeDigests = new Map();
const stale = [];
recoverInterruptedTransaction([...byFile.keys()].map(file => join(root, file)));
for (const [file, fileSpecs] of byFile) {
  const path = join(root, file);
  if (!existsSync(path)) throw new Error(`${file}: missing`);
  const before = readFileSync(path, 'utf8');
  beforeDigests.set(path, digest(before));
  validateLayout(file, before, fileSpecs);
  let after = before;
  for (const [, name, render] of fileSpecs) {
    const start = token(name, 'start'); const end = token(name, 'end');
    const a = after.indexOf(start) + start.length; const b = after.indexOf(end, a);
    const expected = render();
    if (after.slice(a, b) !== expected) stale.push(`${file}:${name}`);
    after = after.slice(0, a) + expected + after.slice(b);
  }
  if (digest(maskBodies(before, fileSpecs)) !== digest(maskBodies(after, fileSpecs))) {
    throw new Error(`${file}: content outside marked spans changed`);
  }
  outputs.set(path, after);
}

if (check && stale.length) {
  console.error(`sot check failed: ${stale.join(', ')}`);
  process.exit(1);
}

if (write && stale.length) {
  const paths = [...outputs.keys()];
  const records = paths.map(path => ({ file: relative(root, path), beforeSha256: beforeDigests.get(path), afterSha256: digest(outputs.get(path)) }));
  try {
    for (const [path, text] of outputs) {
      const temp = `${path}.sot-tmp`; const backup = `${path}.sot-backup`;
      if (existsSync(temp) || existsSync(backup)) throw new Error(`${path}: stale SoT transaction sidecar`);
      writeFileSync(temp, text);
    }
    writeJournal('prepared', records);
    for (const path of paths) renameSync(path, `${path}.sot-backup`);
    for (const path of paths) renameSync(`${path}.sot-tmp`, path);
    writeJournal('committed', records);
    for (const path of paths) rmSync(`${path}.sot-backup`, { force: true });
    rmSync(journalPath, { force: true });
  } catch (error) {
    recoverInterruptedTransaction(paths);
    throw error;
  }
}

console.log(`sot ${write ? 'sync' : 'check'} ok: ${specs.length} markers; ${counts.isms}/${counts.effects}/${counts.answers}`);
