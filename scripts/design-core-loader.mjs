// Node adapter for the same pure classic-script core served by the site.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const CORE_NAMES = ['design-contracts', 'design-catalog', 'design-search', 'design-views', 'design-recipes'];
const OPTIONAL_CORE = new Set(['design-search', 'design-views']);
export const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const metadataContext = vm.createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } });
const metadataSource = readFileSync(join(REPOSITORY_ROOT, 'assets/js/design-contracts.js'), 'utf8');
const metadata = JSON.parse(new vm.Script(metadataSource + '\nJSON.stringify({version:DesignCatalog.CONTRACT_VERSION,domains:DesignCatalog.DOMAINS,files:DesignCatalog.SOURCE_FILES})')
  .runInContext(metadataContext, { timeout: 1000 }));
export const CONTRACT_VERSION = metadata.version;
export const DOMAINS = Object.freeze(metadata.domains);
export const SOURCE_FILES = Object.freeze(metadata.files);

/** Version exact source bytes, including auxiliary documents and code snippets. */
export function snapshotFromFiles(files) {
  const pairs = SOURCE_FILES.map(path => {
    if (!files.has(path)) throw new Error(`Missing snapshot source: ${path}`);
    return [path, sha256(files.get(path))];
  });
  const parse = path => JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(files.get(path)));
  return {
    contractVersion: CONTRACT_VERSION,
    version: sha256(JSON.stringify([CONTRACT_VERSION, ...pairs])),
    catalogs: Object.fromEntries(DOMAINS.map(domain => [domain, parse(`assets/data/${domain}.json`)])),
    recipes: parse('assets/data/recipes.json'),
    guides: parse('assets/data/dev-guides.json'),
    effectDocs: parse('assets/data/effects-docs.json'),
    effectSnippets: parse('assets/data/effects-snippets.json')
  };
}

export function readSourceSnapshot(root = REPOSITORY_ROOT) {
  return snapshotFromFiles(new Map(SOURCE_FILES.map(path => [path, readFileSync(join(root, path))])));
}

/** Only fixed, trusted build outputs are evaluated; callers cannot select a script. */
export function readCoreSources(root = REPOSITORY_ROOT) {
  return CORE_NAMES.flatMap(name => {
    const file = join(root, 'assets/js', `${name}.js`);
    const source = join(root, 'src', `${name}.ts`);
    if (OPTIONAL_CORE.has(name) && !existsSync(file) && !existsSync(source)) return [];
    return [{ name, source: readFileSync(file, 'utf8') }];
  });
}

export function loadDesignCore({ root = REPOSITORY_ROOT, source = readSourceSnapshot(root) } = {}) {
  const coreSources = readCoreSources(root);
  const context = vm.createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } });
  for (const file of coreSources) new vm.Script(file.source, { filename: `${file.name}.js` }).runInContext(context, { timeout: 1000 });
  // Parse in the destination realm, rather than injecting host arrays/functions.
  const input = new vm.Script(`JSON.parse(${JSON.stringify(JSON.stringify(source))})`).runInContext(context, { timeout: 1000 });
  const catalog = context.DesignCatalog;
  const recipes = context.DesignRecipes;
  if (!catalog || !recipes) throw new Error('Generated design core is missing; run npm run build');
  const snapshot = catalog.create(input);
  const recipeList = recipes.parse(input.recipes, snapshot);
  return { catalog, recipes, snapshot, recipeList, source, coreSources };
}
