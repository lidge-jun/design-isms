#!/usr/bin/env node
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { evidenceRootAbs, evidenceRootRel, preservationState, shaBytes, shaFile, stableJson, treeFingerprint } from './final-qa-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const evidenceRoot = evidenceRootAbs(root); const evidenceRel = evidenceRootRel(root);
const read = name => { const path = join(evidenceRoot, name); if (!existsSync(path)) throw new Error(`missing ${name}`); return JSON.parse(readFileSync(path, 'utf8')); };
const browser = read('112_final_browser_receipt.json'); const server = read('113_final_server_receipt.json');
const preservationStart = read('114_final_preservation_start.json'); const preservation = read('114_final_preservation_final.json'); const staticReceipt = read('115_final_static_receipt.json');
const errors = []; const fail = message => errors.push(message);
const pages = new Map([['index', 49], ['effects', 94], ['faq', 18], ['color', 25], ['typography', 20], ['layout', 25], ['motion', 20]]); const widths = [1440, 1180, 1024, 860, 640, 390];
if (browser.schemaVersion !== 1 || browser.rows?.length !== 42) fail('browser receipt must contain 42 rows');
const rowKeys = new Set();
const diagnosticKeys = ['badResponses', 'consoleErrors', 'exceptions', 'failedRequests', 'logErrors'];
for (const row of browser.rows ?? []) {
  rowKeys.add(`${row.page}:${row.width}`); const diagnostics = row.diagnostics ?? {};
  if (!pages.has(row.page) || !widths.includes(row.width) || row.count !== pages.get(row.page) || row.nav !== 6 || row.current !== 1 || row.overflow !== 0 || row.badImages !== 0 || row.ok !== true) fail(`invalid browser row ${row.page}/${row.width}`);
  if (stableJson(Object.keys(diagnostics).sort()) !== stableJson(diagnosticKeys)) fail(`browser diagnostic schema invalid ${row.page}/${row.width}`);
  if (Object.values(diagnostics).some(value => !Array.isArray(value) || value.length)) fail(`browser diagnostics nonzero ${row.page}/${row.width}`);
}
for (const [page] of pages) for (const width of widths) if (!rowKeys.has(`${page}:${width}`)) fail(`missing browser row ${page}/${width}`);
const expectedFlows = ['index', 'effects', 'faq', 'crosslink', 'index-error-retry', 'effects-error-retry', 'faq-error-retry', 'color-error-retry', 'typography-error-retry', 'layout-error-retry', 'motion-error-retry'];
if (stableJson(browser.flows?.map(value => value.id)) !== stableJson(expectedFlows)) fail('browser flow set invalid');
const errorKeys = ['alert', 'cleanDiagnostics', 'errorRemoved', 'id', 'loadingRemoved', 'recovered', 'restored', 'width'];
const expectedFlowKeys = new Map([
  ['index', ['copyFeedback', 'empty', 'escapeOrder', 'finderThree', 'focusReturn', 'id', 'lightbox', 'lightboxDimensions', 'lightboxPng', 'modal', 'previewDimensions', 'previewWebp', 'promptPresent', 'relatedFive', 'searchReset']],
  ['effects', ['copyFeedback', 'devicesExact', 'docsEight', 'empty', 'familiesExact', 'filterReset', 'focusReturn', 'id', 'lightbox', 'lightboxDimensions', 'lightboxPng', 'modal', 'previewDimensions', 'previewWebp', 'reduced', 'reducedCards', 'reducedDurations', 'reducedOverflow', 'refsTwo', 'searchReset', 'stateToggle']],
  ['faq', ['arrowDown', 'arrowUp', 'collapsed', 'end', 'expanded', 'home', 'id', 'localePreserved', 'sources', 'translated']],
  ['crosslink', ['chips', 'forwardLink', 'id', 'reverseLink', 'roundTrip']],
  ['index-error-retry', errorKeys], ['effects-error-retry', errorKeys], ['faq-error-retry', errorKeys],
  ['color-error-retry', errorKeys], ['typography-error-retry', errorKeys], ['layout-error-retry', errorKeys], ['motion-error-retry', errorKeys]
]);
for (const flow of browser.flows ?? []) {
  if (stableJson(Object.keys(flow).sort()) !== stableJson(expectedFlowKeys.get(flow.id)?.slice().sort())) fail(`browser flow schema invalid ${flow.id}`);
  for (const [key, value] of Object.entries(flow)) {
    if (key !== 'id' && key !== 'width' && value !== true) fail(`browser flow assertion failed ${flow.id}/${key}`);
  }
  if (flow.id.endsWith('-error-retry') && flow.width !== 390) fail(`browser error flow width invalid ${flow.id}`);
}
if (browser.screenshots?.length !== 21) fail('browser receipt must contain 21 screenshots');
const expectedShots = new Map([...pages.keys()].flatMap(page => [
  [`${evidenceRel}/final-${page}-1440.png`, { page, width: 1440, state: 'ready' }],
  [`${evidenceRel}/final-${page}-390.png`, { page, width: 390, state: 'ready' }],
  [`${evidenceRel}/final-${page}-error-390.png`, { page, width: 390, state: 'error' }]
]));
const seenShots = new Set(); const qaRoot = realpathSync(evidenceRoot);
for (const shot of browser.screenshots ?? []) {
  const expected = expectedShots.get(shot.path);
  if (!expected || seenShots.has(shot.path) || shot.page !== expected.page || shot.viewportWidth !== expected.width || shot.state !== expected.state) { fail(`screenshot topology invalid ${shot.path}`); continue; } seenShots.add(shot.path);
  const path = resolve(root, shot.path); if (dirname(path) !== qaRoot || !existsSync(path) || !lstatSync(path).isFile() || lstatSync(path).isSymbolicLink() || realpathSync(path) !== path || shaFile(path) !== shot.sha256) { fail(`screenshot drift or unsafe path ${shot.path}`); continue; }
  const meta = await sharp(path, { failOn: 'error' }).metadata(); if (meta.format !== 'png' || meta.width !== shot.width || meta.height !== shot.height || meta.width !== shot.viewportWidth) fail(`screenshot dimensions invalid ${shot.path}`);
}
if (seenShots.size !== 21) fail('screenshot topology incomplete');
if (browser.teardown?.browserSessions !== 53 || browser.teardown?.serverExitCode !== 0 || browser.teardown?.serverSignal !== null || browser.teardown?.serverForced || !browser.teardown?.serverPortClosed || !browser.teardown?.cdpPortClosed || !browser.teardown?.profileRemoved || browser.teardown?.browserStopExitCode !== 0) fail('browser owned-process teardown invalid');
if (server.schemaVersion !== 1 || server.host !== '127.0.0.1' || server.root !== realpathSync(join(root, '.pages')) || server.probes?.length !== 7 || server.exitCode !== 0 || server.exitSignal !== null || server.forced || !server.portClosed) fail('server receipt header/teardown invalid');
const expectedProbes = new Map([
  ['get-index', { method: 'GET', path: '/index.html', status: 200 }],
  ['head-index', { method: 'HEAD', path: '/index.html', status: 200, bodyBytes: 0 }],
  ['post-index', { method: 'POST', path: '/index.html', status: 405, allow: 'GET, HEAD' }],
  ['missing', { method: 'GET', path: '/missing.txt', status: 404 }],
  ['encoded-traversal', { method: 'GET', path: '/%252e%252e%252fpackage.json', status: 404 }],
  ['encoded-slash', { method: 'GET', path: '/..%2fpackage.json', status: 404 }],
  ['malformed-encoding', { method: 'GET', path: '/%ZZ', status: 400 }]
]);
if (stableJson(server.probes?.map(probe => probe.id)) !== stableJson([...expectedProbes.keys()])) fail('server probe set invalid');
for (const probe of server.probes ?? []) {
  const expected = expectedProbes.get(probe.id);
  for (const [key, value] of Object.entries(expected ?? {})) if (probe[key] !== value) fail(`server probe invalid ${probe.id}/${key}`);
}
const head = server.probes?.find(probe => probe.id === 'head-index'); const post = server.probes?.find(probe => probe.id === 'post-index');
if (head?.bodyBytes !== 0 || post?.allow !== 'GET, HEAD') fail('server HEAD/Allow contract invalid');
if (preservationStart.schemaVersion !== 1 || preservationStart.phase !== 'start' || preservation.schemaVersion !== 1 || preservation.phase !== 'final' || preservation.startCapturedAt !== preservationStart.capturedAt || preservation.ok !== true || Object.entries(preservation.checks ?? {}).some(([key, value]) => key === 'github' ? value === false : value !== true)) fail('preservation receipt invalid');
const currentPreservation = preservationState(root);
// head/reflogHead: committing the QA receipts themselves moves HEAD, so an exact
// match is impossible for committed receipts. Accept the receipt head when it is
// an ancestor of the current HEAD and the diff since then only touches the
// archived evidence root (receipts/screenshots) or governed docs synced in the
// same closing sequence. reflogHead is clone-local and excluded from the
// committed-receipt comparison (the same-run start/final comparison above keeps it).
for (const key of ['upstream', 'archiveSha256', 'remoteRefs', 'dirtyFiles', 'dirtySha256']) {
  if (stableJson(currentPreservation[key]) !== stableJson(preservation[key])) fail(`current preservation drift ${key}`);
}
if (currentPreservation.head !== preservation.head) {
  const { spawnSync } = await import('node:child_process');
  const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', preservation.head, currentPreservation.head], { cwd: root });
  if (ancestor.status !== 0) fail('current preservation drift head (receipt head is not an ancestor of HEAD)');
  else {
    const diff = spawnSync('git', ['diff', '--name-only', `${preservation.head}..${currentPreservation.head}`], { cwd: root, encoding: 'utf8' });
    const changed = diff.stdout.split('\n').filter(Boolean);
    const allowedPrefixes = [`${evidenceRel}/`, 'devlog/_fin/260717_design-encyclopedia-upgrade/'];
    const outside = changed.filter(path => !allowedPrefixes.some(prefix => path.startsWith(prefix)));
    if (outside.length) fail(`current preservation drift head (non-evidence changes since receipt: ${outside.slice(0, 5).join(', ')})`);
  }
}
const expectedCommands = [
  { id: 'npm-ci', command: ['npm', 'ci'] }, { id: 'verify', command: ['npm', 'run', 'verify'] },
  { id: 'images-audit', command: ['npm', 'run', 'images:audit'] }, { id: 'pages-stage', command: ['npm', 'run', 'pages:stage'] },
  { id: 'diff-check', command: ['git', 'diff', '--check'] }
];
if (staticReceipt.schemaVersion !== 1 || stableJson(staticReceipt.commands?.map(({ id, command }) => ({ id, command }))) !== stableJson(expectedCommands) || staticReceipt.commands?.some(value => value.exitCode !== 0 || value.signal !== null)) fail('static command receipt invalid');
const expectedPairCount = JSON.parse(readFileSync(join(root, 'assets/data/image-pairs-manifest.json'), 'utf8')).pairs.length;
if (stableJson(staticReceipt.stage?.counts) !== stableJson({ html: 7, png: expectedPairCount, webp: expectedPairCount, forbidden: 0 })) fail('static stage counts invalid');
const currentManifestSha = shaFile(join(root, '.pages/manifest.json'));
if (staticReceipt.stage?.manifestSha256 !== currentManifestSha || browser.stagedManifestSha256 !== currentManifestSha) fail('staged manifest binding invalid');
const tree = treeFingerprint(root); if (tree.sha256 !== staticReceipt.governedTreeSha256 || tree.files.length !== staticReceipt.governedFileCount) fail('static receipt is stale for governed tree');
if (browser.governedTreeSha256 !== tree.sha256) fail('browser receipt is stale for governed tree');
if (server.governedTreeSha256 !== tree.sha256) fail('server receipt is stale for governed tree');
const times = [preservationStart.capturedAt, staticReceipt.createdAt, browser.createdAt, server.createdAt, preservation.capturedAt].map(value => Date.parse(value));
if (times.some(value => !Number.isFinite(value)) || times.some((value, index) => index > 0 && value < times[index - 1])) fail('QA receipt chronology invalid');
if (errors.length) { console.error('final QA verification failed:'); for (const error of errors) console.error(`  - ${error}`); process.exit(1); }
const inputs = ['112_final_browser_receipt.json', '113_final_server_receipt.json', '114_final_preservation_final.json', '115_final_static_receipt.json'].map(name => ({ name, sha256: shaFile(join(evidenceRoot, name)) }));
console.log(`final qa ok: rows=42 screenshots=21 server=7 preservation=true tree=${tree.sha256} receiptSha=${shaBytes(stableJson(inputs))}`);
