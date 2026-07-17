#!/usr/bin/env node
import { closeSync, copyFileSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync, writeSync } from 'node:fs';
import { hostname } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { AUDIT_COLUMNS, assertContainedRegular, attemptRows, escapeCsv, loadInventory, parseCsv, safeRelativePath, sha256File } from './image-quality-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tmpRoot = join(root, '.tmp/image-quality');
const lockPath = join(tmpRoot, 'apply.lock');
const journalPath = join(tmpRoot, 'apply-transaction.json');
const baseline = JSON.parse(readFileSync(join(root, 'devlog/260715_production_upgrade/095_image_baseline_sheet_receipts.json'), 'utf8')).header;
const inventory = new Map(loadInventory(root).map(item => [item.key, item]));
const ids = process.argv.slice(2).flatMap((value, index, args) => value === '--attempt' ? [args[index + 1]] : []);
if (!ids.length) throw new Error('usage: apply-image-candidates.mjs --attempt img-000001 [--attempt ...]');

function syncFile(path) { const fd = openSync(path, 'r'); try { fsyncSync(fd); } finally { closeSync(fd); } }
function syncDir(path) { const fd = openSync(path, 'r'); try { fsyncSync(fd); } finally { closeSync(fd); } }
function writeDurable(path, value) { writeFileSync(path, value); syncFile(path); syncDir(dirname(path)); }
function writeJournal(journal) {
  journal.generation = (journal.generation ?? 0) + 1;
  const temp = `${journalPath}.next-${process.pid}-${journal.generation}`; const fd = openSync(temp, 'wx');
  try { writeSync(fd, JSON.stringify(journal, null, 2) + '\n'); fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(temp, journalPath); syncDir(tmpRoot);
}
function manifestText(manifest) {
  return ['{', `  "schemaVersion": ${manifest.schemaVersion},`, `  "hashAlgorithm": ${JSON.stringify(manifest.hashAlgorithm)},`,
    `  "manifestToolVersion": ${manifest.manifestToolVersion},`, `  "thumbnailContract": ${JSON.stringify(manifest.thumbnailContract)},`,
    `  "visualRelation": ${JSON.stringify(manifest.visualRelation)},`, '  "pairs": [',
    ...manifest.pairs.map((pair, index) => `    ${JSON.stringify(pair)}${index + 1 === manifest.pairs.length ? '' : ','}`), '  ]', '}', ''].join('\n');
}
function auditText(rows) { return rows.map(row => row.map(escapeCsv).join(',')).join('\n') + '\n'; }
function appendApplied(attempts) {
  for (const attemptId of attempts) {
    const result = spawnSync(process.execPath, [join(root, 'scripts/image-attempt.mjs'), 'applied', '--attempt', attemptId], { cwd: root, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(`failed to append applied state for ${attemptId}: ${result.stderr || result.stdout}`);
    process.stdout.write(result.stdout);
  }
}

function lock() {
  mkdirSync(tmpRoot, { recursive: true });
  if (existsSync(lockPath)) {
    const owner = JSON.parse(readFileSync(lockPath, 'utf8'));
    if (owner.host !== hostname()) throw new Error(`apply lock belongs to another host: ${owner.host}`);
    let alive = false; try { process.kill(owner.pid, 0); alive = true; } catch { alive = false; }
    if (alive || owner.runId !== baseline.runId) throw new Error(`apply lock held by pid=${owner.pid} run=${owner.runId}`);
    rmSync(lockPath, { force: true });
  }
  const fd = openSync(lockPath, 'wx');
  try { writeSync(fd, JSON.stringify({ pid: process.pid, host: hostname(), runId: baseline.runId }) + '\n'); fsyncSync(fd); } finally { closeSync(fd); }
}
function recover() {
  if (!existsSync(journalPath)) return;
  const journal = JSON.parse(readFileSync(journalPath, 'utf8'));
  const allowedTargets = new Set([...inventory.values()].flatMap(item => [join(root, item.source), join(root, item.preview)]).concat([
    join(root, 'assets/data/isms.json'), join(root, 'assets/data/effects.json'), join(root, 'assets/data/image-pairs-manifest.json'),
    join(root, 'devlog/260715_production_upgrade/091_image_quality_audit.csv'), join(root, 'devlog/260715_production_upgrade/031_effect_guide_audit.csv'),
    join(root, 'devlog/260715_production_upgrade/032_effect_guide_manifest.jsonl')
  ]));
  if (journal.schemaVersion !== 1 || !Number.isInteger(journal.generation) || journal.generation < 1 || journal.runId !== baseline.runId || journal.baselineSha256 !== baseline.aggregateSha256 ||
      dirname(journal.txDir) !== tmpRoot || !/^apply-\d+-\d+$/.test(journal.txDir.slice(tmpRoot.length + 1))) throw new Error('unsafe apply journal identity');
  if (!existsSync(journal.txDir) || lstatSync(journal.txDir).isSymbolicLink()) throw new Error('unsafe apply transaction directory');
  if (!['prepared', 'committed'].includes(journal.state)) throw new Error(`unknown journal state ${journal.state}`);
  for (const file of journal.files ?? []) {
    if (!allowedTargets.has(file.target)) throw new Error(`journal target outside allowlist: ${file.target}`);
    assertContainedRegular(root, file.backup, journal.txDir); assertContainedRegular(root, file.target);
    if (sha256File(file.backup) !== file.beforeSha256) throw new Error(`journal backup drift: ${file.target}`);
    const replacement = resolve(file.replacement);
    if (!replacement.startsWith(resolve(journal.txDir) + sep)) throw new Error(`journal replacement escapes transaction: ${file.replacement}`);
    if (existsSync(replacement)) assertContainedRegular(root, replacement, journal.txDir);
  }
  if (journal.state === 'prepared') {
    for (const file of journal.files) {
      const current = sha256File(file.target);
      if (![file.beforeSha256, file.afterSha256].includes(current)) throw new Error(`prepared target has unknown bytes: ${file.target}`);
      copyFileSync(file.backup, file.target); syncFile(file.target); syncDir(dirname(file.target));
    }
  } else {
    const complete = journal.files.every(file => sha256File(file.target) === file.afterSha256);
    if (!complete) {
      const applied = new Set(attemptRows(root).filter(row => row.state === 'applied').map(row => row.attemptId));
      const alreadyRecorded = (journal.attempts ?? []).some(attemptId => applied.has(attemptId));
      journal.state = alreadyRecorded ? 'repair-required' : 'rolled-back'; journal.recoveredAt = new Date().toISOString();
      if (!alreadyRecorded) for (const file of journal.files) { copyFileSync(file.backup, file.target); syncFile(file.target); syncDir(dirname(file.target)); }
      const receipt = join(tmpRoot, `apply-${journal.state}-${Date.now()}.json`); writeDurable(receipt, JSON.stringify(journal, null, 2) + '\n');
      if (!alreadyRecorded) rmSync(journal.txDir, { recursive: true, force: true });
      rmSync(journalPath, { force: true }); syncDir(tmpRoot);
      throw new Error(alreadyRecorded ? `committed target drift requires repair; receipt=${receipt}` : `committed transaction rolled back; receipt=${receipt}`);
    }
    appendApplied(journal.attempts ?? []);
  }
  rmSync(journal.txDir, { recursive: true, force: true }); rmSync(journalPath, { force: true }); syncDir(tmpRoot);
}

lock();
try {
  recover();
  const rows = attemptRows(root); const grouped = new Map();
  for (const row of rows) { const list = grouped.get(row.attemptId) ?? []; list.push(row); grouped.set(row.attemptId, list); }
  const selected = ids.map(attemptId => {
    const states = grouped.get(attemptId) ?? []; const prepared = states.find(row => row.state === 'prepared');
    const result = states.find(row => row.state === 'result'); const review = states.find(row => row.state === 'review');
    if (!prepared || result?.exitCode !== 0 || review?.decision !== 'accepted') throw new Error(`${attemptId}: not an accepted successful attempt`);
    if (prepared.runId !== baseline.runId || prepared.baselineSha256 !== baseline.aggregateSha256) throw new Error(`${attemptId}: baseline mismatch`);
    const item = inventory.get(prepared.key); if (!item || prepared.target !== item.source) throw new Error(`${attemptId}: target mismatch`);
    if (!safeRelativePath(prepared.candidate) || !prepared.candidate.startsWith('.tmp/image-candidates/')) throw new Error(`${attemptId}: unsafe candidate path`);
    const candidate = assertContainedRegular(root, join(root, prepared.candidate), join(root, '.tmp/image-candidates'));
    if (sha256File(candidate) !== result.candidateSha256) throw new Error(`${attemptId}: candidate bytes drifted`);
    if (sha256File(join(root, item.source)) !== prepared.beforeSha256) throw new Error(`${attemptId}: production target changed after prepare`);
    return { attemptId, prepared, result, item, candidate };
  });
  if (new Set(selected.map(item => item.item.key)).size !== selected.length) throw new Error('duplicate target attempts');

  const ismsPath = join(root, 'assets/data/isms.json'); const effectsPath = join(root, 'assets/data/effects.json');
  const manifestPath = join(root, 'assets/data/image-pairs-manifest.json');
  const auditPath = join(root, 'devlog/260715_production_upgrade/091_image_quality_audit.csv');
  const effectAuditPath = join(root, 'devlog/260715_production_upgrade/031_effect_guide_audit.csv');
  const effectManifestPath = join(root, 'devlog/260715_production_upgrade/032_effect_guide_manifest.jsonl');
  for (const path of [ismsPath, effectsPath, manifestPath, auditPath, effectAuditPath, effectManifestPath, ...selected.flatMap(({ item }) => [join(root, item.source), join(root, item.preview)])]) assertContainedRegular(root, path);
  const txDir = join(tmpRoot, `apply-${Date.now()}-${process.pid}`); const replacements = join(txDir, 'replacements'); const backups = join(txDir, 'backups');
  mkdirSync(replacements, { recursive: true }); mkdirSync(backups, { recursive: true });
  const isms = JSON.parse(readFileSync(ismsPath, 'utf8')); const effects = JSON.parse(readFileSync(effectsPath, 'utf8')); const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  let effectAudit = readFileSync(effectAuditPath, 'utf8'); let effectManifest = readFileSync(effectManifestPath, 'utf8'); const changedEffects = [];
  const auditRows = parseCsv(readFileSync(auditPath, 'utf8')); const header = auditRows[0];
  if (JSON.stringify(header) !== JSON.stringify(AUDIT_COLUMNS)) throw new Error('audit CSV header mismatch');
  const auditIndex = Object.fromEntries(header.map((name, index) => [name, index]));
  const files = [];
  function stage(target, replacement, name) {
    const backup = join(backups, name); copyFileSync(target, backup); syncFile(backup);
    files.push({ target, replacement, backup, beforeSha256: sha256File(target), afterSha256: sha256File(replacement) });
  }
  for (const selectedItem of selected) {
    const { attemptId, prepared, item, candidate } = selectedItem;
    const sourceReplacement = join(replacements, `${attemptId}.png`); const previewReplacement = join(replacements, `${attemptId}.webp`);
    copyFileSync(candidate, sourceReplacement); syncFile(sourceReplacement);
    await sharp(candidate, { failOn: 'error' }).resize({ width: 768, height: 512, fit: 'cover', position: 'centre' })
      .webp({ quality: 72, effort: 6, smartSubsample: true }).toFile(previewReplacement); syncFile(previewReplacement);
    const [sourceMeta, previewMeta] = await Promise.all([sharp(sourceReplacement).metadata(), sharp(previewReplacement).metadata()]);
    if (sourceMeta.format !== 'png' || sourceMeta.width !== 1536 || sourceMeta.height !== 1024) throw new Error(`${attemptId}: invalid source dimensions`);
    if (previewMeta.format !== 'webp' || previewMeta.width !== 768 || previewMeta.height !== 512) throw new Error(`${attemptId}: invalid preview dimensions`);
    if (item.catalog === 'ism') {
      const ism = isms.find(value => value.id === item.id); const prompt = ism?.prompts?.find(value => value.file === item.file);
      if (!prompt) throw new Error(`${attemptId}: prompt record missing`);
      prompt.prompt = prepared.prompt; prompt.model = 'gpt-5.6-sol'; prompt.quality = 'high'; prompt.size = '1536x1024';
    } else {
      const effect = effects.find(value => value.id === item.id); if (!effect?.guide) throw new Error(`${attemptId}: effect guide missing`);
      effect.guide.prompt = prepared.prompt; changedEffects.push({ selectedItem, sourceReplacement, previewReplacement });
    }
    const pair = manifest.pairs.find(value => value.source === item.source); if (!pair || pair.preview !== item.preview) throw new Error(`${attemptId}: manifest pair missing`);
    pair.sourceSha256 = sha256File(sourceReplacement); pair.previewSha256 = sha256File(previewReplacement);
    pair.sourceSize = [1536, 1024]; pair.previewSize = [768, 512];
    const audit = auditRows.slice(1).find(row => row[auditIndex.key] === item.key); if (!audit || audit[auditIndex.decision] !== 'replace') throw new Error(`${attemptId}: audit row not replace`);
    audit[auditIndex.current_source_sha256] = pair.sourceSha256; audit[auditIndex.current_preview_sha256] = pair.previewSha256;
    stage(join(root, item.source), sourceReplacement, `${attemptId}-source.png`);
    stage(join(root, item.preview), previewReplacement, `${attemptId}-preview.webp`);
  }
  for (const { selectedItem, sourceReplacement, previewReplacement } of changedEffects) {
    const { attemptId, prepared, result, item } = selectedItem; const response = JSON.parse(result.stdout || '{}');
    effectAudit += `${[item.id, 'image-quality-fail', 'accepted', 'codex-main+contact-sheet', new Date().toISOString().slice(0, 10), `wp090 ${attemptId}: ${prepared.priorFailureAnalysis}`].map(escapeCsv).join(',')}\n`;
    const provenance = { id: item.id, attemptId, runId: baseline.runId, baselineSha256: baseline.aggregateSha256,
      sourcePromptSha256: prepared.promptSha256, finalPrompt: prepared.prompt, command: prepared.command.join(' '), providerStatus: 'ok', requestId: response.requestId ?? null,
      original: { path: item.source, width: 1536, height: 1024, format: 'png', sha256: sha256File(sourceReplacement) },
      preview: { path: item.preview, width: 768, height: 512, format: 'webp', sha256: sha256File(previewReplacement), sourceSha256: sha256File(sourceReplacement) }, machineStatus: 'pass' };
    effectManifest += JSON.stringify(provenance) + '\n';
  }
  manifest.pairs.sort((a, b) => a.source.localeCompare(b.source));
  const ismsReplacement = join(replacements, 'isms.json'); const effectsReplacement = join(replacements, 'effects.json');
  const manifestReplacement = join(replacements, 'manifest.json'); const auditReplacement = join(replacements, 'audit.csv');
  writeDurable(ismsReplacement, JSON.stringify(isms, null, 2) + '\n'); writeDurable(effectsReplacement, JSON.stringify(effects, null, 2) + '\n');
  writeDurable(manifestReplacement, manifestText(manifest)); writeDurable(auditReplacement, auditText(auditRows));
  stage(ismsPath, ismsReplacement, 'isms.json'); stage(effectsPath, effectsReplacement, 'effects.json');
  stage(manifestPath, manifestReplacement, 'manifest.json'); stage(auditPath, auditReplacement, 'audit.csv');
  if (changedEffects.length) {
    const effectAuditReplacement = join(replacements, 'effect-audit.csv'); const effectManifestReplacement = join(replacements, 'effect-manifest.jsonl');
    writeDurable(effectAuditReplacement, effectAudit); writeDurable(effectManifestReplacement, effectManifest);
    stage(effectAuditPath, effectAuditReplacement, 'effect-audit.csv'); stage(effectManifestPath, effectManifestReplacement, 'effect-manifest.jsonl');
  }
  const journal = { schemaVersion: 1, state: 'prepared', runId: baseline.runId, baselineSha256: baseline.aggregateSha256, txDir, attempts: ids, files };
  writeJournal(journal);
  for (const file of files) {
    if (sha256File(file.target) !== file.beforeSha256) throw new Error(`target changed during apply: ${file.target}`);
    renameSync(file.replacement, file.target); syncFile(file.target); syncDir(dirname(file.target));
  }
  journal.state = 'committed'; journal.committedAt = new Date().toISOString(); writeJournal(journal);
  appendApplied(selected.map(item => item.attemptId));
  rmSync(txDir, { recursive: true, force: true }); rmSync(journalPath, { force: true }); syncDir(tmpRoot);
  console.log(`image candidates applied: ${ids.join(', ')}`);
} catch (error) {
  if (existsSync(journalPath)) recover();
  throw error;
} finally {
  rmSync(lockPath, { force: true });
}
