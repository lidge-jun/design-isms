import { createHash } from 'node:crypto';
import { closeSync, existsSync, fsyncSync, lstatSync, openSync, readFileSync, renameSync, statSync, writeSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
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
export const FINAL_ALLOWLIST = [
  /^devlog\/260715_production_upgrade\/(111_final_verification\.md|11[2-5]_final_.*\.json)$/,
  /^devlog\/260715_production_upgrade\/qa\/final-.*\.png$/,
  /^\.codexclaw\/goalplans\/design-isms-gpt-pro-zip-main-diff-020-070-phase\/(goalplan\.json|ledger\.jsonl)$/
];
export function finalAllowed(path) { return FINAL_ALLOWLIST.some(pattern => pattern.test(path)); }
function listed(root, args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed`);
  return result.stdout.toString().split('\0').filter(Boolean);
}
export function governedFiles(root) {
  const files = listed(root, ['ls-files', '--cached', '--others', '--exclude-standard', '-z']);
  return files.filter(path => !path.startsWith('.codexclaw/') && path !== 'Archive.zip' && !finalAllowed(path)).sort();
}
export function dirtyFiles(root) {
  const names = new Set(listed(root, ['ls-files', '--modified', '--deleted', '--others', '--exclude-standard', '-z']));
  for (const path of listed(root, ['diff', '--cached', '--name-only', '-z'])) names.add(path);
  return [...names].filter(path => !path.startsWith('.tmp/') && !path.startsWith('.pages/') && !finalAllowed(path)).sort();
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
