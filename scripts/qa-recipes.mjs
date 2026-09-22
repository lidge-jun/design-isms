// Run with an existing Playwright runtime; never installs a browser or dependency.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDesignCore } from './design-core-loader.mjs';
import sharp from 'sharp';

export default async function scenario({ page, baseURL, outputDir }) {
  const core = loadDesignCore();
  const errors = [], requests = [], captures = [], checks = [];
  let injecting = false;
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !injecting) errors.push(message.text()); });
  page.on('request', request => { requests.push(new URL(request.url()).pathname + new URL(request.url()).search); });
  const root = page.locator('#recipe-workbench');
  const summary = root.locator(':scope > summary');
  async function ready() { await page.waitForFunction(() => document.querySelector('#recipe-workbench')?.dataset.state === 'ready'); }
  async function settle() {
    return page.evaluate(async () => {
      const bounded = async (promise, label) => {
        let timer;
        try {
          await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label)), 8000); })]);
          return true;
        } catch { return false; } finally { clearTimeout(timer); }
      };
      const fonts = await bounded(document.fonts.ready, 'fonts');
      const visibleImages = [...document.images].filter(image => {
        const r = image.getBoundingClientRect(); return r.width && r.height && r.top < innerHeight && r.bottom > 0;
      });
      const decoded = await Promise.all(visibleImages.map(image => bounded(image.decode(), image.src)));
      await new Promise(requestAnimationFrame);
      return { fonts, images: visibleImages.length, failedImages: decoded.filter(value => !value).length };
    });
  }
  async function measurements() {
    return page.evaluate(() => {
      const root = document.querySelector('#recipe-workbench');
      const visible = node => { const r = node.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const targets = [...root.querySelectorAll('button,select,summary,a,label.recipe-option')].filter(visible).map(node => {
        const r = node.getBoundingClientRect();
        return { tag: node.tagName, label: node.getAttribute('aria-label') || node.textContent.trim().slice(0,90), width: r.width, height: r.height };
      });
      const clipped = [...root.querySelectorAll('h2,h3,p,span,li,a,label')].filter(node => visible(node)
        && node.scrollWidth > node.clientWidth + 2 && getComputedStyle(node).display !== 'inline').map(node => node.textContent.trim().slice(0,90));
      const typography = [...root.querySelectorAll('h2,p,label,button,select,summary')].filter(visible).map(node => {
        const style = getComputedStyle(node);
        return { tag: node.tagName, size: parseFloat(style.fontSize), lineHeight: style.lineHeight, tracking: style.letterSpacing };
      });
      return { viewport: { width: innerWidth, height: innerHeight }, overflow: document.documentElement.scrollWidth > innerWidth,
        clipped, targets, typography, text: root.innerText, version: root.dataset.version };
    });
  }
  async function capture(name, width, height = 900, offset = 0) {
    await page.setViewportSize({ width, height });
    await root.scrollIntoViewIfNeeded();
    await page.evaluate(offset => {
      const top = document.querySelector('#recipe-workbench').getBoundingClientRect().top + scrollY;
      const header = document.querySelector('.site-header').getBoundingClientRect().height;
      window.scrollTo({ top: Math.max(0, top - header - 12 + offset), behavior: 'instant' });
    }, offset);
    const readiness = await settle();
    const measured = await measurements();
    assert.equal(measured.overflow, false, name + ' page overflow');
    assert.deepEqual(measured.clipped, [], name + ' clipped text');
    assert.equal(readiness.fonts, true, name + ' fonts');
    assert.equal(readiness.failedImages, 0, name + ' images');
    const path = join(outputDir, name + '.png');
    await page.screenshot({ path });
    const meta = await sharp(path).metadata();
    assert.equal(meta.width, width); assert.equal(meta.height, height);
    captures.push({ name, file: name + '.png', width, height, readiness, ...measured });
  }
  async function goIndex() {
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('.ism-card').length === 49);
    await page.locator('#loading-overlay').waitFor({ state: 'detached' });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await goIndex();
  assert.equal(await root.evaluate(node => node.open), false);
  assert.equal(requests.filter(path => path.endsWith('/recipes.json')).length, 0);
  await capture('index-closed-desktop', 1440);
  const before = requests.length;
  await summary.click(); await ready();
  assert.equal(await root.getAttribute('data-version'), core.snapshot.version);
  const opened = requests.slice(before);
  for (const path of core.catalog.SOURCE_FILES) assert.equal(opened.filter(url => url === '/' + path).length, 1, path);
  const loadedRequests = requests.length;
  await summary.click(); await summary.click(); await ready();
  assert.equal(requests.slice(loadedRequests).filter(path => /\/assets\/data\//.test(path)).length, 0);
  checks.push('closed:no recipe requests; first open:ten exact files once; reopen:no additional data; Node/browser SHA equal');

  for (const recipe of core.recipeList) {
    await root.locator(`input[name="recipe-choice"][value="${recipe.id}"]`).check();
    await page.waitForFunction(title => document.querySelector('.recipe-title')?.textContent === title, recipe.title.ko);
    assert.equal(await root.locator('select[data-slot]').count(), 6);
  }
  await root.locator('select[data-slot="style"]').selectOption('isms/bauhaus');
  assert.equal(await root.locator('select[data-slot="style"]').inputValue(), 'isms/bauhaus');
  const detail = root.locator('details[data-detail]').first();
  await detail.locator('summary').click();
  await page.locator('#lang-toggle').click();
  await page.waitForFunction(() => document.documentElement.lang === 'en');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'lang-toggle');
  assert.equal(await root.locator('input[name="recipe-choice"]:checked').inputValue(), 'settings-workspace');
  assert.equal(await root.locator('select[data-slot="style"]').inputValue(), 'isms/bauhaus');
  assert.equal(await root.locator('details[data-detail]').first().evaluate(node => node.open), true);
  await root.locator('details[data-detail]').first().locator('summary').click();
  await capture('recipes-desktop-en', 1440);
  await page.locator('#lang-toggle').click();
  await page.waitForFunction(() => document.documentElement.lang === 'ko');
  checks.push('all recipes, allowed alternative, language selection/details/focus preservation');

  await page.evaluate(() => {
    window.__copiedBrief = null;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async text => { window.__copiedBrief = text; }
    } });
  });
  await root.locator('[data-action="copy"]').click();
  await page.waitForFunction(() => window.__copiedBrief?.includes('설정 편집과 저장 상태'));
  await page.waitForFunction(() => /복사/.test(document.querySelector('.recipe-status')?.textContent || ''));
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
    writeText: async () => { throw new DOMException('Denied', 'NotAllowedError'); }
  } }));
  await root.locator('[data-action="copy"]').click();
  const manual = root.locator('.recipe-manual-copy textarea');
  await manual.waitFor({ state: 'visible' });
  assert.ok((await manual.inputValue()).includes('설정 편집과 저장 상태'));
  assert.equal(await manual.evaluate(node => node.readOnly), true);
  await capture('recipes-manual-copy', 1440);
  checks.push('confirmed clipboard promise and denied clipboard manual fallback; no fabricated success');

  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
    writeText: () => new Promise(resolve => { window.__completeCopy = resolve; })
  } }));
  await root.locator('[data-action="copy"]').click();
  await root.locator('input[name="recipe-choice"][value="editorial-reading"]').check();
  await page.evaluate(() => window.__completeCopy());
  await page.evaluate(() => new Promise(requestAnimationFrame));
  assert.equal(await root.locator('.recipe-status').textContent(), '자동 복사를 사용할 수 없습니다. 아래 가이드를 직접 복사하세요.');
  assert.ok((await root.locator('.recipe-manual-copy textarea').inputValue()).includes('기사 탐색과 차분한 읽기'));
  checks.push('late clipboard success cannot confirm an obsolete selection; manual copy follows current recipe');

  await root.locator('input[name="recipe-choice"][value="product-landing"]').check();
  const ref = root.locator('a[data-domain="isms"]').first();
  await ref.click();
  await page.waitForFunction(() => document.querySelector('#modal-overlay')?.getAttribute('aria-hidden') === 'false');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('#modal-overlay')?.getAttribute('aria-hidden') === 'true');
  assert.equal(await ref.evaluate(node => document.activeElement === node), true);
  const rapidFocus = await ref.evaluate(async node => {
    node.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(requestAnimationFrame);
    return document.activeElement === node;
  });
  assert.equal(rapidFocus, true, 'same-frame close must invalidate scheduled modal focus');
  checks.push('recipe ISM modal open/Escape and trigger focus restoration');

  await page.locator('#finder-trigger').click();
  await page.locator('#finder-form').waitFor({ state: 'visible' });
  for (const name of ['project', 'mood', 'brightness']) await page.locator(`#finder-form input[name="${name}"]`).first().check();
  await page.locator('#finder-submit').click();
  assert.equal(await page.locator('.finder-result').count(), 3);
  await page.locator('.finder-result-open').first().click();
  assert.equal(await page.locator('#finder-dialog').evaluate(node => node.open), false);
  await page.waitForFunction(() => document.querySelector('#modal-overlay')?.getAttribute('aria-hidden') === 'false');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'finder-trigger');
  await page.locator('#finder-trigger').click(); await page.keyboard.press('Escape');
  assert.equal(await page.locator('#finder-dialog').evaluate(node => node.open), false);
  checks.push('Finder three answers/ranked results -> native dialog close -> ISM overlay -> visible trigger focus');

  // Capture the normal workflow separately from the deliberately persistent manual-copy state.
  await goIndex(); await summary.click(); await ready();

  for (const [width, height] of [[1440,900],[1024,900],[768,900],[390,844],[320,844]]) {
    await capture(`recipes-${width}-ko`, width, height);
  }
  await capture('recipes-320-middle', 320, 844, 650);
  await capture('recipes-320-bottom', 320, 844, 1200);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await capture('recipes-mobile-reduced', 390, 844);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await capture('recipes-mobile-text-scale', 390, 844);
  await capture('recipes-mobile-text-scale-middle', 390, 844, 700);
  const scaleHeight = await root.evaluate(node => node.getBoundingClientRect().height);
  await capture('recipes-mobile-text-scale-bottom', 390, 844, Math.max(0, scaleHeight - 650));
  await page.locator('#finder-trigger').click();
  const finderGeometry = await page.locator('.finder-dialog-inner').evaluate(node => ({
    width: node.clientWidth, scrollWidth: node.scrollWidth
  }));
  assert.ok(finderGeometry.scrollWidth <= finderGeometry.width + 1, 'Finder 200% text must reflow without horizontal scrolling');
  await settle();
  await page.screenshot({ path: join(outputDir, 'finder-mobile-text-scale.png') });
  captures.push({ name: 'finder-mobile-text-scale', file: 'finder-mobile-text-scale.png', width: 390, height: 844, finderGeometry });
  await page.keyboard.press('Escape');
  checks.push('Finder 390px / 200% text has no internal horizontal overflow');
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  await page.evaluate(() => {
    const title = document.querySelector('.recipe-title');
    title.dataset.original = title.textContent;
    title.textContent = '제품의 모든 사용 조건과 선택 가능한 동작을 함께 살펴보는 화면 구성';
  });
  await capture('recipes-mobile-long-ko', 390, 844);
  await page.evaluate(() => { const title = document.querySelector('.recipe-title'); title.textContent = title.dataset.original; });
  checks.push('1440/1024/768/390/320px, reduced motion, 200% text, long Korean heading');

  injecting = true;
  let failed = false;
  await page.route('**/assets/data/recipes.json', async route => {
    if (!failed) { failed = true; await route.fulfill({ status: 503, body: 'Temporary failure' }); }
    else await route.continue();
  });
  await goIndex(); await summary.click();
  await page.waitForFunction(() => document.querySelector('#recipe-workbench')?.dataset.state === 'error');
  assert.equal(await page.locator('.ism-card').count(), 49);
  await capture('recipes-mobile-error', 390, 844);
  await root.locator('[data-action="retry"]').click(); await ready();
  await page.unroute('**/assets/data/recipes.json');
  injecting = false;
  checks.push('recipe fetch failure preserves catalog; explicit retry succeeds');

  injecting = true;
  await page.route('**/assets/images/thumbs/bauhaus/*.webp', route => route.fulfill({ status: 404, body: '' }));
  await root.locator('select[data-slot="style"]').selectOption('isms/bauhaus');
  await page.waitForFunction(() => !document.querySelector('.recipe-preview img'));
  assert.ok((await root.locator('.recipe-preview').innerText()).includes('불러올 수 없습니다'));
  await page.unroute('**/assets/images/thumbs/bauhaus/*.webp');
  injecting = false;
  await root.locator('select[data-slot="style"]').selectOption('isms/minimalism');
  checks.push('broken recipe preview becomes a labelled fallback without PNG retry');

  for (const width of [1440,390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(new URL('effects.html', baseURL).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('.effect-card').length === 94);
    const measured = await page.evaluate(() => ({
      count: document.querySelectorAll('.effect-card').length,
      demos: new Set([...document.querySelectorAll('.effect-card > .effect-demo')].map(node => [...node.classList].find(name => name.startsWith('effect-demo-')))).size,
      overflow: document.documentElement.scrollWidth > innerWidth
    }));
    assert.deepEqual(measured, { count: 94, demos: 94, overflow: false });
    checks.push(`Effects ${width}:94 cards/94 demos/no overflow`);
  }
  assert.deepEqual(errors, [], 'unexpected page/console errors');
  return { version: core.snapshot.version, checks, captures, errors, clipboard: 'deterministic resolved/rejected browser API fixtures',
    scope: 'Chromium desktop emulation; no screen-reader, physical mobile or field performance certification' };
}

async function main() {
  const baseURL = process.argv[2] || 'http://127.0.0.1:4187/';
  const outputDir = resolve(process.argv[3] || 'qa-artifacts/recipes');
  const runtime = process.env.DESIGN_QA_RUNTIME;
  if (!runtime) throw new Error('Set DESIGN_QA_RUNTIME to an existing package.json whose dependencies include playwright-core; no install is performed.');
  const { chromium } = createRequire(resolve(runtime))('playwright-core');
  mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.connectOverCDP(process.env.DESIGN_QA_CDP || 'http://127.0.0.1:9222');
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ko-KR' });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  try {
    const result = await scenario({ page, baseURL, outputDir });
    writeFileSync(join(outputDir, 'report.json'), JSON.stringify({ capturedAt: new Date().toISOString(), ...result }, null, 2) + '\n');
    console.log(JSON.stringify({ ok: true, checks: result.checks, screenshots: result.captures.length, outputDir }));
  } catch (error) {
    await page.screenshot({ path: join(outputDir, 'failure.png') }).catch(() => {});
    writeFileSync(join(outputDir, 'failure.txt'), String(error.stack || error));
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
