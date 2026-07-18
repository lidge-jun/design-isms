#!/usr/bin/env node
/**
 * verify-catalog.mjs — generic catalog validator (015-encyclopedia).
 * Iterates the domain registry; a domain whose data file does not exist yet is
 * skipped (placeholder stage). Once data lands, structural schema fields,
 * duplicate ids, and cross-link existence are enforced.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const sha256File = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const sha256Text = (text) => createHash('sha256').update(Buffer.from(text)).digest('hex');

// WCAG contrast (unrounded) — normative gate for color contrast.checks.
function contrastRatio(fgHex, bgHex) {
  const channel = (value) => { const c = value / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const luminance = (hex) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255); };
  const l1 = luminance(fgHex); const l2 = luminance(bgHex);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
const CONTRAST_THRESHOLD = { 'normal-text': 4.5, 'large-text': 3.0, 'non-text': 3.0 };
const REQUIRED_COLOR_ROLES = ['background', 'surface', 'text', 'text-muted', 'primary', 'on-primary', 'border', 'success'];

function validateColorDomain(items) {
  if (items.length !== 25) errors.push(`color: expected 25 cards, found ${items.length}`);
  const familyCounts = new Map();
  for (const card of items) familyCounts.set(card.family, (familyCounts.get(card.family) ?? 0) + 1);
  for (const [family, expected] of [['Service', 7], ['ISM', 8], ['Technique', 5], ['System', 5]]) {
    if (familyCounts.get(family) !== expected) errors.push(`color: family ${family} count ${familyCounts.get(family) ?? 0} != ${expected}`);
  }
  for (const card of items) {
    const label = `color:${card.id}`;
    for (const [variantName, variant] of [['light', { palette: card.palette, contrast: card.contrast }], ['dark', card.darkVariant ?? {}]]) {
      const palette = variant.palette;
      if (!Array.isArray(palette) || palette.length < 8 || palette.length > 12) { errors.push(`${label}: ${variantName} palette must have 8-12 tokens`); continue; }
      const roles = palette.map((token) => token.role);
      if (new Set(roles).size !== roles.length) errors.push(`${label}: ${variantName} duplicate roles`);
      for (const required of REQUIRED_COLOR_ROLES) if (!roles.includes(required)) errors.push(`${label}: ${variantName} missing role ${required}`);
      for (const token of palette) if (!/^#[0-9A-F]{6}$/.test(token.hex)) errors.push(`${label}: ${variantName} invalid hex ${token.hex} (${token.role})`);
      const byRole = new Map(palette.map((token) => [token.role, token.hex]));
      const checks = variant.contrast?.checks;
      if (!Array.isArray(checks) || checks.length === 0) { errors.push(`${label}: ${variantName} contrast.checks missing`); continue; }
      for (const check of checks) {
        const fg = byRole.get(check.foregroundRole); const bg = byRole.get(check.backgroundRole);
        if (!fg || !bg) { errors.push(`${label}: ${variantName} dangling contrast role ${check.foregroundRole}/${check.backgroundRole}`); continue; }
        const ratio = contrastRatio(fg, bg);
        const threshold = CONTRAST_THRESHOLD[check.usage];
        if (!threshold) { errors.push(`${label}: ${variantName} invalid usage ${check.usage}`); continue; }
        if (ratio < threshold) errors.push(`${label}: ${variantName} ${check.foregroundRole}/${check.backgroundRole} ${check.usage} ratio ${ratio.toFixed(2)} < ${threshold}`);
      }
    }
    const lightRoles = new Set((card.palette ?? []).map((token) => token.role));
    const darkRoles = new Set((card.darkVariant?.palette ?? []).map((token) => token.role));
    if (lightRoles.size !== darkRoles.size || [...lightRoles].some((role) => !darkRoles.has(role))) errors.push(`${label}: light/dark role sets differ`);
    if (card.family === 'System' && !(Array.isArray(card.sources) && card.sources.some((source) => /^https:\/\//.test(source?.url ?? '')))) {
      errors.push(`${label}: System card needs at least one https source`);
    }
  }
  // Guide provenance ledger (WP5): 25 rows, decision pass, prompt SHA binding.
  const unitDir = join(root, 'devlog/_plan/260717_design-encyclopedia-upgrade');
  const finDir = join(root, 'devlog/_fin/260717_design-encyclopedia-upgrade');
  const ledgerDir = existsSync(join(unitDir, '030_color_guide_manifest.jsonl')) ? unitDir : finDir;
  const auditPath = join(ledgerDir, '030_color_guide_audit.csv');
  const manifestPath = join(ledgerDir, '030_color_guide_manifest.jsonl');
  if (!existsSync(auditPath) || !existsSync(manifestPath)) { errors.push('color: guide audit/manifest ledger missing'); return; }
  const auditRows = readFileSync(auditPath, 'utf8').split('\n').filter(Boolean).slice(1);
  const manifestRows = readFileSync(manifestPath, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
  const cardIds = new Set(items.map((card) => card.id));
  if (auditRows.length !== 25) errors.push(`color: audit ledger rows ${auditRows.length} != 25`);
  if (manifestRows.length !== 25) errors.push(`color: manifest ledger rows ${manifestRows.length} != 25`);
  const auditIds = new Set(auditRows.map((row) => row.split(',')[0]));
  for (const id of cardIds) if (!auditIds.has(id)) errors.push(`color: audit ledger missing ${id}`);
  for (const row of auditRows) if (!row.includes(',pass,') && !row.includes(',accepted,')) errors.push(`color: audit row not accepted: ${row.slice(0, 60)}`);
  for (const row of manifestRows) {
    const card = items.find((item) => item.id === row.id);
    if (!card) { errors.push(`color: manifest ledger unknown id ${row.id}`); continue; }
    if (row.sourcePromptSha256 !== sha256Text(card.guide.prompt)) errors.push(`color:${row.id}: manifest prompt sha mismatch`);
    const png = join(root, `assets/images/color/${row.id}/guide.png`);
    const webp = join(root, `assets/images/thumbs/color/${row.id}/guide.webp`);
    if (!existsSync(png) || sha256File(png) !== row.original?.sha256) errors.push(`color:${row.id}: manifest png sha mismatch`);
    if (!existsSync(webp) || sha256File(webp) !== row.preview?.sha256) errors.push(`color:${row.id}: manifest webp sha mismatch`);
  }
}

const registry = [
  { name: 'color', dataPath: 'assets/data/color.json', imageRoot: 'assets/images/color', schemaPath: 'assets/data/schema/color.schema.json', idPattern: /^[a-z0-9]+(-[a-z0-9]+)*$/, family: null, validateDomain: validateColorDomain },
  { name: 'typography', dataPath: 'assets/data/typography.json', imageRoot: 'assets/images/typography', schemaPath: 'assets/data/schema/typography.schema.json', idPattern: /^[a-z0-9]+(-[a-z0-9]+)*$/, family: 'Typography Pairing' },
  { name: 'layout', dataPath: 'assets/data/layout.json', imageRoot: 'assets/images/layout', schemaPath: 'assets/data/schema/layout.schema.json', idPattern: /^layout-[a-z0-9]+(-[a-z0-9]+)*$/, family: null },
  { name: 'motion', dataPath: 'assets/data/motion.json', imageRoot: 'assets/images/motion', schemaPath: 'assets/data/schema/motion.schema.json', idPattern: /^motion-[a-z0-9]+(-[a-z0-9]+)*$/, family: 'Motion Preset' }
];

const ismIds = new Set(JSON.parse(readFileSync(join(root, 'assets/data/isms.json'), 'utf8')).map((ism) => ism.id));
const effectIds = new Set(JSON.parse(readFileSync(join(root, 'assets/data/effects.json'), 'utf8')).map((effect) => effect.id));

let verified = 0;
let skipped = 0;

for (const domain of registry) {
  const dataPath = join(root, domain.dataPath);
  if (!existsSync(join(root, domain.schemaPath))) errors.push(`${domain.name}: schema ${domain.schemaPath} missing`);
  if (!existsSync(dataPath)) { skipped += 1; continue; }
  let items;
  try {
    items = JSON.parse(readFileSync(dataPath, 'utf8'));
  } catch (error) {
    errors.push(`${domain.name}: ${domain.dataPath} parse failure ${error.message}`);
    continue;
  }
  if (!Array.isArray(items)) { errors.push(`${domain.name}: data must be a top-level array`); continue; }
  const ids = items.map((item) => item?.id);
  if (new Set(ids).size !== ids.length) errors.push(`${domain.name}: duplicate ids`);
  items.forEach((item, index) => {
    const label = `${domain.name}[${index}]`;
    if (typeof item !== 'object' || item === null) { errors.push(`${label}: not an object`); return; }
    for (const key of ['id', 'name', 'nameKr', 'family', 'category', 'summary']) {
      if (typeof item[key] !== 'string' || item[key].trim() === '') errors.push(`${label}: ${key} must be a non-empty string`);
    }
    if (typeof item.id === 'string' && !domain.idPattern.test(item.id)) errors.push(`${label}: id "${item.id}" violates pattern`);
    if (domain.family && item.family !== domain.family) errors.push(`${label}: family must be "${domain.family}"`);
    if (item.guide !== null && item.guide !== undefined) {
      if (typeof item.guide !== 'object' || item.guide.file !== 'guide.png' || !item.guide.alt || !item.guide.prompt) {
        errors.push(`${label}: guide contract violated`);
      } else if (!existsSync(join(root, domain.imageRoot, item.id, 'guide.png'))) {
        errors.push(`${label}: guide.png missing under ${domain.imageRoot}/${item.id}/`);
      }
    }
    for (const [field, pool] of [['relatedIsms', ismIds], ['relatedEffects', effectIds]]) {
      const refs = item[field];
      if (refs === undefined) continue;
      if (!Array.isArray(refs)) { errors.push(`${label}: ${field} must be an array`); continue; }
      for (const ref of refs) {
        if (!pool.has(ref)) errors.push(`${label}: ${field} dangling reference "${ref}"`);
        if (field === 'relatedIsms' && ref === 'ai-slop') errors.push(`${label}: relatedIsms must not reference the anti-pattern`);
      }
    }
  });
  if (domain.validateDomain) domain.validateDomain(items);
  verified += 1;
}

if (errors.length) {
  console.error('catalog verification failed:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log(`catalog ok: ${verified} domains verified, ${skipped} pending (no data yet)`);
