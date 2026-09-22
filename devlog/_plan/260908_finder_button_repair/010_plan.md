# 260908 — Finder trigger + dialog styling repair

## Problem (observed live at 127.0.0.1:4173/index.html, 1440x900)
Commit 0109359 ("fix: convert style finder from inline section to dialog popup")
moved the Style Finder from an inline `<section class="style-finder">` into a
`<dialog class="finder-dialog">` opened by a new `<button class="finder-trigger">`.
The commit touched only index.html, src/app.ts and assets/js/app.js — no CSS.

`assets/css/finder.css` still styles the OLD inline shell (.style-finder,
.style-finder-header) and has zero rules for the new class names:
- .finder-trigger        → renders as a raw native Chrome button next to styled
                           .filter-btn pills (screenshot evidence)
- .finder-dialog         → native dialog: no max-width, no padding, no border,
                           no shadow, no ::backdrop; overlaps page at top-left
- .finder-dialog-inner   → no rules
- .finder-dialog-header  → no rules
- .finder-dialog-close   → raw 8px native button showing bare "×"

Dead CSS: .style-finder / .style-finder-header rules match nothing after 0109359.

## Scope
Purely presentational. Do not change the dialog markup contract, ids, JS
behavior, or finder scoring. index.html markup change is limited to whitespace
separation of the two adjacent buttons (they are currently written with no
separating whitespace on one line) — no id/class/attribute changes.

## Fix
1. assets/css/finder.css
   - Replace dead .style-finder* rules with .finder-dialog* shell rules.
   - .finder-trigger: adopt the Atlas control language of its siblings
     (.filter-btn / .search-input in style.css + theme-atlas.css):
     var(--font-sans), 13px/500, 6px 14px, 1px solid var(--border),
     var(--atlas-radius-sm), var(--card-bg). Distinguish it as the primary
     affordance with the signal accent border/text, since it opens a tool
     rather than filtering the grid. Add hover + :focus-visible using
     var(--atlas-focus), matching .search-input:focus-visible.
   - .finder-dialog: width min(46rem, 92vw), max-height 88vh, atlas surface,
     1px rule border, atlas radius, shadow consistent with .modal-container,
     centered via margin:auto. ::backdrop rgba ink + blur, matching
     .modal-overlay.
   - .finder-dialog-inner: padding 2rem, overflow-y auto, overscroll contain.
   - .finder-dialog-header: flex, space-between, rule underline, h2 in
     var(--font-display).
   - .finder-dialog-close: reuse .modal-close geometry (34px circle) so the two
     dialogs on this page agree.
   - Mobile ≤640px: full-width sheet, reduced padding, trigger stays ≥40px tall
     within the wrapping filter-row.
   - Extend the existing @media (prefers-reduced-motion), print and
     forced-colors blocks to cover the new controls.
2. index.html: separate the two adjacent buttons with a newline so the flex gap
   is not the only separator in source (cosmetic source hygiene, same render).
3. Bump the finder.css cache-buster on index.html.

## Constraints checked
- verify-finder.mjs asserts assets/css/finder.css < 420 lines (currently 224).
- verify-line-limits.mjs caps assets/css/*.css at 500 lines.
- No src/*.ts change needed → no npm run build strictly required, but run it
  anyway to confirm generated JS stays in sync (verify:generated).

## Check criteria
- npm run build && npm run verify pass.
- Live browser at 1440x900 and 390x844: trigger visually belongs to the filter
  row; dialog is a centered card with backdrop; close button is a circle.
- Keyboard: Tab reaches trigger with a visible focus ring; Enter opens; Esc
  closes; backdrop click closes (existing JS).
- No console errors.

