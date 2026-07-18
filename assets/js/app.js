"use strict";
const DATA_VERSION = '2026-07-17-production', IMAGE_VERSION = '2026-07-17-quality';
const DATA_URL = `./assets/data/isms.json?v=${DATA_VERSION}`;
const GUIDE_URL = `./assets/data/dev-guides.json?v=${DATA_VERSION}`;
const IMAGE_BASE_URL = './assets/images';
const THUMB_BASE_URL = './assets/images/thumbs';
const UI_STRINGS = {
    ko: {
        search: 'ISM 검색...',
        moreSites: '+ {n}개 더 보기',
        showLess: '− 접기',
        colorPalette: '컬러 팔레트',
        keywords: '키워드',
        exampleSites: '예시 사이트',
        relatedIsms: '관련 ISM',
        devGuide: '개발 가이드',
        devGuideComponents: '어울리는 컴포넌트',
        devGuideBuild: '구현 방법',
        devGuideChecks: '검증 포인트',
        designMockup: '{name} 디자인 시안',
        guideBtn: 'Design Guide',
        guideLayout: 'Layout',
        guideTypo: 'Typography',
        guideColor: 'Color',
        guideMotion: 'Motion',
        guideDo: 'Do',
        guideDont: "Don't",
        guideLoading: '가이드 로딩 중...',
        guideError: '가이드를 불러오지 못했습니다.',
        guidePending: '가이드 준비 중',
        footerTitle: 'Design -isms 레퍼런스 보드',
        footerGen: 'GPT Image 2로 생성'
    },
    en: {
        search: 'Search isms...',
        moreSites: '+ {n} more sites',
        showLess: '− show less',
        colorPalette: 'Color Palette',
        keywords: 'Keywords',
        exampleSites: 'Example Sites',
        relatedIsms: 'Related ISMs',
        devGuide: 'Development Guide',
        devGuideComponents: 'Fitting Components',
        devGuideBuild: 'Build Method',
        devGuideChecks: 'Verification Points',
        designMockup: '{name} Design Mockup',
        guideBtn: 'Design Guide',
        guideLayout: 'Layout',
        guideTypo: 'Typography',
        guideColor: 'Color',
        guideMotion: 'Motion',
        guideDo: 'Do',
        guideDont: "Don't",
        guideLoading: 'Loading guide...',
        guideError: 'Failed to load guide.',
        guidePending: 'Guide unavailable',
        footerTitle: 'Design -isms Reference Board',
        footerGen: 'Images generated with GPT Image 2'
    }
};
let allIsms = [];
let activeFilter = 'all';
let searchQuery = '';
let currentLang = AppRuntime.readStorage('design-isms-lang') === 'en' ? 'en' : 'ko';
let imgObserver = null;
let finderController = null;
let cardObserver = null;
let indexMounted = false;
let indexLoadPromise = null;
const toastTimers = new WeakMap();
function t(key, vars = {}) {
    let str = UI_STRINGS[currentLang][key] || UI_STRINGS.en[key] || key;
    Object.entries(vars).forEach(([varKey, value]) => {
        str = str.replace('{' + varKey + '}', String(value));
    });
    return str;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function isStringArray(value) {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
}
function isObjectArrayWith(value, keys) {
    return Array.isArray(value) && value.every(item => isRecord(item) && keys.every(key => typeof item[key] === 'string'));
}
const isExampleArray = (v) => isObjectArrayWith(v, ['name', 'url']);
const isImageArray = (v) => isObjectArrayWith(v, ['file', 'label']);
const isPromptArray = (v) => isObjectArrayWith(v, ['file', 'prompt']);
const isSourceArray = (v) => isObjectArrayWith(v, ['label', 'url']);
function readRequiredString(item, key, index) {
    const value = item[key];
    if (typeof value !== 'string') {
        throw new Error('Invalid isms data: item ' + index + ' missing string field "' + key + '".');
    }
    return value;
}
function parseIsms(raw) {
    if (!Array.isArray(raw)) {
        throw new Error('Invalid isms data: expected an array.');
    }
    const seenIds = new Set();
    return raw.map((item, index) => {
        if (!isRecord(item)) {
            throw new Error('Invalid isms data: item ' + index + ' is not an object.');
        }
        const fail = msg => { throw new Error('Invalid isms data: item ' + index + ' ' + msg); };
        if (!isStringArray(item.keywords))
            fail('missing keywords.');
        if (!isStringArray(item.palette))
            fail('missing palette.');
        if (!isExampleArray(item.examples))
            fail('missing examples.');
        if (!isImageArray(item.images))
            fail('missing images.');
        const ism = {
            id: readRequiredString(item, 'id', index),
            name: readRequiredString(item, 'name', index),
            nameKr: readRequiredString(item, 'nameKr', index),
            tagline: readRequiredString(item, 'tagline', index),
            description: readRequiredString(item, 'description', index),
            keywords: item.keywords,
            palette: item.palette,
            examples: item.examples,
            images: item.images
        };
        if (typeof item.descriptionEn === 'string') {
            ism.descriptionEn = item.descriptionEn;
        }
        if (typeof item.history === 'string') {
            ism.history = item.history;
        }
        if (isPromptArray(item.prompts)) {
            ism.prompts = item.prompts;
        }
        if (item.kind !== undefined) {
            if (item.kind !== 'style' && item.kind !== 'anti-pattern')
                fail('has unknown kind "' + String(item.kind) + '".');
            ism.kind = item.kind;
        }
        if (item.sources !== undefined) {
            if (!isSourceArray(item.sources))
                fail('has invalid sources.');
            ism.sources = item.sources;
        }
        if (typeof item.reviewedOn === 'string') {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(item.reviewedOn))
                fail('reviewedOn must be YYYY-MM-DD.');
            ism.reviewedOn = item.reviewedOn;
        }
        if (seenIds.has(ism.id))
            fail('duplicate id "' + ism.id + '".');
        seenIds.add(ism.id);
        if (new Set(ism.images.map(im => im.file)).size !== ism.images.length)
            fail('has duplicate image filenames.');
        if (!ism.palette.every(color => /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(color)))
            fail('has a non-hex palette value.');
        if (!ism.examples.every(example => example.url.startsWith('https://')))
            fail('has a non-https example URL.');
        if (ism.prompts && ism.prompts.map(p => p.file).sort().join() !== ism.images.map(im => im.file).sort().join())
            fail('prompt files do not match image files.');
        return ism;
    });
}
function queryRequired(selector, root = document) {
    const element = root.querySelector(selector);
    if (!element) {
        throw new Error('Missing required element: ' + selector);
    }
    return element;
}
function getRequired(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error('Missing required element: #' + id);
    }
    return element;
}
function eventElement(event) {
    return event.target instanceof Element ? event.target : null;
}
function safeDomain(url) {
    try {
        return new URL(url).hostname.replace('www.', '');
    }
    catch {
        return url;
    }
}
function escapeHTML(value) {
    return value.replace(/[&<>"']/g, char => {
        switch (char) {
            case '&':
                return '&amp;';
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '"':
                return '&quot;';
            case "'":
                return '&#39;';
            default:
                return char;
        }
    });
}
function originalImageSrc(ismId, file) {
    return `${IMAGE_BASE_URL}/${ismId}/${file}?v=${IMAGE_VERSION}`;
}
function thumbnailFile(file) {
    return file.replace(/\.[^.]+$/, '.webp');
}
function thumbImageSrc(ismId, file) {
    return `${THUMB_BASE_URL}/${ismId}/${thumbnailFile(file)}?v=${IMAGE_VERSION}`;
}
function getDesc(ism) {
    return currentLang === 'en' && ism.descriptionEn ? ism.descriptionEn : ism.description;
}
function getHistory(ism) {
    return ism.history || '';
}
function listHTML(items, className) {
    return '<ul class="' + className + '">' + items.map(item => '<li>' + escapeHTML(item) + '</li>').join('') + '</ul>';
}
async function toggleGuidePanel(ismId) {
    const overlay = document.getElementById('modal-overlay');
    const panel = document.getElementById('guide-panel');
    const container = overlay?.querySelector('.modal-container');
    if (!overlay || !panel || !container)
        return;
    if (container.classList.contains('expanded')) {
        container.classList.remove('expanded');
        panel.innerHTML = '';
        return;
    }
    panel.innerHTML = '<div class="guide-loading">' + t('guideLoading') + '</div>';
    container.classList.add('expanded');
    const guides = await AppGuides.load(GUIDE_URL);
    if (!guides) {
        panel.innerHTML = '<div class="guide-error">' + t('guideError') + '</div>';
        return;
    }
    const guide = guides[ismId];
    if (!guide) {
        panel.innerHTML = '<div class="guide-error">' + t('guidePending') + '</div>';
        return;
    }
    panel.innerHTML = '<div class="guide-panel-header">' + t('guideBtn') + '</div>' + AppGuides.renderPanel(guide, key => t(key));
}
function loadAndRenderIndex() {
    if (indexLoadPromise)
        return indexLoadPromise;
    indexLoadPromise = (async () => {
        const [res] = await Promise.all([fetch(DATA_URL), AppGuides.load(GUIDE_URL)]);
        if (!res.ok)
            throw new Error(`ISM request failed with status ${res.status}`);
        allIsms = parseIsms(await res.json());
        queryRequired('.header-count').textContent = `${allIsms.length} isms`;
        buildFilters();
        render();
        setupImageLazy();
        const fRoot = document.getElementById('style-finder-mount');
        if (fRoot) {
            finderController = DesignFinder.mount({ root: fRoot, isms: allIsms, guides: (await AppGuides.load(GUIDE_URL)), getLang: () => currentLang, openModal });
        }
        dismissLoading();
    })().catch(error => {
        console.error('[isms] failed to initialize', error);
        AppRuntime.dismissLoadingOverlay();
        AppRuntime.renderFatal(getRequired('masonry'), {
            title: currentLang === 'ko' ? 'ISM을 불러오지 못했습니다' : 'Could not load ISMs',
            body: currentLang === 'ko' ? '연결을 확인한 뒤 다시 시도해 주세요.' : 'Check the connection and try again.',
            retry: currentLang === 'ko' ? '다시 시도' : 'Try again'
        }, () => { void loadAndRenderIndex(); });
    }).finally(() => { indexLoadPromise = null; });
    return indexLoadPromise;
}
function setupImageLazy() {
    if (imgObserver) {
        imgObserver.disconnect();
    }
    imgObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting || !(entry.target instanceof HTMLImageElement)) {
                return;
            }
            const img = entry.target;
            const lazySrc = img.getAttribute('data-lazy');
            if (lazySrc) {
                img.src = lazySrc;
                img.removeAttribute('data-lazy');
            }
            imgObserver?.unobserve(img);
        });
    }, { rootMargin: '300px 0px' });
    document.querySelectorAll('img[data-lazy]').forEach(img => {
        imgObserver?.observe(img);
    });
}
function dismissLoading() {
    const firstImages = document.querySelectorAll('.ism-card:nth-child(-n+6) .ism-img-wrap img');
    let loaded = 0;
    const total = Math.min(firstImages.length, 6);
    if (total === 0) {
        AppRuntime.dismissLoadingOverlay();
        return;
    }
    function check() {
        loaded += 1;
        if (loaded >= total) {
            AppRuntime.dismissLoadingOverlay();
        }
    }
    firstImages.forEach(img => {
        if (img.complete) {
            check();
            return;
        }
        img.addEventListener('load', check);
        img.addEventListener('error', check);
    });
    window.setTimeout(() => AppRuntime.dismissLoadingOverlay(), 3000);
}
function buildFilters() {
    const keywords = new Set();
    allIsms.forEach(ism => ism.keywords.forEach(keyword => keywords.add(keyword)));
    const popular = [
        'whitespace', 'bold-color', 'dark-bg', 'gradient', 'neon',
        '3D', 'retro', 'geometric', 'rounded', 'playful'
    ].filter(keyword => keywords.has(keyword));
    const row = queryRequired('.filter-row');
    row.querySelectorAll('.filter-btn:not([data-keyword="all"])').forEach(button => button.remove());
    popular.forEach(keyword => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = keyword;
        btn.dataset.keyword = keyword;
        btn.addEventListener('click', () => {
            if (activeFilter === keyword) {
                activeFilter = 'all';
                document.querySelectorAll('.filter-btn').forEach(button => button.classList.remove('active'));
                queryRequired('.filter-btn[data-keyword="all"]').classList.add('active');
            }
            else {
                activeFilter = keyword;
                document.querySelectorAll('.filter-btn').forEach(button => button.classList.remove('active'));
                btn.classList.add('active');
            }
            render();
        });
        row.appendChild(btn);
    });
}
function matchFilter(ism) {
    if (activeFilter !== 'all' && !ism.keywords.includes(activeFilter)) {
        return false;
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const haystack = [
            ism.name, ism.nameKr, ism.tagline, ism.description,
            ...ism.keywords
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) {
            return false;
        }
    }
    return true;
}
function render() {
    const grid = getRequired('masonry');
    const filtered = allIsms.filter(matchFilter);
    if (cardObserver) {
        cardObserver.disconnect();
        cardObserver = null;
    }
    if (filtered.length === 0) {
        grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <h3>No matches</h3>
        <p>Try a different keyword or clear the search.</p>
      </div>`;
        return;
    }
    const eagerCount = 6;
    let html = '';
    for (let index = 0; index < filtered.length; index += 1) {
        const ism = filtered[index];
        if (!ism) {
            continue;
        }
        html += index < eagerCount ? cardHTML(ism, index) : skeletonHTML(ism, index);
    }
    grid.innerHTML = html;
    setupCardExamplesToggle();
    if (filtered.length <= eagerCount) {
        return;
    }
    cardObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) {
                return;
            }
            const el = entry.target;
            if (el.classList.contains('ism-card--loaded')) {
                return;
            }
            const id = el.dataset.id;
            const rawIndex = el.dataset.index;
            if (!id || !rawIndex) {
                return;
            }
            const idx = Number.parseInt(rawIndex, 10);
            const ism = allIsms.find(candidate => candidate.id === id);
            if (!ism || Number.isNaN(idx)) {
                return;
            }
            const temp = document.createElement('div');
            temp.innerHTML = cardHTML(ism, idx);
            const newCard = temp.firstElementChild;
            if (!(newCard instanceof HTMLElement)) {
                return;
            }
            newCard.classList.add('ism-card--loaded');
            el.replaceWith(newCard);
            setupCardExamplesToggle();
            newCard.querySelectorAll('img[data-lazy]').forEach(img => {
                imgObserver?.observe(img);
            });
            cardObserver?.unobserve(el);
        });
    }, { rootMargin: '200px 0px' });
    grid.querySelectorAll('.ism-card--skeleton').forEach(el => {
        cardObserver?.observe(el);
    });
}
function skeletonHTML(ism, index) {
    const num = String(index + 1).padStart(2, '0');
    return '<article class="ism-card ism-card--skeleton" data-id="' + ism.id + '" data-index="' + index + '">' +
        '<div class="ism-card-header">' +
        '<div class="ism-label-row"><span class="ism-number">' + num + '</span></div>' +
        '<div class="ism-name">' + ism.name + '</div>' +
        '<div class="ism-tagline">' + ism.tagline + '</div>' +
        '</div>' +
        '<div class="ism-skeleton-images">' +
        '<div class="ism-skeleton-block"></div>' +
        '<div class="ism-skeleton-block ism-skeleton-sm"></div>' +
        '<div class="ism-skeleton-block ism-skeleton-sm"></div>' +
        '</div>' +
        '</article>';
}
function cardHTML(ism, index) {
    const num = String(index + 1).padStart(2, '0');
    const paletteHTML = ism.palette.map(color => `<div class="ism-swatch" style="background:${color}" title="${color}"></div>`).join('');
    const imagesHTML = ism.images.map(image => {
        const src = thumbImageSrc(ism.id, image.file);
        const originalSrc = originalImageSrc(ism.id, image.file);
        const isEager = index < 6;
        const imgAttr = isEager
            ? `src="${src}"`
            : `src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-lazy="${src}"`;
        return `
      <button type="button" class="ism-img-wrap" data-src="${originalSrc}" aria-label="Open ${escapeHTML(image.label)} image">
        <img ${imgAttr} alt="${ism.name} - ${image.label}"
             loading="lazy" data-fallback-label="${escapeHTML(image.label)}">
        <span class="ism-img-label">${image.label}</span>
      </button>`;
    }).join('');
    const keywordsHTML = ism.keywords.map(keyword => `<span class="ism-kw">${keyword}</span>`).join('');
    const visibleCount = 3;
    const examplesHTML = ism.examples.map((example, exampleIndex) => {
        const domain = safeDomain(example.url);
        const hidden = exampleIndex >= visibleCount ? ' hidden' : '';
        return `<a href="${example.url}" target="_blank" rel="noopener" class="ism-example-link${hidden}" data-ex-idx="${exampleIndex}">
      ${example.name}<span>${domain}</span>
    </a>`;
    }).join('');
    const remaining = ism.examples.length - visibleCount;
    const toggleBtn = remaining > 0
        ? `<button class="ism-examples-toggle" data-ism="${ism.id}">${t('moreSites', { n: remaining })}</button>`
        : '';
    const subName = currentLang === 'en' ? ism.nameKr : '';
    const desc = getDesc(ism);
    return `
    <article class="ism-card" data-id="${ism.id}" data-specimen-index="${num}" data-kind="${ism.kind ?? 'style'}">
      <div class="ism-card-header">
        <div class="ism-label-row">
          <span class="ism-number">${num}</span>
        </div>
        ${ism.kind === 'anti-pattern' ? '<p class="ism-kind-label">Anti-pattern · Diagnose, do not copy</p>' : ''}
        <button type="button" class="ism-name ism-name-btn" aria-haspopup="dialog">${ism.name}${subName ? '<span class="ism-name-kr">' + subName + '</span>' : ''}</button>
        <div class="ism-tagline">${ism.tagline}</div>
        <p class="ism-desc">${desc}</p>
      </div>
      <div class="ism-palette">${paletteHTML}</div>
      <div class="ism-images">${imagesHTML}</div>
      <div class="ism-keywords">${keywordsHTML}</div>
      <div class="ism-examples">${examplesHTML}${toggleBtn}</div>
    </article>`;
}
function setupCardExamplesToggle() {
    document.querySelectorAll('.ism-examples-toggle').forEach(btn => {
        if (btn.dataset.bound === 'true')
            return;
        btn.dataset.bound = 'true';
        btn.addEventListener('click', event => {
            event.stopPropagation();
            const container = btn.closest('.ism-examples');
            if (!container) {
                return;
            }
            const hidden = container.querySelectorAll('.ism-example-link.hidden');
            if (hidden.length > 0) {
                hidden.forEach(el => el.classList.remove('hidden'));
                btn.textContent = t('showLess');
            }
            else {
                container.querySelectorAll('.ism-example-link').forEach((el, index) => {
                    if (index >= 3) {
                        el.classList.add('hidden');
                    }
                });
                const count = container.querySelectorAll('.ism-example-link.hidden').length;
                btn.textContent = t('moreSites', { n: count });
            }
        });
    });
}
function setupLightbox() {
    const lightbox = getRequired('lightbox');
    document.addEventListener('click', event => {
        const target = eventElement(event);
        const wrap = target?.closest('.ism-img-wrap') ?? null;
        if (wrap && !target?.closest('.modal-overlay')) {
            const src = wrap.dataset.src;
            if (src) {
                openLightbox(src);
            }
        }
    });
    lightbox.addEventListener('click', event => {
        const target = eventElement(event);
        if (event.target === lightbox || target?.closest('.lightbox-close')) {
            closeLightbox();
        }
    });
}
function openLightbox(src) {
    const lightbox = getRequired('lightbox');
    const lightboxImage = queryRequired('img', lightbox);
    lightboxImage.src = src;
    lightbox.classList.add('active');
    AppDialogA11y.open({
        overlay: lightbox,
        onRequestClose: closeLightbox,
        backdropClose: false,
        initialFocus: lightbox.querySelector('.lightbox-close')
    });
}
function closeLightbox() {
    const lightbox = getRequired('lightbox');
    if (!lightbox.classList.contains('active')) {
        return;
    }
    lightbox.classList.remove('active');
    queryRequired('img', lightbox).src = '';
    AppDialogA11y.close(lightbox);
}
function setupScrollTop() {
    const btn = queryRequired('.scroll-top');
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
function mountIndexOnce() {
    if (indexMounted)
        return;
    indexMounted = true;
    setupLightbox();
    setupScrollTop();
    setupModal();
    setupLangToggle();
    queryRequired('.search-input').addEventListener('input', event => {
        if (event.target instanceof HTMLInputElement) {
            searchQuery = event.target.value;
            render();
        }
    });
    const dialog = document.getElementById('finder-dialog');
    document.getElementById('finder-trigger')?.addEventListener('click', () => dialog?.showModal());
    document.getElementById('finder-dialog-close')?.addEventListener('click', () => dialog?.close());
    dialog?.addEventListener('click', event => { if (event.target === dialog)
        dialog.close(); });
    document.addEventListener('error', event => {
        const image = event.target;
        if (image instanceof HTMLImageElement && image.dataset.fallbackLabel) {
            AppRuntime.replaceBrokenImage(image, image.dataset.fallbackLabel);
        }
    }, true);
}
document.addEventListener('DOMContentLoaded', () => { mountIndexOnce(); void loadAndRenderIndex(); });
function getRelatedIsms(target, max = 5) {
    if (target.kind === 'anti-pattern') {
        return [];
    }
    return allIsms
        .filter(ism => ism.id !== target.id && ism.kind !== 'anti-pattern')
        .map(ism => ({
        ism,
        score: ism.keywords.filter(keyword => target.keywords.includes(keyword)).length
    }))
        .sort((a, b) => b.score - a.score)
        .slice(0, max)
        .filter(item => item.score > 0)
        .map(item => item.ism);
}
function renderModalContent(ism) {
    const idx = allIsms.indexOf(ism);
    const num = String(idx + 1).padStart(2, '0');
    const related = getRelatedIsms(ism);
    const mainImg = ism.images[0];
    if (!mainImg) {
        throw new Error('Missing main image for ism: ' + ism.id);
    }
    const subImages = ism.images.slice(1);
    const mainLabel = t('designMockup', { name: ism.name });
    const modalDesc = getDesc(ism);
    const modalHistory = getHistory(ism);
    const mainPrompt = ism.prompts?.[0]?.prompt ?? '';
    let collapsiblesHTML = '';
    for (let index = 0; index < subImages.length; index += 1) {
        const image = subImages[index];
        if (!image) {
            continue;
        }
        const subPrompt = ism.prompts?.[index + 1]?.prompt ?? '';
        const promptBlock = subPrompt
            ? '<div class="modal-prompt"><span class="modal-prompt-label">Prompt</span>' + subPrompt + '</div>'
            : '';
        const collapsibleId = 'modal-collapsible-' + index;
        collapsiblesHTML += '<div class="modal-collapsible">' +
            '<button type="button" class="modal-collapsible-header" aria-expanded="false" aria-controls="' + collapsibleId + '">' +
            '<span class="modal-collapsible-arrow">▶</span> ' + image.label +
            '</button>' +
            '<div class="modal-collapsible-body" id="' + collapsibleId + '" aria-hidden="true"><div class="modal-collapsible-inner">' +
            '<button type="button" class="modal-image-button" data-lightbox-src="' + originalImageSrc(ism.id, image.file) + '" aria-label="' + image.label + ' 확대">' +
            '<img src="' + thumbImageSrc(ism.id, image.file) + '" alt="' + ism.name + ' - ' + image.label + '" data-fallback-label="' + ism.name + ' - ' + image.label + '" loading="lazy"></button>' +
            promptBlock +
            '</div></div></div>';
    }
    let paletteHTML = '';
    ism.palette.forEach(color => {
        paletteHTML += '<button type="button" class="modal-swatch" data-color="' + color + '" aria-label="' + color + ' 복사">' +
            '<div class="modal-swatch-color" style="background:' + color + '"></div>' +
            '<span class="modal-swatch-hex">' + color + '</span></button>';
    });
    let keywordsHTML = '';
    ism.keywords.forEach(keyword => {
        keywordsHTML += '<span class="modal-kw">' + keyword + '</span>';
    });
    let visibleExamplesHTML = '';
    let hiddenExamplesHTML = '';
    ism.examples.forEach((example, index) => {
        const domain = safeDomain(example.url);
        const link = '<a href="' + example.url + '" target="_blank" rel="noopener" class="modal-example-link">' +
            example.name + '<span class="modal-example-domain">' + domain + '</span></a>';
        if (index < 3) {
            visibleExamplesHTML += link;
        }
        else {
            hiddenExamplesHTML += link;
        }
    });
    let examplesSection = '<div class="modal-examples">' +
        '<div class="modal-examples-visible">' + visibleExamplesHTML + '</div>';
    if (hiddenExamplesHTML) {
        examplesSection += '<div class="modal-examples-hidden" id="modal-ex-hidden">' + hiddenExamplesHTML + '</div>' +
            '<button class="modal-examples-toggle" id="modal-ex-toggle">' + t('moreSites', { n: ism.examples.length - 3 }) + '</button>';
    }
    examplesSection += '</div>';
    let relatedHTML = '';
    related.forEach(relatedIsm => {
        relatedHTML += '<button type="button" class="modal-related-card" data-related-id="' + relatedIsm.id + '">' +
            '<div class="modal-related-name">' + relatedIsm.name + '</div>' +
            '<div class="modal-related-tagline">' + relatedIsm.tagline + '</div></button>';
    });
    const subNameHtml = currentLang === 'en' ? '<span class="modal-title-kr">' + ism.nameKr + '</span>' : '';
    let html = '<div class="modal-number">' + num + '</div>' +
        '<div class="modal-title" id="ism-modal-title">' + ism.name + subNameHtml + '</div>' +
        '<div class="modal-tagline">' + ism.tagline + '</div>';
    if (ism.kind === 'anti-pattern') {
        html += '<div class="modal-antipattern-warning" role="note">' +
            '<strong>' + (currentLang === 'en' ? 'Anti-pattern · Diagnose, do not copy' : 'Anti-pattern · 진단용 — 따라 하지 마세요') + '</strong> ' +
            (currentLang === 'en'
                ? 'This entry documents failure modes so you can recognize and fix them. The palette below is a symptom palette, not a recommendation.'
                : '이 항목은 실패 패턴을 알아보고 고치기 위한 진단 자료입니다. 아래 팔레트는 증상 팔레트이며 권장 팔레트가 아닙니다.') +
            '</div>';
    }
    if (modalHistory) {
        html += '<div class="modal-history">' + modalHistory + '</div>';
    }
    html += '<div class="modal-desc">' + modalDesc + '</div>' +
        '<div class="modal-main-image"><button type="button" class="modal-image-button" data-lightbox-src="' + originalImageSrc(ism.id, mainImg.file) + '" aria-label="' + mainLabel + ' 확대">' +
        '<img src="' + thumbImageSrc(ism.id, mainImg.file) + '" alt="' + mainLabel + '" data-fallback-label="' + mainLabel + '"></button></div>' +
        '<div class="modal-main-label">' + mainLabel + '</div>' +
        (mainPrompt ? '<div class="modal-prompt modal-prompt-main"><span class="modal-prompt-label">Prompt</span>' + mainPrompt + '</div>' : '') +
        collapsiblesHTML +
        '<div class="modal-section-title">' + (ism.kind === 'anti-pattern'
        ? (currentLang === 'en' ? 'Symptom palette' : '증상 팔레트')
        : t('colorPalette')) + '</div>' +
        '<div class="modal-palette">' + paletteHTML + '</div>' +
        '<div class="modal-section-title">' + t('keywords') + '</div>' +
        '<div class="modal-keywords">' + keywordsHTML + '</div>' +
        '<div class="modal-section-title">' + (ism.kind === 'anti-pattern'
        ? (currentLang === 'en' ? 'Diagnostic references' : '진단용 레퍼런스')
        : t('exampleSites')) + '</div>' +
        examplesSection;
    if (ism.sources && ism.sources.length > 0) {
        const sourcesHTML = ism.sources.map(source => '<li><a href="' + escapeHTML(source.url) + '" target="_blank" rel="noopener">' + escapeHTML(source.label) + '</a></li>').join('');
        html += '<div class="modal-section-title">' + (currentLang === 'en' ? 'Sources' : '출처') + '</div>' +
            '<ul class="modal-sources">' + sourcesHTML + '</ul>' +
            (ism.reviewedOn ? '<p class="modal-reviewed">' + (currentLang === 'en' ? 'Reviewed ' : '검토일 ') + escapeHTML(ism.reviewedOn) + '</p>' : '');
    }
    if (related.length > 0) {
        html += '<div class="modal-section-title">' + t('relatedIsms') + '</div>' +
            '<div class="modal-related">' + relatedHTML + '</div>';
    }
    html += AppCrosslinks.renderMount(ism.id) + AppGuides.renderDevSection(ism.id, key => t(key));
    html += '<section class="ism-export-mount" id="ism-export-mount" aria-label="Style code export"></section>';
    html += '<button class="guide-toggle-btn" id="guide-toggle-btn" data-ism-id="' + ism.id + '">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg> ' +
        t('guideBtn') + '</button>';
    return html;
}
function openModal(ismId, trigger) {
    const ism = allIsms.find(candidate => candidate.id === ismId);
    if (!ism) {
        return;
    }
    const overlay = getRequired('modal-overlay');
    const content = getRequired('modal-content');
    content.innerHTML = renderModalContent(ism);
    void AppCrosslinks.hydrate(content, ism.id);
    content.scrollTop = 0;
    overlay.classList.add('active');
    AppRuntime.replaceHistory('#' + ismId);
    if (!AppDialogA11y.isOpen(overlay)) {
        AppDialogA11y.open({
            overlay,
            dialog: document.getElementById('ism-modal-dialog') ?? overlay,
            initialFocus: overlay.querySelector('.modal-close'),
            trigger: trigger ?? null,
            onRequestClose: closeModal
        });
    }
    content.querySelectorAll('.modal-collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
            const collapsible = header.closest('.modal-collapsible');
            const body = document.getElementById(header.getAttribute('aria-controls') ?? '');
            const open = collapsible?.classList.toggle('open') ?? false;
            header.setAttribute('aria-expanded', String(open));
            body?.setAttribute('aria-hidden', String(!open));
        });
    });
    content.querySelectorAll('.modal-image-button[data-lightbox-src]').forEach(button => {
        button.addEventListener('click', event => {
            event.stopPropagation();
            const src = button.dataset.lightboxSrc;
            if (src)
                openLightbox(src);
        });
    });
    content.querySelectorAll('.modal-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            const color = swatch.dataset.color;
            if (color)
                void DesignExport.copyText(color, 'Copied ' + color);
        });
    });
    content.querySelectorAll('.modal-related-card').forEach(card => {
        card.addEventListener('click', () => { const id = card.dataset.relatedId; if (id)
            openModal(id); });
    });
    const guideBtn = document.getElementById('guide-toggle-btn');
    if (guideBtn instanceof HTMLButtonElement) {
        guideBtn.addEventListener('click', () => {
            const id = guideBtn.dataset.ismId;
            if (id)
                void toggleGuidePanel(id);
        });
    }
    const exToggle = document.getElementById('modal-ex-toggle');
    const exHidden = document.getElementById('modal-ex-hidden');
    if (exToggle instanceof HTMLButtonElement && exHidden instanceof HTMLElement) {
        exToggle.addEventListener('click', () => {
            if (exHidden.classList.contains('open')) {
                exHidden.classList.remove('open');
                exToggle.textContent = t('moreSites', { n: exHidden.children.length });
            }
            else {
                exHidden.classList.add('open');
                exToggle.textContent = t('showLess');
            }
        });
    }
    // Mount ISM export panel
    const exportMount = content.querySelector("#ism-export-mount");
    if (exportMount) {
        const guide = AppGuides.get(ism.id);
        if (guide) {
            const gi = guide;
            DesignExport.mountIsm(exportMount, { id: ism.id, name: ism.name, palette: ism.palette }, gi);
        }
    }
}
function closeModal() {
    const overlay = getRequired('modal-overlay');
    overlay.classList.remove('active');
    overlay.querySelector('.modal-container')?.classList.remove('expanded');
    const panel = document.getElementById('guide-panel');
    if (panel)
        panel.innerHTML = '';
    AppDialogA11y.close(overlay);
    AppRuntime.replaceHistory(location.pathname + location.search);
}
function showToast(msg) {
    const toast = getRequired('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    const existingTimer = toastTimers.get(toast);
    if (existingTimer) {
        window.clearTimeout(existingTimer);
    }
    const timer = window.setTimeout(() => {
        toast.classList.remove('show');
        toastTimers.delete(toast);
    }, 1500);
    toastTimers.set(toast, timer);
}
function setupModal() {
    const overlay = getRequired('modal-overlay');
    queryRequired('.modal-close', overlay).addEventListener('click', closeModal);
    document.addEventListener('click', event => {
        const target = eventElement(event);
        if (!target) {
            return;
        }
        if (target.closest('.ism-img-wrap')) {
            return;
        }
        if (target.closest('.ism-example-link')) {
            return;
        }
        if (target.closest('.ism-examples-toggle')) {
            return;
        }
        if (target.closest('.modal-overlay')) {
            return;
        }
        if (target.closest('.lightbox')) {
            return;
        }
        const card = target.closest('.ism-card');
        const id = card?.dataset.id;
        if (id) {
            openModal(id, card?.querySelector('.ism-name-btn') ?? card);
        }
    });
    if (location.hash.length > 1) {
        const id = location.hash.slice(1);
        window.setTimeout(() => openModal(id), 400);
    }
}
function setupLangToggle() {
    const toggle = getRequired('lang-toggle');
    updateLangUI();
    toggle.addEventListener('click', () => {
        currentLang = currentLang === 'ko' ? 'en' : 'ko';
        AppRuntime.writeStorage('design-isms-lang', currentLang);
        updateLangUI();
        render();
        finderController?.setLang(currentLang);
    });
}
function updateLangUI() {
    document.querySelectorAll('.lang-option').forEach(element => {
        element.classList.toggle('active', element.dataset.lang === currentLang);
    });
    queryRequired('.search-input').placeholder = t('search');
    document.documentElement.lang = currentLang;
    const footer = queryRequired('.site-footer');
    const title = footer.children.item(0);
    const generator = footer.children.item(1);
    if (title) {
        title.textContent = t('footerTitle');
    }
    if (generator) {
        generator.textContent = t('footerGen');
    }
}
