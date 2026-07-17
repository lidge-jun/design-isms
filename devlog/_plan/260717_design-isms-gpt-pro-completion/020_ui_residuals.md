# 020 — Runtime State and Semantic Interaction Repair

Normative detailed contract: `devlog/260715_production_upgrade/100_phase9_ui_residuals.md`.

## Diff

- NEW `src/app-runtime.ts`, generated `assets/js/app-runtime.js`, focused
  `assets/css/runtime-states.css`.
- MODIFY three HTML load orders; `src/{app,effects,faq}.ts`, `src/effects-filters.ts`, and
  generated JS; minimal page CSS only if selectors require it; docs after proof.
- Preserve user changes in `src/effects.ts`, `assets/js/effects.js`, `assets/css/effects.css`.

Before: index initialization rejection is uncaught; image uses inline `onerror` and
`generating...`; page errors do not retry; modal image/disclosure/swatch/related surfaces are
click-only divs. After: shared safe runtime helpers, visible focused retry, truthful image
fallback, native buttons and ARIA disclosure, idempotent restart, loading cleanup.

Index splits `mountIndexOnce()` from single-flight `loadAndRenderIndex()` so partial failure and
rapid Retry cannot duplicate document/window listeners. Effects splits
`mountStaticInteractionsOnce()` from single-flight retryable `loadAndRender()`. Rapid Retry is
ignored/disabled until settlement. Retry destroys
demo/filter controllers and observers but never rebinds window/element listeners. Index moves
loading/reveal plus safe storage/history/error/image helpers into `AppRuntime`, creating real line
budget below the 1050 ceiling.

## Activation and acceptance

Intercept each primary JSON request to fail then succeed; route one image to 404; deny storage;
drive rapid double Retry on Index and Effects, denied storage/history, Enter/Space, and reduced motion. Observe
alert→Retry→49/64/18 recovery, one in-flight attempt/listener action, no uncaught error,
single event action, controller teardown, focus/ARIA correctness, no inline handlers/generating
copy, TS/JS parity, line limits, and clean desktop/390 render.

## P stale-check — 2026-07-17

- `src/app.ts` is still 1,047 lines. Move its 42-line `dismissLoading`/`revealPage` block and
  direct storage/history calls into `AppRuntime`; do not add another local abstraction.
- `src/app.ts` initial `fetch` does not check `response.ok`, and DOMContentLoaded discards the
  promise. `mountIndexOnce()` owns listeners; single-flight `loadAndRenderIndex()` checks status,
  owns data/Finder hydration, and routes failure to a retryable grid alert.
- `src/effects.ts` binds static listeners before fetch and has no mount guard. Keep one cached
  `PageElements`, one static-bind boolean, and a separate single-flight retryable data/controller
  function whose cached promise prevents concurrent controller creation.
- `EffectsFilters.Controller` still lacks `destroy`; add removal for its two delegated row
  listeners and replace direct history persistence with `AppRuntime.replaceHistory()`.
  `EffectsInteractions.Controller.destroy()` already exists and must be reused. Effects locale
  storage also moves to `AppRuntime.readStorage/writeStorage`.
- `src/faq.ts` has a terminal alert without Retry. Extract `loadFaq()` so retry toggles
  `aria-busy` and fetches once without rebinding locale/accordion listeners.
- Three HTML files still lack `app-runtime.js`; add it before each page consumer and load the
  focused state CSS after existing page CSS.
- Current user deltas in Effects remain exactly the absence of duplicate body class/CSS lock;
  implementation must not reintroduce them.
