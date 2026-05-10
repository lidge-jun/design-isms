"use strict";
const DATA_URL = './assets/data/isms.json';
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
        designMockup: '{name} 디자인 시안',
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
        designMockup: '{name} Design Mockup',
        footerTitle: 'Design -isms Reference Board',
        footerGen: 'Images generated with GPT Image 2'
    }
};
let allIsms = [];
let activeFilter = 'all';
let searchQuery = '';
let currentLang = localStorage.getItem('design-isms-lang') === 'en' ? 'en' : 'ko';
let imgObserver = null;
let pageRevealed = false;
let cardObserver = null;
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
function isExampleArray(value) {
    return Array.isArray(value) && value.every(item => isRecord(item) && typeof item.name === 'string' && typeof item.url === 'string');
}
function isImageArray(value) {
    return Array.isArray(value) && value.every(item => isRecord(item) && typeof item.file === 'string' && typeof item.label === 'string');
}
function isPromptArray(value) {
    return Array.isArray(value) && value.every(item => isRecord(item) && typeof item.file === 'string' && typeof item.prompt === 'string');
}
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
    return raw.map((item, index) => {
        if (!isRecord(item)) {
            throw new Error('Invalid isms data: item ' + index + ' is not an object.');
        }
        if (!isStringArray(item.keywords)) {
            throw new Error('Invalid isms data: item ' + index + ' missing keywords.');
        }
        if (!isStringArray(item.palette)) {
            throw new Error('Invalid isms data: item ' + index + ' missing palette.');
        }
        if (!isExampleArray(item.examples)) {
            throw new Error('Invalid isms data: item ' + index + ' missing examples.');
        }
        if (!isImageArray(item.images)) {
            throw new Error('Invalid isms data: item ' + index + ' missing images.');
        }
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
function originalImageSrc(ismId, file) {
    return `${IMAGE_BASE_URL}/${ismId}/${file}`;
}
function thumbnailFile(file) {
    return file.replace(/\.[^.]+$/, '.webp');
}
function thumbImageSrc(ismId, file) {
    return `${THUMB_BASE_URL}/${ismId}/${thumbnailFile(file)}`;
}
function getDesc(ism) {
    return currentLang === 'en' && ism.descriptionEn ? ism.descriptionEn : ism.description;
}
function getHistory(ism) {
    return ism.history || '';
}
async function init() {
    const res = await fetch(DATA_URL);
    allIsms = parseIsms(await res.json());
    queryRequired('.header-count').textContent = `${allIsms.length} isms`;
    buildFilters();
    render();
    setupLightbox();
    setupScrollTop();
    setupModal();
    setupCardExamplesToggle();
    setupLangToggle();
    setupImageLazy();
    dismissLoading();
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
        revealPage();
        return;
    }
    function check() {
        loaded += 1;
        if (loaded >= total) {
            revealPage();
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
    window.setTimeout(revealPage, 3000);
}
function revealPage() {
    if (pageRevealed) {
        return;
    }
    pageRevealed = true;
    document.body.classList.remove('is-loading');
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('fade-out');
        overlay.addEventListener('transitionend', () => overlay.remove());
    }
}
function buildFilters() {
    const keywords = new Set();
    allIsms.forEach(ism => ism.keywords.forEach(keyword => keywords.add(keyword)));
    const popular = [
        'whitespace', 'bold-color', 'dark-bg', 'gradient', 'neon',
        '3D', 'retro', 'geometric', 'rounded', 'playful'
    ].filter(keyword => keywords.has(keyword));
    const row = queryRequired('.filter-row');
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
      <div class="ism-img-wrap" data-src="${originalSrc}">
        <img ${imgAttr} alt="${ism.name} - ${image.label}"
             loading="lazy"
             onerror="this.parentElement.outerHTML='<div class=\\'ism-img-placeholder\\'>${image.label} — generating...</div>'">
        <span class="ism-img-label">${image.label}</span>
      </div>`;
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
    <article class="ism-card" data-id="${ism.id}">
      <div class="ism-card-header">
        <div class="ism-label-row">
          <span class="ism-number">${num}</span>
        </div>
        <div class="ism-name">${ism.name}${subName ? '<span class="ism-name-kr">' + subName + '</span>' : ''}</div>
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
    const lightboxImage = queryRequired('img', lightbox);
    document.addEventListener('click', event => {
        const target = eventElement(event);
        const wrap = target?.closest('.ism-img-wrap') ?? null;
        if (wrap && !target?.closest('.modal-overlay')) {
            const src = wrap.dataset.src;
            if (src) {
                lightboxImage.src = src;
                lightbox.classList.add('active');
            }
        }
    });
    lightbox.addEventListener('click', () => {
        lightbox.classList.remove('active');
        lightboxImage.src = '';
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && lightbox.classList.contains('active')) {
            lightbox.classList.remove('active');
            lightboxImage.src = '';
        }
    });
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
queryRequired('.search-input').addEventListener('input', event => {
    if (event.target instanceof HTMLInputElement) {
        searchQuery = event.target.value;
        render();
    }
});
document.addEventListener('DOMContentLoaded', () => {
    void init();
});
function getRelatedIsms(target, max = 5) {
    return allIsms
        .filter(ism => ism.id !== target.id)
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
        collapsiblesHTML += '<div class="modal-collapsible">' +
            '<div class="modal-collapsible-header">' +
            '<span class="modal-collapsible-arrow">▶</span> ' + image.label +
            '</div>' +
            '<div class="modal-collapsible-body"><div class="modal-collapsible-inner">' +
            '<img src="' + thumbImageSrc(ism.id, image.file) + '" data-src="' + originalImageSrc(ism.id, image.file) + '" alt="' + ism.name + ' - ' + image.label + '" data-lightbox="true" loading="lazy">' +
            promptBlock +
            '</div></div></div>';
    }
    let paletteHTML = '';
    ism.palette.forEach(color => {
        paletteHTML += '<div class="modal-swatch" data-color="' + color + '">' +
            '<div class="modal-swatch-color" style="background:' + color + '"></div>' +
            '<span class="modal-swatch-hex">' + color + '</span></div>';
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
        relatedHTML += '<div class="modal-related-card" data-related-id="' + relatedIsm.id + '">' +
            '<div class="modal-related-name">' + relatedIsm.name + '</div>' +
            '<div class="modal-related-tagline">' + relatedIsm.tagline + '</div></div>';
    });
    const subNameHtml = currentLang === 'en' ? '<span class="modal-title-kr">' + ism.nameKr + '</span>' : '';
    let html = '<div class="modal-number">' + num + '</div>' +
        '<div class="modal-title">' + ism.name + subNameHtml + '</div>' +
        '<div class="modal-tagline">' + ism.tagline + '</div>';
    if (modalHistory) {
        html += '<div class="modal-history">' + modalHistory + '</div>';
    }
    html += '<div class="modal-desc">' + modalDesc + '</div>' +
        '<div class="modal-main-image"><img src="' + thumbImageSrc(ism.id, mainImg.file) + '" data-src="' + originalImageSrc(ism.id, mainImg.file) + '" alt="' + mainLabel + '" data-lightbox="true"></div>' +
        '<div class="modal-main-label">' + mainLabel + '</div>' +
        (mainPrompt ? '<div class="modal-prompt modal-prompt-main"><span class="modal-prompt-label">Prompt</span>' + mainPrompt + '</div>' : '') +
        collapsiblesHTML +
        '<div class="modal-section-title">' + t('colorPalette') + '</div>' +
        '<div class="modal-palette">' + paletteHTML + '</div>' +
        '<div class="modal-section-title">' + t('keywords') + '</div>' +
        '<div class="modal-keywords">' + keywordsHTML + '</div>' +
        '<div class="modal-section-title">' + t('exampleSites') + '</div>' +
        examplesSection;
    if (related.length > 0) {
        html += '<div class="modal-section-title">' + t('relatedIsms') + '</div>' +
            '<div class="modal-related">' + relatedHTML + '</div>';
    }
    return html;
}
function openModal(ismId) {
    const ism = allIsms.find(candidate => candidate.id === ismId);
    if (!ism) {
        return;
    }
    const overlay = getRequired('modal-overlay');
    const content = getRequired('modal-content');
    content.innerHTML = renderModalContent(ism);
    content.scrollTop = 0;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    history.replaceState(null, '', '#' + ismId);
    content.querySelectorAll('.modal-collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
            header.parentElement?.classList.toggle('open');
        });
    });
    content.querySelectorAll('img[data-lightbox]').forEach(image => {
        image.addEventListener('click', event => {
            event.stopPropagation();
            const lightbox = getRequired('lightbox');
            queryRequired('img', lightbox).src = image.dataset.src || image.src;
            lightbox.classList.add('active');
        });
    });
    content.querySelectorAll('.modal-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            const color = swatch.dataset.color;
            if (!color) {
                return;
            }
            void navigator.clipboard.writeText(color);
            showToast('Copied ' + color);
        });
    });
    content.querySelectorAll('.modal-related-card').forEach(card => {
        card.addEventListener('click', () => {
            const relatedId = card.dataset.relatedId;
            if (relatedId) {
                openModal(relatedId);
            }
        });
    });
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
}
function closeModal() {
    const overlay = getRequired('modal-overlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    history.replaceState(null, '', location.pathname + location.search);
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
    overlay.addEventListener('click', event => {
        if (event.target === overlay) {
            closeModal();
        }
    });
    queryRequired('.modal-close', overlay).addEventListener('click', closeModal);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && overlay.classList.contains('active')) {
            closeModal();
        }
    });
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
            openModal(id);
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
        localStorage.setItem('design-isms-lang', currentLang);
        updateLangUI();
        render();
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
