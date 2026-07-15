/**
 * verify-isms.mjs — ISM catalog validator (Phase 040).
 * Cross-checks isms.json, dev-guides.json, image pairs, new-entry sourcing,
 * anti-pattern uniqueness, and repository line-limit constraints.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const isms = JSON.parse(readFileSync(join(root, 'assets/data/isms.json'), 'utf8'));
const guides = JSON.parse(readFileSync(join(root, 'assets/data/dev-guides.json'), 'utf8'));
const newIds = ['ai-slop', 'refractive-glass-ui', 'spatial-ui', 'human-crafted-web', 'generative-identity', 'technical-blueprint'];
// Deliberate catalog contract: adding an ISM requires consciously updating this constant
// (and README/AGENTS counts). Catches accidental entry loss or stray additions.
const EXPECTED_ISMS = 49;

const errors = [];
const ids = isms.map((i) => i.id);

if (new Set(ids).size !== ids.length) errors.push('duplicate ism ids');
if (isms.length !== EXPECTED_ISMS) errors.push(`isms.json has ${isms.length} entries; expected ${EXPECTED_ISMS}`);
const guideKeys = Object.keys(guides);
if (isms.length !== guideKeys.length) errors.push(`isms ${isms.length} != guides ${guideKeys.length}`);
for (const id of ids) if (!guides[id]) errors.push(`guide missing for ${id}`);
for (const key of guideKeys) if (!ids.includes(key)) errors.push(`orphan guide key ${key}`);
for (const id of newIds) {
  if (ids.filter((x) => x === id).length !== 1) errors.push(`new id ${id} not present exactly once`);
}

const antiPatterns = isms.filter((i) => i.kind === 'anti-pattern').map((i) => i.id);
if (antiPatterns.length !== 1 || antiPatterns[0] !== 'ai-slop') {
  errors.push(`anti-pattern set [${antiPatterns.join(',')}] != [ai-slop]`);
}

let pngCount = 0;
let webpCount = 0;
for (const ism of isms) {
  if (!Array.isArray(ism.images) || ism.images.length !== 3) {
    errors.push(`${ism.id}: images count != 3`);
    continue;
  }
  if (!Array.isArray(ism.prompts) || ism.prompts.length !== 3) {
    errors.push(`${ism.id}: prompts missing or count != 3`);
  } else {
    const promptFiles = ism.prompts.map((p) => p.file).sort();
    if (JSON.stringify(promptFiles) !== JSON.stringify(ism.images.map((im) => im.file).slice().sort())) {
      errors.push(`${ism.id}: prompt filenames do not match image filenames`);
    }
  }
  const fileSet = new Set(ism.images.map((im) => im.file));
  if (fileSet.size !== 3) errors.push(`${ism.id}: duplicate image filenames`);
  for (const color of ism.palette) {
    // legacy entries may carry 8-digit hex with alpha (e.g. glassmorphism)
    if (!/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(color)) errors.push(`${ism.id}: non-hex palette value ${color}`);
  }
  for (const image of ism.images) {
    const png = join(root, 'assets/images', ism.id, image.file);
    const webp = join(root, 'assets/images/thumbs', ism.id, image.file.replace(/\.png$/, '.webp'));
    if (!existsSync(png)) { errors.push(`${ism.id}: missing ${image.file}`); continue; }
    pngCount += 1;
    if (!existsSync(webp)) { errors.push(`${ism.id}: missing preview for ${image.file}`); continue; }
    webpCount += 1;
  }
}

// dimension audit for the six new entries (Phase 030 dimensions)
for (const id of newIds) {
  const ism = isms.find((i) => i.id === id);
  if (!ism) continue;
  if (!ism.reviewedOn || !/^\d{4}-\d{2}-\d{2}$/.test(ism.reviewedOn) || Number.isNaN(Date.parse(ism.reviewedOn))) {
    errors.push(`${id}: missing/invalid reviewedOn`);
  }
  if (!Array.isArray(ism.sources) || ism.sources.length < 2) errors.push(`${id}: needs 2+ sources`);
  for (const s of ism.sources ?? []) if (!s.url.startsWith('https://')) errors.push(`${id}: non-https source`);
  if (!ism.descriptionEn) errors.push(`${id}: missing descriptionEn`);
  if (!ism.history) errors.push(`${id}: missing history`);
  if (ism.description.length < 120 || ism.description.length > 220) errors.push(`${id}: description length ${ism.description.length} outside 120-220`);
  if (ism.history && (ism.history.length < 350 || ism.history.length > 650)) errors.push(`${id}: history length ${ism.history.length} outside 350-650`);
  if (ism.keywords.length < 5 || ism.keywords.length > 8) errors.push(`${id}: keywords out of 5-8 range`);
  for (const kw of ism.keywords) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(kw)) errors.push(`${id}: keyword "${kw}" is not lowercase kebab-case`);
  }
  if (ism.palette.length !== 4) errors.push(`${id}: palette must have exactly 4 colors`);
  const urls = new Set((ism.examples ?? []).map((e) => e.url));
  if (ism.examples.length !== 10 || urls.size !== 10) errors.push(`${id}: needs exactly 10 unique examples`);
  for (const e of ism.examples) if (!e.url.startsWith('https://')) errors.push(`${id}: non-https example ${e.url}`);
  for (const image of ism.images) {
    const png = join(root, 'assets/images', id, image.file);
    if (!existsSync(png)) continue;
    const meta = await sharp(png).metadata();
    if (meta.width !== 1536 || meta.height !== 1024) errors.push(`${id}/${image.file}: ${meta.width}x${meta.height} != 1536x1024`);
    const webp = join(root, 'assets/images/thumbs', id, image.file.replace(/\.png$/, '.webp'));
    if (existsSync(webp)) {
      const wm = await sharp(webp).metadata();
      if (wm.width !== 768 || wm.height !== 512 || wm.format !== 'webp') {
        errors.push(`${id}/${image.file}: preview ${wm.width}x${wm.height}/${wm.format} != 768x512 webp`);
      }
    }
  }
}

// guide field completeness
for (const [key, guide] of Object.entries(guides)) {
  for (const field of ['layout', 'typography', 'color', 'motion', 'dos', 'donts', 'implementation']) {
    if (!guide[field] || (Array.isArray(guide[field]) && guide[field].length === 0)) {
      errors.push(`guide ${key}: missing/empty ${field}`);
    }
  }
  const requiredSubfields = {
    layout: ['grid', 'columns', 'gutter', 'margins', 'spacing', 'symmetry', 'geometry'],
    typography: ['fontPairing', 'sizeHierarchy', 'lineHeight', 'letterSpacing', 'weightStrategy'],
    color: ['usage', 'bgFg', 'contrast'],
    motion: ['easing', 'duration', 'hover', 'scroll', 'transition']
  };
  for (const [field, subKeys] of Object.entries(requiredSubfields)) {
    const section = guide[field];
    if (!section || typeof section !== 'object' || Array.isArray(section)) {
      errors.push(`guide ${key}: ${field} is not an object`);
      continue;
    }
    for (const subKey of subKeys) {
      const subVal = section[subKey];
      if (typeof subVal !== 'string' || subVal.trim() === '') errors.push(`guide ${key}: ${field}.${subKey} missing/empty`);
    }
  }
  const impl = guide.implementation;
  if (impl) {
    for (const f of ['summary', 'components', 'build', 'checks']) {
      if (!impl[f] || (Array.isArray(impl[f]) && impl[f].length === 0)) errors.push(`guide ${key}: implementation.${f} empty`);
    }
  }
}

// asset totals contract
if (pngCount !== EXPECTED_ISMS * 3) errors.push(`png total ${pngCount} != ${EXPECTED_ISMS * 3}`);
if (webpCount !== EXPECTED_ISMS * 3) errors.push(`webp total ${webpCount} != ${EXPECTED_ISMS * 3}`);

// repository constraints
const appTs = readFileSync(join(root, 'src/app.ts'), 'utf8');
if (appTs.includes('DEVELOPMENT_GUIDES')) errors.push('DEVELOPMENT_GUIDES constant still present in src/app.ts');
const appLines = appTs.split('\n').length;
if (appLines > 1050) errors.push(`src/app.ts ${appLines} lines > 1050`);

if (errors.length > 0) {
  console.error('ism verification failed:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`isms ok: ${isms.length} entries, ${guideKeys.length} guides, ${pngCount} png, ${webpCount} webp, ${newIds.length} sourced additions, ${antiPatterns.length} anti-pattern`);
