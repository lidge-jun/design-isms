"use strict";
var EffectsDocs;
(function (EffectsDocs) {
    const DATA_VERSION = '2026-05-10-ism43-curated-ui';
    const DATA_URL = `./assets/data/effects-docs.json?v=${DATA_VERSION}`;
    async function load() {
        try {
            const response = await fetch(DATA_URL);
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const raw = await response.json();
            return parseDocs(raw);
        }
        catch (error) {
            console.error('[effects-docs] load failed', error);
            return new Map();
        }
    }
    EffectsDocs.load = load;
    function render(effectId, docs) {
        if (!docs) {
            return `<section class="effect-docs-missing" data-effect-doc-id="${escapeAttr(effectId)}">상세 해설 문서가 아직 연결되지 않았습니다.</section>`;
        }
        return `<section class="effect-docs-panel" aria-label="Effect background guide">
      <div class="effect-docs-header"><span>Docs</span><h3>배경과 사용 맥락</h3></div>
      <div class="effect-docs-block"><h4>Background</h4><p>${escapeHtml(docs.background)}</p></div>
      <div class="effect-docs-block"><h4>Short history</h4><p>${escapeHtml(docs.history)}</p></div>
      <div class="effect-docs-columns">
        ${renderListBlock('When to use', docs.useWhen)}
        ${renderListBlock('Misuse', docs.misuse)}
      </div>
      <div class="effect-docs-block"><h4>Examples</h4>${renderExamples(docs.examples)}</div>
      <div class="effect-docs-columns">
        ${renderListBlock('Anatomy', docs.anatomy)}
        ${renderListBlock('Implementation notes', docs.implementationNotes)}
      </div>
      <div class="effect-docs-block"><h4>Research references</h4>${renderRefs(docs.researchRefs)}</div>
    </section>`;
    }
    EffectsDocs.render = render;
    function parseDocs(raw) {
        if (!isRecord(raw))
            throw new Error('effects-docs.json must be an object');
        const docs = new Map();
        for (const [id, value] of Object.entries(raw)) {
            docs.set(id, parseDoc(value, id));
        }
        return docs;
    }
    function parseDoc(value, id) {
        const record = asRecord(value, id);
        return {
            background: readString(record, 'background'),
            history: readString(record, 'history'),
            useWhen: readStringArray(record, 'useWhen'),
            examples: readExamples(record.examples, id),
            anatomy: readStringArray(record, 'anatomy'),
            misuse: readStringArray(record, 'misuse'),
            implementationNotes: readStringArray(record, 'implementationNotes'),
            researchRefs: readRefs(record.researchRefs, id)
        };
    }
    function readExamples(value, id) {
        if (!Array.isArray(value))
            throw new Error(`${id}.examples must be an array`);
        return value.map((item, index) => {
            const record = asRecord(item, `${id}.examples[${index}]`);
            return { context: readString(record, 'context'), description: readString(record, 'description') };
        });
    }
    function readRefs(value, id) {
        if (!Array.isArray(value))
            throw new Error(`${id}.researchRefs must be an array`);
        return value.map((item, index) => {
            const record = asRecord(item, `${id}.researchRefs[${index}]`);
            return { label: readString(record, 'label'), url: readString(record, 'url') };
        });
    }
    function renderListBlock(title, items) {
        return `<div class="effect-docs-block"><h4>${escapeHtml(title)}</h4><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`;
    }
    function renderExamples(items) {
        return `<div class="effect-docs-examples">${items.map((item) => `<article><strong>${escapeHtml(item.context)}</strong><p>${escapeHtml(item.description)}</p></article>`).join('')}</div>`;
    }
    function renderRefs(items) {
        return `<div class="effect-docs-refs">${items.map((item) => `<a href="${escapeAttr(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.label)}</a>`).join('')}</div>`;
    }
    function asRecord(value, context) {
        if (!isRecord(value))
            throw new Error(`${context} must be an object`);
        return value;
    }
    function isRecord(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
    function readString(record, key) {
        const value = record[key];
        if (typeof value !== 'string' || value.trim() === '')
            throw new Error(`${key} must be a non-empty string`);
        return value;
    }
    function readStringArray(record, key) {
        const value = record[key];
        if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.trim() === '')) {
            throw new Error(`${key} must be a string array`);
        }
        return value;
    }
    function escapeHtml(value) {
        return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    function escapeAttr(value) {
        return escapeHtml(value);
    }
})(EffectsDocs || (EffectsDocs = {}));
