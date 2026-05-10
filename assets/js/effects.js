"use strict";
(() => {
    const DATA_VERSION = '2026-05-10-ism43-effects46';
    const EFFECTS_DATA_URL = `./assets/data/effects.json?v=${DATA_VERSION}`;
    const EFFECT_GUIDE_BASE_URL = './assets/images/effects';
    const MOTION_QUERY = '(prefers-reduced-motion: reduce)';
    let allEffects = [];
    let effectDocs = new Map();
    let activeCategory = 'all';
    let searchQuery = '';
    let cardObserver = null;
    let modalPreviousFocus = null;
    let lightboxPreviousFocus = null;
    let toastTimer = 0;
    document.addEventListener('DOMContentLoaded', () => {
        void initEffectsPage();
    });
    async function initEffectsPage() {
        const elements = getPageElements();
        setupStaticInteractions(elements);
        try {
            allEffects = await loadEffects();
            effectDocs = await EffectsDocs.load();
            renderFilters(elements);
            renderEffectCards(elements);
            hydrateHash(elements);
        }
        catch (error) {
            console.error('[effects] failed to initialize', error);
            renderError(elements, '효과 데이터를 불러오지 못했습니다. 잠시 후 다시 열어 주세요.');
        }
        finally {
            revealPage();
        }
    }
    function getPageElements() {
        return {
            filterRow: getRequiredElement('#effects-filter-row'),
            searchInput: getRequiredElement('#effects-search'),
            grid: getRequiredElement('#effects-grid'),
            resultCount: getRequiredElement('#effects-result-count'),
            modalOverlay: getRequiredElement('#effect-modal-overlay'),
            modalDialog: getRequiredElement('#effect-modal-dialog'),
            modalClose: getRequiredElement('#effect-modal-close'),
            modalContent: getRequiredElement('#effect-modal-content'),
            lightbox: getRequiredElement('#effect-lightbox'),
            lightboxClose: getRequiredElement('#effect-lightbox-close'),
            lightboxImage: getRequiredElement('#effect-lightbox-image'),
            toast: getRequiredElement('#effect-toast'),
            scrollTop: getRequiredElement('#effects-scroll-top')
        };
    }
    function getRequiredElement(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            throw new Error(`Missing required element: ${selector}`);
        }
        return element;
    }
    async function loadEffects() {
        try {
            const response = await fetch(EFFECTS_DATA_URL);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const raw = await response.json();
            return parseEffects(raw);
        }
        catch (error) {
            console.error('[effects] loadEffects failed', error);
            throw error;
        }
    }
    function parseEffects(raw) {
        if (!Array.isArray(raw)) {
            throw new Error('effects.json must be an array');
        }
        return raw.map((item, index) => parseEffect(item, index));
    }
    function parseEffect(raw, index) {
        const record = asRecord(raw, `effect[${index}]`);
        const id = readString(record, 'id');
        return {
            id, name: readString(record, 'name'), nameKr: readString(record, 'nameKr'),
            category: readString(record, 'category'), priority: readString(record, 'priority'),
            summary: readString(record, 'summary'), alsoCalled: readStringArray(record, 'alsoCalled'),
            bestFor: readStringArray(record, 'bestFor'), avoidWhen: readStringArray(record, 'avoidWhen'),
            implementation: readStringArray(record, 'implementation'), accessibility: readStringArray(record, 'accessibility'),
            performance: readStringArray(record, 'performance'), demo: readDemo(record.demo, id), guide: readGuide(record.guide, id)
        };
    }
    function asRecord(value, context) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new Error(`${context} must be an object`);
        }
        return value;
    }
    function readString(record, key) {
        const value = record[key];
        if (typeof value !== 'string' || value.trim() === '') {
            throw new Error(`${key} must be a non-empty string`);
        }
        return value;
    }
    function readStringArray(record, key) {
        const value = record[key];
        if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
            throw new Error(`${key} must be a string array`);
        }
        return value;
    }
    function readDemo(value, effectId) {
        const record = asRecord(value, `${effectId}.demo`);
        const type = readString(record, 'type');
        if (!EffectsDemos.isDemoType(type)) {
            throw new Error(`${effectId}.demo.type is invalid`);
        }
        return { type, label: readString(record, 'label') };
    }
    function readGuide(value, effectId) {
        if (value === null) {
            return null;
        }
        const record = asRecord(value, `${effectId}.guide`);
        return { file: readString(record, 'file'), alt: readString(record, 'alt'), prompt: readString(record, 'prompt') };
    }
    function setupStaticInteractions(elements) {
        elements.filterRow.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element))
                return;
            const button = target.closest('[data-category]');
            if (!(button instanceof HTMLButtonElement))
                return;
            activeCategory = button.dataset.category ?? 'all';
            renderFilters(elements);
            renderEffectCards(elements);
        });
        elements.searchInput.addEventListener('input', () => {
            searchQuery = elements.searchInput.value.trim().toLowerCase();
            renderEffectCards(elements);
        });
        elements.grid.addEventListener('click', (event) => openCardFromEvent(event, elements));
        elements.grid.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ')
                return;
            event.preventDefault();
            openCardFromEvent(event, elements);
        });
        elements.modalOverlay.addEventListener('click', (event) => {
            if (event.target === elements.modalOverlay)
                closeEffectModal(elements);
        });
        elements.modalClose.addEventListener('click', () => closeEffectModal(elements));
        elements.modalContent.addEventListener('click', (event) => handleModalContentClick(event, elements));
        elements.modalContent.addEventListener('error', handleGuideImageError, true);
        elements.lightboxClose.addEventListener('click', () => closeLightbox(elements));
        elements.lightbox.addEventListener('click', (event) => {
            if (event.target === elements.lightbox)
                closeLightbox(elements);
        });
        elements.scrollTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        window.addEventListener('scroll', () => {
            elements.scrollTop.classList.toggle('visible', window.scrollY > 560);
        }, { passive: true });
        window.addEventListener('hashchange', () => hydrateHash(elements));
        document.addEventListener('keydown', (event) => handleGlobalKeydown(event, elements));
        setupLangToggle();
    }
    function setupLangToggle() {
        const toggle = document.querySelector('#lang-toggle');
        if (!toggle)
            return;
        let currentLang = localStorage.getItem('design-isms-lang') === 'en' ? 'en' : 'ko';
        const sync = () => {
            document.documentElement.lang = currentLang;
            toggle.querySelectorAll('.lang-option').forEach((option) => {
                option.classList.toggle('active', option.dataset.lang === currentLang);
            });
        };
        toggle.addEventListener('click', () => {
            currentLang = currentLang === 'ko' ? 'en' : 'ko';
            localStorage.setItem('design-isms-lang', currentLang);
            sync();
        });
        sync();
    }
    function renderFilters(elements) {
        const categories = Array.from(new Set(allEffects.map((effect) => effect.category)));
        const buttons = [renderFilterButton('all', 'All'), ...categories.map((category) => renderFilterButton(category, category))];
        elements.filterRow.innerHTML = buttons.join('');
    }
    function renderFilterButton(category, label) {
        const activeClass = activeCategory === category ? ' active' : '';
        return `<button class="filter-btn${activeClass}" type="button" data-category="${escapeAttr(category)}">${escapeHtml(label)}</button>`;
    }
    function renderEffectCards(elements) {
        const visibleEffects = allEffects.filter(matchesEffect);
        elements.resultCount.textContent = `${visibleEffects.length} effects`;
        if (visibleEffects.length === 0) {
            elements.grid.innerHTML = '<div class="effects-empty">검색 결과가 없습니다. "팝업", "로딩", "스와이프"처럼 기억나는 단어로 다시 찾아보세요.</div>';
            return;
        }
        elements.grid.innerHTML = visibleEffects.map((effect, index) => renderEffectCard(effect, index)).join('');
        setupCardObserver(elements.grid);
    }
    function matchesEffect(effect) {
        const categoryMatches = activeCategory === 'all' || effect.category === activeCategory;
        const haystack = [effect.name, effect.nameKr, effect.category, effect.summary, ...effect.alsoCalled, ...effect.bestFor].join(' ').toLowerCase();
        return categoryMatches && (!searchQuery || haystack.includes(searchQuery));
    }
    function renderEffectCard(effect, index) {
        const aliasText = effect.alsoCalled.slice(0, 2).join(' · ');
        const chips = effect.bestFor.slice(0, 3).map((chip) => `<span class="effect-chip">${escapeHtml(chip)}</span>`).join('');
        return `<article class="effect-card" tabindex="0" role="button" aria-labelledby="effect-card-title-${escapeAttr(effect.id)}" data-effect-id="${escapeAttr(effect.id)}" style="--effect-index:${index % 6}">
      ${renderEffectDemo(effect)}<div class="effect-card-body">
      <div class="effect-card-kicker"><span>${escapeHtml(effect.category)}</span><span>${escapeHtml(effect.priority)}</span></div>
      <h3 class="effect-card-title" id="effect-card-title-${escapeAttr(effect.id)}">${escapeHtml(effect.name)}</h3>
      <p class="effect-card-kr">${escapeHtml(effect.nameKr)} · ${escapeHtml(aliasText)}</p>
      <p class="effect-card-summary">${escapeHtml(effect.summary)}</p><div class="effect-chip-row" aria-label="Best for">${chips}</div></div></article>`;
    }
    function renderEffectDemo(effect) {
        const type = effect.demo.type;
        const body = EffectsDemos.render(type);
        return `<div class="effect-demo effect-demo-${escapeAttr(type)}" aria-label="${escapeAttr(effect.demo.label)}"><div class="effect-phone">${body}</div></div>`;
    }
    function setupCardObserver(grid) {
        cardObserver?.disconnect();
        const cards = Array.from(grid.querySelectorAll('.effect-card'));
        if (window.matchMedia(MOTION_QUERY).matches || !('IntersectionObserver' in window)) {
            cards.forEach((card) => card.classList.add('is-visible'));
            return;
        }
        cardObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && entry.target instanceof HTMLElement) {
                    entry.target.classList.add('is-visible');
                    cardObserver?.unobserve(entry.target);
                }
            });
        }, { rootMargin: '80px 0px', threshold: 0.1 });
        cards.forEach((card) => cardObserver?.observe(card));
    }
    function openCardFromEvent(event, elements) {
        const target = event.target;
        if (!(target instanceof Element))
            return;
        const card = target.closest('.effect-card');
        if (!(card instanceof HTMLElement))
            return;
        const effectId = card.dataset.effectId;
        if (effectId)
            openEffectModal(effectId, elements);
    }
    function openEffectModal(effectId, elements) {
        const effect = allEffects.find((item) => item.id === effectId);
        if (!effect)
            return;
        if (!elements.modalOverlay.classList.contains('active')) {
            modalPreviousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }
        elements.modalContent.innerHTML = renderEffectModal(effect);
        elements.modalOverlay.classList.add('active');
        elements.modalOverlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        if (window.location.hash !== `#${effect.id}`) {
            history.replaceState(null, '', `#${effect.id}`);
        }
        requestAnimationFrame(() => {
            const title = elements.modalContent.querySelector('#effect-modal-title');
            (title ?? elements.modalDialog).focus();
        });
    }
    function renderEffectModal(effect) {
        return `<div class="effect-modal-hero"><div>
      <span class="modal-number">${escapeHtml(effect.priority)} · ${escapeHtml(effect.category)}</span>
      <h2 class="modal-title" id="effect-modal-title" tabindex="-1">${escapeHtml(effect.name)} <span class="modal-title-kr">${escapeHtml(effect.nameKr)}</span></h2>
      <div class="effect-aliases">${renderChips(effect.alsoCalled)}</div><p class="effect-summary">${escapeHtml(effect.summary)}</p>
      </div>${renderEffectDemo(effect)}</div><div class="effect-check-grid">
      ${renderCheckCard('언제 쓰나', effect.bestFor)}${renderCheckCard('피해야 할 때', effect.avoidWhen)}</div>
      ${renderCollapsible('implementation', '구현 방법', effect.implementation, true)}
      ${renderCollapsible('accessibility', '접근성 체크', effect.accessibility, false)}
      ${renderCollapsible('performance', '성능 체크', effect.performance, false)}
      ${EffectsDocs.render(effect.id, effectDocs.get(effect.id) ?? null)}${renderGuide(effect)}`;
    }
    function renderChips(items) { return items.map((item) => `<span class="effect-chip">${escapeHtml(item)}</span>`).join(''); }
    function renderCheckCard(title, items) { return `<section class="effect-check-card"><h3>${escapeHtml(title)}</h3>${renderList(items)}</section>`; }
    function renderCollapsible(id, title, items, open) {
        const expanded = open ? 'true' : 'false';
        const openClass = open ? ' open' : '';
        return `<section class="modal-collapsible${openClass}">
      <button class="modal-collapsible-header" type="button" aria-expanded="${expanded}" aria-controls="effect-section-${escapeAttr(id)}"><span class="modal-collapsible-arrow">›</span>${escapeHtml(title)}</button>
      <div class="modal-collapsible-body" id="effect-section-${escapeAttr(id)}"><div class="modal-collapsible-inner">${renderList(items)}</div></div></section>`;
    }
    function renderList(items) { return `<ul class="effect-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`; }
    function renderGuide(effect) {
        if (!effect.guide)
            return '';
        const pngSrc = `${EFFECT_GUIDE_BASE_URL}/${effect.id}/${effect.guide.file}`;
        const webpSrc = pngSrc.replace('/images/effects/', '/images/thumbs/effects/').replace(/\.png$/i, '.webp');
        return `<figure class="effect-guide-frame"><picture class="effect-guide-picture"><source srcset="${escapeAttr(webpSrc)}" type="image/webp"><img class="effect-guide-image" src="${escapeAttr(pngSrc)}" data-original-src="${escapeAttr(pngSrc)}" alt="${escapeAttr(effect.guide.alt)}" loading="lazy" decoding="async"></picture>
      <figcaption class="effect-guide-caption">${escapeHtml(effect.guide.alt)}
      <button class="effect-copy-prompt" type="button" data-prompt="${escapeAttr(effect.guide.prompt)}">프롬프트 복사</button></figcaption></figure>`;
    }
    function handleModalContentClick(event, elements) {
        const target = event.target;
        if (!(target instanceof Element))
            return;
        const header = target.closest('.modal-collapsible-header');
        if (header instanceof HTMLButtonElement) {
            const section = header.closest('.modal-collapsible');
            section?.classList.toggle('open');
            header.setAttribute('aria-expanded', section?.classList.contains('open') ? 'true' : 'false');
            return;
        }
        const image = target.closest('.effect-guide-image');
        if (image instanceof HTMLImageElement) {
            openLightbox(image.dataset.originalSrc || image.currentSrc || image.src, image.alt, elements);
            return;
        }
        const copyButton = target.closest('.effect-copy-prompt');
        if (copyButton instanceof HTMLButtonElement && copyButton.dataset.prompt) {
            void copyPrompt(copyButton.dataset.prompt, elements);
        }
    }
    function handleGuideImageError(event) {
        const target = event.target;
        if (target instanceof HTMLImageElement && target.classList.contains('effect-guide-image')) {
            target.closest('.effect-guide-frame')?.classList.add('is-missing');
        }
    }
    async function copyPrompt(prompt, elements) {
        try {
            await navigator.clipboard.writeText(prompt);
            showToast('프롬프트를 복사했습니다.', elements);
        }
        catch (error) {
            console.error('[effects] copy failed', error);
            showToast('복사할 수 없습니다. 프롬프트를 직접 선택해 주세요.', elements);
        }
    }
    function closeEffectModal(elements) {
        if (!elements.modalOverlay.classList.contains('active'))
            return;
        closeLightbox(elements);
        elements.modalOverlay.classList.remove('active');
        elements.modalOverlay.setAttribute('aria-hidden', 'true');
        elements.modalContent.innerHTML = '';
        document.body.classList.remove('modal-open');
        if (window.location.hash) {
            history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        }
        if (modalPreviousFocus && document.contains(modalPreviousFocus)) {
            modalPreviousFocus.focus();
        }
        modalPreviousFocus = null;
    }
    function openLightbox(src, alt, elements) {
        lightboxPreviousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        elements.lightboxImage.src = src;
        elements.lightboxImage.alt = alt;
        elements.lightbox.classList.add('active');
        elements.lightbox.setAttribute('aria-hidden', 'false');
        elements.lightboxClose.focus();
    }
    function closeLightbox(elements) {
        if (!elements.lightbox.classList.contains('active'))
            return;
        elements.lightbox.classList.remove('active');
        elements.lightbox.setAttribute('aria-hidden', 'true');
        elements.lightboxImage.removeAttribute('src');
        elements.lightboxImage.alt = '';
        if (lightboxPreviousFocus && document.contains(lightboxPreviousFocus)) {
            lightboxPreviousFocus.focus();
        }
        lightboxPreviousFocus = null;
    }
    function handleGlobalKeydown(event, elements) {
        if (elements.lightbox.classList.contains('active')) {
            if (event.key === 'Escape')
                closeLightbox(elements);
            trapFocus(event, elements.lightbox);
            return;
        }
        if (elements.modalOverlay.classList.contains('active')) {
            if (event.key === 'Escape')
                closeEffectModal(elements);
            trapFocus(event, elements.modalDialog);
        }
    }
    function trapFocus(event, container) {
        if (event.key !== 'Tab')
            return;
        const focusableElements = getFocusableElements(container);
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        if (!first || !last) {
            event.preventDefault();
            container.focus();
            return;
        }
        const active = document.activeElement;
        if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
        }
        else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
        }
        else if (active instanceof Element && !container.contains(active)) {
            event.preventDefault();
            first.focus();
        }
    }
    function getFocusableElements(container) {
        const selector = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
        return Array.from(container.querySelectorAll(selector)).filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        });
    }
    function hydrateHash(elements) {
        const effectId = decodeURIComponent(window.location.hash.replace(/^#/, ''));
        if (!effectId) {
            if (elements.modalOverlay.classList.contains('active'))
                closeEffectModal(elements);
            return;
        }
        if (allEffects.some((effect) => effect.id === effectId)) {
            openEffectModal(effectId, elements);
        }
    }
    function renderError(elements, message) {
        elements.resultCount.textContent = 'Error';
        elements.grid.innerHTML = `<div class="effects-empty">${escapeHtml(message)}</div>`;
    }
    function showToast(message, elements) {
        window.clearTimeout(toastTimer);
        elements.toast.textContent = message;
        elements.toast.classList.add('show');
        toastTimer = window.setTimeout(() => elements.toast.classList.remove('show'), 2200);
    }
    function revealPage() {
        window.setTimeout(() => {
            document.body.classList.remove('is-loading');
            document.querySelector('#loading-overlay')?.classList.add('fade-out');
        }, 320);
    }
    function escapeHtml(value) {
        return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    function escapeAttr(value) { return escapeHtml(value); }
})();
