 /**
  * app-export.ts — DesignExport global namespace (Phase 060).
  * Deterministic token derivation from isms.json palette + dev-guides.json,
  * effect snippet loading/display, and unified clipboard copy.
  *
  * Classic script: no import/export. Loads BEFORE app.js and effects.js.
  */
 namespace DesignExport {
   /* ── public types ─────────────────────────────────────────────── */
   export type ExportFormat = 'css' | 'tailwind' | 'tokens';
   export interface IsmInput { id: string; name: string; palette: string[]; }
   export interface GuideInput {
     layout: Record<string, string>;
     typography: Record<string, string>;
     color: Record<string, string>;
     motion: Record<string, string>;
   }
   export interface IsmTabRegistration {
     id: string; label: string;
     render: (container: HTMLElement, ism: IsmInput, guide: GuideInput) => void;
   }
 
   /* ── private state ─────────────────────────────────────────────── */
   const SNIPPET_URL = './assets/data/effects-snippets.json?v=2026-07-15-atlas64';
   const DARK_TOKENS = ['dark', 'black', '\uC5B4\uB450', '\uAC80\uC815', 'deep black', 'pitch', '\uB2E4\uD06C'];
   const TAB_KEY = 'design-isms-export-tab';
   let snippetCache: Record<string, SnippetEntry> | null = null;
   let snippetFetch: Promise<Record<string, SnippetEntry> | null> | null = null;
   const extraTabs: IsmTabRegistration[] = [];
 
   interface SnippetEntry { html: string; css: string; js?: string; reducedMotion?: string; a11yNotes?: string[]; sourceRefs?: string[]; }
 
   /* ── clipboard ─────────────────────────────────────────────────── */
   export async function copyText(text: string, announcement: string): Promise<boolean> {
     let ok = false;
     try {
       if (navigator.clipboard && window.isSecureContext) {
         await navigator.clipboard.writeText(text);
         ok = true;
       }
     } catch { /* fall through */ }
     if (!ok) {
       ok = fallbackCopy(text);
     }
     const toast = document.getElementById('toast') ?? document.getElementById('effect-toast');
     if (toast) {
       if (!toast.hasAttribute('role')) toast.setAttribute('role', 'status');
       if (!toast.hasAttribute('aria-live')) toast.setAttribute('aria-live', 'polite');
       toast.textContent = ok ? announcement : 'Copy failed \u2014 select the code manually';
       toast.classList.add('show');
       window.setTimeout(() => toast.classList.remove('show'), 1800);
     }
     document.dispatchEvent(new CustomEvent('design-export-copy', { detail: { success: ok, announcement } }));
     return ok;
   }
 
   function fallbackCopy(text: string): boolean {
     const ta = document.createElement('textarea');
     ta.value = text;
     ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
     document.body.appendChild(ta);
     ta.select();
     let ok = false;
     try { ok = document.execCommand('copy'); } catch { /* */ }
     ta.remove();
     return ok;
   }
 
   /* ── color math ────────────────────────────────────────────────── */
   function hexToRgb(hex: string): [number, number, number] {
     let h = hex.replace('#', '').toUpperCase();
     if (h.length === 3) h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
     if (h.length === 8) h = h.slice(0, 6);
     const n = parseInt(h, 16);
     return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
   }
 
   function normalizeHex(hex: string): string {
     const [r, g, b] = hexToRgb(hex);
     return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0').toUpperCase()).join('');
   }
 
   function srgbLuminance(hex: string): number {
     const [r, g, b] = hexToRgb(hex).map(c => {
       const s = c / 255;
       return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
     });
     return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
   }
 
   function contrastRatio(l1: number, l2: number): number {
     const lighter = Math.max(l1, l2);
     const darker = Math.min(l1, l2);
     return (lighter + 0.05) / (darker + 0.05);
   }
 
   function chroma(hex: string): number {
     const [r, g, b] = hexToRgb(hex);
     const max = Math.max(r, g, b);
     const min = Math.min(r, g, b);
     return (max - min) / 255;
   }
 
   function mixHex(base: string, target: string, amount: number): string {
     const [r1, g1, b1] = hexToRgb(base);
     const [r2, g2, b2] = hexToRgb(target);
     const mix = (a: number, b: number): number => Math.round(a + (b - a) * amount);
     return '#' + [mix(r1, r2), mix(g1, g2), mix(b1, b2)].map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0').toUpperCase()).join('');
   }
 
   interface SemanticColors {
     raw: { hex: string; name: string }[];
     background: string; foreground: string; accent: string;
     surface: string; muted: string; border: string;
     contrastRatio: number; warnings: string[];
   }
 
   function deriveSemanticColors(palette: string[], bgFg: string): SemanticColors {
     const norms = palette.map(normalizeHex);
     const raw = norms.map((hex, i) => ({ hex, name: `color-${i + 1}` }));
     const lums = norms.map(srgbLuminance);
     const isDark = DARK_TOKENS.some(tok => bgFg.toLowerCase().includes(tok));
 
     const bgIdx = isDark
       ? lums.indexOf(Math.min(...lums))
       : lums.indexOf(Math.max(...lums));
     const bg = norms[bgIdx]!;
     const bgLum = lums[bgIdx]!;
 
     let fgIdx = 0;
     let bestContrast = 0;
     norms.forEach((_, i) => {
       if (i === bgIdx) return;
       const cr = contrastRatio(bgLum, lums[i]!);
       if (cr > bestContrast) { bestContrast = cr; fgIdx = i; }
     });
     const fg = norms[fgIdx]!;
 
     const remaining = norms.map((hex, i) => ({ hex, i, chr: chroma(hex) }))
       .filter(x => x.i !== bgIdx && x.i !== fgIdx)
       .sort((a, b) => b.chr - a.chr || a.i - b.i);
     const accent = remaining[0]?.hex ?? fg;
 
     const surface = mixHex(bg, fg, 0.08);
     const muted = mixHex(bg, fg, 0.45);
     const border = mixHex(bg, fg, 0.22);
 
     const warnings: string[] = [];
     const cr = contrastRatio(srgbLuminance(bg), srgbLuminance(fg));
     if (cr < 3) warnings.push(`Contrast ${cr.toFixed(2)}:1 is below the 3:1 WCAG AA threshold for large text and UI components.`);
     if (cr < 4.5) warnings.push(`Body-text contrast ${cr.toFixed(2)}:1 is below the 4.5:1 WCAG AA threshold for normal text.`);
 
     return { raw, background: bg, foreground: fg, accent, surface, muted, border, contrastRatio: cr, warnings };
   }
 
   /* ── guide value parsing ───────────────────────────────────────── */
   interface ParsedGuide {
     gutter: string | null; spaceMin: string | null; spaceMax: string | null;
     pageMargin: string | null; lineHeight: string | null; letterSpacing: string | null;
     fontPairing: string | null; duration: string | null; easing: string | null;
   }
 
   const CSS_LENGTH = /^-?\d+(?:\.\d+)?(?:px|rem|em|vw|vh|%)$/;
   const CSS_UNITLESS = /^\d+(?:\.\d+)?$/;
   const DURATION_RE = /(\d+(?:\.\d+)?(?:ms|s))/;
   const EASING_RE = /(ease(?:-in)?(?:-out)?|linear|cubic-bezier\(\s*[\d.,\s-]+\))/;
 
   function firstLength(val: string): string | null {
     const m = val.match(/(-?\d+(?:\.\d+)?(?:px|rem|em|vw|vh|%))/);
     return m?.[1] ?? null;
   }
 
   function parseGuide(g: GuideInput): ParsedGuide {
     const gutter = firstLength(g.layout['gutter'] ?? '');
     const spacingStr = g.layout['spacing'] ?? '';
     const spaceParts = spacingStr.match(/(-?\d+(?:\.\d+)?(?:px|rem|em))/g);
     const spaceMin = spaceParts?.[0] ?? null;
     const spaceMax = spaceParts?.[1] ?? spaceParts?.[0] ?? null;
     const pageMargin = firstLength(g.layout['margins'] ?? '');
     const lhRaw = g.typography['lineHeight'] ?? '';
     const lineHeight = CSS_UNITLESS.test(lhRaw.trim()) ? lhRaw.trim()
       : (CSS_LENGTH.test(lhRaw.trim()) ? lhRaw.trim() : null);
     const lsRaw = g.typography['letterSpacing'] ?? '';
     const letterSpacing = CSS_LENGTH.test(lsRaw.trim()) ? lsRaw.trim() : null;
     const fpRaw = g.typography['fontPairing'] ?? '';
     const fontPairing = fpRaw.trim() || null;
     const durMatch = (g.motion['duration'] ?? '').match(DURATION_RE);
     const duration = durMatch?.[1] ?? null;
     const easeMatch = (g.motion['easing'] ?? '').match(EASING_RE);
     const easing = easeMatch?.[1] ?? null;
     return { gutter, spaceMin, spaceMax, pageMargin, lineHeight, letterSpacing, fontPairing, duration, easing };
   }
 
   /* ── format generators ─────────────────────────────────────────── */
   function generateCSS(ism: IsmInput, sem: SemanticColors, pg: ParsedGuide): string {
     const lines: string[] = [];
     lines.push(`/* ${ism.name} (${ism.id}) \u2014 CSS custom properties */`);
     lines.push(':root {');
     sem.raw.forEach(c => lines.push(`  --ism-${c.name}: ${c.hex};`));
     lines.push(`  --ism-color-background: ${sem.background};`);
     lines.push(`  --ism-color-foreground: ${sem.foreground};`);
     lines.push(`  --ism-color-accent: ${sem.accent};`);
     lines.push(`  --ism-color-surface: ${sem.surface};`);
     lines.push(`  --ism-color-muted: ${sem.muted};`);
     lines.push(`  --ism-color-border: ${sem.border};`);
     if (pg.gutter) lines.push(`  --ism-gutter: ${pg.gutter};`);
     if (pg.spaceMin) lines.push(`  --ism-space-min: ${pg.spaceMin};`);
     if (pg.spaceMax) lines.push(`  --ism-space-max: ${pg.spaceMax};`);
     if (pg.pageMargin) lines.push(`  --ism-page-margin: ${pg.pageMargin};`);
     if (pg.lineHeight) lines.push(`  --ism-line-height: ${pg.lineHeight};`);
     if (pg.letterSpacing) lines.push(`  --ism-letter-spacing: ${pg.letterSpacing};`);
     if (pg.duration) lines.push(`  --ism-motion-duration: ${pg.duration};`);
     if (pg.easing) lines.push(`  --ism-motion-easing: ${pg.easing};`);
     lines.push('}');
     return lines.join('\n');
   }
 
   function generateTailwind(ism: IsmInput, sem: SemanticColors, pg: ParsedGuide): string {
     const lines: string[] = [];
     lines.push(`/* Tailwind CSS v4 \u2014 ${ism.name} (${ism.id}) */`);
     lines.push('@theme {');
     sem.raw.forEach(c => lines.push(`  --color-ism-${c.name.replace('color-', '')}: ${c.hex};`));
     lines.push(`  --color-ism-background: ${sem.background};`);
     lines.push(`  --color-ism-foreground: ${sem.foreground};`);
     lines.push(`  --color-ism-accent: ${sem.accent};`);
     lines.push(`  --color-ism-surface: ${sem.surface};`);
     lines.push(`  --color-ism-muted: ${sem.muted};`);
     lines.push(`  --color-ism-border: ${sem.border};`);
     if (pg.gutter) lines.push(`  --spacing-ism-gutter: ${pg.gutter};`);
     if (pg.spaceMin) lines.push(`  --spacing-ism-min: ${pg.spaceMin};`);
     if (pg.spaceMax) lines.push(`  --spacing-ism-max: ${pg.spaceMax};`);
     if (pg.easing) lines.push(`  --ease-ism: ${pg.easing};`);
     lines.push('}');
     return lines.join('\n');
   }
 
   function generateTokens(ism: IsmInput, sem: SemanticColors, pg: ParsedGuide): string {
     const obj: Record<string, unknown> = {
       color: {
         '$type': 'color',
         background: { '$value': sem.background },
         foreground: { '$value': sem.foreground },
         accent: { '$value': sem.accent },
         surface: { '$value': sem.surface },
         muted: { '$value': sem.muted },
         border: { '$value': sem.border }
       }
     };
     sem.raw.forEach(c => {
       (obj['color'] as Record<string, unknown>)[c.name] = { '$value': c.hex };
     });
 
     const dim: Record<string, unknown> = {};
     if (pg.gutter) dim['gutter'] = { '$type': 'dimension', '$value': pg.gutter };
     if (pg.spaceMin) dim['spaceMin'] = { '$type': 'dimension', '$value': pg.spaceMin };
     if (pg.spaceMax) dim['spaceMax'] = { '$type': 'dimension', '$value': pg.spaceMax };
     if (Object.keys(dim).length > 0) obj['dimension'] = dim;
 
     const dur: Record<string, unknown> = {};
     if (pg.duration) dur['standard'] = { '$type': 'duration', '$value': pg.duration };
     if (Object.keys(dur).length > 0) obj['duration'] = dur;
 
     obj['extensions'] = {
       designIsms: {
         id: ism.id,
         source: 'assets/data/dev-guides.json',
         contrastRatio: sem.contrastRatio.toFixed(2),
         warnings: sem.warnings
       }
     };
     return JSON.stringify(obj, null, 2);
   }
 
   /* ── tab UI helpers ────────────────────────────────────────────── */
   function escapeHTML(value: string): string {
     return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
   }
 
   interface TabDef { id: string; label: string; content: string; }
 
   function renderTabs(tabs: TabDef[], prefix: string, storageKey: string): string {
     const saved = sessionStorage.getItem(storageKey);
     let activeIdx = 0;
     if (saved) {
       const idx = tabs.findIndex(t => t.id === saved);
       if (idx >= 0) activeIdx = idx;
     }
 
     let tablistHTML = '<div class="export-tablist" role="tablist" aria-label="Export format">';
     let panelsHTML = '';
     tabs.forEach((tab, i) => {
       const isActive = i === activeIdx;
       const tabId = prefix + '-tab-' + tab.id;
       const panelId = prefix + '-panel-' + tab.id;
       tablistHTML += '<button role="tab" id="' + tabId + '" aria-controls="' + panelId + '" aria-selected="' + isActive + '" tabindex="' + (isActive ? '0' : '-1') + '" class="export-tab' + (isActive ? ' export-tab--active' : '') + '" data-export-tab="' + tab.id + '">' + escapeHTML(tab.label) + '</button>';
       panelsHTML += '<div role="tabpanel" id="' + panelId + '" aria-labelledby="' + tabId + '"' + (isActive ? '' : ' hidden') + '><pre class="export-code"><code></code></pre><button type="button" class="export-copy" data-copy-tab="' + tab.id + '" aria-label="Copy ' + escapeHTML(tab.label) + '">Copy</button></div>';
     });
     tablistHTML += '</div>';
     return '<div class="export-panel" data-export-prefix="' + prefix + '" data-export-storage="' + storageKey + '">' + tablistHTML + panelsHTML + '</div>';
   }
 
   function bindTabs(container: HTMLElement): void {
     const panel = container.querySelector<HTMLElement>('.export-panel');
     if (!panel) return;
     const storageKey = panel.dataset.exportStorage ?? TAB_KEY;
     const tabs = Array.from(panel.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
     const panels = Array.from(panel.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
 
     function activate(idx: number): void {
       tabs.forEach((t, i) => {
         const active = i === idx;
         t.setAttribute('aria-selected', String(active));
         t.tabIndex = active ? 0 : -1;
         t.classList.toggle('export-tab--active', active);
       });
       panels.forEach((p, i) => {
         if (i === idx) p.removeAttribute('hidden');
         else p.setAttribute('hidden', '');
       });
       const id = tabs[idx]?.dataset.exportTab;
       if (id) sessionStorage.setItem(storageKey, id);
     }
 
     tabs.forEach((tab, i) => {
       tab.addEventListener('click', () => activate(i));
       tab.addEventListener('keydown', (e: KeyboardEvent) => {
         let next = i;
         if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
         else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
         else if (e.key === 'Home') next = 0;
         else if (e.key === 'End') next = tabs.length - 1;
         else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(i); return; }
         else return;
         e.preventDefault();
         tabs[next]?.focus();
       });
     });
 
     panel.addEventListener('click', (e: Event) => {
       const btn = (e.target as Element).closest<HTMLButtonElement>('.export-copy');
       if (!btn) return;
       const tabId = btn.dataset.copyTab;
       const panelEl = btn.closest<HTMLElement>('[role="tabpanel"]');
       const code = panelEl?.querySelector('code');
       if (code?.textContent) {
         void copyText(code.textContent, 'Copied ' + (tabId ?? 'code'));
       }
     });
   }
 
   /* ── ISM export mount ──────────────────────────────────────────── */
   export function mountIsm(container: HTMLElement, ism: IsmInput, guide: GuideInput): void {
     const bgFg = guide.color['bgFg'] ?? '';
     const sem = deriveSemanticColors(ism.palette, bgFg);
     const pg = parseGuide(guide);
 
     const cssCode = generateCSS(ism, sem, pg);
     const twCode = generateTailwind(ism, sem, pg);
     const tokCode = generateTokens(ism, sem, pg);
 
     const builtinTabs: TabDef[] = [
       { id: 'css', label: 'CSS Variables', content: cssCode },
       { id: 'tailwind', label: 'Tailwind @theme', content: twCode },
       { id: 'tokens', label: 'JSON Tokens', content: tokCode }
     ];
 
     const allTabs = [...builtinTabs];
     extraTabs.forEach(reg => allTabs.push({
       id: reg.id, label: reg.label, content: ''
     }));
 
     container.innerHTML = '<h3 class="export-title">Style to code</h3>' + renderTabs(allTabs, 'ism-export', TAB_KEY);
 
     builtinTabs.forEach(tab => {
       const panelEl = container.querySelector<HTMLElement>('#ism-export-panel-' + tab.id);
       const code = panelEl?.querySelector('code');
       if (code) code.textContent = tab.content;
     });
 
     if (sem.warnings.length > 0) {
       const warnHTML = sem.warnings.map(w => '<p class="export-warning">' + escapeHTML(w) + '</p>').join('');
       container.insertAdjacentHTML('beforeend', '<div class="export-warnings">' + warnHTML + '</div>');
     }
 
     container.insertAdjacentHTML('beforeend',
       '<p class="export-contrast-note">Foreground/background contrast: ' + sem.contrastRatio.toFixed(2) + ':1</p>'
     );
 
     bindTabs(container);
 
     extraTabs.forEach(reg => {
       const panelEl = container.querySelector<HTMLElement>('#ism-export-panel-' + reg.id);
       if (panelEl) reg.render(panelEl, ism, guide);
     });
   }
 
   /* ── effect snippet mount ──────────────────────────────────────── */
   async function loadSnippets(): Promise<Record<string, SnippetEntry> | null> {
     if (snippetCache) return snippetCache;
     if (snippetFetch) return snippetFetch;
     snippetFetch = fetch(SNIPPET_URL)
       .then(res => { if (!res.ok) throw new Error('snippet fetch ' + String(res.status)); return res.json() as Promise<unknown>; })
       .then(raw => {
         const obj = raw as Record<string, unknown>;
         snippetCache = (obj['snippets'] ?? obj) as Record<string, SnippetEntry>;
         return snippetCache;
       })
       .catch(() => { snippetFetch = null; return null; });
     return snippetFetch;
   }
 
   export async function mountEffect(container: HTMLElement, effectId: string): Promise<void> {
     container.innerHTML = '<p class="export-loading">Loading code\u2026</p>';
     const snippets = await loadSnippets();
     if (!snippets) {
       container.innerHTML = '<div class="export-retry"><p>Failed to load snippets.</p><button type="button" class="export-retry-btn">Retry</button></div>';
       container.querySelector('.export-retry-btn')?.addEventListener('click', () => {
         snippetFetch = null;
         void mountEffect(container, effectId);
       });
       return;
     }
     const entry = snippets[effectId];
     if (!entry) {
       container.innerHTML = '<p class="export-empty">No snippet available for this effect.</p>';
       return;
     }
 
     const tabs: TabDef[] = [
       { id: 'html', label: 'HTML', content: entry.html },
       { id: 'css', label: 'CSS', content: entry.css }
     ];
     if (entry.js) tabs.push({ id: 'js', label: 'JavaScript', content: entry.js });
 
     const notes: string[] = [];
     if (entry.reducedMotion) notes.push('Reduced motion: ' + entry.reducedMotion);
     if (entry.a11yNotes) entry.a11yNotes.forEach(n => notes.push(n));
     if (entry.sourceRefs) entry.sourceRefs.forEach(r => notes.push('Reference: ' + r));
     if (notes.length > 0) {
       tabs.push({ id: 'notes', label: 'Notes', content: notes.join('\n') });
     }
 
     container.innerHTML = '<h3 class="export-title">Implementation code</h3>' + renderTabs(tabs, 'fx-' + effectId, 'design-isms-fx-tab');
     tabs.forEach(tab => {
       const panelEl = container.querySelector<HTMLElement>('#fx-' + effectId + '-panel-' + tab.id);
       const code = panelEl?.querySelector('code');
       if (code) code.textContent = tab.content;
     });
     bindTabs(container);
   }
 
   /* ── tab registration for wp6 (prompt packs) ───────────────────── */
   export function registerIsmTab(reg: IsmTabRegistration): void {
     if (!extraTabs.some(t => t.id === reg.id)) {
       extraTabs.push(reg);
     }
   }
 }
