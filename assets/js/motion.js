"use strict";
(() => {
    const DATA_VERSION = '2026-07-18-motion';
    const DATA_URL = `./assets/data/motion.json?v=${DATA_VERSION}`;
    const GUIDE_BASE = './assets/images/motion';
    const MOTION_QUERY = '(prefers-reduced-motion: reduce)';
    let allPresets = [];
    let categoryFilter = 'all';
    let query = '';
    let shell = null;
    let cardObserver = null;
    const esc = CatalogShell.escapeHtml;
    const escA = CatalogShell.escapeAttr;
    const reducedMedia = window.matchMedia(MOTION_QUERY);
    document.addEventListener('DOMContentLoaded', () => { void init(); });
    async function init() {
        const grid = CatalogShell.getRequiredElement('#motion-grid');
        try {
            const response = await fetch(DATA_URL);
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const raw = await response.json();
            if (!Array.isArray(raw))
                throw new Error('motion.json must be an array');
            allPresets = raw;
            mount(grid);
        }
        catch (error) {
            console.error('[motion] failed to initialize', error);
            CatalogShell.getRequiredElement('#motion-result-count').textContent = 'Error';
            AppRuntime.renderFatal(grid, {
                title: '모션 데이터를 불러오지 못했습니다',
                body: '연결을 확인한 뒤 다시 시도해 주세요.',
                retry: '다시 시도'
            }, () => { void init(); });
        }
        finally {
            AppRuntime.dismissLoadingOverlay(320);
        }
    }
    function mount(grid) {
        const searchInput = CatalogShell.getRequiredElement('#motion-search');
        const filterRow = CatalogShell.getRequiredElement('#motion-category-filter');
        shell = CatalogShell.mount({
            elements: {
                grid,
                resultCount: CatalogShell.getRequiredElement('#motion-result-count'),
                modalOverlay: CatalogShell.getRequiredElement('#motion-modal-overlay'),
                modalDialog: CatalogShell.getRequiredElement('#motion-modal-dialog'),
                modalClose: CatalogShell.getRequiredElement('#motion-modal-close'),
                modalContent: CatalogShell.getRequiredElement('#motion-modal-content'),
                lightbox: document.querySelector('#motion-lightbox'),
                lightboxClose: document.querySelector('#motion-lightbox-close'),
                lightboxImage: document.querySelector('#motion-lightbox-image')
            },
            getItems: () => allPresets,
            getHashId: (preset) => preset.id,
            renderModal: (preset) => renderModal(preset),
            onModalOpen: (_preset, dialog) => wireModalControls(dialog)
        });
        filterRow.addEventListener('click', (event) => {
            const button = event.target instanceof Element ? event.target.closest('button[data-category]') : null;
            if (!button)
                return;
            categoryFilter = button.dataset.category ?? 'all';
            filterRow.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === button));
            render(grid);
        });
        searchInput.addEventListener('input', () => { query = searchInput.value.trim().toLowerCase(); render(grid); });
        const openFromCard = (target) => {
            const card = target instanceof Element ? target.closest('.motion-card') : null;
            const preset = card?.dataset.motionId ? allPresets.find((item) => item.id === card.dataset.motionId) : undefined;
            if (preset)
                shell?.openModal(preset);
        };
        grid.addEventListener('click', (event) => openFromCard(event.target));
        grid.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ')
                return;
            event.preventDefault();
            openFromCard(event.target);
        });
        document.querySelector('#motion-modal-content')?.addEventListener('click', (event) => {
            const image = event.target instanceof Element ? event.target.closest('.motion-guide-image') : null;
            if (image)
                shell?.openLightbox(image.dataset.originalSrc || image.src, image.alt);
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden)
                grid.querySelectorAll('.motion-demo.is-active').forEach((demo) => demo.classList.remove('is-active'));
        });
        reducedMedia.addEventListener('change', () => render(grid));
        CatalogShell.setupLangToggle();
        render(grid);
        shell.hydrateHash();
    }
    function matches(preset) {
        if (categoryFilter !== 'all' && preset.category !== categoryFilter)
            return false;
        if (!query)
            return true;
        const haystack = `${preset.id} ${preset.name} ${preset.nameKr} ${preset.category} ${preset.summary} ${preset.trigger} ${preset.intensity}`.toLowerCase();
        return haystack.includes(query);
    }
    function setupObserver(grid) {
        cardObserver?.disconnect();
        if (reducedMedia.matches || !('IntersectionObserver' in window))
            return;
        cardObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const demo = entry.target.querySelector('.motion-demo');
                if (!demo)
                    return;
                demo.classList.toggle('is-active', entry.isIntersecting);
            });
        }, { rootMargin: '40px 0px', threshold: 0.25 });
        grid.querySelectorAll('.motion-card').forEach((card) => cardObserver?.observe(card));
    }
    function render(grid) {
        const visible = allPresets.filter(matches);
        CatalogShell.getRequiredElement('#motion-result-count').textContent = `${visible.length} of ${allPresets.length} motions`;
        if (visible.length === 0) {
            grid.innerHTML = '<div class="motion-empty">검색 결과가 없습니다. "스프링", "로딩", "탭"처럼 기억나는 단어로 다시 찾아보세요.</div>';
            return;
        }
        grid.innerHTML = visible.map(renderCard).join('');
        setupObserver(grid);
    }
    function renderCard(preset) {
        const demo = MotionDemos.isDemoType(preset.id) ? MotionDemos.render(preset.id) : '';
        return `<article class="motion-card" tabindex="0" role="button" aria-label="${escA(preset.nameKr)} 레시피 상세" data-motion-id="${escA(preset.id)}">
      <div class="motion-card-demo">${demo}</div>
      <div class="motion-card-meta">
        <div class="motion-card-kicker"><span>${esc(preset.category)}</span><span>${esc(preset.trigger)} · ${esc(preset.intensity)}</span></div>
        <h3 class="motion-card-title">${esc(preset.name)}</h3>
        <p class="motion-card-kr">${esc(preset.nameKr)} · ${preset.duration}ms</p>
      </div></article>`;
    }
    function wireModalControls(dialog) {
        const demo = dialog.querySelector('.motion-modal-stage .motion-demo');
        const button = dialog.querySelector('.motion-play-toggle');
        if (!demo || !button)
            return;
        if (reducedMedia.matches) {
            button.disabled = true;
            button.textContent = '정적 미리보기 (모션 감소 설정 활성)';
            return;
        }
        button.addEventListener('click', () => {
            const active = demo.classList.toggle('is-active');
            button.textContent = active ? '일시정지' : '재생';
        });
    }
    function renderModal(preset) {
        const demo = MotionDemos.isDemoType(preset.id) ? MotionDemos.render(preset.id) : '';
        const curve = MotionDemos.curveSvg(preset.easing);
        const related = preset.relatedEffects.length
            ? `<section class="motion-related"><h3>관련 Effects</h3>${preset.relatedEffects.map((effect) => `<a href="./effects.html#${escA(effect)}">${esc(effect)}</a>`).join('')}</section>`
            : '';
        const guide = preset.guide
            ? `<figure class="motion-guide-frame"><picture><source srcset="${escA(`./assets/images/thumbs/motion/${preset.id}/guide.webp`)}" type="image/webp"><img class="motion-guide-image" src="${escA(`${GUIDE_BASE}/${preset.id}/${preset.guide.file}`)}" data-original-src="${escA(`${GUIDE_BASE}/${preset.id}/${preset.guide.file}`)}" alt="${escA(preset.guide.alt)}" loading="lazy" decoding="async"></picture>
        <figcaption>${esc(preset.guide.alt)}</figcaption></figure>`
            : '';
        return `<span class="modal-number">${esc(preset.category)} · ${esc(preset.trigger)} · ${esc(preset.intensity)}</span>
      <h2 class="modal-title" id="motion-modal-title" data-shell-initial-focus tabindex="-1">${esc(preset.name)} <span class="modal-title-kr">${esc(preset.nameKr)}</span></h2>
      <p class="motion-summary">${esc(preset.summary)}</p>
      <div class="motion-modal-stage">${demo}<button type="button" class="motion-play-toggle">재생</button></div>
      <section class="motion-detail-grid">
        <div><h3>Easing 곡선</h3><div class="motion-curve">${curve}</div>
          <table class="motion-param-table"><tbody>
            <tr><td>easing</td><td><code>${esc(preset.easing)}</code></td></tr>
            <tr><td>duration</td><td>${preset.duration}ms</td></tr>
            <tr><td>trigger</td><td>${esc(preset.trigger)}</td></tr>
          </tbody></table></div>
        <div><h3>CSS 레시피</h3><pre class="motion-snippet"><code>${esc(preset.snippet.css)}</code></pre></div>
      </section>
      <section class="motion-reduced">
        <h3>모션 감소 대응 (${esc(preset.reducedMotion.strategy)})</h3>
        <p>${esc(preset.reducedMotion.noteKr)}</p>
        <pre class="motion-snippet"><code>${esc(preset.reducedMotion.css)}</code></pre>
      </section>
      ${related}${guide}`;
    }
})();
