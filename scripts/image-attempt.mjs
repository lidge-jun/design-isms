#!/usr/bin/env node
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync, writeSync } from 'node:fs';
import { hostname } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { loadInventory, promptSha, sha256File, stem } from './image-quality-lib.mjs';

const args = process.argv.slice(2); const action = args[0];
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const devlog = join(root, 'devlog/260715_production_upgrade');
const ledgerDir = join(devlog, '092_image_generation_attempts');
const indexPath = join(ledgerDir, 'index.json');
const lockPath = join(root, '.tmp/image-quality/ledger.lock');
const baseline = JSON.parse(readFileSync(join(devlog, '095_image_baseline_sheet_receipts.json'), 'utf8')).header;
const inventory = loadInventory(root); const inventoryMap = new Map(inventory.map(item => [item.key, item]));
mkdirSync(ledgerDir, { recursive: true }); mkdirSync(dirname(lockPath), { recursive: true });

function option(name, fallback = '') { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; }
function syncDir(path) { const handle = openSync(path, 'r'); try { fsyncSync(handle); } finally { closeSync(handle); } }
function shardFiles() { return readdirSync(ledgerDir).filter(name => /^shard-\d{3}\.jsonl$/.test(name)).sort(); }
function readRows() { return shardFiles().flatMap(file => readFileSync(join(ledgerDir, file), 'utf8').split('\n').filter(Boolean).map(JSON.parse)); }
function latestStates(rows) {
  const attempts = new Map();
  for (const row of rows) { const list = attempts.get(row.attemptId) ?? []; list.push(row); attempts.set(row.attemptId, list); }
  return attempts;
}
function lock() {
  mkdirSync(dirname(lockPath), { recursive: true });
  if (existsSync(lockPath)) {
    const owner = JSON.parse(readFileSync(lockPath, 'utf8')); let alive = false;
    if (owner.host !== hostname()) throw new Error(`ledger lock belongs to another host: ${owner.host}`);
    if (owner.host === hostname()) try { process.kill(owner.pid, 0); alive = true; } catch { alive = false; }
    if (alive || owner.runId !== baseline.runId) throw new Error(`ledger lock held by pid=${owner.pid} host=${owner.host} run=${owner.runId}`);
    rmSync(lockPath, { force: true });
  }
  const handle = openSync(lockPath, 'wx');
  try { writeSync(handle, JSON.stringify({ pid: process.pid, host: hostname(), runId: baseline.runId, baselineSha256: baseline.aggregateSha256 }) + '\n'); fsyncSync(handle); } finally { closeSync(handle); }
}
function unlock() { rmSync(lockPath, { force: true }); }
function rebuildIndex(rows) {
  const attempts = latestStates(rows); const openTargets = [];
  let maxId = 0;
  for (const states of attempts.values()) {
    const prepared = states.find(row => row.state === 'prepared'); const review = states.find(row => row.state === 'review');
    if (prepared) { maxId = Math.max(maxId, Number(prepared.attemptId.slice(4))); if (!review) openTargets.push(prepared.key); }
  }
  const index = { schemaVersion: 1, runId: baseline.runId, baselineSha256: baseline.aggregateSha256, shards: shardFiles(), maxAttempt: maxId, openTargets: [...new Set(openTargets)].sort() };
  const temp = indexPath + '.tmp'; writeFileSync(temp, JSON.stringify(index, null, 2) + '\n');
  const handle = openSync(temp, 'r'); try { fsyncSync(handle); } finally { closeSync(handle); } renameSync(temp, indexPath); syncDir(ledgerDir);
  return index;
}
function appendRow(row) {
  const files = shardFiles(); let file = files.at(-1) ?? 'shard-001.jsonl';
  const path = join(ledgerDir, file); const lines = existsSync(path) ? readFileSync(path, 'utf8').split('\n').filter(Boolean).length : 0;
  if (lines >= 300) file = `shard-${String(files.length + 1).padStart(3, '0')}.jsonl`;
  const target = join(ledgerDir, file); const handle = openSync(target, 'a');
  try { writeSync(handle, JSON.stringify(row) + '\n'); fsyncSync(handle); } finally { closeSync(handle); }
  syncDir(ledgerDir);
}
function withLedger(fn) {
  lock();
  try { const before = readRows(); rebuildIndex(before); const result = fn(before); rebuildIndex(readRows()); return result; }
  finally { unlock(); }
}
function attemptStates(id, rows) { const states = rows.filter(row => row.attemptId === id); if (!states.length) throw new Error(`attempt not found ${id}`); return states; }
function claimedOutput(candidate, value) {
  const expectedDir = dirname(candidate);
  if (typeof value !== 'string' || dirname(value) !== expectedDir || !/^candidate\.claim-\d+-\d+\.png$/.test(basename(value))) throw new Error(`unsafe run claim path ${value}`);
  const absolute = resolve(root, value); if (dirname(absolute) !== resolve(root, expectedDir)) throw new Error(`run claim escapes attempt directory ${value}`);
  return absolute;
}

if (action === 'prepare') {
  const key = option('--key'); const item = inventoryMap.get(key); if (!item) throw new Error(`unknown key ${key}`);
  const promptFile = resolve(option('--prompt-file')); const analysis = option('--analysis'); const negative = option('--negative');
  if (!existsSync(promptFile) || !analysis || !negative) throw new Error('prepare requires --prompt-file, --analysis, --negative');
  const prepared = withLedger(rows => {
    const attempts = latestStates(rows);
    for (const states of attempts.values()) {
      const first = states.find(row => row.state === 'prepared'); const review = states.find(row => row.state === 'review');
      if (first?.key === key && !review) throw new Error(`target already has open attempt ${first.attemptId}`);
    }
    const max = rows.filter(row => row.state === 'prepared').reduce((value, row) => Math.max(value, Number(row.attemptId.slice(4))), 0);
    const attemptId = `img-${String(max + 1).padStart(6, '0')}`; const prompt = readFileSync(promptFile, 'utf8').trim();
    const candidate = `.tmp/image-candidates/${item.catalog}/${item.id}/${stem(item.file)}/${attemptId}/candidate.png`;
    if (existsSync(join(root, candidate))) throw new Error(`immutable candidate already exists ${candidate}`);
    mkdirSync(dirname(join(root, candidate)), { recursive: true });
    const command = ['ima2', 'gen', '--stdin', '-q', 'high', '-s', '1536x1024', '-o', candidate, '--json', '--timeout', '300', '--server', 'http://127.0.0.1:3334', '--model', 'oauth/gpt-5.6-sol', '--reasoning-effort', 'high'];
    const row = { state: 'prepared', attemptId, runId: baseline.runId, baselineSha256: baseline.aggregateSha256, key, prompt, promptSha256: promptSha(prompt), negativeConstraints: negative, priorFailureAnalysis: analysis, command, candidate, target: item.source, beforeSha256: sha256File(join(root, item.source)), createdAt: new Date().toISOString() };
    appendRow(row); return row;
  });
  console.log(JSON.stringify(prepared));
} else if (action === 'run') {
  const attemptId = option('--attempt');
  const claim = withLedger(rows => {
    const states = attemptStates(attemptId, rows); const first = states.find(row => row.state === 'prepared');
    if (states.some(row => row.state === 'result')) throw new Error(`attempt already ran ${attemptId}`);
    const prior = states.filter(row => row.state === 'running').at(-1);
    if (prior) {
      if (prior.host !== hostname()) throw new Error(`attempt running on another host ${prior.host}`);
      let alive = false; try { process.kill(prior.pid, 0); alive = true; } catch { alive = false; }
      if (alive) throw new Error(`attempt already running in pid ${prior.pid}`);
      rmSync(claimedOutput(first.candidate, prior.claimCandidate), { force: true });
    }
    const candidatePath = join(root, first.candidate); const markerPath = candidatePath + '.running.json';
    const claimCandidate = first.candidate.replace(/candidate\.png$/, `candidate.claim-${Date.now()}-${process.pid}.png`);
    rmSync(markerPath, { force: true }); rmSync(candidatePath, { force: true }); mkdirSync(dirname(candidatePath), { recursive: true });
    const marker = openSync(markerPath, 'wx');
    try { writeSync(marker, JSON.stringify({ attemptId, pid: process.pid, host: hostname(), runId: baseline.runId }) + '\n'); fsyncSync(marker); } finally { closeSync(marker); }
    const effectiveCommand = [...first.command]; const outIndex = effectiveCommand.indexOf('-o');
    if (outIndex < 0) throw new Error(`${attemptId}: prepared command lacks output flag`); effectiveCommand[outIndex + 1] = claimCandidate;
    appendRow({ state: 'running', attemptId, runId: baseline.runId, baselineSha256: baseline.aggregateSha256,
      pid: process.pid, host: hostname(), claimCandidate, effectiveCommand, startedAt: new Date().toISOString() });
    return { prepared: first, claimCandidate, effectiveCommand };
  });
  const { prepared, claimCandidate, effectiveCommand } = claim;
  const result = spawnSync(effectiveCommand[0], effectiveCommand.slice(1), { cwd: root, input: `${prepared.prompt}\n\nNegative constraints: ${prepared.negativeConstraints}\n`, encoding: 'utf8', timeout: 310000 });
  const claimPath = join(root, claimCandidate); let candidateSha256 = null; let dimensions = null;
  if (result.status === 0 && existsSync(claimPath)) { candidateSha256 = sha256File(claimPath); const meta = await sharp(claimPath, { failOn: 'error' }).metadata(); dimensions = [meta.width, meta.height, meta.format]; }
  const row = { state: 'result', attemptId, runId: baseline.runId, baselineSha256: baseline.aggregateSha256, exitCode: result.status, signal: result.signal, stdout: result.stdout.trim(), stderr: result.stderr.trim(), candidateSha256, dimensions, finishedAt: new Date().toISOString() };
  withLedger(rows => {
    const states = attemptStates(attemptId, rows); const running = states.filter(item => item.state === 'running').at(-1);
    if (states.some(item => item.state === 'result') || running?.pid !== process.pid || running?.host !== hostname() || running?.claimCandidate !== claimCandidate) throw new Error(`attempt run claim lost ${attemptId}`);
    const canonicalPath = join(root, prepared.candidate);
    if (candidateSha256) {
      if (existsSync(canonicalPath)) throw new Error(`immutable candidate already exists ${prepared.candidate}`); renameSync(claimPath, canonicalPath);
      const candidateHandle = openSync(canonicalPath, 'r'); try { fsyncSync(candidateHandle); } finally { closeSync(candidateHandle); }
      syncDir(dirname(canonicalPath));
    }
    else rmSync(claimPath, { force: true });
    appendRow(row); rmSync(canonicalPath + '.running.json', { force: true }); syncDir(dirname(canonicalPath));
  });
  console.log(JSON.stringify(row)); if (result.status !== 0) process.exitCode = result.status ?? 1;
} else if (action === 'review') {
  const attemptId = option('--attempt'); const decision = option('--decision'); const analysis = option('--analysis');
  if (!['accepted', 'rejected'].includes(decision) || !analysis) throw new Error('review requires accepted|rejected decision and analysis');
  const row = withLedger(rows => {
    const states = attemptStates(attemptId, rows); const result = states.find(item => item.state === 'result');
    if (!result) throw new Error(`attempt has no result ${attemptId}`);
    if (decision === 'accepted' && (result.exitCode !== 0 || !result.candidateSha256)) throw new Error(`attempt has no successful result ${attemptId}`);
    if (states.some(item => item.state === 'review')) throw new Error(`attempt already reviewed ${attemptId}`);
    const review = { state: 'review', attemptId, runId: baseline.runId, baselineSha256: baseline.aggregateSha256, decision, analysis, candidateSha256: result.candidateSha256, reviewedAt: new Date().toISOString() };
    appendRow(review); return review;
  });
  console.log(JSON.stringify(row));
} else if (action === 'applied') {
  const attemptId = option('--attempt');
  const row = withLedger(rows => {
    const states = attemptStates(attemptId, rows); const prepared = states.find(item => item.state === 'prepared');
    const review = states.find(item => item.state === 'review'); const result = states.find(item => item.state === 'result');
    if (review?.decision !== 'accepted' || !result?.candidateSha256) throw new Error(`attempt is not accepted ${attemptId}`);
    if (states.some(item => item.state === 'applied')) return states.find(item => item.state === 'applied');
    const item = inventoryMap.get(prepared.key); const sourceSha256 = sha256File(join(root, item.source));
    const previewSha256 = sha256File(join(root, item.preview));
    if (sourceSha256 !== result.candidateSha256) throw new Error(`applied source does not match candidate ${attemptId}`);
    const applied = { state: 'applied', attemptId, runId: baseline.runId, baselineSha256: baseline.aggregateSha256,
      key: prepared.key, sourceSha256, previewSha256, promptSha256: prepared.promptSha256, appliedAt: new Date().toISOString() };
    appendRow(applied); return applied;
  });
  console.log(JSON.stringify(row));
} else if (action === 'status') {
  const index = withLedger(rows => rebuildIndex(rows)); console.log(JSON.stringify(index, null, 2));
} else throw new Error('usage: image-attempt.mjs prepare|run|review|applied|status');
