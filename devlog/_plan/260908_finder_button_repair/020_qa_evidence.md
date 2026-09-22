# 260908 — Finder trigger + dialog styling repair (QA evidence)

## Outcome
The "Find a style" button and the dialog it opens now render in the Atlas shell
language instead of raw browser defaults.

## Root cause
Commit `0109359` ("fix: convert style finder from inline section to dialog popup")
moved the Style Finder out of an inline `<section class="style-finder">` and into
`<dialog class="finder-dialog">` behind `<button class="finder-trigger">`. It
changed `index.html`, `src/app.ts` and `assets/js/app.js` — and no CSS. So
`assets/css/finder.css` kept styling the shell that no longer existed while every
new class name had zero rules. Chrome fell back to native button and native
dialog rendering, which is what the reported screenshot shows.

## Changes
- `assets/css/finder.css`
  - `.finder-trigger`: control geometry shared with `.filter-btn` /
    `.search-input`, signal-accent identity (it opens a tool rather than
    filtering the grid), `--atlas-focus` focus ring.
  - `.finder-dialog` + `::backdrop` + `-inner` / `-header` / `-close`: centred
    card matching `.modal-container`, blurred ink backdrop matching
    `.modal-overlay`, 34px circular close matching `.modal-close`.
  - Removed the dead `.style-finder` / `.style-finder-header` rules.
  - `.finder-options` moved from viewport media queries to
    `repeat(auto-fit, minmax(12.5rem, 1fr))`, since the finder now lives in a
    fixed-width dialog where viewport breakpoints over-pack. `.finder-option`
    became a 2-column grid with the hint stacked under the label, so Korean
    option names no longer break mid-word.
  - Mobile bottom-sheet block; reduced-motion / print / forced-colors extended.
- `index.html`: finder.css cache-buster bumped; the two adjacent buttons in
  `.filter-row` separated onto their own lines.

## Independent audit (explorer subagent) — near-pass, all blockers folded
1. `.finder-trigger:hover` used `#fff` on `--atlas-signal` = **3.32:1**, failing
   AA for a 13px label and contradicting the documented token contract in
   `theme-atlas.css`. Now fills `--atlas-signal-text` (#B82E06) = **6.12:1**.
2. Renaming `.style-finder-header .atlas-kicker` turned a dead rule live, and it
   carried `--atlas-ink-muted`, which is **undefined repo-wide**; the `#7a7a7a`
   fallback gave **3.79:1** where the kicker previously inherited ink at 16.58:1.
   Now `--atlas-muted` (#62645D) = **5.29:1**.
3. `.finder-dialog-close` had the same undefined token, so it did not actually
   agree with `.modal-close` (which resolves `--ink-light` → `--atlas-muted`).
   Now `--atlas-muted`.

Non-blocking notes also folded: stale `flex-shrink` on the now-grid
`.finder-radio` and its undefined `--atlas-accent`; mobile sheet radius aligned
to the 20px sibling precedent in `style.css` / `effects.css`; forced-colors
`.finder-dialog` border changed `ButtonText` → `CanvasText` for a non-button
surface. Every contrast ratio was recomputed independently before accepting.

Accepted residual: the pre-existing undefined `--atlas-accent` focus outlines
elsewhere in `finder.css` are outside this repair's scope and unchanged. Between
roughly 440px and 640px the option grid now shows two columns where the old
breakpoint forced one; real phone widths stay single-column, verified live.

## Verification
- `npm run build` clean; `npm run verify` passes all 13 gates, including
  `finder ok: 3 questions, 16 options, 144 combinations, 432 deterministic
  results` and `generated ok: 24 TypeScript outputs match committed browser JS`.
- Live browser (`npm run serve` over the staged `.pages` tree):
  - 1440×900 — trigger sits in the filter row as an accent control; hover fills
    deep red; dialog is a centred card over a blurred backdrop.
  - 500×757 (narrowest this Chrome allows) — full-width bottom sheet, no
    horizontal overflow.
  - Keyboard — Tab reaches the trigger with a visible blue focus ring, Enter
    opens the dialog, Escape closes it.
  - Full flow — three answers selected, FIND STYLES returns the three ranked
    results with working "레퍼런스 열기" buttons; answers restore from session
    storage on reopen.
  - No console output captured.

