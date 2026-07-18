"use strict";
// TypographyFonts — lazy Google Fonts subset loader for the pairing catalog.
// Stored data URLs never pin text=; this loader derives one union subset per
// pairing (card + modal specimen characters) and injects a single <link>.
var TypographyFonts;
(function (TypographyFonts) {
    const loaded = new Map();
    function subsetChars(texts) {
        const unique = [...new Set(texts.join('').replace(/\s+/g, ' ').split(''))];
        return unique.sort().join('');
    }
    function ensureLoaded(pairingId, baseUrl, texts) {
        const existing = loaded.get(pairingId);
        if (existing)
            return existing;
        const promise = new Promise((resolvePromise) => {
            let url;
            try {
                const parsed = new URL(baseUrl);
                parsed.searchParams.set('text', subsetChars(texts));
                url = parsed.toString();
            }
            catch (_error) {
                resolvePromise(false);
                return;
            }
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.addEventListener('load', () => resolvePromise(true), { once: true });
            link.addEventListener('error', () => { link.remove(); resolvePromise(false); }, { once: true });
            document.head.appendChild(link);
            window.setTimeout(() => resolvePromise(false), 6000);
        });
        loaded.set(pairingId, promise);
        return promise;
    }
    TypographyFonts.ensureLoaded = ensureLoaded;
})(TypographyFonts || (TypographyFonts = {}));
