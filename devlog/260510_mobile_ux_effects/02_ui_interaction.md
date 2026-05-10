---
created: 2026-05-10
status: implemented
tags: [design-isms, ui, interaction, effects-page]
---

# Phase 2 — UI and Interaction Plan

이 phase는 실제 화면 구조를 만든다. 목표는 기존 Design -isms 보드와 같은 계열의 시각 언어를 유지하면서, “효과를 직접 눌러보는 페이지”로 만드는 것이다.

---

## Goal

- [x] `effects.html` 새 페이지를 추가한다.
- [x] `src/effects.ts`에서 효과 데이터 로드, 필터, 검색, modal을 처리한다.
- [x] `assets/js/effects.js`가 build 산출물로 생성된다.
- [x] `src/effects-demos.ts`에서 46개 demo renderer를 분리한다.
- [x] 기존 `index.html` 헤더에 `Effects` 링크를 추가한다.
- [x] 기존 ISM modal CSS 계열을 재사용하되 effect 상세에 맞게 확장한다.

## Page Layout

```text
effects.html
├── loading overlay
├── header
│   ├── logo
│   ├── Isms link
│   ├── Effects active link
│   └── count
├── compact intro
│   ├── eyebrow: Frontend UI candidates
│   ├── heading: 모바일 / 데스크탑 UI 후보군
│   └── short subcopy only
├── category filter
├── search
├── effects grid
│   └── effect card × 46
├── effect modal
├── lightbox
├── toast
└── scroll top
```

## Static Path Contract

GitHub Pages project site에서 깨지지 않도록 모든 경로는 상대 경로를 사용한다.

```html
<link rel="stylesheet" href="./assets/css/style.css">
<script src="./assets/js/effects-demos.js"></script>
<script src="./assets/js/effects.js"></script>
<a href="./effects.html">Effects</a>
<a href="./index.html">Isms</a>
```

```ts
const EFFECTS_DATA_URL = './assets/data/effects.json';
const EFFECT_GUIDE_BASE_URL = './assets/images/effects';
// WebP previews are derived as ./assets/images/thumbs/effects/{id}/guide.webp.
```

Forbidden:

- `/assets/...`
- `/design-isms/assets/...`
- `/effects`
- `/effects/bottom-sheet`
- client-side clean URL router
- redirect dependency for GitHub Pages

Hash direct links are allowed only as `effects.html#bottom-sheet`.

## Effect Card Anatomy

```text
┌─────────────────────────┐
│ mini demo area           │
│  ┌──── phone frame ────┐ │
│  │ effect animation    │ │
│  └─────────────────────┘ │
│ Bottom Sheet             │
│ 바텀 시트                 │
│ "아래 팝업 · 모바일 메뉴"  │
│ [필터] [공유] [옵션]      │
└─────────────────────────┘
```

## Modal Anatomy

기존 ISM modal은 이름, 역사, 이미지, 프롬프트, 팔레트, 예시 사이트, 관련 ISM을 보여준다. Effect modal은 같은 container/close/lightbox/toast 감각을 유지하되 내용만 바꾼다.

```text
modal
├── number/category pill
├── title + Korean title
├── also called chips
├── summary
├── live demo panel
├── "언제 쓰나" list
├── "피해야 할 때" list
├── "구현 방법" collapsible
├── "접근성 체크" collapsible
├── "성능 체크" collapsible
└── guide image / prompt if present
```

## Runtime Functions

| Function | Responsibility |
| --- | --- |
| `initEffectsPage()` | boot sequence |
| `loadEffects()` | fetch `effects.json`, parse, set state |
| `parseEffects(raw)` | runtime validation |
| `renderEffectCards()` | grid render |
| `renderEffectCard(effect)` | single card HTML |
| `renderEffectDemo(effect)` | card mini demo HTML |
| `openEffectModal(effectId)` | modal open |
| `renderEffectModal(effect)` | modal HTML |
| `setupEffectModalInteractions()` | close, collapsible, guide lightbox |
| `filterEffects()` | category + query filtering |
| `setActiveCategory(category)` | category state |
| `showToast(message)` | reuse toast behavior |

## TypeScript Scope Rule

`src/app.ts` and `src/effects.ts` are both included by `tsconfig.json`. Because the browser output is plain scripts, `src/effects.ts` must avoid global helper collisions with `src/app.ts`.

Use an IIFE and keep all helpers inside it:

```ts
(() => {
  const EFFECTS_DATA_URL = './assets/data/effects.json';

  document.addEventListener('DOMContentLoaded', () => {
    void initEffectsPage();
  });

  async function initEffectsPage(): Promise<void> {
    // effects page boot sequence
  }
})();
```

Do not use `export {}` for v1. That would make the TS file a module and may require changing the browser script loading model. The current repository uses normal `<script src="./assets/js/app.js"></script>`.

## State

```ts
let allEffects: UxEffect[] = [];
let activeCategory = 'all';
let effectSearchQuery = '';
let pageRevealed = false;
```

No persistent localStorage is needed for the first release. Language toggle is not required in v1 unless the existing global language UI is ported cleanly.

## Card Keyboard UX

Recommended v1 structure:

```html
<article
  class="effect-card"
  tabindex="0"
  role="button"
  aria-labelledby="effect-title-bottom-sheet"
  data-effect-id="bottom-sheet"
>
  ...
</article>
```

- Enter and Space open the modal.
- Card mini demos are decorative or educational, not separate controls.
- If a demo becomes interactive, the card open target and demo controls must be split.
- Focus indicator must be visible.

## CSS Additions

The implementation uses `assets/css/effects.css` and `assets/css/effects-demos.css` instead of appending to `assets/css/style.css`. The existing global stylesheet already exceeds the 500-line project target, so effect-specific UI stays isolated while still reusing the same tokens and shared modal/lightbox/toast classes.

```css
/* ── Effects Page ── */
.effects-page {}
.effects-hero {}
.effects-grid {}
.effect-card {}
.effect-demo {}
.effect-phone {}
.effect-modal-demo {}
.effect-chip {}
```

## CSS Safety Rules

- `effects.html` body uses `class="effects-page is-loading"`.
- New CSS is scoped under `.effects-page ...` or `.effect-*`.
- Existing `.ism-*` selectors must not be changed.
- Existing `.modal-*` selectors can be reused, but broad behavior changes require ISM page regression checks.
- Header links must wrap safely on small widths.

## Existing CSS to Reuse

| Existing Class | Reuse |
| --- | --- |
| `.site-header` | header shell |
| `.filter-bar`, `.filter-btn`, `.search-input` | filters/search |
| `.modal-overlay`, `.modal-container`, `.modal-scroll` | detail modal |
| `.modal-collapsible` | implementation/accessibility/performance sections |
| `.lightbox` | guide image enlargement |
| `.toast` | copied / status messages |
| `.scroll-top` | scroll utility |

## Demo Types

Each effect uses its own `demo.type`, and every type matches the effect id. The renderer in `src/effects-demos.ts` maps all 46 ids to small HTML/CSS demos, while `assets/css/effects-demos-candidates.css` gives the newly added candidates their own motion pattern.

## Diff-Level Plan

### NEW `effects.html`

Use `index.html` structure as baseline, but:

- title: `Frontend UI Candidates — Design -isms`
- description: mobile and desktop frontend UI candidates catalog
- body target: `effects-grid`
- scripts: `./assets/js/effects-demos.js`, then `./assets/js/effects.js`
- body class: `effects-page is-loading`

User feedback correction:

- The large landing hero/stat panel is not needed.
- `effects.html` uses a compact intro strip and shows the candidate catalog faster.
- Current category filters are `Mobile`, `Desktop`, and `Shared`.

### NEW `src/effects.ts`

- Typed parser
- Render functions
- Interaction setup
- No imports, matching current compile pattern

### GENERATED `assets/js/effects.js`

- Build output from TypeScript
- Do not edit directly

### MODIFY `index.html`

- Add `Effects` link in header with `href="./effects.html"`
- Keep existing layout unchanged

### NEW/MODIFY effect CSS

- `assets/css/effects.css` holds page/modal/layout styles.
- `assets/css/effects-demos.css` holds shared seed demo styles.
- `assets/css/effects-demos-candidates.css` holds the 46-candidate extended demo styles.
- Avoid changing existing ISM card/modal selectors unless necessary.

## Risks

| Risk | Mitigation |
| --- | --- |
| `style.css` is already large | Add one marked section; avoid broad refactor in this phase |
| Demo animations may be too busy | Use tiny isolated phone frames; support reduced motion |
| Existing modal event handlers are app-specific | Keep `effects.ts` self-contained instead of reusing app globals |
| GitHub Pages path issues | Use relative paths only |

## Verification

- `npm run build`
- Open `effects.html` locally
- Click every card and close modal
- Confirm header link returns to `index.html`
- Mobile 375px: no horizontal scroll
