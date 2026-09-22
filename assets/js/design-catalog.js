"use strict";
/** JSON boundary and immutable catalog lookup. No adapters, DOM, or IO. */
var DesignCatalog;
(function (DesignCatalog) {
    const indexes = new WeakMap();
    const SNAPSHOT_FIELDS = ['contractVersion', 'version', 'catalogs', 'recipes', 'guides', 'effectDocs', 'effectSnippets'];
    // Clone descriptors rather than stringify: reject lossy values and never invoke toJSON/getters.
    function cloneJson(value, ancestors = new Set(), depth = 0) {
        if (value === null || typeof value === 'string' || typeof value === 'boolean')
            return value;
        if (typeof value === 'number' && Number.isFinite(value))
            return value;
        if (typeof value !== 'object' || depth > 64 || ancestors.has(value)) {
            return DesignCatalog.Boundary.fail('INVALID_SNAPSHOT', 'Snapshot must be finite, acyclic JSON with depth at most 64');
        }
        if (!Array.isArray(value))
            DesignCatalog.Boundary.record(value, 'Snapshot record', 'INVALID_SNAPSHOT');
        ancestors.add(value);
        const result = Array.isArray(value) ? [] : Object.create(null);
        for (const key of Reflect.ownKeys(value)) {
            if (Array.isArray(value) && key === 'length')
                continue;
            const descriptor = Object.getOwnPropertyDescriptor(value, key);
            if (typeof key !== 'string' || !descriptor || !descriptor.enumerable || !('value' in descriptor)) {
                return DesignCatalog.Boundary.fail('INVALID_SNAPSHOT', 'Snapshot supports enumerable JSON data properties only');
            }
            if (Array.isArray(value) && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length)) {
                return DesignCatalog.Boundary.fail('INVALID_SNAPSHOT', 'Snapshot arrays cannot have named properties');
            }
            Object.defineProperty(result, key, {
                value: cloneJson(descriptor.value, ancestors, depth + 1), enumerable: true
            });
        }
        if (Array.isArray(value) && Object.keys(value).length !== value.length) {
            return DesignCatalog.Boundary.fail('INVALID_SNAPSHOT', 'Snapshot arrays cannot contain holes');
        }
        ancestors.delete(value);
        return Object.freeze(result);
    }
    function validateEntry(domain, value) {
        const entry = DesignCatalog.Boundary.record(value, domain, 'INVALID_SNAPSHOT');
        DesignCatalog.Boundary.id(entry.id, 'INVALID_SNAPSHOT');
        DesignCatalog.Boundary.text(entry.name, 'name', 'INVALID_SNAPSHOT', 500);
        DesignCatalog.Boundary.text(entry.nameKr, 'nameKr', 'INVALID_SNAPSHOT', 500);
        DesignCatalog.Boundary.text(domain === 'isms' ? entry.tagline : entry.summary, 'summary', 'INVALID_SNAPSHOT');
        if (domain === 'isms')
            DesignCatalog.Boundary.text(entry.description, 'description', 'INVALID_SNAPSHOT');
        if (entry.kind !== undefined && entry.kind !== 'style' && entry.kind !== 'anti-pattern') {
            DesignCatalog.Boundary.fail('INVALID_SNAPSHOT', 'Unknown catalog kind');
        }
        if (entry.kind === 'anti-pattern' && (domain !== 'isms' || entry.id !== 'ai-slop')) {
            DesignCatalog.Boundary.fail('INVALID_SNAPSHOT', 'Only isms/ai-slop may be an anti-pattern');
        }
        if (domain === 'isms' && entry.id === 'ai-slop' && entry.kind !== 'anti-pattern') {
            DesignCatalog.Boundary.fail('INVALID_SNAPSHOT', 'isms/ai-slop must be an anti-pattern');
        }
        for (const field of ['keywords', 'alsoCalled', 'aliases', 'bestFor', 'useCases']) {
            if (entry[field] !== undefined)
                DesignCatalog.Boundary.strings(entry[field], field, 'INVALID_SNAPSHOT');
        }
        for (const field of ['descriptionEn', 'summaryEn', 'taglineEn', 'family', 'category']) {
            if (entry[field] !== undefined)
                DesignCatalog.Boundary.text(entry[field], field, 'INVALID_SNAPSHOT');
        }
        return entry;
    }
    function validateGuides(entry) {
        for (const key of ['layout', 'typography', 'color', 'motion']) {
            const fields = DesignCatalog.Boundary.record(entry[key], key, 'INVALID_SNAPSHOT');
            for (const value of Object.values(fields))
                DesignCatalog.Boundary.text(value, key, 'INVALID_SNAPSHOT');
        }
        for (const key of ['dos', 'donts'])
            DesignCatalog.Boundary.strings(entry[key], key, 'INVALID_SNAPSHOT');
        if (entry.implementation !== undefined) {
            const implementation = DesignCatalog.Boundary.record(entry.implementation, 'implementation', 'INVALID_SNAPSHOT');
            DesignCatalog.Boundary.text(implementation.summary, 'implementation.summary', 'INVALID_SNAPSHOT');
            for (const key of ['components', 'build', 'checks']) {
                DesignCatalog.Boundary.strings(implementation[key], key, 'INVALID_SNAPSHOT');
            }
        }
    }
    function validateDocs(entry) {
        for (const key of ['background', 'history'])
            DesignCatalog.Boundary.text(entry[key], key, 'INVALID_SNAPSHOT');
        for (const key of ['useWhen', 'anatomy', 'misuse', 'implementationNotes']) {
            DesignCatalog.Boundary.strings(entry[key], key, 'INVALID_SNAPSHOT');
        }
        for (const [key, fields] of [['examples', ['context', 'description']], ['researchRefs', ['label', 'url']]]) {
            const rows = entry[key];
            if (!Array.isArray(rows))
                DesignCatalog.Boundary.fail('INVALID_SNAPSHOT', `${key} must be an array`);
            for (const row of rows) {
                const record = DesignCatalog.Boundary.record(row, key, 'INVALID_SNAPSHOT');
                for (const field of fields)
                    DesignCatalog.Boundary.text(record[field], field, 'INVALID_SNAPSHOT');
            }
        }
    }
    function validateSnippet(entry) {
        for (const key of ['html', 'css'])
            DesignCatalog.Boundary.text(entry[key], key, 'INVALID_SNAPSHOT');
        // Expansion snippets have HTML/CSS only; preserve absence rather than fabricate metadata.
        if (entry.reducedMotion !== undefined)
            DesignCatalog.Boundary.text(entry.reducedMotion, 'reducedMotion', 'INVALID_SNAPSHOT');
        if (entry.js !== undefined && typeof entry.js !== 'string')
            DesignCatalog.Boundary.fail('INVALID_SNAPSHOT', 'js must be a string');
        for (const key of ['supports', 'a11yNotes', 'sourceRefs']) {
            if (entry[key] !== undefined)
                DesignCatalog.Boundary.strings(entry[key], key, 'INVALID_SNAPSHOT');
        }
    }
    function validateAuxiliary(raw, ids, validate) {
        const entries = DesignCatalog.Boundary.record(raw, 'Auxiliary records', 'INVALID_SNAPSHOT');
        for (const [id, entry] of Object.entries(entries)) {
            DesignCatalog.Boundary.id(id, 'INVALID_SNAPSHOT');
            if (!ids.has(id))
                DesignCatalog.Boundary.fail('INVALID_SNAPSHOT', 'Auxiliary record has no catalog entry');
            validate(DesignCatalog.Boundary.record(entry, id, 'INVALID_SNAPSHOT'));
        }
    }
    function create(source) {
        const raw = DesignCatalog.Boundary.record(cloneJson(source), 'SourceSnapshot', 'INVALID_SNAPSHOT');
        DesignCatalog.Boundary.keys(raw, SNAPSHOT_FIELDS, 'INVALID_SNAPSHOT');
        DesignCatalog.Boundary.text(raw.contractVersion, 'contractVersion', 'INVALID_SNAPSHOT', 80);
        DesignCatalog.Boundary.text(raw.version, 'version', 'INVALID_SNAPSHOT', 256);
        const catalogs = DesignCatalog.Boundary.record(raw.catalogs, 'catalogs', 'INVALID_SNAPSHOT');
        DesignCatalog.Boundary.keys(catalogs, DesignCatalog.DOMAINS, 'INVALID_SNAPSHOT');
        const index = {};
        for (const domain of DesignCatalog.DOMAINS) {
            const entries = catalogs[domain];
            if (!Array.isArray(entries))
                DesignCatalog.Boundary.fail('INVALID_SNAPSHOT', `${domain} must be an array`);
            const byId = new Map();
            for (const value of entries) {
                const entry = validateEntry(domain, value);
                const id = DesignCatalog.Boundary.id(entry.id, 'INVALID_SNAPSHOT');
                if (byId.has(id))
                    DesignCatalog.Boundary.fail('DUPLICATE_REF', `Duplicate ${domain}/${id}`);
                byId.set(id, entry);
            }
            index[domain] = byId;
        }
        validateAuxiliary(raw.guides, index.isms, validateGuides);
        validateAuxiliary(raw.effectDocs, index.effects, validateDocs);
        const snippets = DesignCatalog.Boundary.record(raw.effectSnippets, 'effectSnippets', 'INVALID_SNAPSHOT');
        DesignCatalog.Boundary.text(snippets.version, 'effectSnippets.version', 'INVALID_SNAPSHOT');
        validateAuxiliary(snippets.snippets, index.effects, validateSnippet);
        const recipes = DesignCatalog.Boundary.record(raw.recipes, 'recipes', 'INVALID_SNAPSHOT');
        if (recipes.version !== 1 || !Array.isArray(recipes.recipes)) {
            DesignCatalog.Boundary.fail('INVALID_SNAPSHOT', 'Recipes require version 1 and a recipes array');
        }
        // Recipe slot and cross-reference validation belongs to DesignRecipes.parse.
        // All public data was cloned and recursively frozen before this boundary cast.
        const snapshot = raw;
        indexes.set(snapshot, index);
        return snapshot;
    }
    DesignCatalog.create = create;
    function resolve(snapshot, ref) {
        const args = DesignCatalog.Boundary.record(ref, 'ref', 'INVALID_ARGUMENT');
        DesignCatalog.Boundary.keys(args, ['domain', 'id'], 'INVALID_ARGUMENT');
        const domain = DesignCatalog.Boundary.domain(args.domain, 'INVALID_ARGUMENT');
        const id = DesignCatalog.Boundary.id(args.id, 'INVALID_ARGUMENT');
        const index = indexes.get(snapshot);
        if (!index)
            return DesignCatalog.Boundary.fail('INVALID_SNAPSHOT', 'Use create() to construct the snapshot');
        const entry = index[domain].get(id);
        return entry ?? DesignCatalog.Boundary.fail('UNKNOWN_REFERENCE', `Unknown ${domain}/${id}`);
    }
    DesignCatalog.resolve = resolve;
    function summarize(domain, entry) {
        // Entries originate at create()/resolve(); summary owns only projection.
        const summary = {
            ref: Object.freeze({ domain, id: entry.id }),
            name: entry.name,
            nameKr: entry.nameKr,
            summary: (domain === 'isms' ? entry.tagline || entry.description : entry.summary),
            ...(entry.kind === 'style' || entry.kind === 'anti-pattern' ? { kind: entry.kind } : {})
        };
        return Object.freeze(summary);
    }
    DesignCatalog.summarize = summarize;
})(DesignCatalog || (DesignCatalog = {}));
