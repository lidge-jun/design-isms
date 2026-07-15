# 020 — Site Integrity Repair and Design Reinforcement

## Outcome

Repair the three-page shell before adding content: make the six navigation axes identical, remove emoji and stale/unsupported FAQ copy, eliminate the 390px header/search collision, and install the **Annotated Specimen Atlas** visual system without changing the 43/46 source-of-truth counts.

This phase is intentionally count-neutral:

```text
ISMs:    43 → 43
Effects: 46 → 46
FAQ:     18 → 18 answers
```

## Dependencies

- **Requires:** `010_design_direction.md`, `011_frontend_standards.md`.
- **Blocks:** 040, 050, 060, and 070 because those phases depend on the shared shell, modal semantics, and stable CSS tokens.
- **Followed by:** Phase 030. One work-phase remains one full PABCD cycle; only read-only
  research may overlap.

## Baseline and drift guard

The GPT Pro upload intentionally omitted binary assets and is advisory only. The local
workspace is authoritative. Preserve existing user/agent changes; do not rebase or demand a
clean tree during an active loop. Start with read-only drift inspection:

```bash
git status --short
git branch --show-current
git log --oneline --decorate -5
git status --short
```

Expected: known `.codexclaw/` and current devlog changes are preserved. The real deploy
workflow currently only checks out and uploads the repository root; it does **not** install
Node or run verify. Phase 080 adds that gate from this observed baseline.

Observed defects to close:

- `faq.html` omits Lang and Count while `index.html` and `effects.html` include them.
- `faq.html` uses `⚡`, `🔥`, and `🛠` as section art.
- the FAQ title/copy contains stale `2024–2025` / `2025` framing and several unsourced numeric claims;
- at 390px the fixed-height header wraps, while the filter/search region still assumes the desktop vertical offset;
- the shell relies on beige surfaces, pill links, equal cards, and soft rounded treatment, making a design-reference site look like a generic directory;
- the ISM dialog lacks the focus containment and restoration already implemented more carefully on the effects page.

## File operations

| Marker | Exact path | Purpose |
|---|---|---|
| **NEW** | `assets/icons/atlas-mark.svg` | Non-emoji brand/specimen mark, `currentColor`, no embedded raster. |
| **NEW** | `assets/icons/faq-workflow.svg` | 24px line icon for workflow category. |
| **NEW** | `assets/icons/faq-direction.svg` | 24px line icon for current-direction category. |
| **NEW** | `assets/icons/faq-build.svg` | 24px line icon for implementation category. |
| **NEW** | `assets/css/theme-atlas.css` | Shared atlas tokens and shell primitives; target under 420 lines. |
| **NEW** | `assets/css/faq.css` | Extracted FAQ-only layout and accordion styles; target under 250 lines. |
| **NEW** | `assets/data/faq.json` | Eighteen bilingual, source-aware FAQ entries. |
| **NEW** | `src/faq.ts` | Classic-script FAQ renderer, locale state, accordion behavior. |
| **NEW** | `assets/js/faq.js` | Committed TypeScript output; generated, never hand-edited. |
| **NEW** | `src/app-dialog.ts` | Global `AppDialogA11y` namespace for trigger capture, focus trap, Escape arbitration, body lock; under 500 lines. |
| **NEW** | `assets/js/app-dialog.js` | Generated classic-script dependency loaded before `app.js`. |
| **NEW** | `scripts/verify-nav.mjs` | Parses all public HTML pages and enforces six-axis order/count labels. |
| **MODIFY** | `index.html` | Semantic nav classes, atlas stylesheet, dialog attributes, cache keys. |
| **MODIFY** | `effects.html` | Same nav markup/order, atlas stylesheet, cache keys. |
| **MODIFY** | `faq.html` | Remove inline content/style/script; add complete nav and render mount. |
| **MODIFY** | `assets/css/style.css` | Consume atlas tokens; remove generic shell/card defaults duplicated by theme. |
| **MODIFY** | `assets/css/nav.css` | Replace fixed mobile header assumptions with wrapping grid/flow rules. |
| **MODIFY** | `assets/css/effects.css` | Use shared specimen card/toolbar tokens and angular geometry. |
| **MODIFY** | `src/app.ts` | Delegate dialog lifecycle to `AppDialogA11y`; target ≤1,300 lines by extracting existing modal helpers. |
| **MODIFY** | `package.json` | Add `verify:nav`; append it to `verify`. |
| **MODIFY** | `README.md` | Document shared navigation, FAQ data source, and phase-neutral counts. |
| **MODIFY** | `AGENTS.md` | Record nav validator and no-inline-page-CSS rule. |
| **MODIFY** | `structure/README.md` | Add new CSS/data/TS/icon files. |
| **DELETE** | inline `<style>` in `faq.html` | Move rules to `assets/css/faq.css`. |
| **DELETE** | inline FAQ item markup in `faq.html` | Render from `assets/data/faq.json`. |
| **DELETE** | inline FAQ accordion `<script>` | Replace with compiled `assets/js/faq.js`. |
| **DELETE** | emoji section icons | Replace with decorative SVGs plus accessible category text. |

No other files are deleted in this phase.

## 1. Normalize the six-axis navigation

This is an intentional invariant migration: AGENTS currently documents five axes and omits
FAQ, while runtime index/effects already expose FAQ. Update AGENTS in this phase so the new
canonical order is Isms / Effects / FAQ / GitHub / Lang / Count on all three pages.

Add a skip link and `<main id="main-content">` wrapper to every page. The sticky header and
main target must use focus/scroll offsets that account for wrapped mobile header height.

Use identical child order on all three pages. Only `aria-current` and the count label vary.

```diff
- <a class="star-pill" ...>Isms</a>
- <a class="star-pill" ...>Effects</a>
- <a class="star-pill" ...>FAQ</a>
- <a class="star-pill" ...>...Give me a star</a>
+ <a class="nav-link" data-nav-axis="isms" ...>Isms</a>
+ <a class="nav-link" data-nav-axis="effects" ...>Effects</a>
+ <a class="nav-link" data-nav-axis="faq" ...>FAQ</a>
+ <a class="nav-link nav-link--external" data-nav-axis="github" ...>
+   GitHub <span aria-hidden="true">↗</span>
+ </a>
+ <button class="lang-toggle" data-nav-axis="lang" id="lang-toggle"
+         type="button" aria-label="언어 전환 / Switch language">
+   <span class="lang-option" data-lang="ko">한</span>
+   <span class="lang-divider" aria-hidden="true">/</span>
+   <span class="lang-option" data-lang="en">EN</span>
+ </button>
+ <span class="header-count" data-nav-axis="count">43 isms</span>
```

Page-specific counts in this phase:

```text
index.html   → 43 isms
effects.html → 46 effects
faq.html     → 18 answers
```

Do not call an effect a “candidate” in one page header and an “effect” in another; use **effects** in compact UI and retain “Frontend UI Candidates” only as editorial page title/copy.

`faq.html` must use the same `id="lang-toggle"` and persisted locale contract as the other pages. Each page may implement its own listener, but all read/write `localStorage['design-isms-lang']` with values `ko | en`.

## 2. Replace the brand/FAQ emoji with authored SVG

`assets/icons/atlas-mark.svg` content contract:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <path d="M4 5.5h16M4 12h10M4 18.5h16" stroke="currentColor" stroke-width="1.5"/>
  <path d="M17 9.5 20 12l-3 2.5" stroke="currentColor" stroke-width="1.5"/>
</svg>
```

The three FAQ icons must:

- use a `24 24` viewBox, `fill="none"`, `stroke="currentColor"`;
- contain no text, gradients, filter effects, masks, emoji, external references, or brand marks;
- be included as `<img alt="" aria-hidden="true">` because the adjacent heading names the category;
- remain legible at 20px and 24px.

Representative FAQ heading diff:

```diff
- <h2 class="faq-category-title"><span class="cat-icon">⚡</span> AI 시대의 디자인 작업 방식</h2>
+ <h2 class="faq-category-title" id="faq-workflow-title">
+   <img class="faq-category-icon" src="./assets/icons/faq-workflow.svg" alt="" aria-hidden="true">
+   <span data-i18n="workflow.title">AI와 함께 설계하는 작업 방식</span>
+ </h2>
```

## 3. Move the FAQ to a bilingual, source-aware data file

`assets/data/faq.json` top-level schema:

```json
{
  "version": "2026-07-14",
  "categories": [
    {
      "id": "workflow",
      "icon": "./assets/icons/faq-workflow.svg",
      "title": { "ko": "AI와 함께 설계하는 작업 방식", "en": "Designing with AI" },
      "items": []
    }
  ]
}
```

Each of the 18 `items[]` objects must contain:

```json
{
  "id": "human-authorship",
  "question": { "ko": "...", "en": "..." },
  "answerHtml": { "ko": "<p>...</p>", "en": "<p>...</p>" },
  "sources": [
    { "label": "U.S. Copyright Office — Copyright and Artificial Intelligence", "url": "https://www.copyright.gov/ai/" }
  ],
  "reviewedOn": "2026-07-14"
}
```

Content rules:

1. Keep eighteen answers and the existing three conceptual categories, but rename the trend category to **Current design directions / 현재 디자인 흐름**—no year range in a persistent heading.
2. Delete claims such as “70% faster,” “90% production-ready,” “30% human modification,” “25% dwell time,” or “0% drift” unless an answer links a directly applicable primary study and scopes the population/method. The planned baseline uses no such percentages.
3. Copyright copy must say that protectability depends on human-authored expression, selection, arrangement, and jurisdiction; never prescribe a percentage of edits. [Source: https://www.copyright.gov/ai/]
4. Accessibility answers must link WCAG/APG and present them as standards/guidance, not as a design trend. [Source: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html] [Source: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/]
5. Tool/vendor examples may be illustrative but cannot be described as “the standard” without evidence; add “for example” and a review date.
6. `answerHtml` permits only `p`, `strong`, `em`, `code`, `ul`, `li`, and `a`. `src/faq.ts` must build DOM nodes or sanitize against this allowlist; never assign untrusted arbitrary HTML.
7. Render source links beneath the answer as an unordered list with external-link disclosure.

## 4. Rebuild `faq.html` as a thin entry document

```diff
 <link rel="stylesheet" href="./assets/css/style.css?...">
 <link rel="stylesheet" href="./assets/css/nav.css?...">
-<style>...all FAQ rules...</style>
+<link rel="stylesheet" href="./assets/css/theme-atlas.css?...">
+<link rel="stylesheet" href="./assets/css/faq.css?...">
@@
-<div class="faq-categories">...18 hardcoded items...</div>
+<main id="main-content">
+  <section class="faq-hero" aria-labelledby="faq-title">...</section>
+  <div class="faq-categories" id="faq-categories" aria-busy="true"></div>
+</main>
@@
-<script>document.querySelectorAll(...)</script>
+<script src="./assets/js/faq.js?..."></script>
```

`src/faq.ts` behavior:

- fetch `./assets/data/faq.json` with status checking;
- validate `categories.length === 3`, total items `=== 18`, unique IDs, both locales, valid `https:` source URLs;
- render native `<button>` questions with `aria-expanded`, `aria-controls`, and stable answer IDs;
- set answer containers to `hidden` when collapsed instead of relying on a guessed `max-height`;
- support Enter/Space through native buttons, Home/End and ArrowUp/ArrowDown across questions;
- persist locale and rerender without losing the currently expanded question;
- render a visible error block and clear `aria-busy` if loading/validation fails;
- set document metadata copy for the selected language where practical, without changing the canonical URL.

## 5. Install the atlas shell

Load order on all pages:

```html
<link rel="stylesheet" href="./assets/css/style.css?...">
<link rel="stylesheet" href="./assets/css/theme-atlas.css?...">
<link rel="stylesheet" href="./assets/css/nav.css?...">
<!-- page-specific styles after shared layers -->
```

`theme-atlas.css` defines the concrete token shift:

```diff
- --bg: #FAF8F5;
- --bg-warm: #F5F0E8;
- --border: #E8E0D6;
- --radius: 12px;
+ --atlas-paper: #F1F1EB;
+ --atlas-surface: #FAFAF6;
+ --atlas-ink: #11120F;
+ --atlas-muted: #62645D;
+ --atlas-rule: #B8B9B0;
+ --atlas-signal: #FF4D1F;
+ --atlas-cobalt: #2B50E8;
+ --atlas-focus: #005FCC;
+ --atlas-radius-xs: 2px;
+ --atlas-radius-sm: 4px;
+ --atlas-grid-max: 1440px;
```

Required shell changes:

- add a 1px paper/grid texture using CSS gradients only, under 0.035 opacity;
- use an asymmetrical 12-column catalog at large widths rather than identical equal boxes;
- display specimen index, taxonomy, and annotation rail as text—not decorative pills;
- reserve orange for active/primary signal and cobalt for links/data marks;
- use square/angular controls and one restrained shadow only for modal elevation;
- keep actual ISM imagery neutral and uncropped enough to remain the focal evidence;
- replace blanket hover lift with rule/ink changes; no every-card `transform: translateY(...)`;
- add `:focus-visible` treatment with 2px outline plus offset and no focus suppression.

Representative card shell diff:

```diff
-.ism-card { border-radius: 12px; box-shadow: ...; }
-.ism-card:hover { transform: translateY(-4px); }
+.ism-card {
+  border: 1px solid var(--atlas-rule);
+  border-radius: var(--atlas-radius-sm);
+  box-shadow: none;
+  display: grid;
+  grid-template-rows: auto 1fr;
+}
+.ism-card:hover { border-color: var(--atlas-ink); }
+.ism-card::before { content: attr(data-specimen-index); font-family: var(--font-mono); }
```

## 6. Fix the 390px header/search collision

The defect is structural, not a one-off margin tweak. Replace fixed height and ad-hoc offsets.

```diff
 .site-header {
-  height: 64px;
+  min-height: 64px;
+  height: auto;
 }
 .header-inner {
-  height: 64px;
+  min-height: 64px;
+  height: auto;
+  display: grid;
+  grid-template-columns: minmax(0, 1fr) auto;
 }
```

At `max-width: 640px`:

```css
.header-inner {
  grid-template-columns: 1fr;
  gap: 10px;
  padding-block: 10px;
}
.header-right {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  width: 100%;
}
.filter-bar,
.effects-toolbar {
  position: static;
}
.search-input,
.search-input:focus {
  width: 100%;
  min-width: 0;
  max-width: none;
}
```

At 390px, allow the four page links on the first nav row and Lang/Count on the next row if needed. Do **not** hide an axis, abbreviate FAQ, or overlap the search field. The search must start after the header in normal flow.

## 7. Bring the ISM dialog to the effects-dialog baseline

Modify `index.html`:

```diff
-<div class="modal-overlay" id="modal-overlay">
-  <div class="modal-container">
+<div class="modal-overlay" id="modal-overlay" aria-hidden="true">
+  <div class="modal-container" id="ism-modal-dialog" role="dialog"
+       aria-modal="true" aria-labelledby="ism-modal-title" tabindex="-1">
```

Modify `src/app.ts` to:

- store the trigger element before opening;
- set `aria-hidden="false"`, lock body scroll without layout jump, and focus the close button/dialog;
- trap Tab/Shift+Tab inside the active modal;
- close on Escape, close control, or backdrop—not on clicks inside the dialog;
- restore focus to the original card when closing;
- ensure the generated heading has `id="ism-modal-title"`;
- prevent the lightbox and modal from both claiming Escape/focus at once.

The reusable mechanics live in `src/app-dialog.ts`; `src/app.ts` keeps only the modal-specific
render callback and state bridge. This makes the existing 1,342-line file net-negative.

`index.html` script load order (explicit — `AppDialogA11y` must exist before `app.js` evaluates):

```diff
 <!-- index.html, end of body, classic synchronous scripts -->
+<script src="./assets/js/app-dialog.js?..."></script>
 <script src="./assets/js/app.js?..."></script>
```

Follow the APG modal keyboard/focus behavior. [Source: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/]

## 8. Add automated navigation validation

`scripts/verify-nav.mjs` must read `index.html`, `effects.html`, and `faq.html` without a browser and assert:

```js
const expected = ['isms', 'effects', 'faq', 'github', 'lang', 'count'];
```

Also assert:

- exactly one `aria-current="page"` per page;
- GitHub uses `target="_blank" rel="noopener"`;
- locale button exists and is a `<button type="button">`;
- count text matches `43 isms`, `46 effects`, or `18 answers` in this phase;
- no `class="star-pill"` and no FAQ emoji codepoints remain;
- all local nav targets exist.

`package.json`:

```diff
 "scripts": {
+  "verify:nav": "node scripts/verify-nav.mjs",
-  "verify": "npm run typecheck && npm run build"
+  "verify": "npm run typecheck && npm run build && npm run verify:nav"
 }
```

## Acceptance criteria

Run from a fresh full checkout:

```bash
npm ci
npm run verify
git diff --exit-code -- assets/js/app.js assets/js/app-dialog.js assets/js/faq.js
```

Expected terminal tail:

```text
nav ok: index.html, effects.html, faq.html; axes=6; order consistent
```

Run a local static server and browser checks:

```bash
python3 -m http.server 4173
# inspect http://127.0.0.1:4173/index.html
# inspect http://127.0.0.1:4173/effects.html
# inspect http://127.0.0.1:4173/faq.html
```

Acceptance matrix:

| View | Required result |
|---|---|
| 1440×900, all pages | Six axes in identical order; no generic pill treatment; current page is visible. |
| 1024×768, all pages | Header remains one readable system; no clipped links or counts. |
| 640×900, all pages | Header wraps in normal flow; toolbar/search begins below it. |
| 390×844, all pages | Zero overlap and `document.documentElement.scrollWidth === innerWidth`. |
| Keyboard, FAQ | Every question reachable; expansion state announced; arrows/Home/End work. |
| Keyboard, ISM modal | Focus enters, stays in, Escape closes, and focus returns to trigger. |
| Reduced motion | No nonessential card/modal/accordion travel animation. |
| Console/network | Zero errors; FAQ JSON and SVG files return HTTP 200. |
| Skip/focus | Skip link reaches main; sticky header never hides focused anchors/controls. |

Content acceptance:

```bash
! grep -nE '2024.?2025|70%|90%|30%.*수정|25%|0%.*drift|⚡|🔥|🛠' faq.html assets/data/faq.json
```

Expected: no matches. A year may appear inside a dated source citation or reviewed date, but not as a stale evergreen heading.

## Completion handoff

Phase 020 is complete only when CSS/HTML/data changes, generated JS parity, and documentation
updates pass together. A coherent phase commit is allowed because the user explicitly
authorized commit/push for this loop; stage only reviewed paths, never `git add -A`. Phase 040
and 050 change counts through their own sources of truth and must not duplicate nav markup.
