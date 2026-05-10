const DATA_URL = './assets/data/isms.json';
const IMAGE_BASE_URL = './assets/images';
const THUMB_BASE_URL = './assets/images/thumbs';

type Lang = 'ko' | 'en';
type UIStringKey =
  | 'search'
  | 'moreSites'
  | 'showLess'
  | 'colorPalette'
  | 'keywords'
  | 'exampleSites'
  | 'relatedIsms'
  | 'designMockup'
  | 'footerTitle'
  | 'footerGen';

interface IsmExample {
  name: string;
  url: string;
}

interface IsmImage {
  file: string;
  label: string;
}

interface IsmPrompt {
  file: string;
  prompt: string;
  model?: string;
  quality?: string;
  size?: string;
}

interface DesignIsm {
  id: string;
  name: string;
  nameKr: string;
  tagline: string;
  description: string;
  descriptionEn?: string;
  history?: string;
  keywords: string[];
  palette: string[];
  examples: IsmExample[];
  images: IsmImage[];
  prompts?: IsmPrompt[];
}

interface RelatedScore {
  ism: DesignIsm;
  score: number;
}

const UI_STRINGS: Record<Lang, Record<UIStringKey, string>> = {
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

let allIsms: DesignIsm[] = [];
let activeFilter = 'all';
let searchQuery = '';
let currentLang: Lang = localStorage.getItem('design-isms-lang') === 'en' ? 'en' : 'ko';
let imgObserver: IntersectionObserver | null = null;
let pageRevealed = false;
let cardObserver: IntersectionObserver | null = null;

const toastTimers = new WeakMap<HTMLElement, number>();

function t(key: UIStringKey, vars: Record<string, string | number> = {}): string {
  let str = UI_STRINGS[currentLang][key] || UI_STRINGS.en[key] || key;
  Object.entries(vars).forEach(([varKey, value]) => {
    str = str.replace('{' + varKey + '}', String(value));
  });
  return str;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isExampleArray(value: unknown): value is IsmExample[] {
  return Array.isArray(value) && value.every(item =>
    isRecord(item) && typeof item.name === 'string' && typeof item.url === 'string'
  );
}

function isImageArray(value: unknown): value is IsmImage[] {
  return Array.isArray(value) && value.every(item =>
    isRecord(item) && typeof item.file === 'string' && typeof item.label === 'string'
  );
}

function isPromptArray(value: unknown): value is IsmPrompt[] {
  return Array.isArray(value) && value.every(item =>
    isRecord(item) && typeof item.file === 'string' && typeof item.prompt === 'string'
  );
}

function readRequiredString(
  item: Record<string, unknown>,
  key: string,
  index: number
): string {
  const value = item[key];
  if (typeof value !== 'string') {
    throw new Error('Invalid isms data: item ' + index + ' missing string field "' + key + '".');
  }
  return value;
}

function parseIsms(raw: unknown): DesignIsm[] {
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

    const ism: DesignIsm = {
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

function queryRequired<T extends Element>(selector: string, root: ParentNode = document): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error('Missing required element: ' + selector);
  }
  return element;
}

function getRequired<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error('Missing required element: #' + id);
  }
  return element as T;
}

function eventElement(event: Event): Element | null {
  return event.target instanceof Element ? event.target : null;
}

function safeDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function originalImageSrc(ismId: string, file: string): string {
  return `${IMAGE_BASE_URL}/${ismId}/${file}`;
}

function thumbnailFile(file: string): string {
  return file.replace(/\.[^.]+$/, '.webp');
}

function thumbImageSrc(ismId: string, file: string): string {
  return `${THUMB_BASE_URL}/${ismId}/${thumbnailFile(file)}`;
}

function getDesc(ism: DesignIsm): string {
  return currentLang === 'en' && ism.descriptionEn ? ism.descriptionEn : ism.description;
}

function getHistory(ism: DesignIsm): string {
  return ism.history || '';
}

async function init(): Promise<void> {
  const res = await fetch(DATA_URL);
  allIsms = parseIsms(await res.json() as unknown);

  queryRequired<HTMLElement>('.header-count').textContent = `${allIsms.length} isms`;
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

function setupImageLazy(): void {
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

  document.querySelectorAll<HTMLImageElement>('img[data-lazy]').forEach(img => {
    imgObserver?.observe(img);
  });
}

function dismissLoading(): void {
  const firstImages = document.querySelectorAll<HTMLImageElement>('.ism-card:nth-child(-n+6) .ism-img-wrap img');
  let loaded = 0;
  const total = Math.min(firstImages.length, 6);
  if (total === 0) {
    revealPage();
    return;
  }

  function check(): void {
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

function revealPage(): void {
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

function buildFilters(): void {
  const keywords = new Set<string>();
  allIsms.forEach(ism => ism.keywords.forEach(keyword => keywords.add(keyword)));

  const popular = [
    'whitespace', 'bold-color', 'dark-bg', 'gradient', 'neon',
    '3D', 'retro', 'geometric', 'rounded', 'playful'
  ].filter(keyword => keywords.has(keyword));

  const row = queryRequired<HTMLElement>('.filter-row');
  popular.forEach(keyword => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = keyword;
    btn.dataset.keyword = keyword;
    btn.addEventListener('click', () => {
      if (activeFilter === keyword) {
        activeFilter = 'all';
        document.querySelectorAll<HTMLElement>('.filter-btn').forEach(button => button.classList.remove('active'));
        queryRequired<HTMLElement>('.filter-btn[data-keyword="all"]').classList.add('active');
      } else {
        activeFilter = keyword;
        document.querySelectorAll<HTMLElement>('.filter-btn').forEach(button => button.classList.remove('active'));
        btn.classList.add('active');
      }
      render();
    });
    row.appendChild(btn);
  });
}

function matchFilter(ism: DesignIsm): boolean {
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

function render(): void {
  const grid = getRequired<HTMLElement>('masonry');
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
      newCard.querySelectorAll<HTMLImageElement>('img[data-lazy]').forEach(img => {
        imgObserver?.observe(img);
      });
      cardObserver?.unobserve(el);
    });
  }, { rootMargin: '200px 0px' });

  grid.querySelectorAll<HTMLElement>('.ism-card--skeleton').forEach(el => {
    cardObserver?.observe(el);
  });
}

function skeletonHTML(ism: DesignIsm, index: number): string {
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

function cardHTML(ism: DesignIsm, index: number): string {
  const num = String(index + 1).padStart(2, '0');

  const paletteHTML = ism.palette.map(color =>
    `<div class="ism-swatch" style="background:${color}" title="${color}"></div>`
  ).join('');

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

  const keywordsHTML = ism.keywords.map(keyword =>
    `<span class="ism-kw">${keyword}</span>`
  ).join('');

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

function setupCardExamplesToggle(): void {
  document.querySelectorAll<HTMLButtonElement>('.ism-examples-toggle').forEach(btn => {
    btn.addEventListener('click', event => {
      event.stopPropagation();
      const container = btn.closest<HTMLElement>('.ism-examples');
      if (!container) {
        return;
      }

      const hidden = container.querySelectorAll<HTMLElement>('.ism-example-link.hidden');
      if (hidden.length > 0) {
        hidden.forEach(el => el.classList.remove('hidden'));
        btn.textContent = t('showLess');
      } else {
        container.querySelectorAll<HTMLElement>('.ism-example-link').forEach((el, index) => {
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

function setupLightbox(): void {
  const lightbox = getRequired<HTMLElement>('lightbox');
  const lightboxImage = queryRequired<HTMLImageElement>('img', lightbox);

  document.addEventListener('click', event => {
    const target = eventElement(event);
    const wrap = target?.closest<HTMLElement>('.ism-img-wrap') ?? null;
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

function setupScrollTop(): void {
  const btn = queryRequired<HTMLButtonElement>('.scroll-top');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

queryRequired<HTMLInputElement>('.search-input').addEventListener('input', event => {
  if (event.target instanceof HTMLInputElement) {
    searchQuery = event.target.value;
    render();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  void init();
});

function getRelatedIsms(target: DesignIsm, max = 5): DesignIsm[] {
  return allIsms
    .filter(ism => ism.id !== target.id)
    .map<RelatedScore>(ism => ({
      ism,
      score: ism.keywords.filter(keyword => target.keywords.includes(keyword)).length
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .filter(item => item.score > 0)
    .map(item => item.ism);
}

function renderModalContent(ism: DesignIsm): string {
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
    } else {
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

function openModal(ismId: string): void {
  const ism = allIsms.find(candidate => candidate.id === ismId);
  if (!ism) {
    return;
  }

  const overlay = getRequired<HTMLElement>('modal-overlay');
  const content = getRequired<HTMLElement>('modal-content');
  content.innerHTML = renderModalContent(ism);
  content.scrollTop = 0;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  history.replaceState(null, '', '#' + ismId);

  content.querySelectorAll<HTMLElement>('.modal-collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement?.classList.toggle('open');
    });
  });

  content.querySelectorAll<HTMLImageElement>('img[data-lightbox]').forEach(image => {
    image.addEventListener('click', event => {
      event.stopPropagation();
      const lightbox = getRequired<HTMLElement>('lightbox');
      queryRequired<HTMLImageElement>('img', lightbox).src = image.dataset.src || image.src;
      lightbox.classList.add('active');
    });
  });

  content.querySelectorAll<HTMLElement>('.modal-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      const color = swatch.dataset.color;
      if (!color) {
        return;
      }
      void navigator.clipboard.writeText(color);
      showToast('Copied ' + color);
    });
  });

  content.querySelectorAll<HTMLElement>('.modal-related-card').forEach(card => {
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
      } else {
        exHidden.classList.add('open');
        exToggle.textContent = t('showLess');
      }
    });
  }
}

function closeModal(): void {
  const overlay = getRequired<HTMLElement>('modal-overlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  history.replaceState(null, '', location.pathname + location.search);
}

function showToast(msg: string): void {
  const toast = getRequired<HTMLElement>('toast');
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

function setupModal(): void {
  const overlay = getRequired<HTMLElement>('modal-overlay');

  overlay.addEventListener('click', event => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  queryRequired<HTMLButtonElement>('.modal-close', overlay).addEventListener('click', closeModal);

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

    const card = target.closest<HTMLElement>('.ism-card');
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

function setupLangToggle(): void {
  const toggle = getRequired<HTMLButtonElement>('lang-toggle');
  updateLangUI();

  toggle.addEventListener('click', () => {
    currentLang = currentLang === 'ko' ? 'en' : 'ko';
    localStorage.setItem('design-isms-lang', currentLang);
    updateLangUI();
    render();
  });
}

function updateLangUI(): void {
  document.querySelectorAll<HTMLElement>('.lang-option').forEach(element => {
    element.classList.toggle('active', element.dataset.lang === currentLang);
  });

  queryRequired<HTMLInputElement>('.search-input').placeholder = t('search');
  document.documentElement.lang = currentLang;

  const footer = queryRequired<HTMLElement>('.site-footer');
  const title = footer.children.item(0);
  const generator = footer.children.item(1);
  if (title) {
    title.textContent = t('footerTitle');
  }
  if (generator) {
    generator.textContent = t('footerGen');
  }
}
