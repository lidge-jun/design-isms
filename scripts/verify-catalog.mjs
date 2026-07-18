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

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const registry = [
  { name: 'color', dataPath: 'assets/data/color.json', imageRoot: 'assets/images/color', schemaPath: 'assets/data/schema/color.schema.json', idPattern: /^[a-z0-9]+(-[a-z0-9]+)*$/, family: null },
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
  verified += 1;
}

if (errors.length) {
  console.error('catalog verification failed:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log(`catalog ok: ${verified} domains verified, ${skipped} pending (no data yet)`);
