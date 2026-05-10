const DATA_URL = './assets/data/isms.json';

let allIsms = [];
let activeFilter = 'all';
let searchQuery = '';
let currentLang = localStorage.getItem('design-isms-lang') || 'ko';

var UI_STRINGS = {
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

function t(key, vars) {
  var str = UI_STRINGS[currentLang][key] || UI_STRINGS['en'][key] || key;
  if (vars) {
    Object.keys(vars).forEach(function(k) {
      str = str.replace('{' + k + '}', vars[k]);
    });
  }
  return str;
}

function getDesc(ism) {
  return currentLang === 'en' && ism.descriptionEn ? ism.descriptionEn : ism.description;
}

function getHistory(ism) {
  return ism.history || '';
}

function getName(ism) {
  return currentLang === 'en' ? ism.name : ism.name;
}

function getSubName(ism) {
  return currentLang === 'en' ? ism.nameKr : '';
}

async function init() {
  const res = await fetch(DATA_URL);
  allIsms = await res.json();
  document.querySelector('.header-count').textContent = `${allIsms.length} isms`;
  buildFilters();
  render();
  setupLightbox();
  setupScrollTop();
  setupModal();
  setupCardExamplesToggle();
  setupLangToggle();

  requestAnimationFrame(function() {
    document.body.classList.remove('is-loading');
    var overlay = document.getElementById('loading-overlay');
    overlay.classList.add('fade-out');
    overlay.addEventListener('transitionend', function() {
      overlay.remove();
    });
  });
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
  setupCardExamplesToggle();
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

  const visibleCount = 3;
  const examplesHTML = ism.examples.map((ex, i) => {
    const domain = new URL(ex.url).hostname.replace('www.', '');
    const hidden = i >= visibleCount ? ' hidden' : '';
    return `<a href="${ex.url}" target="_blank" rel="noopener" class="ism-example-link${hidden}" data-ex-idx="${i}">
      ${ex.name}<span>${domain}</span>
    </a>`;
  }).join('');

  const remaining = ism.examples.length - visibleCount;
  const toggleBtn = remaining > 0
    ? `<button class="ism-examples-toggle" data-ism="${ism.id}">${t('moreSites', {n: remaining})}</button>`
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

function setupCardExamplesToggle() {
  document.querySelectorAll('.ism-examples-toggle').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const container = btn.closest('.ism-examples');
      const hidden = container.querySelectorAll('.ism-example-link.hidden');
      if (hidden.length > 0) {
        hidden.forEach(el => el.classList.remove('hidden'));
        btn.textContent = '− show less';
      } else {
        container.querySelectorAll('.ism-example-link').forEach((el, i) => {
          if (i >= 3) el.classList.add('hidden');
        });
        const count = container.querySelectorAll('.ism-example-link.hidden').length;
        btn.textContent = `+ ${count} more sites`;
      }
    });
  });
}

function setupLightbox() {
  const lb = document.getElementById('lightbox');
  const lbImg = lb.querySelector('img');

  document.addEventListener('click', e => {
    const wrap = e.target.closest('.ism-img-wrap');
    if (wrap && !e.target.closest('.modal-overlay')) {
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
      if (lb.classList.contains('active')) {
        lb.classList.remove('active');
        lbImg.src = '';
      }
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

// ── Modal ──

function getRelatedIsms(target, max) {
  max = max || 5;
  return allIsms
    .filter(ism => ism.id !== target.id)
    .map(ism => ({
      ism: ism,
      score: ism.keywords.filter(k => target.keywords.includes(k)).length
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .filter(x => x.score > 0)
    .map(x => x.ism);
}

function renderModalContent(ism) {
  const idx = allIsms.indexOf(ism);
  const num = String(idx + 1).padStart(2, '0');
  const related = getRelatedIsms(ism);
  const mainImg = ism.images[0];
  const subImages = ism.images.slice(1);
  const mainLabel = t('designMockup', {name: ism.name});
  const modalDesc = getDesc(ism);
  const modalHistory = getHistory(ism);

  var mainPrompt = (ism.prompts && ism.prompts[0]) ? ism.prompts[0].prompt : '';

  var collapsiblesHTML = '';
  for (var i = 0; i < subImages.length; i++) {
    var img = subImages[i];
    var subPrompt = (ism.prompts && ism.prompts[i + 1]) ? ism.prompts[i + 1].prompt : '';
    var promptBlock = subPrompt
      ? '<div class="modal-prompt"><span class="modal-prompt-label">Prompt</span>' + subPrompt + '</div>'
      : '';
    collapsiblesHTML += '<div class="modal-collapsible">' +
      '<div class="modal-collapsible-header">' +
      '<span class="modal-collapsible-arrow">▶</span> ' + img.label +
      '</div>' +
      '<div class="modal-collapsible-body"><div class="modal-collapsible-inner">' +
      '<img src="./assets/images/' + ism.id + '/' + img.file + '" alt="' + ism.name + ' - ' + img.label + '" data-lightbox="true">' +
      promptBlock +
      '</div></div></div>';
  }

  var paletteHTML = '';
  for (var i = 0; i < ism.palette.length; i++) {
    var c = ism.palette[i];
    paletteHTML += '<div class="modal-swatch" data-color="' + c + '">' +
      '<div class="modal-swatch-color" style="background:' + c + '"></div>' +
      '<span class="modal-swatch-hex">' + c + '</span></div>';
  }

  var kwHTML = '';
  for (var i = 0; i < ism.keywords.length; i++) {
    kwHTML += '<span class="modal-kw">' + ism.keywords[i] + '</span>';
  }

  var visibleExHTML = '';
  var hiddenExHTML = '';
  for (var i = 0; i < ism.examples.length; i++) {
    var ex = ism.examples[i];
    var domain = '';
    try { domain = new URL(ex.url).hostname.replace('www.', ''); } catch(e) { domain = ex.url; }
    var link = '<a href="' + ex.url + '" target="_blank" rel="noopener" class="modal-example-link">' +
      ex.name + '<span class="modal-example-domain">' + domain + '</span></a>';
    if (i < 3) {
      visibleExHTML += link;
    } else {
      hiddenExHTML += link;
    }
  }

  var examplesSection = '<div class="modal-examples">' +
    '<div class="modal-examples-visible">' + visibleExHTML + '</div>';
  if (hiddenExHTML) {
    examplesSection += '<div class="modal-examples-hidden" id="modal-ex-hidden">' + hiddenExHTML + '</div>' +
      '<button class="modal-examples-toggle" id="modal-ex-toggle">+ ' + (ism.examples.length - 3) + ' more sites</button>';
  }
  examplesSection += '</div>';

  var relatedHTML = '';
  for (var i = 0; i < related.length; i++) {
    var r = related[i];
    relatedHTML += '<div class="modal-related-card" data-related-id="' + r.id + '">' +
      '<div class="modal-related-name">' + r.name + '</div>' +
      '<div class="modal-related-tagline">' + r.tagline + '</div></div>';
  }

  var subNameHtml = currentLang === 'en' ? '<span class="modal-title-kr">' + ism.nameKr + '</span>' : '';
  var html = '<div class="modal-number">' + num + '</div>' +
    '<div class="modal-title">' + ism.name + subNameHtml + '</div>' +
    '<div class="modal-tagline">' + ism.tagline + '</div>';

  if (modalHistory) {
    html += '<div class="modal-history">' + modalHistory + '</div>';
  }

  html += '<div class="modal-desc">' + modalDesc + '</div>' +
    '<div class="modal-main-image"><img src="./assets/images/' + ism.id + '/' + mainImg.file + '" alt="' + mainLabel + '" data-lightbox="true"></div>' +
    '<div class="modal-main-label">' + mainLabel + '</div>' +
    (mainPrompt ? '<div class="modal-prompt modal-prompt-main"><span class="modal-prompt-label">Prompt</span>' + mainPrompt + '</div>' : '') +
    collapsiblesHTML +
    '<div class="modal-section-title">' + t('colorPalette') + '</div>' +
    '<div class="modal-palette">' + paletteHTML + '</div>' +
    '<div class="modal-section-title">' + t('keywords') + '</div>' +
    '<div class="modal-keywords">' + kwHTML + '</div>' +
    '<div class="modal-section-title">' + t('exampleSites') + '</div>' +
    examplesSection;

  if (related.length > 0) {
    html += '<div class="modal-section-title">' + t('relatedIsms') + '</div>' +
      '<div class="modal-related">' + relatedHTML + '</div>';
  }

  return html;
}

function openModal(ismId) {
  var ism = allIsms.find(function(x) { return x.id === ismId; });
  if (!ism) return;

  var overlay = document.getElementById('modal-overlay');
  var content = document.getElementById('modal-content');
  content.innerHTML = renderModalContent(ism);
  content.scrollTop = 0;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  history.replaceState(null, '', '#' + ismId);

  content.querySelectorAll('.modal-collapsible-header').forEach(function(hdr) {
    hdr.addEventListener('click', function() {
      hdr.parentElement.classList.toggle('open');
    });
  });

  content.querySelectorAll('img[data-lightbox]').forEach(function(img) {
    img.addEventListener('click', function(e) {
      e.stopPropagation();
      var lb = document.getElementById('lightbox');
      lb.querySelector('img').src = img.src;
      lb.classList.add('active');
    });
  });

  content.querySelectorAll('.modal-swatch').forEach(function(sw) {
    sw.addEventListener('click', function() {
      var color = sw.dataset.color;
      navigator.clipboard.writeText(color);
      showToast('Copied ' + color);
    });
  });

  content.querySelectorAll('.modal-related-card').forEach(function(card) {
    card.addEventListener('click', function() {
      openModal(card.dataset.relatedId);
    });
  });

  var exToggle = document.getElementById('modal-ex-toggle');
  var exHidden = document.getElementById('modal-ex-hidden');
  if (exToggle && exHidden) {
    exToggle.addEventListener('click', function() {
      if (exHidden.classList.contains('open')) {
        exHidden.classList.remove('open');
        exToggle.textContent = '+ ' + exHidden.children.length + ' more sites';
      } else {
        exHidden.classList.add('open');
        exToggle.textContent = '− show less';
      }
    });
  }
}

function closeModal() {
  var overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  history.replaceState(null, '', location.pathname + location.search);
}

function showToast(msg) {
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function() {
    toast.classList.remove('show');
  }, 1500);
}

function setupModal() {
  var overlay = document.getElementById('modal-overlay');

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeModal();
  });

  overlay.querySelector('.modal-close').addEventListener('click', closeModal);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeModal();
    }
  });

  document.addEventListener('click', function(e) {
    if (e.target.closest('.ism-img-wrap')) return;
    if (e.target.closest('.ism-example-link')) return;
    if (e.target.closest('.ism-examples-toggle')) return;
    if (e.target.closest('.modal-overlay')) return;
    if (e.target.closest('.lightbox')) return;
    var card = e.target.closest('.ism-card');
    if (card) {
      openModal(card.dataset.id);
    }
  });

  if (location.hash && location.hash.length > 1) {
    var id = location.hash.slice(1);
    setTimeout(function() { openModal(id); }, 400);
  }
}

function setupLangToggle() {
  var toggle = document.getElementById('lang-toggle');
  updateLangUI();

  toggle.addEventListener('click', function() {
    currentLang = currentLang === 'ko' ? 'en' : 'ko';
    localStorage.setItem('design-isms-lang', currentLang);
    updateLangUI();
    render();
    document.querySelector('.search-input').placeholder = t('search');
    var footer = document.querySelector('.site-footer');
    footer.children[0].textContent = t('footerTitle');
    footer.children[1].textContent = t('footerGen');
    document.documentElement.lang = currentLang;
  });
}

function updateLangUI() {
  document.querySelectorAll('.lang-option').forEach(function(el) {
    el.classList.toggle('active', el.dataset.lang === currentLang);
  });
  document.querySelector('.search-input').placeholder = t('search');
  document.documentElement.lang = currentLang;
  var footer = document.querySelector('.site-footer');
  if (footer) {
    footer.children[0].textContent = t('footerTitle');
    footer.children[1].textContent = t('footerGen');
  }
}
