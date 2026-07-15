/**
 * verify-finder.mjs — Style Finder contract and scoring validator.
 * Validates config references, browser-build execution, exhaustive scoring,
 * determinism, catalog counts, and repository line limits.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const paths = {
  effects: join(root, 'assets/data/effects.json'),
  isms: join(root, 'assets/data/isms.json'),
  guides: join(root, 'assets/data/dev-guides.json'),
  config: join(root, 'assets/data/finder-config.json'),
  exportJs: join(root, 'assets/js/app-export.js'),
  finderJs: join(root, 'assets/js/finder.js'),
  finderTs: join(root, 'src/finder.ts'),
  finderCss: join(root, 'assets/css/finder.css')
};

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function lineCount(path) {
  return readFileSync(path, 'utf8').split(/\r?\n/).length;
}

function createDomElement() {
  return {
    classList: { add() {}, remove() {}, toggle() {} },
    style: {},
    dataset: {},
    appendChild() {},
    remove() {},
    select() {},
    setAttribute() {},
    hasAttribute() { return false; },
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    innerHTML: '',
    textContent: ''
  };
}

function createBrowserContext() {
  class HTMLElement {}
  class Event {
    constructor(type, init = {}) {
      this.type = type;
      Object.assign(this, init);
    }
    preventDefault() {}
  }
  class CustomEvent extends Event {
    constructor(type, init = {}) {
      super(type, init);
      this.detail = init.detail;
    }
  }

  const storage = new Map();
  const document = {
    documentElement: { lang: 'ko' },
    body: createDomElement(),
    createElement: createDomElement,
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    dispatchEvent() { return true; },
    execCommand() { return false; }
  };
  const context = {
    console,
    document,
    sessionStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, String(value)); },
      removeItem(key) { storage.delete(key); },
      clear() { storage.clear(); }
    },
    navigator: { clipboard: { async writeText() {} } },
    fetch: async () => ({ ok: false, status: 404, async json() { return null; } }),
    HTMLElement,
    Event,
    CustomEvent,
    setTimeout,
    clearTimeout
  };
  context.window = context;
  context.globalThis = context;
  context.isSecureContext = false;
  return vm.createContext(context);
}

function runBrowserBuild(context, path) {
  const source = readFileSync(path, 'utf8');
  new vm.Script(source, { filename: path }).runInContext(context);
}

try {
  assert.ok(existsSync(paths.finderJs), 'generated assets/js/finder.js is missing');

  const effects = readJson(paths.effects);
  const isms = readJson(paths.isms);
  const guides = readJson(paths.guides);
  const config = readJson(paths.config);
  const finderSource = readFileSync(paths.finderJs, 'utf8');

  assert.equal(effects.length, 64, 'effects.json must contain 64 effects');
  assert.equal(isms.length, 49, 'isms.json must contain 49 prompt packs');
  assert.ok(finderSource.length > 0, 'assets/js/finder.js is empty');

  const expectedOptions = {
    project: ['portfolio', 'editorial', 'commerce', 'saas', 'event', 'community'],
    mood: ['calm', 'bold', 'playful', 'luxury', 'technical', 'organic'],
    brightness: ['light', 'dark', 'high-contrast', 'mixed']
  };
  const expectedQuestionIds = Object.keys(expectedOptions);
  const questionIds = config.questions?.map((question) => question.id) ?? [];
  assert.deepEqual(questionIds, expectedQuestionIds, 'question IDs must be project, mood, brightness');

  const questions = new Map(config.questions.map((question) => [question.id, question]));
  for (const [questionId, optionIds] of Object.entries(expectedOptions)) {
    const actualIds = questions.get(questionId)?.options?.map((option) => option.id) ?? [];
    assert.deepEqual(actualIds, optionIds, `${questionId} option IDs do not match the contract`);
  }

  const ismIds = new Set(isms.map((ism) => ism.id));
  assert.equal(ismIds.size, isms.length, 'isms.json contains duplicate IDs');
  for (const question of config.questions) {
    for (const option of question.options) {
      assert.ok(Array.isArray(option.boostIds), `${question.id}.${option.id}.boostIds must be an array`);
      assert.ok(Array.isArray(option.conflictIds), `${question.id}.${option.id}.conflictIds must be an array`);
      assert.ok(!option.boostIds.includes('ai-slop'), `${question.id}.${option.id} boosts ai-slop`);
      for (const id of option.boostIds) {
        assert.ok(ismIds.has(id), `${question.id}.${option.id} has unknown boostId ${id}`);
      }
      for (const id of option.conflictIds) {
        assert.ok(ismIds.has(id), `${question.id}.${option.id} has unknown conflictId ${id}`);
      }
    }
  }

  assert.ok(lineCount(paths.finderTs) < 500, 'src/finder.ts must be under 500 lines');
  assert.ok(lineCount(paths.finderCss) < 420, 'assets/css/finder.css must be under 420 lines');
  assert.ok(lineCount(paths.config) < 500, 'assets/data/finder-config.json must be under 500 lines');

  const context = createBrowserContext();
  runBrowserBuild(context, paths.exportJs);
  assert.equal(typeof context.DesignExport?.classifyPalette, 'function', 'DesignExport.classifyPalette is unavailable');
  runBrowserBuild(context, paths.finderJs);
  assert.equal(typeof context.DesignFinder?.score, 'function', 'DesignFinder.score is unavailable');

  const styleIds = new Set(isms
    .filter((ism) => ism.kind === undefined || ism.kind === 'style')
    .map((ism) => ism.id));
  let combinations = 0;
  let resultCount = 0;

  for (const project of expectedOptions.project) {
    for (const mood of expectedOptions.mood) {
      for (const brightness of expectedOptions.brightness) {
        const answers = { project, mood, brightness };
        const first = context.DesignFinder.score(isms, guides, config, answers);
        const second = context.DesignFinder.score(isms, guides, config, answers);
        const label = `${project}/${mood}/${brightness}`;

        assert.equal(first.length, 3, `${label}: expected exactly 3 results`);
        assert.equal(JSON.stringify(first), JSON.stringify(second), `${label}: scoring is not deterministic`);

        const resultIds = first.map((result) => result.id);
        assert.equal(new Set(resultIds).size, 3, `${label}: result IDs are not unique`);
        for (const result of first) {
          assert.ok(styleIds.has(result.id), `${label}: ${result.id} is not a valid style ISM`);
          assert.notEqual(result.id, 'ai-slop', `${label}: ai-slop was returned`);
          assert.ok(Array.isArray(result.reasons) && result.reasons.length > 0, `${label}: ${result.id} has no reasons`);
        }

        combinations += 1;
        resultCount += first.length;
      }
    }
  }

  assert.equal(combinations, 144, 'expected 144 answer combinations');
  assert.equal(resultCount, 432, 'expected 432 deterministic results');
  const optionCount = Object.values(expectedOptions).reduce((sum, ids) => sum + ids.length, 0);
  console.log(`finder ok: ${questionIds.length} questions, ${optionCount} options, ${combinations} combinations, ${resultCount} deterministic results, ${isms.length} prompt packs`);
} catch (error) {
  console.error(`finder verification failed: ${error.message}`);
  process.exitCode = 1;
}
