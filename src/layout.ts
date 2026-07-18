(() => {
  const DATA_VERSION = '2026-07-18-layout';
  const DATA_URL = `./assets/data/layout.json?v=${DATA_VERSION}`;
  const GUIDE_BASE = './assets/images/layout';

  interface BreakpointSpec { minWidth?: number; maxWidth?: number; referenceWidth: number; composition: string; }
  interface CompositionSlot { role: string; labelKr: string; required: boolean; }
  interface ResponsiveRule { from: string; to: string; rule: string; }
  interface LayoutPattern {
    id: string; name: string; nameKr: string; family: string; category: string; summary: string;
    breakpoints: { desktop: BreakpointSpec; tablet: BreakpointSpec; mobile: BreakpointSpec };
    composition: CompositionSlot[]; responsive: ResponsiveRule[];
    bestFor: string[]; avoidWhen: string[];
    snippet: { html: string; css: string };
    relatedEffects: string[]; relatedIsms: string[];
    wireframe: { type: string; label: string };
    guide: { file: string; alt: string; prompt: string } | null;
  }

  let allPatterns: LayoutPattern[] = [];
  let familyFilter = 'all';
  let query = '';
  let shell: CatalogShell.Controller<LayoutPattern> | null = null;
  const esc = CatalogShell.escapeHtml;
  const escA = CatalogShell.escapeAttr;

  document.addEventListener('DOMContentLoaded', () => { void init(); });

  async function init(): Promise<void> {
    const grid = CatalogShell.getRequiredElement<HTMLElement>('#layout-grid');
    try {
      const response = await fetch(DATA_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw: unknown = await response.json();
      if (!Array.isArray(raw)) throw new Error('layout.json must be an array');
      allPatterns = raw as LayoutPattern[];
      mount(grid);
    } catch (error) {
      console.error('[layout] failed to initialize', error);
      CatalogShell.getRequiredElement<HTMLElement>('#layout-result-count').textContent = 'Error';
      AppRuntime.renderFatal(grid, {
        title: '레이아웃 데이터를 불러오지 못했습니다',
        body: '연결을 확인한 뒤 다시 시도해 주세요.',
        retry: '다시 시도'
      }, () => { void init(); });
    } finally {
      AppRuntime.dismissLoadingOverlay(320);
    }
  }

  function mount(grid: HTMLElement): void {
    const searchInput = CatalogShell.getRequiredElement<HTMLInputElement>('#layout-search');
    const filterRow = CatalogShell.getRequiredElement<HTMLElement>('#layout-family-filter');
    shell = CatalogShell.mount<LayoutPattern>({
      elements: {
        grid,
        resultCount: CatalogShell.getRequiredElement<HTMLElement>('#layout-result-count'),
        modalOverlay: CatalogShell.getRequiredElement<HTMLElement>('#layout-modal-overlay'),
        modalDialog: CatalogShell.getRequiredElement<HTMLElement>('#layout-modal-dialog'),
        modalClose: CatalogShell.getRequiredElement<HTMLButtonElement>('#layout-modal-close'),
        modalContent: CatalogShell.getRequiredElement<HTMLElement>('#layout-modal-content'),
        lightbox: document.querySelector<HTMLElement>('#layout-lightbox'),
        lightboxClose: document.querySelector<HTMLButtonElement>('#layout-lightbox-close'),
        lightboxImage: document.querySelector<HTMLImageElement>('#layout-lightbox-image')
      },
      getItems: () => allPatterns,
      getHashId: (pattern) => pattern.id,
      renderModal: (pattern) => renderModal(pattern),
      onModalOpen: (_pattern, dialog) => wireCopyButtons(dialog)
    });
    filterRow.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-family]') : null;
      if (!button) return;
      familyFilter = button.dataset.family ?? 'all';
      filterRow.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === button));
      render(grid);
    });
    searchInput.addEventListener('input', () => { query = searchInput.value.trim().toLowerCase(); render(grid); });
    const openFromCard = (target: EventTarget | null): void => {
      const card = target instanceof Element ? target.closest<HTMLElement>('.layout-card') : null;
      const pattern = card?.dataset.layoutId ? allPatterns.find((item) => item.id === card.dataset.layoutId) : undefined;
      if (pattern) shell?.openModal(pattern);
    };
    grid.addEventListener('click', (event) => openFromCard(event.target));
    grid.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openFromCard(event.target);
    });
    document.querySelector('#layout-modal-content')?.addEventListener('click', (event) => {
      const image = event.target instanceof Element ? event.target.closest<HTMLImageElement>('.layout-guide-image') : null;
      if (image) shell?.openLightbox(image.dataset.originalSrc || image.src, image.alt);
    });
    CatalogShell.setupLangToggle();
    render(grid);
    shell.hydrateHash();
  }

  function wireCopyButtons(dialog: HTMLElement): void {
    dialog.querySelectorAll<HTMLButtonElement>('.layout-copy-snippet').forEach((button) => {
      button.addEventListener('click', () => {
        const pattern = allPatterns.find((item) => item.id === button.dataset.layoutId);
        if (!pattern) return;
        const text = button.dataset.kind === 'css' ? pattern.snippet.css : pattern.snippet.html;
        void DesignExport.copyText(text, '스니펫을 복사했습니다.');
      });
    });
  }

  function matches(pattern: LayoutPattern): boolean {
    if (familyFilter !== 'all' && pattern.family !== familyFilter) return false;
    if (!query) return true;
    const haystack = `${pattern.id} ${pattern.name} ${pattern.nameKr} ${pattern.category} ${pattern.summary} ${pattern.bestFor.join(' ')}`.toLowerCase();
    return haystack.includes(query);
  }

  function render(grid: HTMLElement): void {
    const visible = allPatterns.filter(matches);
    CatalogShell.getRequiredElement<HTMLElement>('#layout-result-count').textContent = `${visible.length} of ${allPatterns.length} layouts`;
    if (visible.length === 0) {
      grid.innerHTML = '<div class="layout-empty">검색 결과가 없습니다. "히어로", "벤토", "설정"처럼 기억나는 단어로 다시 찾아보세요.</div>';
      return;
    }
    grid.innerHTML = visible.map(renderCard).join('');
  }

  function renderCard(pattern: LayoutPattern): string {
    const wire = LayoutWireframes.isWireframeType(pattern.wireframe.type)
      ? LayoutWireframes.render(pattern.wireframe.type, 'desktop')
      : '';
    return `<article class="layout-card" tabindex="0" role="button" aria-label="${escA(pattern.nameKr)} 패턴 상세" data-layout-id="${escA(pattern.id)}">
      <div class="layout-card-wire" aria-label="${escA(pattern.wireframe.label)}">${wire}</div>
      <div class="layout-card-meta">
        <div class="layout-card-kicker"><span>${esc(pattern.family)}</span><span>${esc(pattern.category)}</span></div>
        <h3 class="layout-card-title">${esc(pattern.name)}</h3>
        <p class="layout-card-kr">${esc(pattern.nameKr)}</p>
        <p class="layout-card-summary">${esc(pattern.summary)}</p>
      </div></article>`;
  }

  function renderViewportColumn(pattern: LayoutPattern, viewport: LayoutWireframes.Viewport, label: string, reference: number): string {
    const wire = LayoutWireframes.isWireframeType(pattern.wireframe.type)
      ? LayoutWireframes.render(pattern.wireframe.type, viewport)
      : '';
    const spec = pattern.breakpoints[viewport];
    return `<figure class="layout-compare-col">
      <figcaption><strong>${esc(label)}</strong> · ${reference}px 기준</figcaption>
      ${wire}
      <p class="layout-compare-note">${esc(spec.composition)}</p>
    </figure>`;
  }

  function renderModal(pattern: LayoutPattern): string {
    const slots = pattern.composition.map((slot) =>
      `<li><code>${esc(slot.role)}</code> ${esc(slot.labelKr)}${slot.required ? '' : ' <span class="layout-slot-optional">(선택)</span>'}</li>`).join('');
    const rules = pattern.responsive.map((rule) => `<li><strong>${esc(rule.from)} → ${esc(rule.to)}</strong> ${esc(rule.rule)}</li>`).join('');
    const chips = (items: string[]): string => items.map((item) => `<span class="layout-chip">${esc(item)}</span>`).join('');
    const related = pattern.relatedEffects.length || pattern.relatedIsms.length
      ? `<section class="layout-related"><h3>관련 항목</h3>
          ${pattern.relatedEffects.map((effect) => `<a href="./effects.html#${escA(effect)}">${esc(effect)}</a>`).join('')}
          ${pattern.relatedIsms.map((ism) => `<a href="./index.html#${escA(ism)}">${esc(ism)}</a>`).join('')}
        </section>`
      : '';
    const guide = pattern.guide
      ? `<figure class="layout-guide-frame"><picture><source srcset="${escA(`./assets/images/thumbs/layout/${pattern.id}/guide.webp`)}" type="image/webp"><img class="layout-guide-image" src="${escA(`${GUIDE_BASE}/${pattern.id}/${pattern.guide.file}`)}" data-original-src="${escA(`${GUIDE_BASE}/${pattern.id}/${pattern.guide.file}`)}" alt="${escA(pattern.guide.alt)}" loading="lazy" decoding="async"></picture>
        <figcaption>${esc(pattern.guide.alt)}</figcaption></figure>`
      : '';
    return `<span class="modal-number">${esc(pattern.family)} · ${esc(pattern.category)}</span>
      <h2 class="modal-title" id="layout-modal-title" data-shell-initial-focus tabindex="-1">${esc(pattern.name)} <span class="modal-title-kr">${esc(pattern.nameKr)}</span></h2>
      <p class="layout-summary">${esc(pattern.summary)}</p>
      <div class="layout-compare" role="group" aria-label="반응형 3단 비교">
        ${renderViewportColumn(pattern, 'desktop', 'Desktop', pattern.breakpoints.desktop.referenceWidth)}
        ${renderViewportColumn(pattern, 'tablet', 'Tablet', pattern.breakpoints.tablet.referenceWidth)}
        ${renderViewportColumn(pattern, 'mobile', 'Mobile', pattern.breakpoints.mobile.referenceWidth)}
      </div>
      <section class="layout-detail-grid">
        <div><h3>구성 요소</h3><ul class="layout-slot-list">${slots}</ul></div>
        <div><h3>반응형 변환</h3><ul class="layout-rule-list">${rules}</ul></div>
      </section>
      <div class="layout-usage"><div><h3>언제 쓰나</h3>${chips(pattern.bestFor)}</div><div><h3>피해야 할 때</h3>${chips(pattern.avoidWhen)}</div></div>
      <section class="layout-snippet-section">
        <div class="layout-snippet-head"><h3>코드 스니펫</h3>
          <button type="button" class="layout-copy-snippet" data-layout-id="${escA(pattern.id)}" data-kind="html">HTML 복사</button>
          <button type="button" class="layout-copy-snippet" data-layout-id="${escA(pattern.id)}" data-kind="css">CSS 복사</button>
        </div>
        <pre class="layout-snippet"><code>${esc(pattern.snippet.html)}</code></pre>
        <pre class="layout-snippet"><code>${esc(pattern.snippet.css)}</code></pre>
      </section>
      ${related}${guide}`;
  }
})();
