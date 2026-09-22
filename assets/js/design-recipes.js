"use strict";
/** Pure recipe contracts. Depends only on DesignCatalog; adapters own IO and hashing. */
var DesignRecipes;
(function (DesignRecipes) {
    class RecipeError extends Error {
        constructor(code, message) {
            super(message);
            this.code = code;
            this.name = 'RecipeError';
        }
    }
    DesignRecipes.RecipeError = RecipeError;
    const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);
    const safeId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    function fail(code, message) { throw new RecipeError(code, message); }
    function record(raw, keys, code) {
        if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
            fail(code, 'Expected an object.');
        const proto = Object.getPrototypeOf(raw);
        // Permit JSON objects from another realm as well as null-prototype dictionaries.
        if (proto !== null) {
            const ctor = Object.getOwnPropertyDescriptor(proto, 'constructor')?.value;
            if (Object.getPrototypeOf(proto) !== null || typeof ctor !== 'function' || ctor.name !== 'Object') {
                fail(code, 'Expected a plain object.');
            }
        }
        const result = Object.create(null);
        for (const key of Reflect.ownKeys(raw)) {
            if (typeof key !== 'string' || forbiddenKeys.has(key) || (keys !== null && !keys.includes(key))) {
                fail(code, 'Unknown or unsafe field.');
            }
            const descriptor = Object.getOwnPropertyDescriptor(raw, key);
            if (!descriptor || !('value' in descriptor) || !descriptor.enumerable)
                fail(code, 'Expected JSON data fields.');
            result[key] = descriptor.value;
        }
        return result;
    }
    function string(raw, code) {
        if (typeof raw !== 'string' || raw.trim().length === 0)
            fail(code, 'Expected non-empty text.');
        return raw;
    }
    function id(raw, code) {
        const value = string(raw, code);
        if (!safeId.test(value) || forbiddenKeys.has(value))
            fail(code, 'Invalid identifier.');
        return value;
    }
    function array(raw, code, nonempty = true) {
        if (!Array.isArray(raw) || (nonempty && raw.length === 0))
            fail(code, 'Expected an array of entries.');
        const result = [];
        const keys = Reflect.ownKeys(raw);
        if (keys.length !== raw.length + 1)
            fail(code, 'Arrays cannot contain holes or named properties.');
        for (let index = 0; index < raw.length; index++) {
            const descriptor = Object.getOwnPropertyDescriptor(raw, String(index));
            if (!descriptor || !descriptor.enumerable || !('value' in descriptor))
                fail(code, 'Expected dense JSON arrays.');
            result.push(descriptor.value);
        }
        return result;
    }
    function text(raw) {
        const value = record(raw, ['ko', 'en'], 'INVALID_RECIPE');
        return Object.freeze({ ko: string(value.ko, 'INVALID_RECIPE'), en: string(value.en, 'INVALID_RECIPE') });
    }
    function language(raw) {
        if (raw !== 'ko' && raw !== 'en')
            fail('INVALID_LANGUAGE', 'Language must be ko or en.');
        return raw;
    }
    function ref(raw, snapshot, code) {
        const value = record(raw, ['domain', 'id'], code);
        const domain = string(value.domain, code);
        if (!Object.prototype.hasOwnProperty.call(snapshot.catalogs, domain))
            fail(code, 'Unknown catalog domain.');
        const reference = Object.freeze({ domain: domain, id: id(value.id, code) });
        let entry;
        try {
            entry = DesignCatalog.resolve(snapshot, reference);
        }
        catch {
            return fail(code, 'Unknown catalog reference: ' + domain + '/' + reference.id);
        }
        if (reference.id === 'ai-slop' || entry.kind === 'anti-pattern')
            fail(code, 'Anti-patterns cannot enter recipes.');
        return reference;
    }
    function sameRef(a, b) {
        return a.domain === b.domain && a.id === b.id;
    }
    function slot(raw, snapshot) {
        const value = record(raw, ['id', 'label', 'role', 'default', 'alternatives'], 'INVALID_RECIPE');
        if (value.role !== 'essential' && value.role !== 'helper' && value.role !== 'substitutable') {
            fail('INVALID_RECIPE', 'Unknown slot role.');
        }
        const fallback = ref(value.default, snapshot, 'INVALID_RECIPE');
        const alternatives = array(value.alternatives, 'INVALID_RECIPE', false).map(item => ref(item, snapshot, 'INVALID_RECIPE'));
        const seen = new Set([fallback.id]);
        for (const alternative of alternatives) {
            if (alternative.domain !== fallback.domain || seen.has(alternative.id)) {
                fail('INVALID_RECIPE', 'Alternatives must be unique references in the slot domain.');
            }
            seen.add(alternative.id);
        }
        return Object.freeze({ id: id(value.id, 'INVALID_RECIPE'), label: text(value.label), role: value.role,
            default: fallback, alternatives: Object.freeze(alternatives) });
    }
    function source(raw) {
        const value = record(raw, ['url', 'license', 'note'], 'INVALID_RECIPE');
        const url = string(value.url, 'INVALID_RECIPE');
        // No URL/network globals are needed by this pure module. Whitespace/markup are not source URLs.
        if (!/^https:\/\/[a-z0-9.-]+(?::[0-9]+)?(?:[/?#][^\s<>"\\]*)?$/i.test(url)) {
            fail('INVALID_RECIPE', 'Source must be an HTTPS URL.');
        }
        return Object.freeze({ url, license: string(value.license, 'INVALID_RECIPE'), note: string(value.note, 'INVALID_RECIPE') });
    }
    function recipe(raw, snapshot) {
        const value = record(raw, ['id', 'title', 'summary', 'slots', 'constraints', 'checks', 'sources'], 'INVALID_RECIPE');
        const slots = array(value.slots, 'INVALID_RECIPE').map(item => slot(item, snapshot));
        if (new Set(slots.map(item => item.id)).size !== slots.length)
            fail('INVALID_RECIPE', 'Duplicate slot ID.');
        return Object.freeze({ id: id(value.id, 'INVALID_RECIPE'), title: text(value.title), summary: text(value.summary),
            slots: Object.freeze(slots), constraints: Object.freeze(array(value.constraints, 'INVALID_RECIPE').map(text)),
            checks: Object.freeze(array(value.checks, 'INVALID_RECIPE').map(text)),
            sources: Object.freeze(array(value.sources, 'INVALID_RECIPE').map(source)) });
    }
    /** Parse the version:1 source document once; return detached, immutable recipes. */
    function parse(raw, snapshot) {
        const value = record(raw, ['version', 'recipes'], 'INVALID_RECIPE');
        if (value.version !== 1)
            fail('INVALID_RECIPE', 'Unsupported recipe schema version.');
        const recipes = array(value.recipes, 'INVALID_RECIPE').map(item => recipe(item, snapshot));
        if (new Set(recipes.map(item => item.id)).size !== recipes.length)
            fail('INVALID_RECIPE', 'Duplicate recipe ID.');
        return Object.freeze(recipes);
    }
    DesignRecipes.parse = parse;
    /** Adapters wrap this compact bilingual list with snapshot.version. */
    function list(recipes) {
        return Object.freeze(recipes.map(item => Object.freeze({ id: item.id, title: item.title, summary: item.summary })));
    }
    DesignRecipes.list = list;
    /** Adapters wrap the complete authored contract with snapshot.version. */
    function detail(recipes, recipeId) {
        const wanted = id(recipeId, 'RECIPE_NOT_FOUND');
        const found = recipes.find(item => item.id === wanted);
        if (!found)
            fail('RECIPE_NOT_FOUND', 'Recipe not found: ' + wanted);
        return found;
    }
    DesignRecipes.detail = detail;
    function compose(snapshot, recipes, options) {
        const input = record(options, ['recipeId', 'selections', 'lang'], 'INVALID_SELECTION');
        const lang = language(Object.prototype.hasOwnProperty.call(input, 'lang') ? input.lang : 'ko');
        const chosen = detail(recipes, id(input.recipeId, 'RECIPE_NOT_FOUND'));
        const selections = Object.prototype.hasOwnProperty.call(input, 'selections')
            ? record(input.selections, chosen.slots.map(item => item.id), 'INVALID_SELECTION') : Object.create(null);
        const slots = chosen.slots.map(item => {
            const selected = Object.prototype.hasOwnProperty.call(selections, item.id)
                ? ref(selections[item.id], snapshot, 'INVALID_SELECTION') : ref(item.default, snapshot, 'INVALID_SELECTION');
            if (![item.default, ...item.alternatives].some(allowed => sameRef(allowed, selected))) {
                fail('INVALID_SELECTION', 'Selection is not allowed for slot: ' + item.id);
            }
            return Object.freeze({ id: item.id, role: item.role, ref: selected,
                item: DesignCatalog.summarize(selected.domain, DesignCatalog.resolve(snapshot, selected)) });
        });
        return Object.freeze({ version: snapshot.version, recipeId: chosen.id, title: chosen.title[lang],
            slots: Object.freeze(slots), constraints: Object.freeze(chosen.constraints.map(item => item[lang])),
            checks: Object.freeze(chosen.checks.map(item => item[lang])), sources: chosen.sources });
    }
    DesignRecipes.compose = compose;
    function markdown(value) {
        return value.replace(/[\\`*_{}\[\]()#+.!|>~-]/g, '\\$&').replace(/</g, '&lt;').replace(/\r?\n/g, ' ');
    }
    /** Format a localized composition. Pass the same language as compose; no truncation. */
    function formatBrief(composition, lang = 'ko') {
        language(lang);
        const ko = lang === 'ko';
        const roles = ko
            ? { essential: '필수', helper: '보조', substitutable: '교체 가능' }
            : { essential: 'essential', helper: 'helper', substitutable: 'substitutable' };
        const lines = ['# ' + markdown(composition.title), '',
            (ko ? '레시피' : 'Recipe') + ': ' + markdown(composition.recipeId),
            (ko ? '데이터 버전' : 'Data version') + ': ' + markdown(composition.version), '',
            ko ? '설계 가이드입니다. 완성된 실행 코드나 현재 제품의 검증 결과가 아닙니다.'
                : 'Design guidance. This is not an integrated implementation or verification of the consuming product.', '',
            '## ' + (ko ? '구성' : 'Composition'), ''];
        for (const slot of composition.slots) {
            const name = ko ? slot.item.nameKr : slot.item.name;
            lines.push('- ' + markdown(slot.id) + ' (' + roles[slot.role] + '): ' + markdown(name)
                + ' — `' + slot.ref.domain + '/' + slot.ref.id + '`');
        }
        lines.push('', '## ' + (ko ? '구현 제약' : 'Constraints'), '', ...composition.constraints.map(value => '- ' + markdown(value)), '', '## ' + (ko ? '구현 후 확인할 항목' : 'Checks to run after implementation'), '', ...composition.checks.map(value => '- [ ] ' + markdown(value)), '', '## ' + (ko ? '출처' : 'Sources'), '');
        for (const item of composition.sources) {
            lines.push('- <' + item.url + '> (' + markdown(item.license) + '): ' + markdown(item.note));
        }
        return lines.join('\n') + '\n';
    }
    DesignRecipes.formatBrief = formatBrief;
})(DesignRecipes || (DesignRecipes = {}));
