(() => {
  const DATA_VERSION = '2026-07-17-production';
  const IMAGE_VERSION = '2026-07-17-quality';
  const EFFECTS_DATA_URL = `./assets/data/effects.json?v=${DATA_VERSION}`;
  const EFFECT_GUIDE_BASE_URL = './assets/images/effects';
  const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

  type DemoType = EffectsDemos.DemoType;
  interface EffectDemo { type: DemoType; label: string; }
  interface EffectGuide { file: string; alt: string; prompt: string; }
  interface UxEffect {
    id: string; name: string; nameKr: string; family: string; category: string; priority: string; summary: string;
    alsoCalled: string[]; bestFor: string[]; avoidWhen: string[]; implementation: string[];
    accessibility: string[]; performance: string[]; demo: EffectDemo; guide: EffectGuide | null;
  }
  interface PageElements {
    familyRow: HTMLElement; deviceRow: HTMLElement; searchInput: HTMLInputElement; grid: HTMLElement; resultCount: HTMLElement;
    modalOverlay: HTMLElement; modalDialog: HTMLElement; modalClose: HTMLButtonElement; modalContent: HTMLElement;
    lightbox: HTMLElement; lightboxClose: HTMLButtonElement; lightboxImage: HTMLImageElement;
    toast: HTMLElement; scrollTop: HTMLButtonElement;
  }

  let allEffects: UxEffect[] = [];
  let effectDocs: EffectsDocs.DocsMap = new Map();
  let filtersController: EffectsFilters.Controller | null = null;
  let filterState: EffectsFilters.State = { family: 'all', device: 'all', query: '' };
  let interactions: EffectsInteractions.Controller | null = null;
  let cardObserver: IntersectionObserver | null = null;
  let staticInteractionsMounted = false;
  let loadPromise: Promise<void> | null = null;
  let shell: CatalogShell.Controller<UxEffect> | null = null;

  document.addEventListener('DOMContentLoaded', () => {
    const elements = getPageElements();
    mountStaticInteractionsOnce(elements);
    void loadAndRender(elements);
  });

  function loadAndRender(elements: PageElements): Promise<void> {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      interactions?.destroy(); interactions = null;
      filtersController?.destroy(); filtersController = null;
      cardObserver?.disconnect(); cardObserver = null;
      try {
        allEffects = await loadEffects();
        effectDocs = await EffectsDocs.load();
        filtersController = EffectsFilters.create(
          allEffects,
          { familyRow: elements.familyRow, deviceRow: elements.deviceRow },
          state => { filterState = state; renderEffectCards(elements); }
        );
        filterState = filtersController.getState();
        elements.searchInput.value = filterState.query;
        interactions = EffectsInteractions.mount(elements.grid);
        renderEffectCards(elements);
        shell?.hydrateHash();
      } catch (error) {
        console.error('[effects] failed to initialize', error);
        renderError(elements);
      } finally {
        AppRuntime.dismissLoadingOverlay(320);
      }
    })().finally(() => { loadPromise = null; });
    return loadPromise;
  }

  function getPageElements(): PageElements {
    return {
      familyRow: getRequiredElement<HTMLElement>('#effects-family-filter'),
      deviceRow: getRequiredElement<HTMLElement>('#effects-device-filter'),
      searchInput: getRequiredElement<HTMLInputElement>('#effects-search'),
      grid: getRequiredElement<HTMLElement>('#effects-grid'),
      resultCount: getRequiredElement<HTMLElement>('#effects-result-count'),
      modalOverlay: getRequiredElement<HTMLElement>('#effect-modal-overlay'),
      modalDialog: getRequiredElement<HTMLElement>('#effect-modal-dialog'),
      modalClose: getRequiredElement<HTMLButtonElement>('#effect-modal-close'),
      modalContent: getRequiredElement<HTMLElement>('#effect-modal-content'),
      lightbox: getRequiredElement<HTMLElement>('#effect-lightbox'),
      lightboxClose: getRequiredElement<HTMLButtonElement>('#effect-lightbox-close'),
      lightboxImage: getRequiredElement<HTMLImageElement>('#effect-lightbox-image'),
      toast: getRequiredElement<HTMLElement>('#effect-toast'),
      scrollTop: getRequiredElement<HTMLButtonElement>('#effects-scroll-top')
    };
  }

  function getRequiredElement<T extends Element>(selector: string): T {
    return CatalogShell.getRequiredElement<T>(selector);
  }

  async function loadEffects(): Promise<UxEffect[]> {
    try {
      const response = await fetch(EFFECTS_DATA_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const raw: unknown = await response.json();
      return parseEffects(raw);
    } catch (error) {
      console.error('[effects] loadEffects failed', error);
      throw error;
    }
  }

  function parseEffects(raw: unknown): UxEffect[] {
    if (!Array.isArray(raw)) {
      throw new Error('effects.json must be an array');
    }
    return raw.map((item, index) => parseEffect(item, index));
  }

  function parseEffect(raw: unknown, index: number): UxEffect {
    const record = asRecord(raw, `effect[${index}]`);
    const id = readString(record, 'id');
    return {
      id, name: readString(record, 'name'), nameKr: readString(record, 'nameKr'),
      family: readString(record, 'family'), category: readString(record, 'category'), priority: readString(record, 'priority'),
      summary: readString(record, 'summary'), alsoCalled: readStringArray(record, 'alsoCalled'),
      bestFor: readStringArray(record, 'bestFor'), avoidWhen: readStringArray(record, 'avoidWhen'),
      implementation: readStringArray(record, 'implementation'), accessibility: readStringArray(record, 'accessibility'),
      performance: readStringArray(record, 'performance'), demo: readDemo(record.demo, id), guide: readGuide(record.guide, id)
    };
  }

  function asRecord(value: unknown, context: string): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(`${context} must be an object`);
    }
    return value as Record<string, unknown>;
  }

  function readString(record: Record<string, unknown>, key: string): string {
    const value = record[key];
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`${key} must be a non-empty string`);
    }
    return value;
  }

  function readStringArray(record: Record<string, unknown>, key: string): string[] {
    const value = record[key];
    if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
      throw new Error(`${key} must be a string array`);
    }
    return value;
  }

  function readDemo(value: unknown, effectId: string): EffectDemo {
    const record = asRecord(value, `${effectId}.demo`);
    const type = readString(record, 'type');
    if (!EffectsDemos.isDemoType(type)) {
      throw new Error(`${effectId}.demo.type is invalid`);
    }
    if (type !== effectId) {
      throw new Error(`${effectId}.demo.type must equal id; received ${type}`);
    }
    return { type, label: readString(record, 'label') };
  }

  function readGuide(value: unknown, effectId: string): EffectGuide | null {
    if (value === null) {
      return null;
    }
    const record = asRecord(value, `${effectId}.guide`);
    return { file: readString(record, 'file'), alt: readString(record, 'alt'), prompt: readString(record, 'prompt') };
  }

  function mountStaticInteractionsOnce(elements: PageElements): void {
    if (staticInteractionsMounted) return;
    staticInteractionsMounted = true;
    shell = CatalogShell.mount<UxEffect>({
      elements: {
        grid: elements.grid,
        resultCount: elements.resultCount,
        modalOverlay: elements.modalOverlay,
        modalDialog: elements.modalDialog,
        modalClose: elements.modalClose,
        modalContent: elements.modalContent,
        lightbox: elements.lightbox,
        lightboxClose: elements.lightboxClose,
        lightboxImage: elements.lightboxImage
      },
      getItems: () => allEffects,
      getHashId: (effect) => effect.id,
      renderModal: (effect) => renderEffectModal(effect),
      onModalOpen: (effect) => {
        const codeMount = elements.modalContent.querySelector<HTMLElement>('#effect-code-mount');
        if (codeMount) void DesignExport.mountEffect(codeMount, effect.id);
      }
    });
    elements.searchInput.addEventListener('input', () => {
      filtersController?.setQuery(elements.searchInput.value);
    });

    elements.grid.addEventListener('click', (event) => openCardFromEvent(event, elements));
    elements.grid.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openCardFromEvent(event, elements);
    });

    elements.modalContent.addEventListener('click', (event) => handleModalContentClick(event, elements));
    elements.modalContent.addEventListener('error', handleGuideImageError, true);
    elements.scrollTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => {
      elements.scrollTop.classList.toggle('visible', window.scrollY > 560);
    }, { passive: true });
    CatalogShell.setupLangToggle();
  }

  function renderEffectCards(elements: PageElements): void {
    const visibleEffects = allEffects.filter(effect => EffectsFilters.matches(effect, filterState));
    elements.resultCount.textContent = `${visibleEffects.length} of ${allEffects.length} effects`;

    if (visibleEffects.length === 0) {
      elements.grid.innerHTML = '<div class="effects-empty">검색 결과가 없습니다. "팝업", "로딩", "스와이프"처럼 기억나는 단어로 다시 찾아보세요. <button type="button" class="filter-btn" id="effects-filter-reset">필터 초기화</button></div>';
      document.getElementById('effects-filter-reset')?.addEventListener('click', () => {
        elements.searchInput.value = '';
        filtersController?.reset();
      });
      return;
    }

    elements.grid.innerHTML = visibleEffects.map((effect, index) => renderEffectCard(effect, index)).join('');
    setupCardObserver(elements.grid);
    interactions?.refresh();
  }

  function renderEffectCard(effect: UxEffect, index: number): string {
    const aliasText = effect.alsoCalled.slice(0, 2).join(' · ');
    const chips = effect.bestFor.slice(0, 3).map((chip) => `<span class="effect-chip">${escapeHtml(chip)}</span>`).join('');
    return `<article class="effect-card" tabindex="0" role="button" aria-labelledby="effect-card-title-${escapeAttr(effect.id)}" data-effect-id="${escapeAttr(effect.id)}" style="--effect-index:${index % 6}">
      ${renderEffectDemo(effect)}<div class="effect-card-body">
      <div class="effect-card-kicker"><span>${escapeHtml(effect.category)}</span><span>${escapeHtml(effect.priority)}</span></div>
      <h3 class="effect-card-title" id="effect-card-title-${escapeAttr(effect.id)}">${escapeHtml(effect.name)}</h3>
      <p class="effect-card-kr">${escapeHtml(effect.nameKr)} · ${escapeHtml(aliasText)}</p>
      <p class="effect-card-summary">${escapeHtml(effect.summary)}</p><div class="effect-chip-row" aria-label="Best for">${chips}</div></div></article>`;
  }

  function renderEffectDemo(effect: UxEffect): string {
    const type = effect.demo.type;
    const body = EffectsDemos.render(type);
    return `<div class="effect-demo effect-demo-${escapeAttr(type)}" aria-label="${escapeAttr(effect.demo.label)}"><div class="effect-phone">${body}</div></div>`;
  }

  function setupCardObserver(grid: HTMLElement): void {
    cardObserver?.disconnect();
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('.effect-card'));
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

  function openCardFromEvent(event: Event, _elements: PageElements): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('[data-demo-action]')) return; // interactive demo controls stay in-card
    const card = target.closest('.effect-card');
    if (!(card instanceof HTMLElement)) return;
    const effectId = card.dataset.effectId;
    if (effectId) openEffectModal(effectId);
  }

  function openEffectModal(effectId: string): void {
    const effect = allEffects.find((item) => item.id === effectId);
    if (!effect) return;
    shell?.openModal(effect);
  }
  function renderEffectModal(effect: UxEffect): string {
    return `<div class="effect-modal-hero"><div>
      <span class="modal-number">${escapeHtml(effect.priority)} · ${escapeHtml(effect.category)}</span>
      <h2 class="modal-title" id="effect-modal-title" data-shell-initial-focus tabindex="-1">${escapeHtml(effect.name)} <span class="modal-title-kr">${escapeHtml(effect.nameKr)}</span></h2>
      <div class="effect-aliases">${renderChips(effect.alsoCalled)}</div><p class="effect-summary">${escapeHtml(effect.summary)}</p>
      </div>${renderEffectDemo(effect)}</div><div class="effect-check-grid">
      ${renderCheckCard('언제 쓰나', effect.bestFor)}${renderCheckCard('피해야 할 때', effect.avoidWhen)}</div>
      ${renderCollapsible('implementation', '구현 방법', effect.implementation, true)}
      ${renderCollapsible('accessibility', '접근성 체크', effect.accessibility, false)}
      ${renderCollapsible('performance', '성능 체크', effect.performance, false)}
      ${EffectsDocs.render(effect.id, effectDocs.get(effect.id) ?? null)}${renderGuide(effect)}<section class="effect-code-mount" id="effect-code-mount" aria-label="Implementation code"></section>`;
  }

  function renderChips(items: string[]): string { return items.map((item) => `<span class="effect-chip">${escapeHtml(item)}</span>`).join(''); }

  function renderCheckCard(title: string, items: string[]): string { return `<section class="effect-check-card"><h3>${escapeHtml(title)}</h3>${renderList(items)}</section>`; }

  function renderCollapsible(id: string, title: string, items: string[], open: boolean): string {
    const expanded = open ? 'true' : 'false';
    const openClass = open ? ' open' : '';
    return `<section class="modal-collapsible${openClass}">
      <button class="modal-collapsible-header" type="button" aria-expanded="${expanded}" aria-controls="effect-section-${escapeAttr(id)}"><span class="modal-collapsible-arrow">›</span>${escapeHtml(title)}</button>
      <div class="modal-collapsible-body" id="effect-section-${escapeAttr(id)}"><div class="modal-collapsible-inner">${renderList(items)}</div></div></section>`;
  }

  function renderList(items: string[]): string { return `<ul class="effect-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`; }

  function renderGuide(effect: UxEffect): string {
    if (!effect.guide) return '';
    const pngSrc = `${EFFECT_GUIDE_BASE_URL}/${effect.id}/${effect.guide.file}?v=${IMAGE_VERSION}`;
    const webpSrc = pngSrc.replace('/images/effects/', '/images/thumbs/effects/').replace(/\.png(?=\?)/i, '.webp');
    return `<figure class="effect-guide-frame"><picture class="effect-guide-picture"><source srcset="${escapeAttr(webpSrc)}" type="image/webp"><img class="effect-guide-image" src="${escapeAttr(pngSrc)}" data-original-src="${escapeAttr(pngSrc)}" alt="${escapeAttr(effect.guide.alt)}" loading="lazy" decoding="async"></picture>
      <figcaption class="effect-guide-caption">${escapeHtml(effect.guide.alt)}
      <button class="effect-copy-prompt" type="button" data-prompt="${escapeAttr(effect.guide.prompt)}">프롬프트 복사</button></figcaption></figure>`;
  }

  function handleModalContentClick(event: Event, elements: PageElements): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const header = target.closest('.modal-collapsible-header');
    if (header instanceof HTMLButtonElement) {
      const section = header.closest('.modal-collapsible');
      section?.classList.toggle('open');
      header.setAttribute('aria-expanded', section?.classList.contains('open') ? 'true' : 'false');
      return;
    }
    const image = target.closest('.effect-guide-image');
    if (image instanceof HTMLImageElement) {
      shell?.openLightbox(image.dataset.originalSrc || image.currentSrc || image.src, image.alt);
      return;
    }
    const copyButton = target.closest('.effect-copy-prompt');
    if (copyButton instanceof HTMLButtonElement && copyButton.dataset.prompt) {
      void copyPrompt(copyButton.dataset.prompt, elements);
    }
  }

  function handleGuideImageError(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLImageElement && target.classList.contains('effect-guide-image')) {
      target.closest('.effect-guide-frame')?.classList.add('is-missing');
    }
  }

  async function copyPrompt(prompt: string, _elements: PageElements): Promise<void> {
    void DesignExport.copyText(prompt, '프롬프트를 복사했습니다.');
  }

  function renderError(elements: PageElements): void {
    elements.resultCount.textContent = 'Error';
    AppRuntime.renderFatal(elements.grid, {
      title: '효과 데이터를 불러오지 못했습니다',
      body: '연결을 확인한 뒤 다시 시도해 주세요.',
      retry: '다시 시도'
    }, () => { void loadAndRender(elements); });
  }

  function escapeHtml(value: string): string {
    return CatalogShell.escapeHtml(value);
  }

  function escapeAttr(value: string): string { return escapeHtml(value); }
})();
