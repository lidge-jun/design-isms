# Feature Plan: ISM Detail Popup (v2 — Confirmed)

## Overview
카드 클릭 → 모달 팝업 → 스크롤하며 상세 정보 열람.
라이트박스(이미지 확대)와 별도 — 모달 안 이미지 클릭 시 라이트박스로 이동.

## 확정된 디자인 결정

| 항목 | 결정 |
|------|------|
| 프롬프트 표시 | 메인 1개 항상 펼침 + 나머지 3개 접이식(collapsible) |
| 메인 이미지 라벨 | "ㅇㅇ 디자인 시안" (hero page 같은 라벨 제거) |
| 접기 이미지 라벨 | 기존 label 사용 (Landing Page, 쇼핑몰 등) |
| 예시 사이트 | 링크만, 썸네일 없음 (10개씩) |
| 역사/맥락 | 필수, 제목 바로 밑에 (history 필드) |
| 관련 ISM | 자동 (keywords 겹침 기반 계산) |

---

## 모달 레이아웃 (위→아래)

```
┌─────────────────────────────────────────────┐
│ [X]                                         │ ← 닫기
│                                             │
│  01  Minimalism  미니멀리즘                  │ ← 번호 + 이름 + 한국어명
│  "Less is more"                             │ ← 태그라인
│                                             │
│  ┌─ 역사/맥락 ──────────────────────────┐   │
│  │ 1960년대 미술 운동에서 출발...        │   │ ← history 필드
│  └──────────────────────────────────────┘   │
│                                             │
│  극도로 절제된 요소. 넓은 여백...            │ ← description
│                                             │
│  ┌─ 메인 이미지 ────────────────────────┐   │
│  │                                      │   │
│  │  [landing.png — 풀 사이즈]           │   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│  Minimalism 디자인 시안                      │ ← 메인 라벨
│                                             │
│  ┌─ 프롬프트 (항상 펼침) ───────────────┐   │
│  │ "A minimalist e-commerce website..." │   │
│  │                             [복사]   │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ▶ 쇼핑몰 (접기) ──────────────────────     │ ← 클릭 시 펼침
│  │  [shop.png]                              │
│  │  프롬프트: "A minimalist shop..."        │
│  │                             [복사]       │
│  └──────────────────────────────────────     │
│                                             │
│  ▶ Portfolio (접기) ────────────────────     │
│  ▶ Mobile App (접기) ──────────────────     │
│                                             │
│  ── 컬러 팔레트 ───                         │
│  [■] [■] [■] [■]  ← 클릭=복사             │
│  #FFF  #1A1  #F5F  #E0E                     │
│                                             │
│  ── 키워드 ───                               │
│  whitespace  typography  monochrome  grid    │
│                                             │
│  ── 예시 사이트 (10개) ───                   │
│  → Apple          apple.com                 │
│  → Away           awaytravel.com            │
│  → Everlane       everlane.com              │
│  → ...                                      │
│                                             │
│  ── 관련 ISM ───                             │
│  ┌────┐ ┌────┐ ┌────┐  ← 가로 스크롤      │
│  │Flat│ │Jpnd│ │Swss│                       │
│  └────┘ └────┘ └────┘                       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Data Schema (현재 + 추가 필요)

### 현재 보유 필드 (isms.json)
```json
{
  "id": "minimalism",
  "name": "Minimalism",
  "nameKr": "미니멀리즘",
  "tagline": "Less is more",
  "description": "극도로 절제된...",
  "keywords": ["whitespace", ...],
  "palette": ["#FFFFFF", ...],
  "examples": [{ "name": "Apple", "url": "..." }, ...],  // ✅ 10개로 확장 완료
  "images": [{ "file": "landing.png", "label": "Landing Page" }, ...],
  "history": "1960년대 미술 운동에서..."  // ✅ 추가 완료
}
```

### 추가 필요 필드
```json
{
  "prompts": [
    {
      "file": "landing.png",
      "prompt": "A minimalist e-commerce website homepage screenshot...",
      "model": "gpt-image-2",
      "quality": "high",
      "size": "1536x1024"
    },
    ...
  ]
}
```

> **prompts 데이터 수집 방법**: 이미지 생성 시 사용한 프롬프트를 각 ism별로 정리.
> 이전 세션에서 Bash 히스토리 또는 메모리에서 추출 가능.
> 없으면 역추론 프롬프트 생성 (이미지 스타일 + ism 특성 기반).

### relatedIsms — 자동 계산 (코드)
```js
function getRelatedIsms(targetIsm, allIsms, max = 5) {
  return allIsms
    .filter(ism => ism.id !== targetIsm.id)
    .map(ism => ({
      id: ism.id,
      score: ism.keywords.filter(k => targetIsm.keywords.includes(k)).length
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .filter(x => x.score > 0)
    .map(x => x.id);
}
```
> JSON에 저장하지 않고 **app.js에서 런타임 계산** — 유지보수 불필요.

---

## Implementation Steps (Diff-level)

### Phase 1: Data — prompts 수집
- [ ] `isms.json`에 각 ism별 `prompts` 배열 추가
- 각 이미지(3장)의 생성 프롬프트 + model/quality/size 메타데이터
- 35 isms × 3 images = 105개 프롬프트 항목

### Phase 2: HTML — 모달 구조
**`index.html`** — `</body>` 앞에 추가:
```html
<div class="modal-overlay" id="modal-overlay">
  <div class="modal-container">
    <button class="modal-close" aria-label="Close">✕</button>
    <div class="modal-scroll" id="modal-content">
      <!-- JS로 동적 렌더링 -->
    </div>
  </div>
</div>
```

### Phase 3: CSS — 모달 스타일
**`style.css`** — 끝에 추가 (~120줄):

```css
/* ── Modal Overlay ── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: none; align-items: center; justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.modal-overlay.active { display: flex; opacity: 1; }

/* ── Modal Container ── */
.modal-container {
  position: relative;
  width: min(720px, 92vw);
  max-height: 85vh;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.15);
  overflow: hidden;
  transform: translateY(20px);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-overlay.active .modal-container { transform: translateY(0); }

.modal-scroll {
  overflow-y: auto;
  max-height: 85vh;
  padding: 32px;
  scroll-behavior: smooth;
}

.modal-close {
  position: absolute; top: 12px; right: 12px; z-index: 10;
  width: 36px; height: 36px;
  border-radius: 50%;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
  font-size: 18px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--ink-light);
  transition: background 0.2s, color 0.2s;
}
.modal-close:hover { background: var(--accent); color: #fff; }

/* ── Modal Header ── */
.modal-number {
  font-family: var(--font-mono); font-size: 12px;
  color: var(--ink-muted); background: var(--bg-warm);
  padding: 2px 10px; border-radius: 4px;
  display: inline-block; margin-bottom: 8px;
}
.modal-title {
  font-family: var(--font-display);
  font-size: 28px; font-weight: 800;
  letter-spacing: -1px; margin-bottom: 4px;
}
.modal-title-kr {
  font-size: 16px; color: var(--ink-muted);
  font-weight: 400; margin-left: 8px;
}
.modal-tagline {
  font-family: var(--font-mono); font-size: 14px;
  color: var(--accent); margin-bottom: 16px;
}

/* ── History Block ── */
.modal-history {
  background: var(--accent-soft);
  border-left: 3px solid var(--accent);
  border-radius: 0 8px 8px 0;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 13px; line-height: 1.7;
  color: var(--ink-light);
}

/* ── Description ── */
.modal-desc {
  font-size: 15px; line-height: 1.8;
  color: var(--ink); margin-bottom: 24px;
  word-break: keep-all;
}

/* ── Main Image ── */
.modal-main-image img {
  width: 100%; border-radius: 12px;
  border: 1px solid var(--border);
  cursor: zoom-in;
}
.modal-main-label {
  font-family: var(--font-display);
  font-size: 14px; font-weight: 600;
  color: var(--ink); margin: 8px 0 4px;
}

/* ── Prompt Block (always visible for main) ── */
.modal-prompt {
  background: var(--bg-warm);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
  margin: 8px 0 24px;
  font-family: var(--font-mono); font-size: 12px;
  line-height: 1.6; color: var(--ink-light);
  position: relative;
  word-break: break-all;
}
.prompt-copy-btn {
  position: absolute; top: 8px; right: 8px;
  font-family: var(--font-mono); font-size: 11px;
  background: var(--card-bg); border: 1px solid var(--border);
  border-radius: 4px; padding: 3px 10px;
  cursor: pointer; color: var(--ink-muted);
  transition: all 0.15s;
}
.prompt-copy-btn:hover { color: var(--accent); border-color: var(--accent); }

/* ── Collapsible Image Section ── */
.modal-collapsible {
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
}
.modal-collapsible-header {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px;
  background: var(--bg-warm);
  cursor: pointer; user-select: none;
  font-family: var(--font-sans); font-size: 13px;
  font-weight: 500; color: var(--ink);
  transition: background 0.15s;
}
.modal-collapsible-header:hover { background: var(--border); }
.modal-collapsible-header::before {
  content: '▶'; font-size: 10px; color: var(--ink-muted);
  transition: transform 0.2s;
}
.modal-collapsible.open .modal-collapsible-header::before {
  transform: rotate(90deg);
}
.modal-collapsible-body {
  display: none;
  padding: 12px 16px;
}
.modal-collapsible.open .modal-collapsible-body { display: block; }
.modal-collapsible-body img {
  width: 100%; border-radius: 8px;
  border: 1px solid var(--border);
  margin-bottom: 8px; cursor: zoom-in;
}

/* ── Palette (modal) ── */
.modal-palette {
  display: flex; gap: 8px; margin: 20px 0;
  flex-wrap: wrap;
}
.modal-swatch {
  display: flex; flex-direction: column;
  align-items: center; gap: 4px; cursor: pointer;
}
.modal-swatch-color {
  width: 40px; height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.08);
  transition: transform 0.15s;
}
.modal-swatch:hover .modal-swatch-color { transform: scale(1.15); }
.modal-swatch-hex {
  font-family: var(--font-mono); font-size: 10px;
  color: var(--ink-muted);
}

/* ── Keywords (modal) ── */
.modal-keywords {
  display: flex; gap: 6px; flex-wrap: wrap;
  margin-bottom: 20px;
}
.modal-kw {
  font-family: var(--font-mono); font-size: 12px;
  color: var(--ink-muted); background: var(--bg);
  padding: 4px 10px; border-radius: 6px;
  border: 1px solid var(--border);
}

/* ── Examples (modal) ── */
.modal-section-title {
  font-family: var(--font-display);
  font-size: 14px; font-weight: 700;
  color: var(--ink); margin: 24px 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
.modal-examples {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.modal-example-link {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--ink-light);
  padding: 4px 0; transition: color 0.15s;
}
.modal-example-link:hover { color: var(--accent); }
.modal-example-link::before {
  content: '→'; font-size: 11px; color: var(--ink-muted);
}
.modal-example-domain {
  font-family: var(--font-mono); font-size: 10px;
  color: var(--ink-muted); margin-left: auto;
}

/* ── Related ISMs ── */
.modal-related {
  display: flex; gap: 10px;
  overflow-x: auto; padding: 8px 0 16px;
  -webkit-overflow-scrolling: touch;
}
.modal-related::-webkit-scrollbar { height: 4px; }
.modal-related::-webkit-scrollbar-thumb {
  background: var(--border); border-radius: 2px;
}
.modal-related-card {
  flex: 0 0 auto;
  width: 140px; padding: 12px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.modal-related-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
.modal-related-name {
  font-family: var(--font-display);
  font-size: 13px; font-weight: 600;
}
.modal-related-tagline {
  font-family: var(--font-mono);
  font-size: 10px; color: var(--ink-muted);
  margin-top: 4px;
}

/* ── Toast ── */
.toast {
  position: fixed; bottom: 24px; left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: var(--ink); color: #fff;
  font-family: var(--font-mono); font-size: 12px;
  padding: 8px 20px; border-radius: 8px;
  opacity: 0; pointer-events: none;
  transition: opacity 0.2s, transform 0.2s;
  z-index: 300;
}
.toast.show {
  opacity: 1; transform: translateX(-50%) translateY(0);
}

/* ── Mobile Modal ── */
@media (max-width: 640px) {
  .modal-container {
    width: 100vw; max-height: 100vh;
    border-radius: 16px 16px 0 0;
    align-self: flex-end;
  }
  .modal-scroll { max-height: 100vh; padding: 24px 16px; }
  .modal-title { font-size: 22px; }
  .modal-examples { grid-template-columns: 1fr; }
}
```

### Phase 4: JavaScript — 모달 로직
**`app.js`** — 추가 함수들 (~150줄):

```js
// ── Modal ──

function getRelatedIsms(target, max = 5) {
  return allIsms
    .filter(ism => ism.id !== target.id)
    .map(ism => ({
      ...ism,
      score: ism.keywords.filter(k => target.keywords.includes(k)).length
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .filter(x => x.score > 0);
}

function renderModalContent(ism) {
  const idx = allIsms.indexOf(ism);
  const num = String(idx + 1).padStart(2, '0');
  const related = getRelatedIsms(ism);

  const mainImg = ism.images[0];
  const subImages = ism.images.slice(1);
  const mainPrompt = ism.prompts?.[0];

  // 메인 이미지: "Minimalism 디자인 시안"
  const mainLabel = `${ism.name} 디자인 시안`;

  // 접기 이미지들
  const collapsiblesHTML = subImages.map((img, i) => {
    const prompt = ism.prompts?.[i + 1];
    return `
      <div class="modal-collapsible">
        <div class="modal-collapsible-header" onclick="this.parentElement.classList.toggle('open')">
          ${img.label}
        </div>
        <div class="modal-collapsible-body">
          <img src="./assets/images/${ism.id}/${img.file}"
               alt="${ism.name} - ${img.label}"
               data-src="./assets/images/${ism.id}/${img.file}">
          ${prompt ? `
            <div class="modal-prompt">
              ${prompt.prompt}
              <button class="prompt-copy-btn" onclick="copyText(this, '${escapeForAttr(prompt.prompt)}')">Copy</button>
            </div>` : ''}
        </div>
      </div>`;
  }).join('');

  // 팔레트
  const paletteHTML = ism.palette.map(c => `
    <div class="modal-swatch" onclick="copyText(this, '${c}')">
      <div class="modal-swatch-color" style="background:${c}"></div>
      <span class="modal-swatch-hex">${c}</span>
    </div>
  `).join('');

  // 키워드
  const kwHTML = ism.keywords.map(k => `<span class="modal-kw">${k}</span>`).join('');

  // 예시 사이트 (10개, 2열)
  const examplesHTML = ism.examples.map(ex => {
    const domain = new URL(ex.url).hostname.replace('www.', '');
    return `<a href="${ex.url}" target="_blank" rel="noopener" class="modal-example-link">
      ${ex.name}<span class="modal-example-domain">${domain}</span>
    </a>`;
  }).join('');

  // 관련 ISM 카드
  const relatedHTML = related.map(r => `
    <div class="modal-related-card" onclick="openModal('${r.id}')">
      <div class="modal-related-name">${r.name}</div>
      <div class="modal-related-tagline">${r.tagline}</div>
    </div>
  `).join('');

  return `
    <div class="modal-number">${num}</div>
    <div class="modal-title">${ism.name}<span class="modal-title-kr">${ism.nameKr}</span></div>
    <div class="modal-tagline">${ism.tagline}</div>

    ${ism.history ? `<div class="modal-history">${ism.history}</div>` : ''}

    <div class="modal-desc">${ism.description}</div>

    <div class="modal-main-image">
      <img src="./assets/images/${ism.id}/${mainImg.file}"
           alt="${mainLabel}"
           data-src="./assets/images/${ism.id}/${mainImg.file}">
    </div>
    <div class="modal-main-label">${mainLabel}</div>

    ${mainPrompt ? `
      <div class="modal-prompt">
        ${mainPrompt.prompt}
        <button class="prompt-copy-btn" onclick="copyText(this, '${escapeForAttr(mainPrompt.prompt)}')">Copy</button>
      </div>` : ''}

    ${collapsiblesHTML}

    <div class="modal-section-title">컬러 팔레트</div>
    <div class="modal-palette">${paletteHTML}</div>

    <div class="modal-section-title">키워드</div>
    <div class="modal-keywords">${kwHTML}</div>

    <div class="modal-section-title">예시 사이트</div>
    <div class="modal-examples">${examplesHTML}</div>

    ${related.length > 0 ? `
      <div class="modal-section-title">관련 ISM</div>
      <div class="modal-related">${relatedHTML}</div>
    ` : ''}
  `;
}

function escapeForAttr(str) {
  return str.replace(/'/g, "\\'").replace(/\n/g, ' ');
}

function openModal(ismId) {
  const ism = allIsms.find(x => x.id === ismId);
  if (!ism) return;

  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  content.innerHTML = renderModalContent(ism);
  content.scrollTop = 0;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  history.replaceState(null, '', `#${ismId}`);

  // 모달 안 이미지 클릭 → 라이트박스
  content.querySelectorAll('img[data-src]').forEach(img => {
    img.addEventListener('click', () => {
      const lb = document.getElementById('lightbox');
      lb.querySelector('img').src = img.dataset.src;
      lb.classList.add('active');
    });
  });
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  history.replaceState(null, '', location.pathname);
}

function copyText(el, text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied!');
    if (el.classList.contains('prompt-copy-btn')) {
      el.textContent = 'Copied!';
      setTimeout(() => el.textContent = 'Copy', 1500);
    }
  });
}

function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1500);
}

function setupModal() {
  const overlay = document.getElementById('modal-overlay');
  // 오버레이 클릭 → 닫기
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });
  // X 버튼
  overlay.querySelector('.modal-close').addEventListener('click', closeModal);
  // ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
  });

  // 카드 클릭 → 모달 열기 (라이트박스와 분리)
  document.addEventListener('click', e => {
    // 이미지 클릭은 라이트박스로 → 무시
    if (e.target.closest('.ism-img-wrap')) return;
    const card = e.target.closest('.ism-card');
    if (card) {
      e.preventDefault();
      openModal(card.dataset.id);
    }
  });

  // URL hash → 자동 모달 열기
  if (location.hash) {
    const id = location.hash.slice(1);
    setTimeout(() => openModal(id), 300);
  }
}
```

### Phase 5: init() 수정
```js
async function init() {
  const res = await fetch(DATA_URL);
  allIsms = await res.json();
  document.querySelector('.header-count').textContent = `${allIsms.length} isms`;
  buildFilters();
  render();
  setupLightbox();
  setupScrollTop();
  setupModal();      // ← 추가
}
```

### Phase 6: 카드 클릭 동작 변경
현재 카드 전체에 클릭 이벤트 없음. 이미지만 라이트박스.
→ `setupModal()`에서 document-level delegation으로 처리 (위 코드 참고).
→ 이미지 클릭: 기존 라이트박스 유지
→ 이미지 외 카드 영역 클릭: 모달 열기

### Phase 7: Polish
- [ ] 모달 진입 애니메이션 (CSS transition — overlay fade + container slide-up)
- [ ] body scroll lock (`overflow: hidden`)
- [ ] prefers-reduced-motion 대응
- [ ] 모바일: 전체 높이 모달, 바텀 시트 스타일
- [ ] Tab trap (포커스가 모달 안에 갇히도록)

---

## File Changes Summary

| File | Action | 변경량 |
|------|--------|--------|
| `assets/data/isms.json` | MODIFY | prompts 배열 추가 (105개 항목) |
| `assets/css/style.css` | MODIFY | 모달 스타일 ~180줄 추가 |
| `assets/js/app.js` | MODIFY | 모달 로직 ~150줄 추가 |
| `index.html` | MODIFY | 모달 HTML + toast 구조 (~10줄) |

## Notes
- 빌드 도구 없이 순수 JS (GitHub Pages 호환)
- 라이트박스와 모달은 독립: 모달 안 이미지 → 라이트박스
- relatedIsms는 런타임 계산 (JSON에 저장 안 함)
- 프롬프트 없는 ism은 프롬프트 섹션 자동 숨김
- URL hash 직링크: `https://.../#minimalism`
