"use strict";
/** Shared projections: authored implementation guidance and complete code, never image prompts. */
var DesignCatalog;
(function (DesignCatalog) {
    const GUIDE_FIELDS = {
        color: ['palette', 'contrast', 'darkVariant', 'tone', 'useCases'],
        typography: ['heading', 'body', 'mono', 'scale', 'supportsKorean', 'webfonts', 'specimen'],
        layout: ['breakpoints', 'composition', 'responsive', 'bestFor', 'avoidWhen'],
        motion: ['easing', 'duration', 'trigger', 'intensity', 'reducedMotion']
    };
    function guideData(snapshot, ref, entry) {
        if (ref.domain === 'isms' || ref.domain === 'effects') {
            const map = ref.domain === 'isms' ? snapshot.guides : snapshot.effectDocs;
            if (!Object.prototype.hasOwnProperty.call(map, ref.id)) {
                return DesignCatalog.Boundary.fail('VIEW_UNAVAILABLE', `No guide for ${ref.domain}/${ref.id}`);
            }
            return map[ref.id];
        }
        const fields = GUIDE_FIELDS[ref.domain];
        const result = {};
        let hasImplementation = false;
        for (const key of [...fields, 'sources', 'reviewedOn', 'relatedIsms', 'relatedEffects']) {
            if (Object.prototype.hasOwnProperty.call(entry, key)) {
                result[key] = entry[key];
                if (fields.includes(key))
                    hasImplementation = true;
            }
        }
        if (!hasImplementation)
            return DesignCatalog.Boundary.fail('VIEW_UNAVAILABLE', `No guide for ${ref.domain}/${ref.id}`);
        return Object.freeze(result);
    }
    function codeData(snapshot, ref, entry) {
        let data;
        if (ref.domain === 'effects') {
            const snippets = snapshot.effectSnippets.snippets;
            if (Object.prototype.hasOwnProperty.call(snippets, ref.id))
                data = snippets[ref.id];
        }
        else if (ref.domain === 'layout' || ref.domain === 'motion')
            data = entry.snippet;
        if (data === undefined)
            return DesignCatalog.Boundary.fail('VIEW_UNAVAILABLE', `No code for ${ref.domain}/${ref.id}`);
        return DesignCatalog.Boundary.record(data, 'code', 'INVALID_SNAPSHOT');
    }
    function get(snapshot, args) {
        const raw = DesignCatalog.Boundary.record(args, 'Get arguments', 'INVALID_ARGUMENT');
        DesignCatalog.Boundary.keys(raw, ['domain', 'id', 'view'], 'INVALID_ARGUMENT');
        const ref = Object.freeze({
            domain: DesignCatalog.Boundary.domain(raw.domain, 'INVALID_ARGUMENT'),
            id: DesignCatalog.Boundary.id(raw.id, 'INVALID_ARGUMENT')
        });
        const view = raw.view === undefined ? 'summary' : raw.view;
        if (view !== 'summary' && view !== 'guide' && view !== 'code' && view !== 'full') {
            return DesignCatalog.Boundary.fail('INVALID_ARGUMENT', 'Unknown catalog view');
        }
        const entry = DesignCatalog.resolve(snapshot, ref);
        let data;
        switch (view) {
            case 'summary':
                data = DesignCatalog.summarize(ref.domain, entry);
                break;
            case 'full':
                data = entry;
                break;
            case 'guide':
                data = guideData(snapshot, ref, entry);
                break;
            case 'code':
                data = codeData(snapshot, ref, entry);
                break;
        }
        return Object.freeze({ version: snapshot.version, ref, view, data });
    }
    DesignCatalog.get = get;
})(DesignCatalog || (DesignCatalog = {}));
