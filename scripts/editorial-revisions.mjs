import { sha256Bytes, stableJson } from './image-quality-lib.mjs';

// 012_content.md is the ceiling; the reviewed policy must narrow it to actual changes.
const EDITORIAL_FIELDS = ['name', 'nameKr', 'tagline', 'description', 'descriptionEn',
  'history', 'sources', 'examples', 'reviewedOn'];
const EDITORIAL_ID = 'refractive-glass-ui';
const SHA256 = /^[a-f0-9]{64}$/;
const REVISION_KEYS = ['schemaVersion', 'revisionId', 'parentRevisionSha256', 'baselineRunId',
  'baselineAggregateSha256', 'baselineRuntimeSha256', 'reason', 'evidenceRefs',
  'reviewedBy', 'reviewedAt', 'changes', 'revisionSha256'];

function requireThat(condition, message) {
  if (!condition) throw new Error(`editorial revisions: ${message}`);
}

function exactKeys(value, keys, label) {
  requireThat(value !== null && typeof value === 'object' && !Array.isArray(value), `${label}: expected object`);
  requireThat(stableJson(Object.keys(value).sort()) === stableJson([...keys].sort()), `${label}: unknown or missing keys`);
}

function nonempty(value) { return typeof value === 'string' && value.trim().length > 0; }
function validSha(value) { return typeof value === 'string' && SHA256.test(value); }
function equal(left, right) { return stableJson(left) === stableJson(right); }

// Field hashes cover the entire {present,value?} envelope; absence is never null.
// Runtime hashes cover the parsed 096 object, not the file's formatting bytes.
export function editorialDigest(value) { return sha256Bytes(stableJson(value)); }

export function editorialRevisionDigest(revision) {
  const { revisionSha256, ...payload } = revision;
  return editorialDigest(payload);
}

function validatePolicy(policy) {
  exactKeys(policy, ['schemaVersion', 'allowedFields', 'revisionIds', 'finalRevisionSha256'], 'policy');
  requireThat(policy.schemaVersion === 1, 'unsupported policy schemaVersion');
  const fields = policy.allowedFields;
  requireThat(fields !== null && typeof fields === 'object' && !Array.isArray(fields), 'policy allowedFields must be an object');
  for (const [id, names] of Object.entries(fields)) {
    requireThat(id === EDITORIAL_ID, `policy ID not allowed: ${id}`);
    requireThat(Array.isArray(names) && names.length > 0 && new Set(names).size === names.length &&
      names.every(name => EDITORIAL_FIELDS.includes(name)), `policy fields invalid: ${id}`);
  }
  requireThat(Array.isArray(policy.revisionIds) && policy.revisionIds.every(nonempty) &&
    new Set(policy.revisionIds).size === policy.revisionIds.length, 'policy revisionIds invalid or duplicated');
  if (policy.revisionIds.length === 0) {
    requireThat(Object.keys(fields).length === 0 && policy.finalRevisionSha256 === null, 'empty policy must have no fields or tip');
  } else {
    requireThat(Object.keys(fields).length > 0 && validSha(policy.finalRevisionSha256), 'nonempty policy requires fields and final tip');
  }
}

function parseRow(line, number) {
  let row;
  try {
    row = JSON.parse(line, (_key, value) => {
      if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('non-finite JSON number');
      return value;
    });
  }
  catch { throw new Error(`editorial revisions: malformed JSONL at line ${number}`); }
  // JSON.parse silently accepts repeated object keys. Check the already-valid JSON
  // tokens so an overwritten key (including an escaped spelling) cannot disappear.
  const tokens = line.match(/"(?:\\.|[^"\\])*"|[{}\[\]:]/g) ?? [];
  const stack = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === '{') stack.push(new Set());
    else if (token === '[') stack.push(null);
    else if (token === '}' || token === ']') stack.pop();
    else if (token.startsWith('"') && tokens[index + 1] === ':') {
      const key = JSON.parse(token); const keys = stack.at(-1);
      requireThat(!keys.has(key), `duplicate JSON key at line ${number}: ${key}`);
      keys.add(key);
    }
  }
  return row;
}

function parseLedger(ledgerText, policy) {
  if (ledgerText === undefined) {
    requireThat(policy.revisionIds.length === 0, 'required ledger is missing');
    return [];
  }
  requireThat(typeof ledgerText === 'string', 'ledger must be JSONL text; only undefined means absent');
  if (ledgerText === '') return [];
  const lines = ledgerText.split(/\r?\n/);
  if (lines.at(-1) === '') lines.pop();
  return lines.map((line, index) => parseRow(line, index + 1));
}

function validateRevision(row, index, policy, binding, parent) {
  exactKeys(row, REVISION_KEYS, `revision ${index + 1}`);
  requireThat(row.schemaVersion === 1, 'unsupported revision schemaVersion');
  requireThat(row.revisionId === policy.revisionIds[index], 'revision ID/order mismatch');
  requireThat(row.parentRevisionSha256 === parent, 'parent revision hash mismatch');
  for (const key of ['baselineRunId', 'baselineAggregateSha256', 'baselineRuntimeSha256']) {
    requireThat(row[key] === binding[key], `${key} mismatch`);
  }
  requireThat(nonempty(row.reason) && nonempty(row.reviewedBy), 'reason/reviewedBy required');
  requireThat(Array.isArray(row.evidenceRefs) && row.evidenceRefs.length > 0 && row.evidenceRefs.every(nonempty) &&
    new Set(row.evidenceRefs).size === row.evidenceRefs.length, 'evidenceRefs invalid');
  requireThat(typeof row.reviewedAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(row.reviewedAt) &&
    Number.isFinite(Date.parse(row.reviewedAt)) && new Date(row.reviewedAt).toISOString() ===
      (row.reviewedAt.includes('.') ? row.reviewedAt : row.reviewedAt.replace('Z', '.000Z')),
  'reviewedAt must be a valid UTC ISO timestamp');
  requireThat(Array.isArray(row.changes) && row.changes.length > 0, 'revision changes must not be empty');
  requireThat(validSha(row.revisionSha256) && row.revisionSha256 === editorialRevisionDigest(row), 'revision hash mismatch');
}

function validateSnapshot(snapshot, label, after = false) {
  requireThat(snapshot !== null && typeof snapshot === 'object' && typeof snapshot.present === 'boolean', `${label}: invalid presence`);
  exactKeys(snapshot, snapshot.present ? ['present', 'value'] : ['present'], label);
  requireThat(!after || snapshot.present, 'field deletion is forbidden');
  requireThat(!snapshot.present || snapshot.value !== undefined, `${label}: present value is missing`);
}

function validateAfter(field, value) {
  if (field === 'sources' || field === 'examples') {
    requireThat(Array.isArray(value) && (field === 'sources' ? value.length >= 2 : value.length === 10), `${field}: invalid array length`);
    const label = field === 'sources' ? 'label' : 'name';
    for (const entry of value) {
      exactKeys(entry, [label, 'url'], field);
      requireThat(nonempty(entry[label]) && typeof entry.url === 'string' && /^https:\/\/[^\s]+$/.test(entry.url), `${field}: invalid link`);
    }
  } else {
    requireThat(nonempty(value), `${field}: after value must be nonempty text`);
    if (field === 'reviewedOn') requireThat(/^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value, 'reviewedOn: invalid date');
  }
}

function replayChange(change, runtime, policy, seen) {
  exactKeys(change, ['catalog', 'id', 'field', 'before', 'beforeSha256', 'after', 'afterSha256'], 'change');
  requireThat(change.catalog === 'isms' && change.id === EDITORIAL_ID, 'change catalog/ID not allowed');
  requireThat(policy.allowedFields[change.id]?.includes(change.field), `field not allowed: ${change.field}`);
  const key = `${change.id}:${change.field}`;
  requireThat(!seen.has(key), `duplicate change: ${key}`); seen.add(key);
  validateSnapshot(change.before, 'before'); validateSnapshot(change.after, 'after', true);
  for (const name of ['before', 'after']) {
    requireThat(validSha(change[`${name}Sha256`]) && change[`${name}Sha256`] === editorialDigest(change[name]), `${name} hash mismatch`);
  }
  const item = runtime.isms.find(value => value.id === change.id);
  requireThat(item !== undefined, `baseline ID missing: ${change.id}`);
  const actual = Object.hasOwn(item, change.field) ? { present: true, value: item[change.field] } : { present: false };
  requireThat(equal(actual, change.before), `before value mismatch: ${key}`);
  requireThat(!equal(change.before, change.after), `no-op change: ${key}`);
  validateAfter(change.field, change.after.value);
  item[change.field] = structuredClone(change.after.value);
}

/** Replay pinned editorial receipts onto an independent baseline copy. No live data input. */
export function replayEditorialRevisions({ baselineRuntime, baselineRunId, baselineAggregateSha256, policy, ledgerText }) {
  validatePolicy(policy);
  requireThat(nonempty(baselineRunId) && validSha(baselineAggregateSha256), 'invalid baseline binding');
  requireThat(baselineRuntime?.runId === baselineRunId && Array.isArray(baselineRuntime.isms) &&
    Array.isArray(baselineRuntime.effects), 'invalid baseline runtime');
  for (const catalog of ['isms', 'effects']) {
    const ids = baselineRuntime[catalog].map(item => item?.id);
    requireThat(ids.every(nonempty) && new Set(ids).size === ids.length, `baseline ${catalog} IDs invalid or duplicated`);
  }
  const binding = { baselineRunId, baselineAggregateSha256, baselineRuntimeSha256: editorialDigest(baselineRuntime) };
  const rows = parseLedger(ledgerText, policy);
  requireThat(rows.length === policy.revisionIds.length, 'ledger revision count mismatch');
  const runtime = structuredClone(baselineRuntime); const used = new Set(); let parent = null;
  for (const [index, row] of rows.entries()) {
    validateRevision(row, index, policy, binding, parent);
    const seen = new Set();
    for (const change of row.changes) replayChange(change, runtime, policy, seen);
    for (const key of seen) used.add(key);
    parent = row.revisionSha256;
  }
  requireThat(parent === policy.finalRevisionSha256, 'final revision hash mismatch');
  const allowed = Object.entries(policy.allowedFields).flatMap(([id, fields]) => fields.map(field => `${id}:${field}`));
  requireThat(equal([...used].sort(), allowed.sort()), 'policy contains unused field grants');
  return runtime;
}
