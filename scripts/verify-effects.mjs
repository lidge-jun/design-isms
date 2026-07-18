/**
 * verify-effects.mjs — effects catalog validator (Phase 050).
 * Cross-checks effects.json, effects-docs.json, the EffectsDemos registry,
 * family/device enums, guide image pairs, and authored line limits.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const effects = JSON.parse(readFileSync(join(root, 'assets/data/effects.json'), 'utf8'));
const docs = JSON.parse(readFileSync(join(root, 'assets/data/effects-docs.json'), 'utf8'));
const demosSrc = readFileSync(join(root, 'src/effects-demos.ts'), 'utf8');

// Deliberate catalog contract (update consciously when the catalog grows).
const EXPECTED_EFFECTS = 94;
const FAMILIES = new Set(['Interface Pattern', 'Scroll & Parallax', 'Text Motion', 'Hero & Background', 'Cursor & Pointer', 'View Transition', 'Micro-interaction']);
const DEVICES = new Set(['Mobile', 'Desktop', 'Shared']);
const LEGACY_VISUAL_IDS = ['scroll-progress-indicator', 'layered-parallax', 'horizontal-scroll-gallery', 'split-text-reveal', 'text-scramble', 'number-ticker', 'aurora-mesh-background', 'spotlight-grid-background', 'grain-noise-drift', 'magnetic-button', 'cursor-trail', 'tilt-hover-card', 'crossfade-view-transition', 'shared-element-transition', 'route-wipe-transition', 'favorite-burst', 'success-checkmark', 'copy-confirmation'];
const WP4_IDS = ['sticky-section-reveal', 'scroll-snap-carousel', 'scroll-zoom-hero', 'parallax-depth-cards', 'scroll-linked-progress-sections', 'typewriter-caret', 'word-rotate-swap', 'gradient-text-sweep', 'glitch-text-flicker', 'marquee-text-loop', 'svg-wave-divider', 'gradient-morph-blob', 'dot-grid-pulse', 'floating-particles-field', 'video-scrim-hero', 'spotlight-follow', 'hover-ripple-feedback', 'pointer-glow-border', 'drag-affordance-cursor', 'lens-zoom-hover', 'flip-card-reveal', 'accordion-morph-expand', 'list-reorder-flip', 'page-turn-transition', 'hero-expand-navigation', 'toggle-switch-morph', 'confetti-success-burst', 'shake-validation-error', 'progress-ring-completion', 'long-press-context-reveal'];
const NEW_IDS = [...LEGACY_VISUAL_IDS, ...WP4_IDS];
const EXPECTED_FAMILY_COUNTS = new Map([
  ['Interface Pattern', 46], ['Scroll & Parallax', 8], ['Text Motion', 8], ['Hero & Background', 8],
  ['Cursor & Pointer', 8], ['View Transition', 8], ['Micro-interaction', 8]
]);

const errors = [];
const ids = effects.map((e) => e.id);

if (effects.length !== EXPECTED_EFFECTS) errors.push(`effects.json ${effects.length} != ${EXPECTED_EFFECTS}`);
if (new Set(ids).size !== ids.length) errors.push('duplicate effect ids');
for (const id of NEW_IDS) {
  if (ids.filter((x) => x === id).length !== 1) errors.push(`new id ${id} not present exactly once`);
}

// demo registry parity — parse the demoTypes array literal specifically,
// and require exactly one explicit `case '<id>':` per effect.
const registryBlock = demosSrc.match(/demoTypes = \[([\s\S]*?)\] as const/);
if (!registryBlock) errors.push('effects-demos.ts: demoTypes array literal not found');
const registryIds = new Set(registryBlock ? [...registryBlock[1].matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]) : []);
if (registryBlock && registryIds.size !== EXPECTED_EFFECTS) {
  errors.push(`demoTypes registry has ${registryIds.size} ids != ${EXPECTED_EFFECTS}`);
}
let families = new Set();
let pngCount = 0;
let webpCount = 0;

for (const effect of effects) {
  if (!effect.family || !FAMILIES.has(effect.family)) errors.push(`${effect.id}: invalid family "${effect.family}"`);
  if (!DEVICES.has(effect.category)) errors.push(`${effect.id}: invalid category "${effect.category}"`);
  if (!effect.demo || effect.demo.type !== effect.id) errors.push(`${effect.id}: demo.type !== id`);
  if (!registryIds.has(effect.id)) errors.push(`${effect.id}: missing from demoTypes registry`);
  const caseCount = (demosSrc.match(new RegExp(`case '${effect.id}':`, 'g')) ?? []).length;
  if (caseCount !== 1) errors.push(`${effect.id}: expected exactly 1 render case, found ${caseCount}`);
  if (!docs[effect.id]) errors.push(`${effect.id}: missing effects-docs entry`);
  families.add(effect.family);

  for (const [minKey, minLen] of [['alsoCalled', 3], ['bestFor', 3], ['avoidWhen', 2], ['implementation', 2], ['accessibility', 2], ['performance', 2]]) {
    if (!Array.isArray(effect[minKey]) || effect[minKey].length < minLen) errors.push(`${effect.id}: ${minKey} < ${minLen}`);
  }

  const png = join(root, 'assets/images/effects', effect.id, effect.guide?.file ?? 'guide.png');
  const webp = join(root, 'assets/images/thumbs/effects', effect.id, 'guide.webp');
  if (existsSync(png)) pngCount += 1; else errors.push(`${effect.id}: guide png missing`);
  if (existsSync(webp)) webpCount += 1; else errors.push(`${effect.id}: guide webp missing`);
}

// docs quality for new entries
for (const id of NEW_IDS) {
  const doc = docs[id];
  if (!doc) continue;
  for (const field of ['background', 'history', 'useWhen', 'examples', 'anatomy', 'misuse', 'implementationNotes', 'researchRefs']) {
    const v = doc[field];
    if (v === undefined || v === null || (Array.isArray(v) && v.length === 0) || (typeof v === 'string' && v.trim() === '')) {
      errors.push(`docs ${id}: missing/empty ${field}`);
    }
  }
  const refs = Array.isArray(doc.researchRefs) ? doc.researchRefs : [];
  const urls = refs.map((r) => (typeof r === 'string' ? r : r?.url ?? ''));
  if (urls.length < 2) errors.push(`docs ${id}: needs 2+ researchRefs`);
  for (const u of urls) if (!String(u).startsWith('https://')) errors.push(`docs ${id}: non-https ref ${u}`);
}

// docs orphan keys
for (const key of Object.keys(docs)) {
  if (!ids.includes(key)) errors.push(`docs orphan key ${key}`);
}

// authored line limits
for (const rel of ['src/effects-filters.ts', 'src/effects-interactions.ts', 'assets/css/effects-demos-candidates.css', 'assets/css/effects-demos-patterns.css']) {
  const lines = readFileSync(join(root, rel), 'utf8').split('\n').length;
  if (lines > 500) errors.push(`${rel} ${lines} lines > 500`);
}
const effectsTsLines = readFileSync(join(root, 'src/effects.ts'), 'utf8').split('\n').length;
if (effectsTsLines > 450) errors.push(`src/effects.ts ${effectsTsLines} lines > 450`);

if (errors.length > 0) {
  console.error('effects verification failed:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`effects ok: ${effects.length} entries, ${Object.keys(docs).length} docs, ${pngCount} png, ${webpCount} webp, ${families.size} families`);
