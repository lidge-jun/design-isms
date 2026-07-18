/**
 * verify-snippets.mjs — effect snippet contract and export asset validator.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const MAX_SNIPPET_BYTES = 12 * 1024;
const EXPECTED_EFFECTS = 94;

// Effects that REQUIRE JavaScript for their core interaction
const JS_REQUIRED = new Set([
  'bottom-sheet', 'drawer-navigation', 'scroll-reveal', 'press-scale',
  'swipe-action', 'skeleton-loading', 'toast', 'pull-to-refresh',
  'command-palette', 'resizable-sidebar', 'drag-reorder', 'virtual-list',
  'carousel', 'date-picker', 'file-dropzone', 'notification-center',
  'split-text-reveal', 'text-scramble', 'number-ticker',
  'magnetic-button', 'cursor-trail', 'tilt-hover-card',
  'crossfade-view-transition', 'shared-element-transition', 'route-wipe-transition',
  'favorite-burst', 'success-checkmark', 'copy-confirmation',
  'inline-edit', 'context-menu', 'tooltip', 'popover',
  'mega-menu', 'split-pane', 'kanban-board', 'filter-sidebar',
  'master-detail', 'image-lightbox', 'inline-validation',
  'mobile-stepper-form', 'desktop-wizard', 'progress-stepper',
  // WP4 expansion (interaction requires JS)
  'spotlight-follow', 'hover-ripple-feedback', 'pointer-glow-border',
  'drag-affordance-cursor', 'lens-zoom-hover', 'flip-card-reveal',
  'list-reorder-flip', 'page-turn-transition', 'hero-expand-navigation',
  'confetti-success-burst', 'shake-validation-error', 'progress-ring-completion',
  'long-press-context-reveal',
]);
const MAX_TRANSFER_BYTES = 280 * 1024; // 280 KiB uncompressed — raised consciously for the 94-effect catalog (WP4 expansion, was 180 KiB at 64 effects)


function readText(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    errors.push(`${relativePath}: file does not exist`);
    return null;
  }

  try {
    return readFileSync(absolutePath, 'utf8');
  } catch (error) {
    errors.push(`${relativePath}: could not be read (${error.message})`);
    return null;
  }
}

function parseJson(relativePath) {
  const text = readText(relativePath);
  if (text === null) return null;

  try {
    return { data: JSON.parse(text), text };
  } catch (error) {
    errors.push(`${relativePath}: invalid JSON (${error.message})`);
    return null;
  }
}

function countLines(text) {
  return text.split(/\r?\n/).length;
}

function checkUnder500Lines(relativePath, text = readText(relativePath)) {
  if (text === null) return;
  const lines = countLines(text);
  if (lines >= 500) errors.push(`${relativePath}: ${lines} lines (must be under 500)`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const unsafePatterns = [
  ['encoded script tag', /&lt;script\b/i],
  ['inline event handler', /\bon[a-z]+\s*=/i],
  ['javascript URL', /javascript\s*:/i],
  ['eval()', /\beval\s*\(/i],
  ['new Function', /\bnew\s+Function\b/i],
  ['document.write()', /\bdocument\s*\.\s*write\s*\(/i],
  ['innerHTML', /\binnerHTML\b/i],
  ['analytics/tracking', /(?:google-analytics|googletagmanager|google_tag_manager|\bgtag\s*\(|\bga\s*\(|\bfbq\s*\(|\bdataLayer\b|\bmixpanel\b|\bsegment\b|\bamplitude\b|\bposthog\b|\bplausible\b|\banalytics\b|\btracking\b)/i],
];

function findUnsafe(id, combinedSource) {
  for (const [label, pattern] of unsafePatterns) {
    if (pattern.test(combinedSource)) errors.push(`${id}: unsafe pattern detected (${label})`);
  }
}

function hasForbiddenSelector(selector) {
  const typeSelector = /(^|[\s>+~,(])(?:body|html|button|a|h[1-6])(?=$|[\s>+~.#:[,)])/i;
  const universalSelector = /(^|[\s>+~,(])\*(?=$|[\s>+~.#:[,)])/;
  return typeSelector.test(selector) || universalSelector.test(selector);
}

function splitSelectorList(prelude) {
  const selectors = [];
  let start = 0;
  let depth = 0;

  for (let index = 0; index < prelude.length; index += 1) {
    const character = prelude[index];
    if (character === '(' || character === '[') depth += 1;
    if (character === ')' || character === ']') depth = Math.max(0, depth - 1);
    if (character === ',' && depth === 0) {
      selectors.push(prelude.slice(start, index));
      start = index + 1;
    }
  }

  selectors.push(prelude.slice(start));
  return selectors;
}

function findUnscopedSelectors(id, css) {
  const rootClass = `.fx-${id}`;
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rulePattern = /([^{}]+)\{/g;
  let match;

  while ((match = rulePattern.exec(withoutComments)) !== null) {
    const prelude = match[1].trim();
    if (!prelude || prelude.startsWith('@')) continue;

    for (const selector of splitSelectorList(prelude)) {
      const normalized = selector.trim();
      if (hasForbiddenSelector(normalized) && !normalized.includes(rootClass)) {
        errors.push(`${id}: unscoped CSS selector "${normalized}"`);
      }
    }
  }
}

const effectsFile = parseJson('assets/data/effects.json');
const snippetsFile = parseJson('assets/data/effects-snippets.json');

if (snippetsFile) checkUnder500Lines('assets/data/effects-snippets.json', snippetsFile.text);
checkUnder500Lines('src/app-export.ts');
checkUnder500Lines('assets/css/export.css');
readText('assets/js/app-export.js');

let effectIds = [];
if (effectsFile) {
  if (!Array.isArray(effectsFile.data)) {
    errors.push('assets/data/effects.json: expected an array');
  } else {
    effectIds = effectsFile.data.map((effect, index) => {
      if (!effect || typeof effect.id !== 'string' || effect.id.trim() === '') {
        errors.push(`assets/data/effects.json: entry ${index} has an invalid id`);
        return null;
      }
      return effect.id;
    }).filter(Boolean);

    if (effectIds.length !== EXPECTED_EFFECTS) {
      errors.push(`assets/data/effects.json: ${effectIds.length} ids (expected ${EXPECTED_EFFECTS})`);
    }
    if (new Set(effectIds).size !== effectIds.length) {
      errors.push('assets/data/effects.json: duplicate effect ids');
    }
  }
}

let snippets = null;
if (snippetsFile) {
  if (!snippetsFile.data || typeof snippetsFile.data !== 'object' || Array.isArray(snippetsFile.data)) {
    errors.push('assets/data/effects-snippets.json: expected an object');
  } else if (!snippetsFile.data.snippets || typeof snippetsFile.data.snippets !== 'object' || Array.isArray(snippetsFile.data.snippets)) {
    errors.push('assets/data/effects-snippets.json: .snippets must be an object');
  } else {
    snippets = snippetsFile.data.snippets;
  }
}

let htmlCount = 0;
let cssCount = 0;
let jsCount = 0;

if (snippets) {
  const effectIdSet = new Set(effectIds);
  const snippetIds = Object.keys(snippets);
  const snippetIdSet = new Set(snippetIds);

  for (const id of effectIds) {
    if (!snippetIdSet.has(id)) errors.push(`${id}: missing snippet entry`);
  }
  for (const id of snippetIds) {
    if (!effectIdSet.has(id)) errors.push(`${id}: extra snippet entry`);
  }

  for (const [id, snippet] of Object.entries(snippets)) {
    if (!snippet || typeof snippet !== 'object' || Array.isArray(snippet)) {
      errors.push(`${id}: snippet must be an object`);
      continue;
    }

    const rootClass = `fx-${id}`;
    const rootSelector = `.${rootClass}`;
    const html = snippet.html;
    const css = snippet.css;
    const hasHtml = typeof html === 'string' && html.trim() !== '';
    const hasCss = typeof css === 'string' && css.trim() !== '';

    if (!hasHtml) {
      errors.push(`${id}: html must be a nonempty string`);
    } else {
      htmlCount += 1;
      if (Buffer.byteLength(html, 'utf8') >= MAX_SNIPPET_BYTES) {
        errors.push(`${id}: html is ${Buffer.byteLength(html, 'utf8')} bytes (must be under 12 KiB)`);
      }
      const classPattern = new RegExp(`\\bclass\\s*=\\s*(["'])[^"']*\\b${escapeRegExp(rootClass)}\\b[^"']*\\1`, 'i');
      if (!classPattern.test(html)) errors.push(`${id}: html is missing root class ${rootSelector}`);
    }

    if (!hasCss) {
      errors.push(`${id}: css must be a nonempty string`);
    } else {
      cssCount += 1;
      if (Buffer.byteLength(css, 'utf8') >= MAX_SNIPPET_BYTES) {
        errors.push(`${id}: css is ${Buffer.byteLength(css, 'utf8')} bytes (must be under 12 KiB)`);
      }
      const selectorPattern = new RegExp(`${escapeRegExp(rootSelector)}(?![a-zA-Z0-9_-])`);
      if (!selectorPattern.test(css)) errors.push(`${id}: css is missing root class ${rootSelector}`);

      const hasReducedMotionQuery = /@media[^{}]*\(\s*prefers-reduced-motion\s*:/i.test(css);
      const hasReducedMotionClass = /\.reduced-motion(?![a-zA-Z0-9_-])/i.test(css);
      const hasReducedMotionNote = typeof snippet.reducedMotion === 'string' && snippet.reducedMotion.trim() !== '';
      if (!hasReducedMotionQuery && !hasReducedMotionClass && !hasReducedMotionNote) {
        errors.push(`${id}: missing reduced-motion CSS or reducedMotion documentation`);
      }

      findUnscopedSelectors(id, css);
    }

    if (Object.hasOwn(snippet, 'js')) {
      if (typeof snippet.js !== 'string' || snippet.js.trim() === '') {
        errors.push(`${id}: js must be a nonempty string when present`);
      } else {
        jsCount += 1;
      }
    } else if (JS_REQUIRED.has(id)) {
      errors.push(`${id}: js is required for this interactive effect`);
    }

    if (Object.hasOwn(snippet, 'sourceRefs')) {
      if (!Array.isArray(snippet.sourceRefs)) {
        errors.push(`${id}: sourceRefs must be an array`);
      } else {
        for (const [index, ref] of snippet.sourceRefs.entries()) {
          if (typeof ref !== 'string' || !ref.startsWith('https://')) {
            errors.push(`${id}: sourceRefs[${index}] must be an https:// string`);
          }
        }
      }
    }

    findUnsafe(id, `${typeof html === 'string' ? html : ''}\n${typeof css === 'string' ? css : ''}\n${typeof snippet.js === 'string' ? snippet.js : ''}`);
  }
}

// Transfer-size check
if (snippetsFile && snippetsFile.text) {
  const rawSize = Buffer.byteLength(snippetsFile.text, 'utf8');
  if (rawSize > MAX_TRANSFER_BYTES) {
    errors.push(`assets/data/effects-snippets.json: ${rawSize} bytes uncompressed (target < ${MAX_TRANSFER_BYTES})`);
  }
}

if (errors.length > 0) {
  console.error('snippet verification failed:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`snippets ok: ${effectIds.length} ids, ${htmlCount} html, ${cssCount} css, ${jsCount} js, 0 unsafe, 0 unscoped`);
