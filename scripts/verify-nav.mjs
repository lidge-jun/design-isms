#!/usr/bin/env node
/**
 * verify-nav.mjs — six-axis navigation validator (Phase 020, extended 015-encyclopedia).
 * Parses public HTML pages without a browser and enforces the shared
 * Isms / Catalog / FAQ / GitHub / Lang / Count contract, including the
 * Catalog dropdown (Effects / Color / Typography / Layout / Motion).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index.html', 'effects.html', 'faq.html', 'color.html', 'typography.html', 'layout.html', 'motion.html'];
const expectedAxes = ['isms', 'catalog', 'faq', 'github', 'lang', 'count'];
const catalogTargets = ['effects', 'color', 'typography', 'layout', 'motion'];
// Pages whose aria-current lives on the Catalog dropdown trigger.
const catalogPages = new Set(['effects.html', 'color.html', 'typography.html', 'layout.html', 'motion.html']);
// Catalog entries that are live (not "준비 중"). Update as content cycles land.
const readyTargets = new Set(['effects', 'color', 'typography', 'layout']);

// Expected counts derive from the data sources of truth, not hardcoded labels.
const ismCount = JSON.parse(readFileSync(resolve(root, 'assets/data/isms.json'), 'utf8')).length;
const effectCount = JSON.parse(readFileSync(resolve(root, 'assets/data/effects.json'), 'utf8')).length;
const faqData = JSON.parse(readFileSync(resolve(root, 'assets/data/faq.json'), 'utf8'));
const faqCount = faqData.categories.reduce((sum, c) => sum + c.items.length, 0);
function catalogCount(file, unit) {
  const path = resolve(root, `assets/data/${file}`);
  if (!existsSync(path)) return new RegExp(`^0 ${unit}$`);
  const length = JSON.parse(readFileSync(path, 'utf8')).length;
  return new RegExp(`^${length} ${unit}$`);
}
const expectedCounts = {
  'index.html': new RegExp(`^${ismCount} isms$`),
  'effects.html': new RegExp(`^${effectCount} effects$`),
  'faq.html': new RegExp(`^${faqCount} answers$`),
  'color.html': catalogCount('color.json', 'colors'),
  'typography.html': catalogCount('typography.json', 'pairings'),
  'layout.html': catalogCount('layout.json', 'layouts'),
  'motion.html': catalogCount('motion.json', 'motions')
};

const errors = [];

for (const page of pages) {
  const path = resolve(root, page);
  if (!existsSync(path)) {
    errors.push(`${page}: file missing`);
    continue;
  }
  const html = readFileSync(path, 'utf8');

  // 1. axis order
  const axes = [...html.matchAll(/data-nav-axis="([a-z]+)"/g)].map((m) => m[1]);
  if (axes.join(',') !== expectedAxes.join(',')) {
    errors.push(`${page}: nav axes [${axes.join(', ')}] != expected [${expectedAxes.join(', ')}]`);
  }

  // 2. exactly one aria-current="page"
  const current = [...html.matchAll(/aria-current="page"/g)];
  if (current.length !== 1) {
    errors.push(`${page}: aria-current="page" count ${current.length} != 1`);
  }

  // 2b. aria-current owner matches the page's expected axis
  const expectedOwner = catalogPages.has(page) ? 'catalog-trigger' : page === 'faq.html' ? 'faq' : 'isms';
  if (expectedOwner === 'catalog-trigger') {
    const trigger = html.match(/<button[^>]*data-catalog-trigger[^>]*>/);
    if (!trigger) errors.push(`${page}: catalog dropdown trigger missing`);
    else if (!trigger[0].includes('aria-current="page"')) errors.push(`${page}: aria-current must live on the catalog trigger`);
  } else {
    const owner = html.match(new RegExp(`<a[^>]*data-nav-axis="${expectedOwner}"[^>]*>`));
    if (!owner || !owner[0].includes('aria-current="page"')) errors.push(`${page}: aria-current must live on the ${expectedOwner} nav link`);
  }

  // 2c. catalog dropdown contract: trigger wiring + exactly one link per target
  const trigger = html.match(/<button[^>]*data-catalog-trigger[^>]*>/);
  if (!trigger) {
    errors.push(`${page}: catalog dropdown trigger missing`);
  } else {
    if (!trigger[0].includes('type="button"')) errors.push(`${page}: catalog trigger lacks type="button"`);
    if (!/aria-expanded="(true|false)"/.test(trigger[0])) errors.push(`${page}: catalog trigger lacks aria-expanded`);
    if (!trigger[0].includes('aria-controls="catalog-nav-list"')) errors.push(`${page}: catalog trigger lacks aria-controls`);
  }
  if (!html.includes('id="catalog-nav-list"')) errors.push(`${page}: catalog-nav-list missing`);
  for (const target of catalogTargets) {
    const links = [...html.matchAll(new RegExp(`<a[^>]*data-catalog-target="${target}"[^>]*>`, 'g'))];
    if (links.length !== 1) {
      errors.push(`${page}: catalog target ${target} count ${links.length} != 1`);
      continue;
    }
    const link = links[0][0];
    if (!link.includes(`href="./${target}.html"`)) errors.push(`${page}: catalog target ${target} href mismatch`);
    const disabled = link.includes('aria-disabled="true"');
    if (readyTargets.has(target) && disabled) errors.push(`${page}: catalog target ${target} should be enabled`);
    if (!readyTargets.has(target) && !disabled) errors.push(`${page}: catalog target ${target} must carry aria-disabled="true" until its cycle lands`);
    if (!existsSync(resolve(root, `${target}.html`))) errors.push(`${page}: catalog target ${target}.html does not exist`);
  }

  // 3. GitHub link disclosure
  const gh = html.match(/<a[^>]*data-nav-axis="github"[^>]*>/);
  if (!gh) {
    errors.push(`${page}: github nav link missing`);
  } else {
    if (!gh[0].includes('target="_blank"')) errors.push(`${page}: github link lacks target="_blank"`);
    if (!/rel="[^"]*noopener[^"]*"/.test(gh[0])) errors.push(`${page}: github link lacks rel="noopener"`);
  }

  // 4. lang toggle is a typed button
  const lang = html.match(/<button[^>]*data-nav-axis="lang"[^>]*>/);
  if (!lang) {
    errors.push(`${page}: lang toggle <button data-nav-axis="lang"> missing`);
  } else if (!lang[0].includes('type="button"')) {
    errors.push(`${page}: lang toggle lacks type="button"`);
  }

  // 5. count label matches page contract
  const countEl = html.match(/<span[^>]*data-nav-axis="count"[^>]*>([^<]*)<\/span>/);
  if (!countEl) {
    errors.push(`${page}: count label missing`);
  } else if (!expectedCounts[page].test(countEl[1].trim())) {
    errors.push(`${page}: count label "${countEl[1].trim()}" does not match ${expectedCounts[page]}`);
  }

  // 6. legacy pill class and FAQ emoji are gone
  if (html.includes('class="star-pill"') || html.includes('star-pill ')) {
    errors.push(`${page}: legacy star-pill class remains`);
  }
  for (const emoji of ['\u26A1', '\u{1F525}', '\u{1F6E0}']) {
    if (html.includes(emoji)) errors.push(`${page}: forbidden emoji ${emoji} remains`);
  }

  // 7. local nav targets exist
  const localTargets = [...html.matchAll(/data-nav-axis="(?:isms|faq)"[^>]*href="\.\/([^"]+)"/g)].map((m) => m[1]);
  for (const target of localTargets) {
    if (!existsSync(resolve(root, target))) {
      errors.push(`${page}: nav target ${target} does not exist`);
    }
  }

  // 8. skip link + main landmark
  if (!html.includes('class="skip-link"')) errors.push(`${page}: skip link missing`);
  if (!html.includes('id="main-content"')) errors.push(`${page}: main-content landmark missing`);
}

if (errors.length > 0) {
  console.error('nav verification failed:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`nav ok: ${pages.join(', ')}; axes=${expectedAxes.length}; order consistent`);
