#!/usr/bin/env node
/**
 * verify-nav.mjs — six-axis navigation validator (Phase 020).
 * Parses public HTML pages without a browser and enforces the shared
 * Isms / Effects / FAQ / GitHub / Lang / Count contract.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index.html', 'effects.html', 'faq.html'];
const expectedAxes = ['isms', 'effects', 'faq', 'github', 'lang', 'count'];

// Expected counts derive from the data sources of truth, not hardcoded labels.
const ismCount = JSON.parse(readFileSync(resolve(root, 'assets/data/isms.json'), 'utf8')).length;
const effectCount = JSON.parse(readFileSync(resolve(root, 'assets/data/effects.json'), 'utf8')).length;
const faqData = JSON.parse(readFileSync(resolve(root, 'assets/data/faq.json'), 'utf8'));
const faqCount = faqData.categories.reduce((sum, c) => sum + c.items.length, 0);
const expectedCounts = {
  'index.html': new RegExp(`^${ismCount} isms$`),
  'effects.html': new RegExp(`^${effectCount} effects$`),
  'faq.html': new RegExp(`^${faqCount} answers$`)
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
  const localTargets = [...html.matchAll(/data-nav-axis="(?:isms|effects|faq)"[^>]*href="\.\/([^"]+)"/g)].map((m) => m[1]);
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
