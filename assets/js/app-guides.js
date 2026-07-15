"use strict";
/**
 * app-guides.ts — AppGuides global namespace (Phase 040).
 * Owns the dev-guides.json data: fetch/cache, per-ISM lookup, and the
 * HTML rendering for the split guide panel and the modal implementation
 * section. dev-guides.json is the single source of truth for ISM
 * implementation guidance; there is no embedded fallback map.
 *
 * Classic script: no import/export. Loads BEFORE app.js.
 */
var AppGuides;
(function (AppGuides) {
    let cache = null;
    let fetchPromise = null;
    let loadFailed = false;
    function load(url) {
        if (cache)
            return Promise.resolve(cache);
        if (fetchPromise)
            return fetchPromise;
        fetchPromise = fetch(url)
            .then(res => { if (!res.ok)
            throw new Error('guide fetch failed'); return res.json(); })
            .then(raw => { cache = raw; loadFailed = false; return cache; })
            .catch(() => {
            // allow a retry on the next load() call instead of caching the failure forever
            fetchPromise = null;
            loadFailed = true;
            return null;
        });
        return fetchPromise;
    }
    AppGuides.load = load;
    function get(id) {
        return cache?.[id] ?? null;
    }
    AppGuides.get = get;
    function failed() {
        return loadFailed && cache === null;
    }
    AppGuides.failed = failed;
    function escapeHTML(value) {
        return value
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function listHTML(items, className) {
        return '<ul class="' + className + '">' + items.map(item => '<li>' + escapeHTML(item) + '</li>').join('') + '</ul>';
    }
    function row(label, value) {
        return '<div class="guide-row"><span class="guide-row-label">' + escapeHTML(label) + '</span><span class="guide-row-value">' + escapeHTML(value) + '</span></div>';
    }
    function renderPanel(guide, t) {
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
    AppGuides.renderPanel = renderPanel;
    function renderDevSection(id, t) {
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
    AppGuides.renderDevSection = renderDevSection;
})(AppGuides || (AppGuides = {}));
