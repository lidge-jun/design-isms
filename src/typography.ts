(() => {
  const DATA_VERSION = '2026-07-18-typography';
  const DATA_URL = `./assets/data/typography.json?v=${DATA_VERSION}`;
  const GUIDE_BASE = './assets/images/typography';

  interface FontRole { family: string; weight: number; fallback: string[]; }
  interface WebfontSource { family: string; source: string; url: string | null; strategy: string; }
  interface Specimen { headingKo: string; headingEn: string; bodyKo: string; bodyEn: string; mono?: string; }
  interface Pairing {
    id: string; name: string; nameKr: string; family: string; category: string; summary: string;
    heading: FontRole; body: FontRole; mono?: FontRole;
    scale: { name: string; ratio: number };
    supportsKorean: boolean; webfonts: WebfontSource[]; specimen: Specimen;
    relatedIsms: string[]; guide: { file: string; alt: string; prompt: string } | null;
  }

  let allPairings: Pairing[] = [];
  let categoryFilter = 'all';
  let query = '';
  let shell: CatalogShell.Controller<Pairing> | null = null;
  const esc = CatalogShell.escapeHtml;
  const escA = CatalogShell.escapeAttr;

  document.addEventListener('DOMContentLoaded', () => { void init(); });

  async function init(): Promise<void> {
    const grid = CatalogShell.getRequiredElement<HTMLElement>('#typography-grid');
    try {
      const response = await fetch(DATA_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw: unknown = await response.json();
      if (!Array.isArray(raw)) throw new Error('typography.json must be an array');
      allPairings = raw as Pairing[];
      mount(grid);
    } catch (error) {
      console.error('[typography] failed to initialize', error);
      CatalogShell.getRequiredElement<HTMLElement>('#typography-result-count').textContent = 'Error';
      AppRuntime.renderFatal(grid, {
        title: '페어링 데이터를 불러오지 못했습니다',
        body: '연결을 확인한 뒤 다시 시도해 주세요.',
        retry: '다시 시도'
      }, () => { void init(); });
    } finally {
      AppRuntime.dismissLoadingOverlay(320);
    }
  }

  function fontStack(role: FontRole, koreanFirst: boolean): string {
    const families = koreanFirst ? role.fallback : [role.family, ...role.fallback];
    return families.map((family) => (family.includes(' ') ? `'${family}'` : family)).join(', ');
  }

  function specimenTexts(pairing: Pairing): string[] {
    const spec = pairing.specimen;
    return [spec.headingKo, spec.headingEn, spec.bodyKo, spec.bodyEn, spec.mono ?? '', pairing.name, pairing.nameKr];
  }

  function googleBaseUrl(pairing: Pairing): string | null {
    const google = pairing.webfonts.find((webfont) => webfont.source === 'google-fonts' && webfont.url);
    return google?.url ?? null;
  }

  function loadPairingFonts(pairing: Pairing, dialog: HTMLElement | null): void {
    const base = googleBaseUrl(pairing);
    if (!base) return;
    void TypographyFonts.ensureLoaded(pairing.id, base, specimenTexts(pairing)).then((ok) => {
      const target = dialog ?? document;
      const badge = target.querySelector<HTMLElement>(`[data-font-status="${pairing.id}"]`);
      if (badge) badge.textContent = ok ? '웹폰트 로드됨' : '시스템 대체 글꼴 표시 중';
    });
  }

  function mount(grid: HTMLElement): void {
    const searchInput = CatalogShell.getRequiredElement<HTMLInputElement>('#typography-search');
    const filterRow = CatalogShell.getRequiredElement<HTMLElement>('#typography-category-filter');
    shell = CatalogShell.mount<Pairing>({
      elements: {
        grid,
        resultCount: CatalogShell.getRequiredElement<HTMLElement>('#typography-result-count'),
        modalOverlay: CatalogShell.getRequiredElement<HTMLElement>('#typography-modal-overlay'),
        modalDialog: CatalogShell.getRequiredElement<HTMLElement>('#typography-modal-dialog'),
        modalClose: CatalogShell.getRequiredElement<HTMLButtonElement>('#typography-modal-close'),
        modalContent: CatalogShell.getRequiredElement<HTMLElement>('#typography-modal-content'),
        lightbox: document.querySelector<HTMLElement>('#typography-lightbox'),
        lightboxClose: document.querySelector<HTMLButtonElement>('#typography-lightbox-close'),
        lightboxImage: document.querySelector<HTMLImageElement>('#typography-lightbox-image')
      },
      getItems: () => allPairings,
      getHashId: (pairing) => pairing.id,
      renderModal: (pairing) => renderModal(pairing),
      onModalOpen: (pairing, dialog) => loadPairingFonts(pairing, dialog)
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
      const card = target instanceof Element ? target.closest<HTMLElement>('.typo-card') : null;
      const pairing = card?.dataset.pairingId ? allPairings.find((item) => item.id === card.dataset.pairingId) : undefined;
      if (pairing) shell?.openModal(pairing);
    };
    grid.addEventListener('click', (event) => openFromCard(event.target));
    grid.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openFromCard(event.target);
    });
    document.querySelector('#typography-modal-content')?.addEventListener('click', (event) => {
      const image = event.target instanceof Element ? event.target.closest<HTMLImageElement>('.typo-guide-image') : null;
      if (image) shell?.openLightbox(image.dataset.originalSrc || image.src, image.alt);
    });
    CatalogShell.setupLangToggle();
    render(grid);
    shell.hydrateHash();
  }

  function matches(pairing: Pairing): boolean {
    if (categoryFilter !== 'all' && pairing.category !== categoryFilter) return false;
    if (!query) return true;
    const haystack = `${pairing.id} ${pairing.name} ${pairing.nameKr} ${pairing.category} ${pairing.summary} ${pairing.heading.family} ${pairing.body.family}`.toLowerCase();
    return haystack.includes(query);
  }

  function render(grid: HTMLElement): void {
    const visible = allPairings.filter(matches);
    CatalogShell.getRequiredElement<HTMLElement>('#typography-result-count').textContent = `${visible.length} of ${allPairings.length} pairings`;
    if (visible.length === 0) {
      grid.innerHTML = '<div class="catalog-search-empty">검색 결과가 없습니다. "명조", "serif", "코딩"처럼 기억나는 단어로 다시 찾아보세요.</div>';
      return;
    }
    grid.innerHTML = visible.map(renderCard).join('');
  }

  function renderCard(pairing: Pairing): string {
    const headingStack = fontStack(pairing.heading, false);
    const bodyStack = fontStack(pairing.body, !pairing.supportsKorean);
    return `<article class="typo-card" tabindex="0" role="button" aria-label="${escA(pairing.nameKr)} 페어링 상세" data-pairing-id="${escA(pairing.id)}">
      <div class="typo-card-specimen">
        <p class="typo-card-heading" style="font-family:${escA(headingStack)};font-weight:${pairing.heading.weight}">${esc(pairing.specimen.headingEn)}</p>
        <p class="typo-card-body" style="font-family:${escA(bodyStack)};font-weight:${pairing.body.weight}">${esc(pairing.specimen.bodyKo)}</p>
      </div>
      <div class="typo-card-meta">
        <div class="typo-card-kicker"><span>${esc(pairing.category)}</span><span>${esc(pairing.scale.name)}</span></div>
        <h3 class="typo-card-title">${esc(pairing.name)}</h3>
        <p class="typo-card-kr">${esc(pairing.nameKr)} · ${esc(pairing.heading.family)} + ${esc(pairing.body.family)}</p>
      </div></article>`;
  }

  function renderScaleRows(pairing: Pairing): string {
    const base = 16;
    const steps = [['Display', 4], ['H1', 3], ['H2', 2], ['H3', 1], ['Body', 0], ['Caption', -1]] as const;
    return steps.map(([label, step]) => {
      const size = (base * Math.pow(pairing.scale.ratio, step)).toFixed(1);
      return `<tr><td>${esc(label)}</td><td>${size}px</td></tr>`;
    }).join('');
  }

  function renderModal(pairing: Pairing): string {
    const headingStack = fontStack(pairing.heading, false);
    const bodyStack = fontStack(pairing.body, !pairing.supportsKorean);
    const koreanNote = pairing.supportsKorean
      ? ''
      : '<p class="typo-korean-note">한글: 시스템 대체 글꼴로 표시됩니다 (이 페어링의 라틴 폰트는 한글 글리프를 포함하지 않습니다).</p>';
    const mono = pairing.mono && pairing.specimen.mono
      ? `<pre class="typo-specimen-mono" style="font-family:${escA(fontStack(pairing.mono, false))}">${esc(pairing.specimen.mono)}</pre>`
      : '';
    const related = pairing.relatedIsms.length
      ? `<section class="typo-related"><h3>관련 ISM</h3>${pairing.relatedIsms.map((ism) => `<a href="./index.html#${escA(ism)}">${esc(ism)}</a>`).join('')}</section>`
      : '';
    const guide = pairing.guide
      ? `<figure class="typo-guide-frame"><picture><source srcset="${escA(`./assets/images/thumbs/typography/${pairing.id}/guide.webp`)}" type="image/webp"><img class="typo-guide-image" src="${escA(`${GUIDE_BASE}/${pairing.id}/${pairing.guide.file}`)}" data-original-src="${escA(`${GUIDE_BASE}/${pairing.id}/${pairing.guide.file}`)}" alt="${escA(pairing.guide.alt)}" loading="lazy" decoding="async"></picture>
        <figcaption>${esc(pairing.guide.alt)} — 정확한 조판 값은 위 스케일 표와 폰트 정보를 기준으로 합니다.</figcaption></figure>`
      : '';
    return `<span class="modal-number">${esc(pairing.category)} · ${esc(pairing.scale.name)} (${pairing.scale.ratio})</span>
      <h2 class="modal-title" id="typography-modal-title" data-shell-initial-focus tabindex="-1">${esc(pairing.name)} <span class="modal-title-kr">${esc(pairing.nameKr)}</span></h2>
      <p class="typo-summary">${esc(pairing.summary)}</p>
      <p class="typo-font-status" data-font-status="${escA(pairing.id)}" aria-live="polite">웹폰트 로드 중…</p>
      <div class="typo-specimen-panel">
        <p class="typo-specimen-heading" style="font-family:${escA(headingStack)};font-weight:${pairing.heading.weight}">${esc(pairing.specimen.headingKo)}</p>
        <p class="typo-specimen-heading en" style="font-family:${escA(headingStack)};font-weight:${pairing.heading.weight}">${esc(pairing.specimen.headingEn)}</p>
        <p class="typo-specimen-body" style="font-family:${escA(bodyStack)};font-weight:${pairing.body.weight}">${esc(pairing.specimen.bodyKo)}</p>
        <p class="typo-specimen-body" style="font-family:${escA(bodyStack)};font-weight:${pairing.body.weight}">${esc(pairing.specimen.bodyEn)}</p>
        ${mono}${koreanNote}
      </div>
      <section class="typo-detail-grid">
        <div><h3>폰트 구성</h3><ul class="typo-font-list">
          <li><strong>Heading</strong> ${esc(pairing.heading.family)} ${pairing.heading.weight}</li>
          <li><strong>Body</strong> ${esc(pairing.body.family)} ${pairing.body.weight}</li>
          ${pairing.mono ? `<li><strong>Mono</strong> ${esc(pairing.mono.family)} ${pairing.mono.weight}</li>` : ''}
        </ul></div>
        <div><h3>타입 스케일</h3><table class="typo-scale-table"><tbody>${renderScaleRows(pairing)}</tbody></table></div>
      </section>
      ${related}${guide}`;
  }
})();
