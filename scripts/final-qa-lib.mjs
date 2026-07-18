import { createHash } from 'node:crypto';
import { closeSync, existsSync, fsyncSync, lstatSync, openSync, readFileSync, renameSync, statSync, writeSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

export function shaBytes(value) { return createHash('sha256').update(value).digest('hex'); }
export function shaFile(path) { return shaBytes(readFileSync(path)); }
export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function writeJsonAtomic(path, value) {
  const text = JSON.stringify(value, null, 2) + '\n'; const temp = `${path}.next-${process.pid}`;
  const fd = openSync(temp, 'wx'); try { writeSync(fd, text); fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(temp, path); const dir = openSync(dirname(path), 'r'); try { fsyncSync(dir); } finally { closeSync(dir); }
}
export function run(root, command, args, options = {}) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  return { command: [command, ...args], startedAt, finishedAt: new Date().toISOString(), exitCode: result.status,
    signal: result.signal, outputSha256: shaBytes(output), outputTail: output.slice(-4000) };
}
export function git(root, args, allowFailure = false) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0 && !allowFailure) throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  return result.status === 0 ? result.stdout.trim() : null;
}
// Evidence root contract (010, design-encyclopedia-upgrade): QA receipts and
// screenshots live under a runtime-selected repo-relative root. The default is
// the active unit's qa/ directory; DESIGN_ISMS_EVIDENCE_ROOT overrides it
// (e.g. after the unit is archived to devlog/_fin) without any source change,
// preserving the governed-tree SHA contract.
export const EVIDENCE_ROOT_DEFAULT = 'devlog/_plan/260717_design-encyclopedia-upgrade/qa';
export function evidenceRootRel(root) {
  const raw = process.env.DESIGN_ISMS_EVIDENCE_ROOT ?? EVIDENCE_ROOT_DEFAULT;
  if (isAbsolute(raw)) throw new Error('DESIGN_ISMS_EVIDENCE_ROOT must be repo-relative');
  const boundary = resolve(root);
  const absolute = resolve(boundary, raw);
  if (absolute === boundary || !absolute.startsWith(boundary + sep)) throw new Error(`evidence root escapes repository: ${raw}`);
  const rel = relative(boundary, absolute).split(sep).join('/');
  if (rel.split('/').some(part => part === '..' || part === '')) throw new Error(`unsafe evidence root: ${raw}`);
  let cursor = boundary;
  for (const part of rel.split('/')) {
    cursor = join(cursor, part);
    if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) throw new Error(`symlinked evidence root component: ${cursor}`);
  }
  return rel;
}
export function evidenceRootAbs(root) { return join(root, evidenceRootRel(root)); }
export function finalAllowed(root, path) {
  const rel = evidenceRootRel(root);
  if (path === rel || path.startsWith(`${rel}/`)) return true;
  return /^\.codexclaw\/goalplans\/[^/]+\/(goalplan\.json|ledger\.jsonl)$/.test(path);
}
function listed(root, args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed`);
  return result.stdout.toString().split('\0').filter(Boolean);
}
export function governedFiles(root) {
  const files = listed(root, ['ls-files', '--cached', '--others', '--exclude-standard', '-z']);
  return files.filter(path => !path.startsWith('.codexclaw/') && path !== 'Archive.zip' && !finalAllowed(root, path)).sort();
}
export function dirtyFiles(root) {
  const names = new Set(listed(root, ['ls-files', '--modified', '--deleted', '--others', '--exclude-standard', '-z']));
  for (const path of listed(root, ['diff', '--cached', '--name-only', '-z'])) names.add(path);
  return [...names].filter(path => !path.startsWith('.tmp/') && !path.startsWith('.pages/') && !finalAllowed(root, path)).sort();
}
export function fileMap(root, paths) {
  return paths.map(path => {
    const absolute = join(root, path); if (!existsSync(absolute)) return { path, deleted: true };
    if (!lstatSync(absolute).isFile() || lstatSync(absolute).isSymbolicLink()) throw new Error(`unsafe receipt file ${path}`);
    return { path, sha256: shaFile(absolute), bytes: statSync(absolute).size };
  });
}
export function treeFingerprint(root) {
  const files = fileMap(root, governedFiles(root)); return { files, sha256: shaBytes(stableJson(files)) };
}
export function preservationState(root) {
  const archive = join(root, 'Archive.zip');
  if (!existsSync(archive)) throw new Error('Archive.zip missing');
  const files = fileMap(root, dirtyFiles(root));
  return {
    head: git(root, ['rev-parse', 'HEAD']),
    upstream: git(root, ['rev-parse', '@{u}']),
    reflogHead: git(root, ['reflog', '-1', '--format=%H %gs']),
    archiveSha256: shaFile(archive),
    remoteRefs: git(root, ['for-each-ref', '--format=%(refname) %(objectname)', 'refs/remotes']).split('\n').filter(Boolean),
    dirtyFiles: files,
    dirtySha256: shaBytes(stableJson(files))
  };
}
export function relativePath(root, path) { return relative(resolve(root), resolve(path)).split('\\').join('/'); }
