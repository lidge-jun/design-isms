/**
 * app-guides.ts — AppGuides global namespace (Phase 040).
 * Owns the dev-guides.json data: fetch/cache, per-ISM lookup, and the
 * HTML rendering for the split guide panel and the modal implementation
 * section. dev-guides.json is the single source of truth for ISM
 * implementation guidance; there is no embedded fallback map.
 *
 * Classic script: no import/export. Loads BEFORE app.js.
 */
namespace AppGuides {
  export interface GuideLayout {
    grid: string; columns: string; gutter: string; margins: string;
    spacing: string; symmetry: string; geometry: string;
  }
  export interface GuideTypo {
    fontPairing: string; sizeHierarchy: string; lineHeight: string;
    letterSpacing: string; weightStrategy: string;
  }
  export interface GuideColor { usage: string; bgFg: string; contrast: string; }
  export interface GuideMotion {
    easing: string; duration: string; hover: string; scroll: string; transition: string;
  }
  export interface GuideImplementation {
    summary: string;
    components: string[];
    build: string[];
    checks: string[];
  }
  export interface Guide {
    layout: GuideLayout; typography: GuideTypo;
    color: GuideColor; motion: GuideMotion;
    dos: string[]; donts: string[];
    implementation?: GuideImplementation;
  }
  export type GuideMap = Record<string, Guide>;
  export type Translate = (key: string) => string;

  let cache: GuideMap | null = null;
  let fetchPromise: Promise<GuideMap | null> | null = null;
  let loadFailed = false;

  export function load(url: string): Promise<GuideMap | null> {
    if (cache) return Promise.resolve(cache);
    if (fetchPromise) return fetchPromise;
    fetchPromise = fetch(url)
      .then(res => { if (!res.ok) throw new Error('guide fetch failed'); return res.json() as Promise<unknown>; })
      .then(raw => { cache = raw as GuideMap; loadFailed = false; return cache; })
      .catch(() => {
        // allow a retry on the next load() call instead of caching the failure forever
        fetchPromise = null;
        loadFailed = true;
        return null;
      });
    return fetchPromise;
  }

  export function get(id: string): Guide | null {
    return cache?.[id] ?? null;
  }

  export function failed(): boolean {
    return loadFailed && cache === null;
  }

  function escapeHTML(value: string): string {
    return value
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function listHTML(items: string[], className: string): string {
    return '<ul class="' + className + '">' + items.map(item => '<li>' + escapeHTML(item) + '</li>').join('') + '</ul>';
  }

  function row(label: string, value: string): string {
    return '<div class="guide-row"><span class="guide-row-label">' + escapeHTML(label) + '</span><span class="guide-row-value">' + escapeHTML(value) + '</span></div>';
  }

  export function renderPanel(guide: Guide, t: Translate): string {
    const l = guide.layout;
    const ty = guide.typography;
    const c = guide.color;
    const m = guide.motion;

    let html = '<div class="guide-section"><h3 class="guide-section-title">' + t('guideLayout') + '</h3>' +
      row('Grid', l.grid) + row('Columns', l.columns) +
      row('Gutter', l.gutter) + row('Margins', l.margins) +
      row('Spacing', l.spacing) + row('Symmetry', l.symmetry) +
      row('Geometry', l.geometry) + '</div>';

    html += '<div class="guide-section"><h3 class="guide-section-title">' + t('guideTypo') + '</h3>' +
      row('Font Pairing', ty.fontPairing) + row('Size Hierarchy', ty.sizeHierarchy) +
      row('Line Height', ty.lineHeight) + row('Letter Spacing', ty.letterSpacing) +
      row('Weight', ty.weightStrategy) + '</div>';

    html += '<div class="guide-section"><h3 class="guide-section-title">' + t('guideColor') + '</h3>' +
      row('Usage', c.usage) + row('BG / FG', c.bgFg) +
      row('Contrast', c.contrast) + '</div>';

    html += '<div class="guide-section"><h3 class="guide-section-title">' + t('guideMotion') + '</h3>' +
      row('Easing', m.easing) + row('Duration', m.duration) +
      row('Hover', m.hover) + row('Scroll', m.scroll) +
      row('Transition', m.transition) + '</div>';

    html += '<div class="guide-section guide-do-dont"><div class="guide-do"><h3 class="guide-section-title guide-do-title">' + t('guideDo') + '</h3>' +
      '<ul class="guide-list guide-list-do">' + guide.dos.map(d => '<li>' + escapeHTML(d) + '</li>').join('') + '</ul></div>' +
      '<div class="guide-dont"><h3 class="guide-section-title guide-dont-title">' + t('guideDont') + '</h3>' +
      '<ul class="guide-list guide-list-dont">' + guide.donts.map(d => '<li>' + escapeHTML(d) + '</li>').join('') + '</ul></div></div>';

    return html;
  }

  export function renderDevSection(id: string, t: Translate): string {
    const impl = get(id)?.implementation;
    if (!impl) {
      const message = failed() ? t('guideError') : t('guidePending');
      return '<div class="modal-section-title modal-section-title-dev">' + t('devGuide') + '</div>' +
        '<section class="modal-dev-guide"><p class="modal-dev-summary">' + message + '</p></section>';
    }

    const componentsHTML = impl.components
      .map(component => '<span class="modal-dev-chip">' + escapeHTML(component) + '</span>')
      .join('');

    return '<div class="modal-section-title modal-section-title-dev">' + t('devGuide') + '</div>' +
      '<section class="modal-dev-guide">' +
      '<p class="modal-dev-summary">' + escapeHTML(impl.summary) + '</p>' +
      '<div class="modal-dev-block">' +
      '<div class="modal-dev-label">' + t('devGuideComponents') + '</div>' +
      '<div class="modal-dev-components">' + componentsHTML + '</div>' +
      '</div>' +
      '<div class="modal-dev-columns">' +
      '<div class="modal-dev-block">' +
      '<div class="modal-dev-label">' + t('devGuideBuild') + '</div>' +
      listHTML(impl.build, 'modal-dev-list') +
      '</div>' +
      '<div class="modal-dev-block">' +
      '<div class="modal-dev-label">' + t('devGuideChecks') + '</div>' +
      listHTML(impl.checks, 'modal-dev-list modal-dev-list-checks') +
      '</div>' +
      '</div>' +
      '</section>';
  }
}
