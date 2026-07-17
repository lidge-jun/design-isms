#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AUDIT_COLUMNS, RUBRICS, assertContainedRegular, attemptRows, buildSheet, loadInventory, parseCsv, promptSha, sha256Bytes, sha256File, sheetSpecs, stableJson, verifyBaseline } from './image-quality-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'); const devlog = join(root, 'devlog/260715_production_upgrade');
const preFinal = process.argv.includes('--pre-final');
const errors = []; const fail = message => errors.push(message);
const baselineState = verifyBaseline(root); const baselineReceipt = baselineState.receipt;
const finalReceipt = preFinal ? null : JSON.parse(readFileSync(join(devlog, '098_image_final_sheet_receipts.json'), 'utf8'));
const baselineRun = baselineReceipt.header.runId; const baselineSha = baselineReceipt.header.aggregateSha256;
const inventory = loadInventory(root); const inventoryMap = new Map(inventory.map(item => [item.key, item]));

const baselineAssets = readFileSync(join(devlog, '093_image_baseline_assets.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse);
if (baselineAssets.length !== 422 || new Set(baselineAssets.map(row => row.path)).size !== 422) fail('baseline asset inventory must contain 422 unique paths');
const baselineAssetMap = new Map(baselineAssets.map(row => [row.path, row.sha256]));
const currentPaths = inventory.flatMap(item => [item.source, item.preview]).sort();
if (stableJson([...baselineAssetMap.keys()].sort()) !== stableJson(currentPaths)) fail('current raster path set differs from baseline');

const attempts = attemptRows(root); const groups = new Map();
for (const row of attempts) {
  if (row.runId !== baselineRun || row.baselineSha256 !== baselineSha) fail(`${row.attemptId}: run/baseline binding mismatch`);
  const list = groups.get(row.attemptId) ?? []; list.push(row); groups.set(row.attemptId, list);
}
const acceptedByKey = new Map();
for (const [attemptId, states] of groups) {
  const prepared = states.filter(row => row.state === 'prepared'); const result = states.filter(row => row.state === 'result');
  const review = states.filter(row => row.state === 'review'); const applied = states.filter(row => row.state === 'applied');
  if (prepared.length !== 1 || result.length !== 1 || review.length !== 1) fail(`${attemptId}: expected one prepared/result/review state`);
  if (states.some(row => !['prepared', 'running', 'result', 'review', 'applied'].includes(row.state))) fail(`${attemptId}: unknown attempt state`);
  const preparedAt = states.findIndex(row => row.state === 'prepared'); const resultAt = states.findIndex(row => row.state === 'result');
  const reviewAt = states.findIndex(row => row.state === 'review'); const appliedAt = states.findIndex(row => row.state === 'applied');
  if (!(preparedAt === 0 && resultAt > preparedAt && reviewAt > resultAt && (appliedAt < 0 || appliedAt > reviewAt))) fail(`${attemptId}: invalid state order`);
  if (states.some((row, indexValue) => row.state === 'running' && (indexValue <= preparedAt || indexValue >= resultAt))) fail(`${attemptId}: running claim outside generation window`);
  const item = inventoryMap.get(prepared[0]?.key); const canonicalCandidate = item && `.tmp/image-candidates/${item.catalog}/${item.id}/${item.file.replace(/\.[^.]+$/, '')}/${attemptId}/candidate.png`;
  if (!item || prepared[0]?.target !== item.source || prepared[0]?.candidate !== canonicalCandidate || prepared[0]?.beforeSha256 !== baselineAssetMap.get(item?.source)) fail(`${attemptId}: prepared target/candidate/baseline provenance mismatch`);
  for (const running of states.filter(row => row.state === 'running')) {
    const expectedDir = canonicalCandidate && dirname(canonicalCandidate); const expected = [...prepared[0].command]; const outIndex = expected.indexOf('-o');
    const safeClaim = typeof running.claimCandidate === 'string' && dirname(running.claimCandidate) === expectedDir && /^candidate\.claim-\d+-\d+\.png$/.test(basename(running.claimCandidate));
    if (!safeClaim || outIndex < 0) fail(`${attemptId}: invalid unique run claim path`);
    else { expected[outIndex + 1] = running.claimCandidate; if (stableJson(running.effectiveCommand) !== stableJson(expected)) fail(`${attemptId}: run claim command drift`); }
  }
  if (review[0]?.decision === 'accepted') {
    if (result[0]?.exitCode !== 0 || !result[0]?.candidateSha256 || applied.length !== 1) fail(`${attemptId}: accepted attempt is not successful and applied exactly once`);
    else {
      const expectedCommand = ['ima2', 'gen', '--stdin', '-q', 'high', '-s', '1536x1024', '-o', canonicalCandidate, '--json', '--timeout', '300', '--server', 'http://127.0.0.1:3334', '--model', 'oauth/gpt-5.6-sol', '--reasoning-effort', 'high'];
      if (stableJson(prepared[0].command) !== stableJson(expectedCommand)) fail(`${attemptId}: accepted generation command/model/reasoning drift`);
      if (review[0].candidateSha256 !== result[0].candidateSha256 || applied[0].key !== prepared[0].key || applied[0].sourceSha256 !== result[0].candidateSha256) fail(`${attemptId}: result/review/applied provenance mismatch`);
      if (acceptedByKey.has(prepared[0].key)) fail(`${prepared[0].key}: multiple accepted attempts`);
      acceptedByKey.set(prepared[0].key, { attemptId, prepared: prepared[0], result: result[0], applied: applied[0] });
      const candidate = join(root, prepared[0].candidate);
      if (existsSync(candidate) && sha256File(candidate) !== result[0].candidateSha256) fail(`${attemptId}: retained candidate drifted`);
      if (!item || sha256File(join(root, item.source)) !== applied[0].sourceSha256 || sha256File(join(root, item.preview)) !== applied[0].previewSha256) fail(`${attemptId}: applied hashes drift`);
      if (promptSha(item?.prompt ?? '') !== prepared[0].promptSha256 || applied[0].promptSha256 !== prepared[0].promptSha256) fail(`${attemptId}: current prompt drift`);
    }
  } else {
    if (applied.length) fail(`${attemptId}: rejected attempt has applied state`);
    if (review[0]?.candidateSha256 !== result[0]?.candidateSha256) fail(`${attemptId}: rejected result/review hash mismatch`);
  }
}
if (!acceptedByKey.size) fail('no accepted replacement attempts');

const attemptDir = join(devlog, '092_image_generation_attempts'); const index = JSON.parse(readFileSync(join(attemptDir, 'index.json'), 'utf8'));
const shards = readdirSync(attemptDir).filter(name => /^shard-\d{3}\.jsonl$/.test(name)).sort();
if (stableJson(shards) !== stableJson(index.shards) || index.runId !== baselineRun || index.baselineSha256 !== baselineSha) fail('attempt index cache mismatch');
if (index.openTargets?.length) fail('attempt index has open targets');
for (const shard of shards) if (readFileSync(join(attemptDir, shard), 'utf8').split('\n').filter(Boolean).length > 300) fail(`${shard}: exceeds 300 rows`);
const ids = [...groups.keys()]; if (new Set(ids).size !== ids.length || index.maxAttempt !== Math.max(...ids.map(id => Number(id.slice(4))))) fail('attempt id/index maximum mismatch');

const audit = parseCsv(readFileSync(join(devlog, '091_image_quality_audit.csv'), 'utf8')); const header = audit[0];
if (stableJson(header) !== stableJson(AUDIT_COLUMNS) || audit.length !== 212) fail('audit CSV must have exact 24-column header and 211 rows');
const col = Object.fromEntries(header.map((name, indexValue) => [name, indexValue])); const auditKeys = new Set();
const baselineMaps = new Map(baselineReceipt.sheets.flatMap(sheet => sheet.maps).map(map => [map.key, map]));
for (const row of audit.slice(1)) {
  if (row.length !== AUDIT_COLUMNS.length) { fail(`audit row width ${row.length} != ${AUDIT_COLUMNS.length}`); continue; }
  const key = row[col.key]; const item = inventoryMap.get(key); auditKeys.add(key);
  if (!item || row[col.run_id] !== baselineRun) { fail(`${key}: audit inventory/run mismatch`); continue; }
  const map = baselineMaps.get(key); const expected = { catalog: item.catalog, id: item.id, slot: item.slot, file: item.file,
    source_path: item.source, preview_path: item.preview, sheet_id: map?.sheetId, cell_index: String(map?.cellIndex),
    baseline_source_sha256: map?.sourceSha256, baseline_preview_sha256: map?.previewSha256 };
  for (const [name, value] of Object.entries(expected)) if (row[col[name]] !== value) fail(`${key}: audit ${name} mismatch`);
  if (!row[col.reason]?.trim()) fail(`${key}: audit reason missing`);
  for (const name of RUBRICS) if (!['pass', 'fail'].includes(row[col[name]])) fail(`${key}: invalid ${name} rubric value`);
  const sourceHash = sha256File(join(root, item.source)); const previewHash = sha256File(join(root, item.preview));
  if (row[col.current_source_sha256] !== sourceHash || row[col.current_preview_sha256] !== previewHash) fail(`${key}: audit current hash drift`);
  if (row[col.decision] === 'keep') {
    if (RUBRICS.some(name => row[col[name]] !== 'pass')) fail(`${key}: kept row has failed rubric`);
    if (sourceHash !== row[col.baseline_source_sha256] || previewHash !== row[col.baseline_preview_sha256]) fail(`${key}: kept asset changed`);
  } else if (row[col.decision] === 'replace') {
    if (!RUBRICS.some(name => row[col[name]] === 'fail') || !acceptedByKey.has(key)) fail(`${key}: replacement lacks failed rubric or accepted attempt`);
  } else fail(`${key}: invalid audit decision`);
}
if (auditKeys.size !== 211 || [...inventoryMap.keys()].some(key => !auditKeys.has(key))) fail('audit key set differs from canonical inventory');

for (const item of inventory) {
  const replacement = acceptedByKey.get(item.key); const source = sha256File(join(root, item.source)); const preview = sha256File(join(root, item.preview));
  if (!replacement && (baselineAssetMap.get(item.source) !== source || baselineAssetMap.get(item.preview) !== preview)) fail(`${item.key}: unapproved raster drift`);
}
const baselinePairs = JSON.parse(readFileSync(join(devlog, '094_image_baseline_pairs.json'), 'utf8')).manifest;
const currentManifest = JSON.parse(readFileSync(join(root, 'assets/data/image-pairs-manifest.json'), 'utf8'));
const baselinePairMap = new Map(baselinePairs.pairs.map(pair => [pair.source, pair]));
for (const pair of currentManifest.pairs) {
  const item = inventory.find(entry => entry.source === pair.source); const baselinePair = baselinePairMap.get(pair.source);
  if (!item || !baselinePair) fail(`${pair.source}: pair is outside baseline inventory`);
  else if (!acceptedByKey.has(item.key) && stableJson(pair) !== stableJson(baselinePair)) fail(`${item.key}: non-target manifest row drift`);
  else if (acceptedByKey.has(item.key) && (pair.sourceSha256 !== sha256File(join(root, item.source)) || pair.previewSha256 !== sha256File(join(root, item.preview)))) fail(`${item.key}: target manifest hashes drift`);
}
if (currentManifest.pairs.length !== 211) fail('current pair manifest must contain 211 rows');

const baselineRuntime = JSON.parse(readFileSync(join(devlog, '096_image_baseline_runtime.json'), 'utf8'));
const currentIsms = JSON.parse(readFileSync(join(root, 'assets/data/isms.json'), 'utf8')); const currentEffects = JSON.parse(readFileSync(join(root, 'assets/data/effects.json'), 'utf8'));
for (const [key] of acceptedByKey) {
  const item = inventoryMap.get(key);
  if (item.catalog === 'ism') {
    const baselineIsm = baselineRuntime.isms.find(value => value.id === item.id); const currentIsm = currentIsms.find(value => value.id === item.id);
    const indexValue = baselineIsm.prompts.findIndex(value => value.file === item.file); baselineIsm.prompts[indexValue] = currentIsm.prompts.find(value => value.file === item.file);
  } else {
    const baselineEffect = baselineRuntime.effects.find(value => value.id === item.id); const currentEffect = currentEffects.find(value => value.id === item.id);
    baselineEffect.guide.prompt = currentEffect.guide.prompt;
  }
}
if (stableJson(baselineRuntime) !== stableJson({ runId: baselineRun, isms: currentIsms, effects: currentEffects })) fail('runtime data changed outside approved prompt records');
const acceptedEffects = [...acceptedByKey.entries()].filter(([key]) => key.startsWith('effect:'));
for (const [baselineName, currentName, kind] of [['031.before.csv', '031_effect_guide_audit.csv', 'csv'], ['032.before.jsonl', '032_effect_guide_manifest.jsonl', 'jsonl']]) {
  const before = readFileSync(join(devlog, '097_effect_ledger_baseline', baselineName), 'utf8'); const current = readFileSync(join(devlog, currentName), 'utf8');
  if (!current.startsWith(before)) { fail(`${currentName}: baseline prefix drift`); continue; }
  const appended = current.slice(before.length).split('\n').filter(Boolean);
  if (appended.length !== acceptedEffects.length) { fail(`${currentName}: append count does not match accepted effects`); continue; }
  const appendedIds = new Set();
  for (const line of appended) {
    if (kind === 'csv') {
      const values = parseCsv(line)[0]; const accepted = acceptedEffects.find(([key]) => inventoryMap.get(key)?.id === values?.[0])?.[1]; appendedIds.add(values?.[0]);
      if (values?.length !== 6 || !accepted || values[1] !== 'image-quality-fail' || values[2] !== 'accepted' || values[3] !== 'codex-main+contact-sheet' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(values[4]) || !values[5].startsWith(`wp090 ${accepted.attemptId}: `)) fail(`${currentName}: invalid appended audit row`);
    }
    else {
      const value = JSON.parse(line); appendedIds.add(value.id); const accepted = acceptedEffects.find(([, state]) => state.attemptId === value.attemptId)?.[1];
      if (!accepted || value.runId !== baselineRun || value.baselineSha256 !== baselineSha || value.sourcePromptSha256 !== accepted.prepared.promptSha256 ||
          value.id !== inventoryMap.get(accepted.prepared.key)?.id || value.original?.sha256 !== accepted.applied.sourceSha256 ||
          value.preview?.sha256 !== accepted.applied.previewSha256 || value.machineStatus !== 'pass') fail(`${currentName}: invalid appended provenance row`);
    }
  }
  for (const [key] of acceptedEffects) if (!appendedIds.has(inventoryMap.get(key).id)) fail(`${currentName}: accepted effect append missing ${key}`);
}

if (!preFinal) {
  if (finalReceipt.header.runId !== baselineRun || finalReceipt.header.baselineSha256 !== baselineSha || finalReceipt.header.cellCount !== 211 || finalReceipt.sheets.length !== 4) fail('final sheet receipt header invalid');
  const expectedAttempts = [...acceptedByKey.values()].map(value => value.attemptId).sort();
  if (stableJson(finalReceipt.header.acceptedAttempts) !== stableJson(expectedAttempts)) fail('final receipt accepted-attempt set mismatch');
  const finalAggregate = sha256Bytes(stableJson(finalReceipt.sheets.map(sheet => ({ id: sheet.id, imagePixelSha256: sheet.imagePixelSha256, mapSha256: sheet.mapSha256 }))));
  if (finalReceipt.header.aggregateSha256 !== finalAggregate) fail('final receipt aggregate drift');
  const temp = await mkdtemp(join(tmpdir(), 'verify-design-isms-sheets-'));
  try {
    for (const spec of sheetSpecs(inventory)) {
      const rebuilt = await buildSheet(root, spec, temp); const recorded = finalReceipt.sheets.find(sheet => sheet.id === spec.id);
      if (!recorded || rebuilt.imagePixelSha256 !== recorded.imagePixelSha256 || rebuilt.mapSha256 !== recorded.mapSha256 || stableJson(rebuilt.maps) !== stableJson(recorded.maps)) fail(`${spec.id}: final sheet pixel/map receipt drift`);
      if (!recorded || recorded.file !== `${spec.id}.webp`) fail(`${spec.id}: final sheet identity drift`);
      else if (sha256File(assertContainedRegular(root, join(devlog, '095_image_sheets/final', recorded.file), join(devlog, '095_image_sheets/final'))) !== recorded.fileSha256) fail(`${spec.id}: committed final sheet bytes drift`);
    }
  } finally { await rm(temp, { recursive: true, force: true }); }
}

if (errors.length) { console.error('image quality verification failed:'); for (const error of errors) console.error(`  - ${error}`); process.exit(1); }
console.log(preFinal ? `image quality pre-final ok: 211 audited, ${acceptedByKey.size} approved replacements` : `image quality ok: 211 audited, ${acceptedByKey.size} replaced, 4 final sheets, no unapproved drift`);
