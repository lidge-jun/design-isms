"use strict";
/**
 * finder.ts — DesignFinder namespace (Phase 070).
 * Three-question style finder + AI prompt pack tab registration.
 * Classic script: no import/export. Loads BEFORE app.js, AFTER app-export.js.
 */
var DesignFinder;
(function (DesignFinder) {
    const CONFIG_URL = './assets/data/finder-config.json?v=2026-07-15-atlas49';
    const STORAGE_KEY = 'design-isms-finder-v1';
    let configCache = null;
    let configFetch = null;
    /* ── config loading ────────────────────────────────────────── */
    async function loadConfig() {
        if (configCache)
            return configCache;
        if (configFetch)
            return configFetch;
        configFetch = fetch(CONFIG_URL)
            .then(r => { if (!r.ok)
            throw new Error('config ' + r.status); return r.json(); })
            .then(c => { configCache = c; return c; })
            .catch(() => { configFetch = null; return null; });
        return configFetch;
    }
    /* ── scoring ───────────────────────────────────────────────── */
    function flatGuideText(guide) {
        const parts = [];
        for (const val of Object.values(guide)) {
            if (typeof val === 'string')
                parts.push(val);
            else if (Array.isArray(val))
                val.forEach(v => { if (typeof v === 'string')
                    parts.push(v); });
            else if (typeof val === 'object' && val !== null) {
                for (const inner of Object.values(val)) {
                    if (typeof inner === 'string')
                        parts.push(inner);
                    else if (Array.isArray(inner))
                        inner.forEach(v => { if (typeof v === 'string')
                            parts.push(v); });
                }
            }
        }
        return parts.join(' ').toLowerCase();
    }
    function score(isms, guides, config, answers) {
        const selectedOpts = [];
        for (const q of config.questions) {
            const ans = answers[q.id];
            const opt = q.options.find(o => o.id === ans);
            if (opt)
                selectedOpts.push(opt);
        }
        const allKeywords = [...new Set(selectedOpts.flatMap(o => o.keywords))];
        const allGuideTerms = [...new Set(selectedOpts.flatMap(o => o.guideTerms))];
        const allConflicts = new Set(selectedOpts.flatMap(o => o.conflictIds));
        const brightAns = answers.brightness;
        const results = [];
        for (let idx = 0; idx < isms.length; idx++) {
            const ism = isms[idx];
            if (ism.kind === 'anti-pattern')
                continue;
            let total = 0;
            let boostCount = 0;
            let kwCount = 0;
            let guideCount = 0;
            let paletteMatch = false;
            const reasons = [];
            // boost: +6 per option whose boostIds contains this ism
            for (const opt of selectedOpts) {
                if (opt.boostIds.includes(ism.id)) {
                    total += 6;
                    boostCount++;
                    reasons.push('direct match: ' + opt.id);
                }
            }
            // keyword: +3 per unique keyword match
            for (const kw of allKeywords) {
                if (ism.keywords.some(k => k.toLowerCase() === kw.toLowerCase())) {
                    total += 3;
                    kwCount++;
                    if (reasons.length < 4)
                        reasons.push('keyword: ' + kw);
                }
            }
            // guide terms: +1 each, max +3
            if (guides) {
                const guide = guides[ism.id];
                if (guide) {
                    const text = flatGuideText(guide);
                    let gc = 0;
                    for (const term of allGuideTerms) {
                        const re = new RegExp('\\b' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
                        if (re.test(text) && gc < 3) {
                            total += 1;
                            gc++;
                            guideCount++;
                        }
                    }
                }
            }
            // palette brightness: +3
            const guideColor = guides?.[ism.id];
            const bgFg = typeof guideColor?.['color']?.['bgFg'] === 'string'
                ? ((guideColor?.['color'])['bgFg']) : '';
            const pc = DesignExport.classifyPalette(ism.palette, bgFg);
            if (pc === brightAns) {
                total += 3;
                paletteMatch = true;
                reasons.push('palette: ' + brightAns);
            }
            // conflict: -5
            if (allConflicts.has(ism.id)) {
                total -= 5;
            }
            const confidence = total >= 18 ? 'Strong starting point' : total >= 10 ? 'Worth comparing' : 'Exploratory match';
            const guide = guides?.[ism.id];
            const donts = guide?.['donts'] ?? [];
            const caution = donts[0] ?? '';
            results.push({ id: ism.id, name: ism.name, nameKr: ism.nameKr, score: total, boostCount, kwCount, guideCount, paletteMatch, reasons, caution, confidence });
        }
        results.sort((a, b) => b.score - a.score || b.boostCount - a.boostCount || b.kwCount - a.kwCount || isms.findIndex(i => i.id === a.id) - isms.findIndex(i => i.id === b.id));
        return results.slice(0, 3);
    }
    DesignFinder.score = score;
    /* ── escape ────────────────────────────────────────────────── */
    function esc(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    /* ── mount ─────────────────────────────────────────────────── */
    function mount(opts) {
        const { root, isms, guides, getLang, openModal } = opts;
        let answers = {};
        let results = [];
        let config = null;
        // restore session
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored)
                answers = JSON.parse(stored);
        }
        catch { /* */ }
        void loadConfig().then(c => {
            if (!c) {
                root.innerHTML = '<div class="finder-error"><p>Failed to load finder.</p><button type="button" class="finder-retry-btn">Retry</button></div>';
                root.querySelector('.finder-retry-btn')?.addEventListener('click', () => { configFetch = null; mount(opts); });
                root.removeAttribute('aria-busy');
                return;
            }
            config = c;
            render();
        });
        function render() {
            if (!config)
                return;
            const lang = getLang();
            root.removeAttribute('aria-busy');
            let html = '<form class="finder-form" id="finder-form">';
            for (const q of config.questions) {
                html += '<fieldset class="finder-fieldset"><legend class="finder-legend">' + esc(q.legend[lang]) + '</legend><div class="finder-options">';
                for (const opt of q.options) {
                    const checked = answers[q.id] === opt.id ? ' checked' : '';
                    html += '<label class="finder-option"><input type="radio" name="' + q.id + '" value="' + opt.id + '"' + checked + ' class="finder-radio"><span class="finder-option-label">' + esc(opt.label[lang]) + '</span><span class="finder-option-hint">' + esc(opt.hint[lang]) + '</span></label>';
                }
                html += '</div></fieldset>';
            }
            html += '<div class="finder-actions"><button type="submit" class="finder-submit" id="finder-submit" disabled>Find styles</button><button type="button" class="finder-reset" id="finder-reset">Reset</button></div></form>';
            html += '<div class="finder-results" id="finder-results" aria-live="polite"></div>';
            root.innerHTML = html;
            const form = root.querySelector('#finder-form');
            const submitBtn = root.querySelector('#finder-submit');
            const resetBtn = root.querySelector('#finder-reset');
            const resultsEl = root.querySelector('#finder-results');
            function checkValid() {
                const qIds = config.questions.map(q => q.id);
                const allAnswered = qIds.every(id => !!answers[id]);
                submitBtn.disabled = !allAnswered;
            }
            form.addEventListener('change', (e) => {
                const target = e.target;
                if (target instanceof HTMLInputElement && target.type === 'radio') {
                    answers[target.name] = target.value;
                    try {
                        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
                    }
                    catch { /* */ }
                    checkValid();
                }
            });
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (!config)
                    return;
                results = score(isms, guides, config, answers);
                renderResults(resultsEl, results, lang);
                document.dispatchEvent(new CustomEvent('design-finder-results', { detail: results.map(r => r.id) }));
            });
            resetBtn.addEventListener('click', () => {
                answers = {};
                results = [];
                try {
                    sessionStorage.removeItem(STORAGE_KEY);
                }
                catch { /* */ }
                form.reset();
                submitBtn.disabled = true;
                resultsEl.innerHTML = '';
                const firstRadio = form.querySelector('.finder-radio');
                firstRadio?.focus();
            });
            checkValid();
            if (Object.keys(answers).length === 3 && config) {
                results = score(isms, guides, config, answers);
                renderResults(resultsEl, results, lang);
            }
        }
        function renderResults(el, res, lang) {
            if (res.length === 0) {
                el.innerHTML = '';
                return;
            }
            const summary = lang === 'ko' ? res.length + '개 스타일 추천' : res.length + ' styles recommended';
            let html = '<p class="finder-summary">' + esc(summary) + '</p>';
            res.forEach((r, i) => {
                const num = String(i + 1).padStart(2, '0');
                const displayName = lang === 'ko' ? r.nameKr || r.name : r.name;
                const why = r.reasons.slice(0, 3).join('; ');
                html += '<div class="finder-result"><div class="finder-result-num">' + num + '</div><div class="finder-result-body">' +
                    '<div class="finder-result-name">' + esc(displayName) + '</div>' +
                    '<div class="finder-result-confidence">' + esc(r.confidence) + '</div>' +
                    '<div class="finder-result-why">' + esc(why) + '</div>' +
                    (r.caution ? '<div class="finder-result-caution">Watch: ' + esc(r.caution) + '</div>' : '') +
                    '<button type="button" class="finder-result-open" data-ism-id="' + esc(r.id) + '">' + (lang === 'ko' ? '레퍼런스 열기' : 'Open full reference') + '</button>' +
                    '</div></div>';
            });
            el.innerHTML = html;
            el.querySelectorAll('.finder-result-open').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.ismId;
                    if (id)
                        openModal(id, btn);
                });
            });
        }
        function setLang(lang) {
            if (config && results.length > 0) {
                const resultsEl = root.querySelector('#finder-results');
                if (resultsEl)
                    renderResults(resultsEl, results, lang);
            }
            render();
        }
        return { setLang };
    }
    DesignFinder.mount = mount;
    /* ── prompt pack registration ──────────────────────────────── */
    function buildPromptPack(ism, guide, _lang) {
        const lines = [];
        lines.push('PROJECT');
        lines.push('Design a [PROJECT TYPE] interface for [AUDIENCE] and [PRIMARY TASK].');
        lines.push('');
        lines.push('STYLE DIRECTION');
        lines.push('Use ' + ism.name + '. Apply it as a coherent system, not surface decoration.');
        lines.push('');
        lines.push('PALETTE');
        const sem = DesignExport.classifyPalette(ism.palette, guide.color['bgFg'] ?? '');
        lines.push('Palette class: ' + sem + '. Colors: ' + ism.palette.join(', ') + '.');
        lines.push('Preserve readable contrast.');
        lines.push('');
        lines.push('TYPOGRAPHY');
        const typo = guide.typography;
        if (typo['fontPairing'])
            lines.push(typo['fontPairing'] + '.');
        if (typo['sizeHierarchy'])
            lines.push(typo['sizeHierarchy'] + '.');
        if (typo['lineHeight'])
            lines.push('Line height: ' + typo['lineHeight'] + '.');
        lines.push('');
        lines.push('LAYOUT');
        const layout = guide.layout;
        const layoutParts = ['grid', 'columns', 'gutter', 'spacing', 'geometry'].map(k => layout[k]).filter(Boolean);
        lines.push(layoutParts.join('; ') + '.');
        lines.push('');
        lines.push('MOTION');
        const motion = guide.motion;
        if (motion['duration'])
            lines.push('Duration: ' + motion['duration'] + '.');
        if (motion['easing'])
            lines.push('Easing: ' + motion['easing'] + '.');
        lines.push('Honor reduced motion.');
        lines.push('');
        lines.push('OUTPUT CONSTRAINTS');
        lines.push('One finished production screen, real navigation/content/controls/states,');
        lines.push('responsive structure, no moodboard, no browser chrome, no real logos,');
        lines.push('no artist imitation, no watermark, no fake performance claims.');
        lines.push('');
        lines.push('ACCESSIBILITY');
        lines.push('Visible focus, keyboard-operable controls, semantic HTML, sufficient contrast,');
        lines.push('non-color state cues, and a static/reduced-motion equivalent.');
        lines.push('');
        lines.push('Note: output still requires content, accessibility, legal, and usability review.');
        return lines.join('\n');
    }
    function buildDeslopPrompt(_ism) {
        const lines = [];
        lines.push('DE-SLOP AUDIT');
        lines.push('Audit and redesign the supplied interface to remove AI-slop symptoms.');
        lines.push('Preserve its product goal and content, but replace generic generated');
        lines.push('decoration with a clear hierarchy, one visual system, purposeful assets,');
        lines.push('consistent spacing, verifiable claims, and human-reviewed copy.');
        lines.push('');
        lines.push('AVOID');
        lines.push('Purple gradient soup, meaningless sparkle icons, identical rounded cards,');
        lines.push('generic stock illustrations, floating 3D objects, unreadable decorative text,');
        lines.push('empty marketing superlatives, fake testimonials, and unverifiable statistics.');
        lines.push('');
        lines.push('OUTPUT CONSTRAINTS');
        lines.push('One finished production screen showing the redesigned interface.');
        lines.push('Real navigation, content, controls, and states.');
        lines.push('No moodboard, no browser chrome, no real logos.');
        lines.push('');
        lines.push('Note: output requires content, accessibility, legal, and usability review.');
        return lines.join('\n');
    }
    // Register prompt pack tab at load time
    DesignExport.registerIsmTab({
        id: 'prompt',
        label: 'AI Prompt Pack',
        render: (container, ism, guide) => {
            const isAntiPattern = document.querySelector('[data-kind="anti-pattern"]') !== null;
            const lang = document.documentElement.lang || 'ko';
            const prompt = isAntiPattern ? buildDeslopPrompt(ism) : buildPromptPack(ism, guide, lang);
            const title = isAntiPattern ? 'De-slop Audit Prompt' : 'AI Prompt Pack';
            const pre = document.createElement('pre');
            pre.className = 'export-code';
            const code = document.createElement('code');
            code.textContent = prompt;
            pre.appendChild(code);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'export-copy';
            btn.textContent = 'Copy';
            btn.setAttribute('aria-label', 'Copy ' + title);
            btn.addEventListener('click', () => { void DesignExport.copyText(prompt, 'Copied prompt'); });
            container.innerHTML = '';
            container.appendChild(pre);
            container.appendChild(btn);
        }
    });
})(DesignFinder || (DesignFinder = {}));
