#!/usr/bin/env node
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { evidenceRootAbs, relativePath, shaFile, treeFingerprint, writeJsonAtomic } from './final-qa-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'); const evidenceRoot = evidenceRootAbs(root);
const qaDir = evidenceRoot; const receiptPath = join(evidenceRoot, '112_final_browser_receipt.json');
const pages = [{ id: 'index', selector: '.ism-card', count: 49, data: 'assets/data/isms.json' },
  { id: 'effects', selector: '.effect-card', count: 94, data: 'assets/data/effects.json' },
  { id: 'faq', selector: '.faq-item', count: 18, data: 'assets/data/faq.json' },
  { id: 'color', selector: '.color-card', count: 25, data: 'assets/data/color.json' },
  { id: 'typography', selector: '.typo-card', count: 20, data: 'assets/data/typography.json' },
  { id: 'layout', selector: '.layout-card', count: 25, data: 'assets/data/layout.json' },
  { id: 'motion', selector: '.motion-card', count: 20, data: 'assets/data/motion.json' }];
const widths = [1440, 1180, 1024, 860, 640, 390]; const cdpPort = 9333;
mkdirSync(qaDir, { recursive: true });

class Cdp {
  constructor(url) { this.url = url; this.id = 0; this.pending = new Map(); this.reset(''); }
  isSameOrigin(url) { try { return Boolean(this.baseOrigin) && new URL(url).origin === this.baseOrigin; } catch { return false; } }
  async connect() {
    this.ws = new WebSocket(this.url); await new Promise((resolveConnect, reject) => { this.ws.onopen = resolveConnect; this.ws.onerror = () => reject(new Error('CDP socket failed')); });
    this.ws.onmessage = event => { const message = JSON.parse(event.data); if (message.id) { const pending = this.pending.get(message.id); if (!pending) return; this.pending.delete(message.id); message.error ? pending.reject(new Error(JSON.stringify(message.error))) : pending.resolve(message.result); return; } this.capture(message); };
  }
  capture(message) {
    const p = message.params ?? {}; let captured = false;
    if (message.method === 'Network.requestWillBeSent') { this.requests.set(p.requestId, p.request?.url); if (this.isSameOrigin(p.request?.url)) this.lastDiagnosticAt = Date.now(); }
    if (message.method === 'Network.loadingFinished') { const url = this.requests.get(p.requestId); if (this.isSameOrigin(url)) this.lastDiagnosticAt = Date.now(); this.requests.delete(p.requestId); }
    if (message.method === 'Runtime.exceptionThrown') { this.events.exceptions.push(p.exceptionDetails?.text ?? 'exception'); captured = true; }
    if (message.method === 'Runtime.consoleAPICalled' && ['error', 'assert'].includes(p.type)) { this.events.consoleErrors.push(p.args?.map(value => value.value ?? value.description).join(' ') ?? p.type); captured = true; }
    if (message.method === 'Log.entryAdded' && p.entry?.level === 'error') { this.events.logErrors.push(p.entry.text); captured = true; }
    if (message.method === 'Network.loadingFailed' && !p.canceled) { const url = this.requests.get(p.requestId); if (this.isSameOrigin(url)) { this.events.failedRequests.push({ url, errorText: p.errorText }); captured = true; } this.requests.delete(p.requestId); }
    if (message.method === 'Network.responseReceived' && this.isSameOrigin(p.response?.url) && p.response.status >= 400) { this.events.badResponses.push({ url: p.response.url, status: p.response.status }); captured = true; }
    if (captured) this.lastDiagnosticAt = Date.now();
  }
  call(method, params = {}) {
    const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolveCall, reject) => { const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout ${method}`)); }, 30000); this.pending.set(id, { resolve: value => { clearTimeout(timer); resolveCall(value); }, reject: error => { clearTimeout(timer); reject(error); } }); });
  }
  async evaluate(expression) {
    const value = await this.call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (value.exceptionDetails) throw new Error(`evaluate failed: ${value.exceptionDetails.text}`); return value.result.value;
  }
  reset(base) { this.base = base; this.baseOrigin = base ? new URL(base).origin : ''; this.requests = new Map(); this.events = { exceptions: [], consoleErrors: [], logErrors: [], failedRequests: [], badResponses: [] }; this.lastDiagnosticAt = Date.now(); }
  close() { this.ws?.close(); }
}
function startServer() {
  const child = spawn(process.execPath, ['scripts/serve-static.mjs', '--root', '.pages', '--host', '127.0.0.1', '--port', '0'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = ''; child.stdout.on('data', value => { output += value; }); child.stderr.on('data', value => { output += value; });
  const ready = new Promise((resolveReady, reject) => { const started = Date.now(); const timer = setInterval(() => { const match = output.match(/http:\/\/127\.0\.0\.1:(\d+) root=(.+)/); if (match) { clearInterval(timer); resolveReady({ port: Number(match[1]), root: match[2].trim() }); } else if (Date.now() - started > 8000) { clearInterval(timer); reject(new Error(`browser server timeout ${output}`)); } }, 25); });
  return { child, ready };
}
async function portClosed(url) { try { await fetch(url, { signal: AbortSignal.timeout(500) }); return false; } catch { return true; } }
async function waitPortClosed(url, timeout = 5000) { const started = Date.now(); while (Date.now() - started < timeout) { if (await portClosed(url)) return true; await new Promise(resolveWait => setTimeout(resolveWait, 100)); } return false; }
async function waitUntil(cdp, expression, label) {
  const started = Date.now(); while (Date.now() - started < 25000) { if (await cdp.evaluate(expression)) return; await new Promise(resolveWait => setTimeout(resolveWait, 150)); }
  throw new Error(`timeout waiting for ${label}`);
}
async function waitForQuiet(cdp, duration = 500, timeout = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (Date.now() - cdp.lastDiagnosticAt >= duration) return;
    await new Promise(resolveWait => setTimeout(resolveWait, 50));
  }
  throw new Error(`diagnostic quiet window timeout: ${JSON.stringify(cdp.events)}`);
}
async function assertCleanDiagnostics(cdp, label) {
  await waitForQuiet(cdp, 500);
  if (Object.values(cdp.events).some(value => value.length)) throw new Error(`${label} diagnostics failed ${JSON.stringify(cdp.events)}`);
}
async function screenshot(cdp, page, width, state) {
  const name = state === 'ready' ? `final-${page}-${width}.png` : `final-${page}-error-${width}.png`; const path = join(qaDir, name);
  const capture = await cdp.call('Page.captureScreenshot', { format: 'png', fromSurface: true }); writeFileSync(path, Buffer.from(capture.data, 'base64'));
  const fd = openSync(path, 'r'); try { fsyncSync(fd); } finally { closeSync(fd); }
  const meta = await sharp(path, { failOn: 'error' }).metadata(); return { path: relativePath(root, path), sha256: shaFile(path), width: meta.width, height: meta.height, page, viewportWidth: width, state };
}
async function stopChild(child) {
  if (child.exitCode !== null) return { code: child.exitCode, signal: child.signalCode, forced: false };
  const exited = new Promise(resolveExit => child.once('exit', (code, signal) => resolveExit({ code, signal, forced: false }))); child.kill('SIGTERM');
  const graceful = await Promise.race([exited, new Promise(resolveWait => setTimeout(() => resolveWait(null), 4000))]); if (graceful) return graceful;
  child.kill('SIGKILL'); return await Promise.race([new Promise(resolveExit => child.once('exit', (code, signal) => resolveExit({ code, signal, forced: true }))), new Promise((_, reject) => setTimeout(() => reject(new Error('owned process SIGKILL timeout')), 2000))]);
}
async function launchBrowser(browserEnv, current) {
  current?.close();
  const stopped = spawnSync('agbrowse', ['stop'], { cwd: root, env: browserEnv, encoding: 'utf8' });
  if (stopped.status !== 0) throw new Error(`isolated browser stop failed: ${stopped.stderr || stopped.stdout}`);
  if (!await waitPortClosed(`http://127.0.0.1:${cdpPort}/json/version`, 15000)) throw new Error(`CDP port ${cdpPort} already in use`);
  const started = spawnSync('agbrowse', ['start', '--headless', '--port', String(cdpPort)], { cwd: root, env: browserEnv, encoding: 'utf8' });
  if (started.status !== 0) throw new Error(`isolated browser start failed: ${started.stderr || started.stdout}`);
  let targets;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { targets = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then(response => response.json()); if (targets.length) break; } catch {}
    await new Promise(resolveWait => setTimeout(resolveWait, 100));
  }
  const target = targets?.find(value => value.type === 'page' && !value.url.startsWith('devtools:'));
  if (!target) throw new Error('isolated page target missing');
  const next = new Cdp(target.webSocketDebuggerUrl); await next.connect();
  for (const method of ['Page.enable', 'Runtime.enable', 'Log.enable', 'Network.enable']) await next.call(method);
  await next.call('Network.setCacheDisabled', { cacheDisabled: true });
  return next;
}

const browserHome = join(root, '.tmp/final-browser-home'); rmSync(browserHome, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 }); mkdirSync(browserHome, { recursive: true });
const server = startServer();
const browserEnv = { ...process.env, BROWSER_AGENT_HOME: browserHome, AGBROWSE_UPDATE_CHECK: '0', CDP_PORT: String(cdpPort) };
let cdp; let base; let serverPort; let failure; let qaStep = 'startup'; let browserSessions = 0; const rows = []; const screenshots = []; const flows = [];
const teardown = { serverExitCode: null, browserStopExitCode: null, serverPortClosed: false, cdpPortClosed: false, profileRemoved: false };
try {
  const ready = await server.ready; serverPort = ready.port; base = `http://127.0.0.1:${serverPort}`;
  for (const width of widths) {
    for (const page of pages) {
    cdp = await launchBrowser(browserEnv, cdp); browserSessions += 1;
    qaStep = `matrix ${page.id}/${width}`;
    await cdp.call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false }); cdp.reset(base);
    const rowUrl = `${base}/${page.id}.html?qa=${Date.now()}-${width}`; await cdp.call('Page.navigate', { url: rowUrl });
    await waitUntil(cdp, `location.href===${JSON.stringify(rowUrl)}&&document.readyState==='complete'&&document.querySelectorAll('${page.selector}').length===${page.count}`, `${page.id}/${width}`);
    await waitUntil(cdp, `!document.querySelector('#loading-overlay')`, `${page.id}/${width} loading teardown`); await waitForQuiet(cdp, 500);
    const state = await cdp.evaluate(`(()=>{const badImages=[...document.images].filter(i=>{const b=i.getBoundingClientRect();return getComputedStyle(i).display!=='none'&&b.bottom>0&&b.top<innerHeight&&b.right>0&&b.left<innerWidth&&(!i.complete||!i.naturalWidth)}).length;return {page:'${page.id}',width:innerWidth,count:document.querySelectorAll('${page.selector}').length,nav:document.querySelectorAll('[data-nav-axis]').length,current:document.querySelectorAll('[aria-current="page"]').length,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),badImages}})()`);
    const diagnostics = structuredClone(cdp.events); const okay = state.width === width && state.count === page.count && state.nav === 6 && state.current === 1 && state.overflow === 0 && state.badImages === 0 && Object.values(diagnostics).every(value => value.length === 0);
    rows.push({ ...state, diagnostics, ok: okay }); if (!okay) throw new Error(`matrix failure ${JSON.stringify(rows.at(-1))}`);
    if ([1440, 390].includes(width)) screenshots.push(await screenshot(cdp, page.id, width, 'ready'));
    }
  }
  qaStep = 'index critical flow';
  cdp = await launchBrowser(browserEnv, cdp); browserSessions += 1;
  await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  cdp.reset(base);
  await cdp.call('Page.navigate', { url: `${base}/index.html?flow=${Date.now()}` }); await waitUntil(cdp, `document.querySelectorAll('.ism-card').length===49&&!document.querySelector('#loading-overlay')`, 'index flow');
  const indexFlow = await cdp.evaluate(`(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const imageReady=img=>img.complete&&img.naturalWidth?Promise.resolve():new Promise(r=>{img.addEventListener('load',r,{once:true});setTimeout(r,2000)});const search=document.querySelector('.search-input');search.value='qa-no-such-ism';search.dispatchEvent(new Event('input',{bubbles:true}));await wait(50);const empty=!!document.querySelector('.empty-state')&&document.querySelectorAll('.ism-card').length===0;search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));await wait(50);const searchReset=document.querySelectorAll('.ism-card').length===49;document.querySelector('#finder-trigger').click();const radios=[...document.querySelectorAll('#finder-dialog .finder-radio')];for(const name of new Set(radios.map(r=>r.name))){const radio=radios.find(r=>r.name===name);radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}))}document.querySelector('#finder-submit').click();await wait(100);const finderThree=document.querySelectorAll('.finder-result').length===3;document.querySelector('#finder-dialog').close();const trigger=document.querySelector('.ism-card[data-id="minimalism"] .ism-name-btn');trigger.focus();trigger.click();await wait(80);const modal=document.querySelector('#modal-overlay').getAttribute('aria-hidden')==='false';const relatedFive=document.querySelectorAll('.modal-related-card').length===5;const promptPresent=document.querySelector('.modal-prompt-main')?.textContent.trim().length>20;const preview=document.querySelector('.modal-main-image img');await imageReady(preview);const previewWebp=preview.currentSrc.includes('.webp');const previewDimensions=preview.naturalWidth===768&&preview.naturalHeight===512;let copyFeedback=false;const copyButton=document.querySelector('#ism-modal-dialog .export-copy');if(copyButton){try{document.execCommand=()=>true}catch{}const copied=new Promise(resolve=>document.addEventListener('design-export-copy',event=>resolve(event.detail?.success===true&&String(event.detail?.announcement||'').startsWith('Copied')),{once:true}));copyButton.click();copyFeedback=await Promise.race([copied,wait(700).then(()=>false)])}preview.click();await wait(80);const lightboxImage=document.querySelector('#lightbox img');await imageReady(lightboxImage);const lightbox=document.querySelector('#lightbox').getAttribute('aria-hidden')==='false';const lightboxPng=lightboxImage.src.includes('.png');const lightboxDimensions=lightboxImage.naturalWidth===1536&&lightboxImage.naturalHeight===1024;document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(30);const escapeOrder=document.querySelector('#lightbox').getAttribute('aria-hidden')==='true'&&document.querySelector('#modal-overlay').getAttribute('aria-hidden')==='false';document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(30);const focusReturn=document.querySelector('#modal-overlay').getAttribute('aria-hidden')==='true'&&document.activeElement===trigger;return {empty,searchReset,finderThree,modal,relatedFive,promptPresent,previewWebp,previewDimensions,copyFeedback,lightbox,lightboxPng,lightboxDimensions,escapeOrder,focusReturn}})()`); if (!Object.values(indexFlow).every(Boolean)) throw new Error(`index flow failed ${JSON.stringify(indexFlow)}`); flows.push({ id: 'index', ...indexFlow });
  await assertCleanDiagnostics(cdp, 'index flow'); qaStep = 'effects critical flow';
  cdp = await launchBrowser(browserEnv, cdp); browserSessions += 1; cdp.reset(base);
  await cdp.call('Page.navigate', { url: `${base}/effects.html?flow=${Date.now()}` }); await waitUntil(cdp, `document.querySelectorAll('.effect-card').length===94&&!document.querySelector('#loading-overlay')`, 'effects flow');
  await cdp.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const effectsFlow = await cdp.evaluate(`(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const imageReady=img=>img.complete&&img.naturalWidth?Promise.resolve():new Promise(r=>{img.addEventListener('load',r,{once:true});setTimeout(r,2000)});const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const expected={'Interface Pattern':46,'Scroll & Parallax':8,'Text Motion':8,'Hero & Background':8,'Cursor & Pointer':8,'View Transition':8,'Micro-interaction':8};const observed={};for(const name of Object.keys(expected)){const button=[...document.querySelectorAll('.effects-filter-btn[data-filter-kind="family"]')].find(candidate=>candidate.dataset.filterValue===name);button.click();await wait(30);observed[name]=document.querySelectorAll('.effect-card').length}const familiesExact=Object.entries(expected).every(([name,count])=>observed[name]===count);document.querySelector('.effects-filter-btn[data-filter-kind="family"][data-filter-value="all"]').click();await wait(30);const filterReset=document.querySelectorAll('.effect-card').length===94;const search=document.querySelector('#effects-search');search.value='no-such-effect-qa';search.dispatchEvent(new Event('input',{bubbles:true}));await wait(30);const empty=!!document.querySelector('.effects-empty')&&document.querySelectorAll('.effect-card').length===0;document.querySelector('#effects-filter-reset').click();await wait(30);const searchReset=document.querySelectorAll('.effect-card').length===94;const favorite=document.querySelector('.effect-card[data-effect-id="favorite-burst"] .demo-favorite-core');favorite.click();const stateToggle=favorite.getAttribute('aria-pressed')==='true';const trigger=document.querySelector('.effect-card[data-effect-id="bottom-sheet"]');trigger.focus();trigger.click();await wait(100);const modal=document.querySelector('#effect-modal-overlay').getAttribute('aria-hidden')==='false';const docsEight=document.querySelectorAll('#effect-modal-dialog .effect-docs-block').length===8;const refsTwo=document.querySelectorAll('#effect-modal-dialog .effect-docs-refs a').length===2;const guide=document.querySelector('#effect-modal-dialog .effect-guide-image');await imageReady(guide);const previewWebp=guide.currentSrc.includes('.webp');const previewDimensions=guide.naturalWidth===768&&guide.naturalHeight===512;guide.click();await wait(80);const lightboxImage=document.querySelector('#effect-lightbox-image');await imageReady(lightboxImage);const lightbox=document.querySelector('#effect-lightbox').getAttribute('aria-hidden')==='false';const lightboxPng=lightboxImage.src.includes('.png');const lightboxDimensions=lightboxImage.naturalWidth===1536&&lightboxImage.naturalHeight===1024;document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(30);for(let i=0;i<20&&!document.querySelector('#effect-code-mount .export-copy[data-copy-tab="html"]');i++)await wait(50);let copyFeedback=false;const copyButton=document.querySelector('#effect-code-mount .export-copy[data-copy-tab="html"]');if(copyButton){try{document.execCommand=()=>true}catch{}const copied=new Promise(resolve=>document.addEventListener('design-export-copy',event=>resolve(event.detail?.success===true&&event.detail?.announcement==='Copied html'),{once:true}));copyButton.click();copyFeedback=await Promise.race([copied,wait(700).then(()=>false)])}document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(30);const focusReturn=document.querySelector('#effect-modal-overlay').getAttribute('aria-hidden')==='true'&&document.activeElement===trigger;return {reduced,familiesExact,filterReset,empty,searchReset,stateToggle,modal,docsEight,refsTwo,previewWebp,previewDimensions,lightbox,lightboxPng,lightboxDimensions,copyFeedback,focusReturn}})()`); if (!Object.values(effectsFlow).every(Boolean)) throw new Error(`effects flow failed ${JSON.stringify(effectsFlow)}`); flows.push({ id: 'effects', ...effectsFlow });
  const devicesExact = await cdp.evaluate(`(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const expected={Mobile:11,Shared:51,Desktop:32};for(const [name,count] of Object.entries(expected)){document.querySelector('.effects-filter-btn[data-filter-kind="device"][data-filter-value="'+name+'"]').click();await wait(40);if(document.querySelectorAll('.effect-card').length!==count)return false}document.querySelector('.effects-filter-btn[data-filter-kind="device"][data-filter-value="all"]').click();await wait(40);return document.querySelectorAll('.effect-card').length===94})()`);
  if (!devicesExact) throw new Error('effects device filters failed'); Object.assign(flows.at(-1), { devicesExact });
  const reducedContract = await cdp.evaluate(`(()=>{const toMs=value=>value.trim().endsWith('ms')?parseFloat(value):parseFloat(value)*1000;const durations=[...document.querySelectorAll('#effects-grid *')].flatMap(element=>{const style=getComputedStyle(element);return [...style.animationDuration.split(','),...style.transitionDuration.split(',')].map(toMs).filter(Number.isFinite)});return {reducedCards:document.querySelectorAll('.effect-card').length===94,reducedOverflow:document.documentElement.scrollWidth<=innerWidth,reducedDurations:durations.length>0&&durations.every(value=>value<=0.02)}})()`);
  if (!Object.values(reducedContract).every(Boolean)) throw new Error(`effects reduced-motion contract failed ${JSON.stringify(reducedContract)}`); Object.assign(flows.at(-1), reducedContract);
  await assertCleanDiagnostics(cdp, 'effects flow'); qaStep = 'faq critical flow';
  cdp = await launchBrowser(browserEnv, cdp); browserSessions += 1; cdp.reset(base);
  await cdp.call('Page.navigate', { url: `${base}/faq.html?flow=${Date.now()}` }); await waitUntil(cdp, `document.querySelectorAll('.faq-item').length===18`, 'faq flow');
  const faqFlow = await cdp.evaluate(`(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));let buttons=[...document.querySelectorAll('.faq-question')];const before=buttons[0].textContent;buttons[0].click();const expanded=buttons[0].getAttribute('aria-expanded')==='true';const sources=document.querySelectorAll('.faq-answer:not([hidden]) .faq-sources a').length>0;buttons[0].focus();buttons[0].dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));const arrowDown=document.activeElement===buttons[1];buttons[1].dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));const end=document.activeElement===buttons.at(-1);buttons.at(-1).dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));const home=document.activeElement===buttons[0];document.querySelector('#lang-toggle').click();await wait(50);buttons=[...document.querySelectorAll('.faq-question')];const localePreserved=document.documentElement.lang==='en'&&buttons[0].getAttribute('aria-expanded')==='true';const translated=buttons[0].textContent!==before;buttons[0].click();const collapsed=buttons[0].getAttribute('aria-expanded')==='false';return {expanded,sources,arrowDown,end,home,localePreserved,translated,collapsed}})()`); if (!Object.values(faqFlow).every(Boolean)) throw new Error(`faq flow failed ${JSON.stringify(faqFlow)}`); flows.push({ id: 'faq', ...faqFlow });
  const arrowUp = await cdp.evaluate(`(()=>{const buttons=[...document.querySelectorAll('.faq-question')];buttons[1].focus();buttons[1].dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}));return document.activeElement===buttons[0]})()`);
  if (!arrowUp) throw new Error('faq ArrowUp failed'); Object.assign(flows.at(-1), { arrowUp });
  await assertCleanDiagnostics(cdp, 'faq flow'); qaStep = 'crosslink round-trip flow';
  cdp = await launchBrowser(browserEnv, cdp); browserSessions += 1; cdp.reset(base);
  await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.call('Page.navigate', { url: `${base}/index.html?cross=${Date.now()}#minimalism` });
  await waitUntil(cdp, `document.querySelectorAll('.ism-card').length===49&&document.querySelector('#modal-overlay')?.classList.contains('active')`, 'crosslink ism modal');
  await waitUntil(cdp, `document.querySelector('#ism-catalog-links')?.dataset.crosslinksState==='ready'`, 'crosslink hydrate');
  const crossForward = await cdp.evaluate(`(()=>{const chips=document.querySelectorAll('.crosslink-chip').length;const link=document.querySelector('a[href="./color.html#minimalism-neutral"]');if(link)link.click();return {chips,linked:!!link}})()`);
  await waitUntil(cdp, `location.pathname.endsWith('/color.html')&&document.querySelector('#color-modal-overlay')?.classList.contains('active')`, 'crosslink color modal');
  const crossReverse = await cdp.evaluate(`(()=>{const link=document.querySelector('#color-modal-content a[href="./index.html#minimalism"]');if(link)link.click();return {reverseLink:!!link}})()`);
  await waitUntil(cdp, `location.pathname.endsWith('/index.html')&&location.hash==='#minimalism'&&document.querySelector('#modal-overlay')?.classList.contains('active')`, 'crosslink round trip');
  const crosslinkFlow = { chips: crossForward.chips > 0, forwardLink: crossForward.linked, reverseLink: crossReverse.reverseLink, roundTrip: true };
  if (!Object.values(crosslinkFlow).every(Boolean)) throw new Error(`crosslink flow failed ${JSON.stringify(crosslinkFlow)}`); flows.push({ id: 'crosslink', ...crosslinkFlow });
  await assertCleanDiagnostics(cdp, 'crosslink flow');
  for (const page of pages) {
    qaStep = `${page.id} fault/retry flow`;
    cdp = await launchBrowser(browserEnv, cdp); browserSessions += 1; cdp.reset(base);
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: false });
    const data = join(root, '.pages', page.data); const fault = data + '.fault'; if (existsSync(fault)) renameSync(fault, data);
    try {
      renameSync(data, fault); await cdp.call('Page.navigate', { url: `${base}/${page.id}.html?fault=${Date.now()}` }); await waitUntil(cdp, `!!document.querySelector('.page-error-state[role="alert"]')`, `${page.id} alert`);
      await new Promise(resolveWait => setTimeout(resolveWait, 900));
      const errorState = await cdp.evaluate(`(()=>{const alert=document.querySelector('.page-error-state[role="alert"]');const loading=document.querySelector('#loading-overlay');const rect=alert.getBoundingClientRect();return {width:innerWidth,visible:rect.width>0&&rect.height>0&&getComputedStyle(alert).visibility!=='hidden',loadingVisible:!!loading&&getComputedStyle(loading).opacity!=='0'}})()`);
      if (errorState.width !== 390 || !errorState.visible || errorState.loadingVisible) throw new Error(`${page.id} error state not visibly ready ${JSON.stringify(errorState)}`); screenshots.push(await screenshot(cdp, page.id, 390, 'error'));
      renameSync(fault, data); cdp.reset(base); await cdp.evaluate(`document.querySelector('.page-error-retry').click()`);
      await waitUntil(cdp, `document.querySelectorAll('${page.selector}').length===${page.count}&&!document.querySelector('.page-error-state')&&!document.querySelector('#loading-overlay')`, `${page.id} retry`); await waitForQuiet(cdp, 500);
      const cleanDiagnostics = Object.values(cdp.events).every(value => value.length === 0);
      flows.push({ id: `${page.id}-error-retry`, alert: true, restored: existsSync(data) && !existsSync(fault), recovered: true,
        errorRemoved: await cdp.evaluate(`!document.querySelector('.page-error-state')`), loadingRemoved: await cdp.evaluate(`!document.querySelector('#loading-overlay')`), cleanDiagnostics, width: errorState.width });
    } finally { if (existsSync(fault)) renameSync(fault, data); }
  }
} catch (error) { failure = new Error(`${qaStep}: ${error.message}`, { cause: error }); }
finally {
  cdp?.close(); const serverStop = await stopChild(server.child).catch(() => null); teardown.serverExitCode = serverStop?.code ?? null; teardown.serverSignal = serverStop?.signal ?? null; teardown.serverForced = serverStop?.forced ?? true;
  const browserStop = spawnSync('agbrowse', ['stop'], { cwd: root, env: browserEnv, encoding: 'utf8' }); teardown.browserStopExitCode = browserStop.status;
  if (serverPort) teardown.serverPortClosed = await waitPortClosed(`http://127.0.0.1:${serverPort}/`); teardown.cdpPortClosed = await waitPortClosed(`http://127.0.0.1:${cdpPort}/json/version`);
  if (teardown.cdpPortClosed) { rmSync(browserHome, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 }); teardown.profileRemoved = !existsSync(browserHome); }
  teardown.browserSessions = browserSessions;
  teardown.finishedAt = new Date().toISOString();
}
if (failure) throw failure;
if (rows.length !== 42 || screenshots.length !== 21 || teardown.browserSessions !== 53 || teardown.serverExitCode !== 0 || teardown.serverForced || !teardown.serverPortClosed || !teardown.cdpPortClosed || !teardown.profileRemoved || teardown.browserStopExitCode !== 0) throw new Error(`browser QA incomplete ${JSON.stringify({ rows: rows.length, screenshots: screenshots.length, teardown })}`);
const receipt = { schemaVersion: 1, createdAt: new Date().toISOString(), governedTreeSha256: treeFingerprint(root).sha256,
  stagedManifestSha256: shaFile(join(root, '.pages/manifest.json')), widths, pages: pages.map(({ id, count }) => ({ id, count })), rows, flows, screenshots, teardown };
writeJsonAtomic(receiptPath, receipt);
console.log(`final browser qa ok: rows=${rows.length} flows=${flows.length} screenshots=${screenshots.length} teardown=true`);
