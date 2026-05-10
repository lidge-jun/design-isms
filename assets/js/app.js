const DATA_URL = './assets/data/isms.json';

let allIsms = [];
let activeFilter = 'all';
let searchQuery = '';

async function init() {
  const res = await fetch(DATA_URL);
  allIsms = await res.json();
  document.querySelector('.header-count').textContent = `${allIsms.length} isms`;
  buildFilters();
  render();
  setupLightbox();
  setupScrollTop();
}

function buildFilters() {
  const keywords = new Set();
  allIsms.forEach(ism => ism.keywords.forEach(k => keywords.add(k)));

  const popular = [
    'whitespace', 'bold-color', 'dark-bg', 'gradient', 'neon',
    '3D', 'retro', 'geometric', 'rounded', 'playful'
  ].filter(k => keywords.has(k));

  const row = document.querySelector('.filter-row');
  popular.forEach(kw => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = kw;
    btn.dataset.keyword = kw;
    btn.addEventListener('click', () => {
      if (activeFilter === kw) {
        activeFilter = 'all';
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-btn[data-keyword="all"]').classList.add('active');
      } else {
        activeFilter = kw;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
      render();
    });
    row.appendChild(btn);
  });
}

function matchFilter(ism) {
  if (activeFilter !== 'all' && !ism.keywords.includes(activeFilter)) return false;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    const haystack = [
      ism.name, ism.nameKr, ism.tagline, ism.description,
      ...ism.keywords
    ].join(' ').toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

function render() {
  const grid = document.getElementById('masonry');
  const filtered = allIsms.filter(matchFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="column-span:all">
        <h3>No matches</h3>
        <p>Try a different keyword or clear the search.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map((ism, i) => cardHTML(ism, i)).join('');
}

function cardHTML(ism, index) {
  const num = String(index + 1).padStart(2, '0');

  const paletteHTML = ism.palette.map(c =>
    `<div class="ism-swatch" style="background:${c}" title="${c}"></div>`
  ).join('');

  const imagesHTML = ism.images.map(img => {
    const src = `./assets/images/${ism.id}/${img.file}`;
    return `
      <div class="ism-img-wrap" data-src="${src}">
        <img src="${src}" alt="${ism.name} - ${img.label}"
             loading="lazy"
             onerror="this.parentElement.outerHTML='<div class=\\'ism-img-placeholder\\'>${img.label} — generating...</div>'">
        <span class="ism-img-label">${img.label}</span>
      </div>`;
  }).join('');

  const keywordsHTML = ism.keywords.map(k =>
    `<span class="ism-kw">${k}</span>`
  ).join('');

  const examplesHTML = ism.examples.map(ex => {
    const domain = new URL(ex.url).hostname.replace('www.', '');
    return `<a href="${ex.url}" target="_blank" rel="noopener" class="ism-example-link">
      ${ex.name}<span>${domain}</span>
    </a>`;
  }).join('');

  return `
    <article class="ism-card" data-id="${ism.id}">
      <div class="ism-card-header">
        <div class="ism-label-row">
          <span class="ism-number">${num}</span>
        </div>
        <div class="ism-name">${ism.name}<span class="ism-name-kr">${ism.nameKr}</span></div>
        <div class="ism-tagline">${ism.tagline}</div>
        <p class="ism-desc">${ism.description}</p>
      </div>
      <div class="ism-palette">${paletteHTML}</div>
      <div class="ism-images">${imagesHTML}</div>
      <div class="ism-keywords">${keywordsHTML}</div>
      <div class="ism-examples">${examplesHTML}</div>
    </article>`;
}

function setupLightbox() {
  const lb = document.getElementById('lightbox');
  const lbImg = lb.querySelector('img');

  document.addEventListener('click', e => {
    const wrap = e.target.closest('.ism-img-wrap');
    if (wrap) {
      const src = wrap.dataset.src;
      if (src) {
        lbImg.src = src;
        lb.classList.add('active');
      }
    }
  });

  lb.addEventListener('click', () => {
    lb.classList.remove('active');
    lbImg.src = '';
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      lb.classList.remove('active');
      lbImg.src = '';
    }
  });
}

function setupScrollTop() {
  const btn = document.querySelector('.scroll-top');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

document.querySelector('.search-input').addEventListener('input', e => {
  searchQuery = e.target.value;
  render();
});

document.addEventListener('DOMContentLoaded', init);
