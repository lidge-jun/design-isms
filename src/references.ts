(() => {
  const DATA_URL = './assets/data/references.json';

  interface ReferenceEntry {
    id: string;
    name: string;
    nameKr: string;
    kind: string;
    priority: string;
    summary: string;
    tags: string[];
    officialUrl: string;
    status: string;
    researchPrompt: string;
    imagePrompt: string;
  }

  interface PageElements {
    filterRow: HTMLElement;
    searchInput: HTMLInputElement;
    grid: HTMLElement;
    resultCount: HTMLElement;
  }

  let allReferences: ReferenceEntry[] = [];
  let activeKind = 'all';
  let searchQuery = '';

  document.addEventListener('DOMContentLoaded', () => {
    void init();
  });

  async function init(): Promise<void> {
    const elements = getElements();
    setupInteractions(elements);
    try {
      allReferences = await loadReferences();
      renderFilters(elements);
      renderCards(elements);
    } catch (error) {
      console.error('[references] failed to initialize', error);
      elements.grid.innerHTML = '<div class="references-empty">레퍼런스 데이터를 불러오지 못했습니다.</div>';
      elements.resultCount.textContent = 'Error';
    } finally {
      revealPage();
    }
  }

  function getElements(): PageElements {
    return {
      filterRow: required<HTMLElement>('#references-filter-row'),
      searchInput: required<HTMLInputElement>('#references-search'),
      grid: required<HTMLElement>('#references-grid'),
      resultCount: required<HTMLElement>('#references-result-count')
    };
  }

  function setupInteractions(elements: PageElements): void {
    setupLangToggle();
    elements.grid.addEventListener('error', handleImageError, true);
    elements.filterRow.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest('[data-kind]');
      if (!(button instanceof HTMLButtonElement)) return;
      activeKind = button.dataset.kind ?? 'all';
      renderFilters(elements);
      renderCards(elements);
    });
    elements.searchInput.addEventListener('input', () => {
      searchQuery = elements.searchInput.value.trim().toLowerCase();
      renderCards(elements);
    });
  }

  async function loadReferences(): Promise<ReferenceEntry[]> {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const raw: unknown = await response.json();
    if (!Array.isArray(raw)) throw new Error('references.json must be an array');
    return raw.map(parseReference);
  }

  function parseReference(value: unknown): ReferenceEntry {
    const record = asRecord(value);
    return {
      id: readString(record, 'id'),
      name: readString(record, 'name'),
      nameKr: readString(record, 'nameKr'),
      kind: readString(record, 'kind'),
      priority: readString(record, 'priority'),
      summary: readString(record, 'summary'),
      tags: readStringArray(record, 'tags'),
      officialUrl: readOptionalString(record, 'officialUrl'),
      status: readString(record, 'status'),
      researchPrompt: readString(record, 'researchPrompt'),
      imagePrompt: readString(record, 'imagePrompt')
    };
  }

  function renderFilters(elements: PageElements): void {
    const kinds = Array.from(new Set(allReferences.map((entry) => entry.kind)));
    elements.filterRow.innerHTML = [button('all', 'All'), ...kinds.map((kind) => button(kind, kind))].join('');
  }

  function button(kind: string, label: string): string {
    const activeClass = activeKind === kind ? ' active' : '';
    return `<button class="filter-btn${activeClass}" type="button" data-kind="${escapeAttr(kind)}">${escapeHtml(label)}</button>`;
  }

  function renderCards(elements: PageElements): void {
    const visible = allReferences.filter(matchesEntry);
    elements.resultCount.textContent = `${visible.length} references`;
    if (visible.length === 0) {
      elements.grid.innerHTML = '<div class="references-empty">검색 결과가 없습니다.</div>';
      return;
    }
    elements.grid.innerHTML = visible.map(renderCard).join('');
  }

  function matchesEntry(entry: ReferenceEntry): boolean {
    const kindMatches = activeKind === 'all' || entry.kind === activeKind;
    const haystack = [entry.name, entry.nameKr, entry.kind, entry.summary, ...entry.tags].join(' ').toLowerCase();
    return kindMatches && (!searchQuery || haystack.includes(searchQuery));
  }

  function renderCard(entry: ReferenceEntry): string {
    const image = imagePath(entry);
    const link = entry.officialUrl
      ? `<a class="reference-link" href="${escapeAttr(entry.officialUrl)}" target="_blank" rel="noopener">Official source</a>`
      : '<span class="reference-link is-muted">Research required</span>';
    return `<article class="reference-card">
      <div class="reference-image-wrap"><img src="${escapeAttr(image)}" alt="${escapeAttr(entry.name)} preview" loading="lazy"></div>
      <div class="reference-card-body">
        <div class="reference-kicker"><span>${escapeHtml(entry.kind)}</span><span>${escapeHtml(entry.priority)}</span></div>
        <h3>${escapeHtml(entry.name)}</h3>
        <p class="reference-kr">${escapeHtml(entry.nameKr)}</p>
        <p>${escapeHtml(entry.summary)}</p>
        <div class="reference-tags">${entry.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
        <details><summary>Grok prompt</summary><p>${escapeHtml(entry.researchPrompt)}</p></details>
        <details><summary>ima2 prompt</summary><p>${escapeHtml(entry.imagePrompt)}</p></details>
        ${link}
      </div>
    </article>`;
  }

  function imagePath(entry: ReferenceEntry): string {
    if (entry.kind === 'ISM Candidate') return `./assets/images/thumbs/${entry.id}/landing.webp`;
    return `./assets/images/thumbs/references/${entry.id}/overview.webp`;
  }

  function handleImageError(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;
    target.closest('.reference-image-wrap')?.classList.add('is-missing');
  }

  function setupLangToggle(): void {
    const button = document.querySelector<HTMLButtonElement>('#lang-toggle');
    if (!button) return;
    const saved = localStorage.getItem('design-isms-lang');
    const initial = saved === 'en' ? 'en' : 'ko';
    applyLanguage(button, initial);
    button.addEventListener('click', () => {
      const next = document.documentElement.lang === 'ko' ? 'en' : 'ko';
      localStorage.setItem('design-isms-lang', next);
      applyLanguage(button, next);
    });
  }

  function applyLanguage(button: HTMLButtonElement, lang: string): void {
    document.documentElement.lang = lang;
    button.textContent = lang === 'ko' ? 'KR' : 'EN';
  }

  function required<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Missing ${selector}`);
    return element;
  }

  function asRecord(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Entry must be an object');
    return value as Record<string, unknown>;
  }

  function readString(record: Record<string, unknown>, key: string): string {
    const value = record[key];
    if (typeof value !== 'string' || value.trim() === '') throw new Error(`${key} must be a string`);
    return value;
  }

  function readOptionalString(record: Record<string, unknown>, key: string): string {
    const value = record[key];
    return typeof value === 'string' ? value : '';
  }

  function readStringArray(record: Record<string, unknown>, key: string): string[] {
    const value = record[key];
    if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) throw new Error(`${key} must be string[]`);
    return value;
  }

  function revealPage(): void {
    window.setTimeout(() => {
      document.body.classList.remove('is-loading');
      document.querySelector<HTMLElement>('#loading-overlay')?.classList.add('fade-out');
    }, 220);
  }

  function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function escapeAttr(value: string): string {
    return escapeHtml(value);
  }
})();
