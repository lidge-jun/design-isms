(() => {
  const DATA_VERSION = '2026-09-06-motion';
  const DATA_URL = `./assets/data/motion.json?v=${DATA_VERSION}`;
  const GUIDE_BASE = './assets/images/motion';
  const GUIDE_VERSION = '2026-09-06-guides';
  const MOTION_QUERY = '(prefers-reduced-motion: reduce)';
  const DEMO_PLAYBACK_RATE = 0.4;

  interface MotionPreset {
    id: string; name: string; nameKr: string; family: string; category: string; summary: string;
    easing: string; duration: number; trigger: string; intensity: string;
    snippet: { css: string };
    reducedMotion: { strategy: string; css: string; noteKr: string };
    relatedEffects: string[];
    guide: { file: string; alt: string; prompt: string } | null;
  }

  interface PreviewState {
    demo: HTMLElement;
    requested: boolean;
    visible: boolean;
    started: boolean;
    animations: Animation[];
  }

  let allPresets: MotionPreset[] = [];
  let categoryFilter = 'all';
  let query = '';
  let shell: CatalogShell.Controller<MotionPreset> | null = null;
  let cardObserver: IntersectionObserver | null = null;
  const previews = new Map<HTMLElement, PreviewState>();
  let modalController: MotionInteractions.Controller | null = null;
  let modalPreview: PreviewState | null = null;
  let modalListeners: AbortController | null = null;
  const esc = CatalogShell.escapeHtml;
  const escA = CatalogShell.escapeAttr;

  const reducedMedia = window.matchMedia(MOTION_QUERY);

  document.addEventListener('DOMContentLoaded', () => { void init(); });

  async function init(): Promise<void> {
    const grid = CatalogShell.getRequiredElement<HTMLElement>('#motion-grid');
    try {
      const response = await fetch(DATA_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw: unknown = await response.json();
      if (!Array.isArray(raw)) throw new Error('motion.json must be an array');
      allPresets = raw as MotionPreset[];
      mount(grid);
    } catch (error) {
      console.error('[motion] failed to initialize', error);
      CatalogShell.getRequiredElement<HTMLElement>('#motion-result-count').textContent = 'Error';
      AppRuntime.renderFatal(grid, {
        title: '모션 데이터를 불러오지 못했습니다',
        body: '연결을 확인한 뒤 다시 시도해 주세요.',
        retry: '다시 시도'
      }, () => { void init(); });
    } finally {
      AppRuntime.dismissLoadingOverlay(320);
    }
  }

  function mount(grid: HTMLElement): void {
    const searchInput = CatalogShell.getRequiredElement<HTMLInputElement>('#motion-search');
    const filterRow = CatalogShell.getRequiredElement<HTMLElement>('#motion-category-filter');
    shell = CatalogShell.mount<MotionPreset>({
      elements: {
        grid,
        resultCount: CatalogShell.getRequiredElement<HTMLElement>('#motion-result-count'),
        modalOverlay: CatalogShell.getRequiredElement<HTMLElement>('#motion-modal-overlay'),
        modalDialog: CatalogShell.getRequiredElement<HTMLElement>('#motion-modal-dialog'),
        modalClose: CatalogShell.getRequiredElement<HTMLButtonElement>('#motion-modal-close'),
        modalContent: CatalogShell.getRequiredElement<HTMLElement>('#motion-modal-content'),
        lightbox: document.querySelector<HTMLElement>('#motion-lightbox'),
        lightboxClose: document.querySelector<HTMLButtonElement>('#motion-lightbox-close'),
        lightboxImage: document.querySelector<HTMLImageElement>('#motion-lightbox-image')
      },
      getItems: () => allPresets,
      getHashId: (preset) => preset.id,
      renderModal: (preset) => renderModal(preset),
      onModalOpen: (preset, dialog) => wireModalControls(dialog, preset.id),
      onModalClose: disposeModal
    });
    filterRow.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-category]') : null;
      if (!button) return;
      categoryFilter = button.dataset.category ?? 'all';
      filterRow.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === button));
      render(grid);
    });
    searchInput.addEventListener('input', () => { query = searchInput.value.trim().toLowerCase(); render(grid); });
    const openFromCard = (target: EventTarget | null): void => {
      const card = target instanceof Element ? target.closest<HTMLElement>('.motion-card') : null;
      const preset = card?.dataset.motionId ? allPresets.find((item) => item.id === card.dataset.motionId) : undefined;
      if (preset) shell?.openModal(preset);
    };
    grid.addEventListener('click', (event) => openFromCard(event.target));
    grid.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openFromCard(event.target);
    });
    document.querySelector('#motion-modal-content')?.addEventListener('click', (event) => {
      const image = event.target instanceof Element ? event.target.closest<HTMLImageElement>('.motion-guide-image') : null;
      if (image) shell?.openLightbox(image.dataset.originalSrc || image.src, image.alt);
    });
    document.addEventListener('visibilitychange', () => previews.forEach(syncPreview));
    reducedMedia.addEventListener('change', () => {
      setupObserver(grid);
      previews.forEach(syncPreview);
    });
    CatalogShell.setupLangToggle();
    render(grid);
    shell.hydrateHash();
  }

  function matches(preset: MotionPreset): boolean {
    if (categoryFilter !== 'all' && preset.category !== categoryFilter) return false;
    if (!query) return true;
    const haystack = `${preset.id} ${preset.name} ${preset.nameKr} ${preset.category} ${preset.summary} ${preset.trigger} ${preset.intensity}`.toLowerCase();
    return haystack.includes(query);
  }

  function setupObserver(grid: HTMLElement): void {
    cardObserver?.disconnect();
    cardObserver = null;
    grid.querySelectorAll<HTMLElement>('.motion-demo').forEach((demo) => {
      const state = previews.get(demo);
      if (state) { state.visible = false; syncPreview(state); }
    });
    if (reducedMedia.matches || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      if (reducedMedia.matches || cardObserver !== observer) return;
      entries.forEach((entry) => {
        const demo = entry.target.querySelector<HTMLElement>('.motion-demo');
        const state = demo ? previews.get(demo) : undefined;
        if (!state) return;
        state.visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
        syncPreview(state);
      });
    }, { rootMargin: '40px 0px', threshold: 0.25 });
    cardObserver = observer;
    grid.querySelectorAll('.motion-card').forEach((card) => observer.observe(card));
  }

  function registerPreview(demo: HTMLElement, requested: boolean, visible: boolean): PreviewState {
    const state: PreviewState = { demo, requested, visible, started: false, animations: [] };
    previews.set(demo, state);
    syncPreview(state);
    return state;
  }

  function syncPreview(state: PreviewState): void {
    const running = state.requested && state.visible && !document.hidden && !reducedMedia.matches;
    if (running) state.started = true;
    state.demo.dataset.playback = reducedMedia.matches ? 'reduced'
      : !state.started ? 'idle' : running ? 'running' : 'paused';
    state.demo.classList.toggle('is-active', running);
    state.animations = state.demo.getAnimations({ subtree: true });
    state.animations.forEach((animation) => {
      animation.playbackRate = DEMO_PLAYBACK_RATE;
      // Resolve an unstarted infinite animation before pause() (Web Animations contract).
      if (animation.currentTime === null) animation.currentTime = 0;
      if (running) {
        if (animation.playState !== 'running') animation.play();
      } else if (animation.playState !== 'paused') {
        const heldTime = animation.currentTime;
        animation.pause();
        animation.currentTime = heldTime;
      }
    });
    updatePlaybackControls(state, running);
  }

  function updatePlaybackControls(state: PreviewState, running: boolean): void {
    const stage = state.demo.closest('.motion-modal-stage');
    const button = stage?.querySelector<HTMLButtonElement>('.motion-play-toggle');
    const replay = stage?.querySelector<HTMLButtonElement>('.motion-replay');
    if (!button || !replay) return;
    button.disabled = reducedMedia.matches;
    replay.disabled = reducedMedia.matches;
    button.setAttribute('aria-pressed', String(running));
    button.textContent = reducedMedia.matches ? '정적 미리보기' : running ? '일시정지'
      : state.started ? '계속 재생' : '재생';
    const status = stage?.querySelector<HTMLElement>('.motion-playback-status');
    if (status) status.textContent = reducedMedia.matches
      ? '모션 감소 설정에 따라 정적으로 표시합니다.'
      : document.hidden && state.requested ? '페이지가 숨겨져 재생을 잠시 멈췄습니다.'
      : '0.4× 속도의 타이밍 미리보기';
  }

  function disposePreview(state: PreviewState): void {
    state.animations.forEach((animation) => animation.cancel());
    previews.delete(state.demo);
  }

  function disposeModal(): void {
    modalController?.dispose();
    modalController = null;
    modalListeners?.abort();
    modalListeners = null;
    if (modalPreview) disposePreview(modalPreview);
    modalPreview = null;
  }

  function render(grid: HTMLElement): void {
    cardObserver?.disconnect();
    cardObserver = null;
    previews.forEach((state) => { if (grid.contains(state.demo)) disposePreview(state); });
    const visible = allPresets.filter(matches);
    CatalogShell.getRequiredElement<HTMLElement>('#motion-result-count').textContent = `${visible.length} of ${allPresets.length} motions`;
    if (visible.length === 0) {
      grid.innerHTML = '<div class="catalog-search-empty">검색 결과가 없습니다. "스프링", "로딩", "탭"처럼 기억나는 단어로 다시 찾아보세요.</div>';
      return;
    }
    grid.innerHTML = visible.map(renderCard).join('');
    grid.querySelectorAll<HTMLElement>('.motion-demo').forEach((demo) => registerPreview(demo, true, false));
    setupObserver(grid);
  }

  function renderCard(preset: MotionPreset): string {
    const demo = MotionDemos.isDemoType(preset.id) ? MotionDemos.render(preset.id) : '';
    return `<article class="motion-card" tabindex="0" role="button" aria-label="${escA(preset.nameKr)} 레시피 상세" data-motion-id="${escA(preset.id)}">
      <div class="motion-card-demo">${demo}</div>
      <div class="motion-card-meta">
        <div class="motion-card-kicker"><span>${esc(preset.category)}</span><span>${esc(preset.trigger)} · ${esc(preset.intensity)}</span></div>
        <h3 class="motion-card-title">${esc(preset.name)}</h3>
        <p class="motion-card-kr">${esc(preset.nameKr)} · ${preset.duration}ms</p>
      </div></article>`;
  }

  function wireModalControls(dialog: HTMLElement, id: string): void {
    const stage = dialog.querySelector<HTMLElement>('.motion-modal-stage');
    if (!stage) return;
    modalController = MotionInteractions.mount(stage, id);
    if (modalController) return;
    const demo = stage.querySelector<HTMLElement>('.motion-demo');
    const button = stage.querySelector<HTMLButtonElement>('.motion-play-toggle');
    const replay = stage.querySelector<HTMLButtonElement>('.motion-replay');
    if (!demo || !button || !replay) return;
    const state = registerPreview(demo, false, true);
    modalPreview = state;
    modalListeners = new AbortController();
    const { signal } = modalListeners;
    button.addEventListener('click', () => {
      state.requested = !state.requested;
      syncPreview(state);
    }, { signal });
    replay.addEventListener('click', () => {
      state.animations.forEach((animation) => { animation.currentTime = 0; });
      state.requested = true;
      state.started = true;
      syncPreview(state);
    }, { signal });
  }

  function renderModal(preset: MotionPreset): string {
    // CatalogShell replaces the old DOM only after this function returns.
    disposeModal();
    const demo = MotionDemos.isDemoType(preset.id) ? MotionDemos.render(preset.id) : '';
    const curve = MotionDemos.curveSvg(preset.easing);
    const related = preset.relatedEffects.length
      ? `<section class="motion-related"><h3>관련 Effects</h3>${preset.relatedEffects.map((effect) => `<a href="./effects.html#${escA(effect)}">${esc(effect)}</a>`).join('')}</section>`
      : '';
    const guide = preset.guide
      ? `<figure class="motion-guide-frame"><picture><source srcset="${escA(`./assets/images/thumbs/motion/${preset.id}/guide.webp?v=${GUIDE_VERSION}`)}" type="image/webp"><img class="motion-guide-image" src="${escA(`${GUIDE_BASE}/${preset.id}/${preset.guide.file}?v=${GUIDE_VERSION}`)}" data-original-src="${escA(`${GUIDE_BASE}/${preset.id}/${preset.guide.file}?v=${GUIDE_VERSION}`)}" alt="${escA(preset.guide.alt)}" loading="lazy" decoding="async"></picture>
        <figcaption>${esc(preset.guide.alt)}</figcaption></figure>`
      : '';
    return `<span class="modal-number">${esc(preset.category)} · ${esc(preset.trigger)} · ${esc(preset.intensity)}</span>
      <h2 class="modal-title" id="motion-modal-title" data-shell-initial-focus tabindex="-1">${esc(preset.name)} <span class="modal-title-kr">${esc(preset.nameKr)}</span></h2>
      <p class="motion-summary">${esc(preset.summary)}</p>
      <div class="motion-modal-stage">${demo}<div class="motion-playback-controls">
        <button type="button" class="motion-play-toggle" aria-pressed="false" aria-describedby="motion-playback-status">재생</button>
        <button type="button" class="motion-replay" aria-describedby="motion-playback-status">처음부터 재생</button>
      </div><p class="motion-playback-status" id="motion-playback-status" role="status">0.4× 속도의 타이밍 미리보기</p></div>
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
