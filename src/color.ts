(() => {
  const DATA_VERSION = '2026-07-18-color';
  const COLOR_DATA_URL = `./assets/data/color.json?v=${DATA_VERSION}`;
  const GUIDE_BASE = './assets/images/color';

  interface ColorToken { role: string; hex: string; labelKr: string; }
  interface ContrastCheck { foregroundRole: string; backgroundRole: string; usage: 'normal-text' | 'large-text' | 'non-text'; }
  interface ContrastInfo { checks: ContrastCheck[]; notes: string[]; }
  interface ColorGuide { file: string; alt: string; prompt: string; }
  interface ColorCard {
    id: string; name: string; nameKr: string; family: string; category: string; tone: string;
    summary: string; useCases: string[]; palette: ColorToken[]; contrast: ContrastInfo;
    darkVariant: { palette: ColorToken[]; contrast: ContrastInfo };
    relatedIsms: string[]; guide: ColorGuide | null;
  }

  let allCards: ColorCard[] = [];
  let familyFilter = 'all';
  let query = '';
  let shell: CatalogShell.Controller<ColorCard> | null = null;
  const esc = CatalogShell.escapeHtml;
  const escA = CatalogShell.escapeAttr;

  document.addEventListener('DOMContentLoaded', () => { void init(); });

  async function init(): Promise<void> {
    const grid = CatalogShell.getRequiredElement<HTMLElement>('#color-grid');
    try {
      const response = await fetch(COLOR_DATA_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      allCards = parseCards(await response.json());
      mount(grid);
    } catch (error) {
      console.error('[color] failed to initialize', error);
      CatalogShell.getRequiredElement<HTMLElement>('#color-result-count').textContent = 'Error';
      AppRuntime.renderFatal(grid, {
        title: '팔레트 데이터를 불러오지 못했습니다',
        body: '연결을 확인한 뒤 다시 시도해 주세요.',
        retry: '다시 시도'
      }, () => { void init(); });
    } finally {
      AppRuntime.dismissLoadingOverlay(320);
    }
  }

  function parseCards(raw: unknown): ColorCard[] {
    if (!Array.isArray(raw)) throw new Error('color.json must be an array');
    return raw.map((item, index) => {
      const record = item as Record<string, unknown>;
      for (const key of ['id', 'name', 'nameKr', 'family', 'category', 'tone', 'summary']) {
        if (typeof record[key] !== 'string' || (record[key] as string).trim() === '') throw new Error(`color[${index}].${key} invalid`);
      }
      return record as unknown as ColorCard;
    });
  }

  function mount(grid: HTMLElement): void {
    const searchInput = CatalogShell.getRequiredElement<HTMLInputElement>('#color-search');
    const familyRow = CatalogShell.getRequiredElement<HTMLElement>('#color-family-filter');
    shell = CatalogShell.mount<ColorCard>({
      elements: {
        grid,
        resultCount: CatalogShell.getRequiredElement<HTMLElement>('#color-result-count'),
        modalOverlay: CatalogShell.getRequiredElement<HTMLElement>('#color-modal-overlay'),
        modalDialog: CatalogShell.getRequiredElement<HTMLElement>('#color-modal-dialog'),
        modalClose: CatalogShell.getRequiredElement<HTMLButtonElement>('#color-modal-close'),
        modalContent: CatalogShell.getRequiredElement<HTMLElement>('#color-modal-content'),
        lightbox: document.querySelector<HTMLElement>('#color-lightbox'),
        lightboxClose: document.querySelector<HTMLButtonElement>('#color-lightbox-close'),
        lightboxImage: document.querySelector<HTMLImageElement>('#color-lightbox-image')
      },
      getItems: () => allCards,
      getHashId: (card) => card.id,
      renderModal: (card) => renderModal(card)
    });
    familyRow.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-family]') : null;
      if (!button) return;
      familyFilter = button.dataset.family ?? 'all';
      familyRow.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === button));
      render(grid);
    });
    searchInput.addEventListener('input', () => { query = searchInput.value.trim().toLowerCase(); render(grid); });
    grid.addEventListener('click', (event) => {
      const card = event.target instanceof Element ? event.target.closest<HTMLElement>('.color-card') : null;
      const target = card?.dataset.colorId ? allCards.find((c) => c.id === card.dataset.colorId) : undefined;
      if (target) shell?.openModal(target);
    });
    grid.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = event.target instanceof Element ? event.target.closest<HTMLElement>('.color-card') : null;
      if (!card) return;
      event.preventDefault();
      const target = card.dataset.colorId ? allCards.find((c) => c.id === card.dataset.colorId) : undefined;
      if (target) shell?.openModal(target);
    });
    document.querySelector('#color-modal-content')?.addEventListener('click', (event) => {
      const image = event.target instanceof Element ? event.target.closest<HTMLImageElement>('.color-guide-image') : null;
      if (image) shell?.openLightbox(image.dataset.originalSrc || image.src, image.alt);
    });
    CatalogShell.setupLangToggle();
    render(grid);
    shell.hydrateHash();
  }

  function matches(card: ColorCard): boolean {
    if (familyFilter !== 'all' && card.family !== familyFilter) return false;
    if (!query) return true;
    const haystack = `${card.id} ${card.name} ${card.nameKr} ${card.category} ${card.tone} ${card.summary} ${card.useCases.join(' ')}`.toLowerCase();
    return haystack.includes(query);
  }

  function render(grid: HTMLElement): void {
    const visible = allCards.filter(matches);
    CatalogShell.getRequiredElement<HTMLElement>('#color-result-count').textContent = `${visible.length} of ${allCards.length} palettes`;
    if (visible.length === 0) {
      grid.innerHTML = '<div class="color-empty">검색 결과가 없습니다. "SaaS", "모노크롬", "Material"처럼 기억나는 단어로 다시 찾아보세요.</div>';
      return;
    }
    grid.innerHTML = visible.map(renderCard).join('');
  }

  function renderCard(card: ColorCard): string {
    const swatches = card.palette.slice(0, 10).map((token) =>
      `<i style="background:${escA(token.hex)}" title="${escA(token.role)}"></i>`).join('');
    return `<article class="color-card" tabindex="0" role="button" aria-label="${escA(card.nameKr)} 팔레트 상세" data-color-id="${escA(card.id)}">
      <div class="color-card-swatches" aria-hidden="true">${swatches}</div>
      <div class="color-card-body">
        <div class="color-card-kicker"><span>${esc(card.family)}</span><span>${esc(card.tone)}</span></div>
        <h3 class="color-card-title">${esc(card.name)}</h3>
        <p class="color-card-kr">${esc(card.nameKr)}</p>
        <p class="color-card-summary">${esc(card.summary)}</p>
      </div></article>`;
  }

  // WCAG relative luminance / contrast ratio (unrounded).
  function channel(value: number): number {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function luminance(hex: string): number {
    const n = parseInt(hex.slice(1), 16);
    return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  }
  function contrastRatio(fg: string, bg: string): number {
    const l1 = luminance(fg); const l2 = luminance(bg);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function threshold(usage: ContrastCheck['usage']): number { return usage === 'normal-text' ? 4.5 : 3.0; }

  function renderPaletteTable(title: string, palette: ColorToken[], contrast: ContrastInfo, dark: boolean): string {
    const byRole = new Map(palette.map((token) => [token.role, token.hex]));
    const rows = palette.map((token) =>
      `<tr><td><i class="color-chip" style="background:${escA(token.hex)}"></i></td><td><code>${esc(token.hex)}</code></td><td>${esc(token.role)}</td><td>${esc(token.labelKr)}</td></tr>`).join('');
    const checks = contrast.checks.map((check) => {
      const fg = byRole.get(check.foregroundRole); const bg = byRole.get(check.backgroundRole);
      if (!fg || !bg) return '';
      const ratio = contrastRatio(fg, bg);
      const pass = ratio >= threshold(check.usage);
      return `<li class="${pass ? 'pass' : 'fail'}"><code>${esc(check.foregroundRole)}</code> / <code>${esc(check.backgroundRole)}</code> · ${esc(check.usage)} · ${ratio.toFixed(2)}:1 ${pass ? 'AA 통과' : 'AA 미달'}</li>`;
    }).join('');
    return `<section class="color-variant${dark ? ' dark' : ''}">
      <h3>${esc(title)}</h3>
      <table class="color-role-table"><thead><tr><th></th><th>HEX</th><th>Role</th><th>용도</th></tr></thead><tbody>${rows}</tbody></table>
      <ul class="color-contrast-list" aria-label="${escA(title)} 대비 검사">${checks}</ul>
    </section>`;
  }

  function renderModal(card: ColorCard): string {
    const useCases = card.useCases.map((use) => `<span class="color-chip-label">${esc(use)}</span>`).join('');
    const related = card.relatedIsms.length
      ? `<section class="color-related"><h3>관련 ISM</h3>${card.relatedIsms.map((ism) => `<a href="./index.html#${escA(ism)}">${esc(ism)}</a>`).join('')}</section>`
      : '';
    const guide = card.guide
      ? `<figure class="color-guide-frame"><picture><source srcset="${escA(`./assets/images/thumbs/color/${card.id}/guide.webp`)}" type="image/webp"><img class="color-guide-image" src="${escA(`${GUIDE_BASE}/${card.id}/${card.guide.file}`)}" data-original-src="${escA(`${GUIDE_BASE}/${card.id}/${card.guide.file}`)}" alt="${escA(card.guide.alt)}" loading="lazy" decoding="async"></picture>
        <figcaption>${esc(card.guide.alt)} — 이 이미지는 역할과 구성 참고용입니다. 정확한 색상 값과 대비 판정은 위 role/HEX 표를 기준으로 합니다.</figcaption></figure>`
      : '';
    return `<span class="modal-number">${esc(card.family)} · ${esc(card.category)} · ${esc(card.tone)}</span>
      <h2 class="modal-title" id="color-modal-title" data-shell-initial-focus tabindex="-1">${esc(card.name)} <span class="modal-title-kr">${esc(card.nameKr)}</span></h2>
      <p class="color-summary">${esc(card.summary)}</p>
      <div class="color-usecases" aria-label="사용처">${useCases}</div>
      <div class="color-variants">
        ${renderPaletteTable('Light', card.palette, card.contrast, false)}
        ${renderPaletteTable('Dark', card.darkVariant.palette, card.darkVariant.contrast, true)}
      </div>
      ${related}${guide}`;
  }
})();
