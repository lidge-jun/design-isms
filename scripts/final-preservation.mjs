#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { preservationState, stableJson, writeJsonAtomic } from './final-qa-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'); const action = process.argv[2];
if (!['start', 'final', 'check'].includes(action)) throw new Error('usage: final-preservation.mjs start|final|check');
const devlog = join(root, 'devlog/260715_production_upgrade'); const startPath = join(devlog, '114_final_preservation_start.json');
const finalPath = join(devlog, '114_final_preservation_final.json');
function optional(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  return result.status === 0 ? result.stdout.trim() : null;
}
function githubReceipt() {
  const repoText = optional('gh', ['repo', 'view', '--json', 'nameWithOwner']); if (!repoText) return { available: false };
  const repo = JSON.parse(repoText).nameWithOwner;
  const runsText = optional('gh', ['run', 'list', '--limit', '50', '--json', 'databaseId,workflowName,status,conclusion,createdAt,headSha,event,url']);
  const deploymentsText = optional('gh', ['api', `repos/${repo}/deployments?per_page=50`]);
  if (!runsText || !deploymentsText) return { available: false, repo };
  const deployments = JSON.parse(deploymentsText).map(value => ({ id: value.id, created_at: value.created_at, sha: value.sha, ref: value.ref, environment: value.environment }));
  return { available: true, repo, runs: JSON.parse(runsText), deployments };
}
function capture() {
  return { capturedAt: new Date().toISOString(), ...preservationState(root), github: githubReceipt() };
}
const snapshot = capture();
if (action === 'start') {
  snapshot.schemaVersion = 1; snapshot.phase = 'start'; writeJsonAtomic(startPath, snapshot);
  console.log(`preservation start captured: dirty=${snapshot.dirtyFiles.length} head=${snapshot.head}`);
} else {
  if (!existsSync(startPath)) throw new Error('preservation start receipt missing');
  const start = JSON.parse(readFileSync(startPath, 'utf8'));
  const checks = {
    head: snapshot.head === start.head, upstream: snapshot.upstream === start.upstream,
    reflogHead: snapshot.reflogHead === start.reflogHead, archive: snapshot.archiveSha256 === start.archiveSha256,
    archiveKnown: snapshot.archiveSha256 === '1973aa16c30b4f2fa292f14bae4c325ea4d92daefec5ac675f950d4235f124a2',
    remoteRefs: stableJson(snapshot.remoteRefs) === stableJson(start.remoteRefs), dirtyFiles: stableJson(snapshot.dirtyFiles) === stableJson(start.dirtyFiles)
  };
  checks.github = !start.github?.available || !snapshot.github?.available ? null : stableJson(snapshot.github) === stableJson(start.github);
  const ok = Object.entries(checks).every(([key, value]) => key === 'github' ? value !== false : value === true);
  if (action === 'check') {
    const final = JSON.parse(readFileSync(finalPath, 'utf8'));
    const currentState = { head: snapshot.head, upstream: snapshot.upstream, reflogHead: snapshot.reflogHead, archiveSha256: snapshot.archiveSha256, remoteRefs: snapshot.remoteRefs, dirtyFiles: snapshot.dirtyFiles, dirtySha256: snapshot.dirtySha256, github: snapshot.github };
    const finalState = { head: final.head, upstream: final.upstream, reflogHead: final.reflogHead, archiveSha256: final.archiveSha256, remoteRefs: final.remoteRefs, dirtyFiles: final.dirtyFiles, dirtySha256: final.dirtySha256, github: final.github };
    if (!ok || final.ok !== true || stableJson(currentState) !== stableJson(finalState)) throw new Error('current preservation state differs from final receipt');
    console.log(`preservation check ok: dirty=${snapshot.dirtyFiles.length} github=${checks.github}`); process.exit(0);
  }
  const receipt = { schemaVersion: 1, phase: 'final', startCapturedAt: start.capturedAt, ...snapshot, checks, ok,
    remoteClaim: checks.github === null ? 'this agent did not invoke remote actions; global remote state unavailable' : 'GitHub Actions and deployment identifiers unchanged during QA window' };
  writeJsonAtomic(finalPath, receipt); if (!ok) throw new Error(`preservation mismatch: ${JSON.stringify(checks)}`);
  console.log(`preservation final ok: dirty=${snapshot.dirtyFiles.length} github=${checks.github}`);
}
