# 100 — Runtime Error States and Semantic Interaction Residuals

## Loop specification

- Archetype: focused frontend repair
- Trigger: release content checks expose shipped inline `onerror`, `generating...` fallback,
  unhandled index initialization failure, non-retry page errors, and click-only modal controls.
- Goal: make data/image failure recoverable and convert click-only controls to native semantic
  controls while preserving the Atlas visual direction and the effects-modal flicker fix.
- Non-goals: visual redesign, layout replacement, new catalog data, new framework/dependency.
- Verifier: forced-fetch and broken-image activation, keyboard interaction, source/build parity,
  desktop/mobile render observation.
- Stop: all three pages recover or retry, no authored inline event handlers remain, keyboard
  activation matches pointer activation, and existing 49/64/18 flows remain unchanged.
- Bounds: current repo files only, no remote actions, one PABCD cycle.

## Existing design direction

Keep the paper/ink Atlas shell, one signal accent, current typography, card density, and six-axis
navigation. This phase adds state clarity and semantics, not a new concept. The GPT overlay's
`production-hardening.css` is reference material only; current CSS owners remain authoritative.

## Diff-level path manifest

| Marker | Exact path | Before → after |
| --- | --- | --- |
| NEW | `src/app-runtime.ts` | page utilities duplicated/missing → classic-script namespace for safe storage/history, loading dismissal, image fallback, and page error + retry rendering |
| NEW generated | `assets/js/app-runtime.js` | absent → TypeScript build output |
| MODIFY | `index.html`, `effects.html`, `faq.html` | no shared runtime script → load `app-runtime.js` after dialog helper and before page consumer; add state CSS link if split |
| NEW | `assets/css/runtime-states.css` | state fixes would grow near-limit owners → focused error/fallback/native-control/min-target rules under 500 lines |
| MODIFY | `src/app.ts` | monolithic retryable `init`, inline image `onerror`, div image wrappers/collapsibles/swatches/related cards, direct storage/history → `mountIndexOnce()` + single-flight `loadAndRenderIndex()`, delegated image error listener, native buttons/ARIA, shared safe helpers |
| MODIFY generated | `assets/js/app.js` | old browser output → rebuilt output |
| MODIFY | `src/effects.ts` | terminal text-only error and delayed overlay residue → `mountStaticInteractionsOnce()` plus retryable `loadAndRender()` and shared loading cleanup; destroy partial controllers before remount; preserve `AppDialogA11y` as scroll-lock owner |
| MODIFY generated | `assets/js/effects.js` | preserve current user deletion while reflecting source changes |
| MODIFY | `src/effects-filters.ts` and generated `assets/js/effects-filters.js` | controller has no teardown and calls history directly → add `destroy()` for delegated row listeners and route persistence through `AppRuntime.replaceHistory()` |
| MODIFY | `src/faq.ts` | terminal alert only → localized retry button; safe storage helper; stable expanded/locale state |
| MODIFY generated | `assets/js/faq.js` | rebuilt output |
| MODIFY | `assets/css/effects.css`, `assets/css/faq.css`, `assets/css/style.css` only if necessary | minimal selector compatibility; prefer the new focused state stylesheet |
| MODIFY | `README.md`, `AGENTS.md`, `structure/README.md` | document shared runtime owner and load order after behavior is proven |

`src/app-runtime.ts` is loaded on all pages. Index order remains
`app-dialog → app-runtime → app-guides → app-export → finder → app`; Effects remains
`app-dialog → app-runtime → app-export → filters → interactions → demos → docs → effects`;
FAQ loads `app-runtime → faq`.

## Behavior changes

### Index

- `mountIndexOnce()` owns a module boolean and binds lightbox, scroll, modal, filter/search,
  language, Finder dialog shell, and delegated image/card handlers exactly once.
- `loadAndRenderIndex()` owns the data/guide fetch, parse, cards, Finder controller data mount,
  and loading/error state. A cached in-flight promise disables/ignores rapid repeated Retry until
  the current attempt settles; retry never rebinds document/window listeners.
- `DOMContentLoaded` mounts once, then calls the single-flight loader that catches initial
  JSON/network/schema failures.
- Error state replaces the grid with a localized alert and one Retry button; retry clears the
  error, marks busy, and reruns start without registering duplicate global listeners.
- Card image wrappers become `<button type="button">`; image failures replace only the image
  surface with a truthful unavailable state, never the phrase `generating...`.
- Modal image, collapsible header, swatch-copy, and related-ISM surfaces use buttons. Collapsible
  buttons own `aria-expanded` and `aria-controls`; hidden body owns `aria-hidden`.
- Safe history/storage helpers absorb privacy/sandbox exceptions without hiding data failures.

### Effects

- `mountStaticInteractionsOnce(elements)` owns a module boolean and binds search/grid/modal/
  lightbox/scroll/hash/lang listeners exactly once. Single-flight `loadAndRender(elements)` owns
  fetch, data parse, filter and demo controller creation, cards, and hash hydration; its cached
  in-flight promise disables/ignores additional Retry activations until settlement.
- Load failure renders an alert and retry control. Before each retry,
  `interactions?.destroy()`, `filtersController?.destroy()`, and `cardObserver?.disconnect()` run;
  controller references reset to null, while static listeners remain mounted once.
- Loading overlay is removed after transition or timeout; no invisible overlay remains.
- Effects locale reads/writes use `AppRuntime.readStorage/writeStorage`; filter URL persistence
  uses `AppRuntime.replaceHistory`, so privacy/sandbox exceptions cannot abort setup or actions.
- Existing user-owned removal of duplicate `body.modal-open` logic stays intact.

### FAQ

- Failure alert includes a localized retry that performs a new fetch.
- `aria-busy` returns to true during retry and false on terminal success/failure.
- Locale and expanded item state are retained; no duplicate key handlers are added.

## Conditional-path activation matrix

| Path | Trigger | Observable proof |
| --- | --- | --- |
| index data failure | intercept `isms.json` with 500/abort | alert + focused Retry; retry with success renders 49 cards |
| rapid Index retry | trigger two Retry activations before the replacement fetch settles | one fetch/mount attempt, one listener action, button disabled or ignored until settle |
| effect data failure | intercept `effects.json` | alert + Retry; retry renders 64 cards and filter state works |
| rapid Effects retry | trigger two Retry activations before the replacement fetch settles | one fetch and one filter/demo controller mount; no unreachable listener/controller |
| FAQ data failure | intercept `faq.json` | localized alert + Retry; retry renders 18 items |
| image failure | route one WebP to 404 | unavailable fallback appears, card still opens, no console page error |
| storage/history denied | override storage and history access in browser context on Index and Effects | locale/filter interactions still work for session, no uncaught error |
| keyboard semantics | Tab/Enter/Space on image, disclosure, swatch, related item | same action as click, correct ARIA state/focus |
| reduced motion | emulate `prefers-reduced-motion: reduce` | final state visible; overlay removed without animation wait |

## Acceptance criteria

- `rg 'on[a-z]+=' index.html effects.html faq.html src assets/js` finds no authored inline handler
  in shipped runtime; `rg 'generating\.\.\.'` finds no shipped UI copy.
- Move `dismissLoading()` and `revealPage()` plus safe storage/history and page-error/image-
  fallback helpers into `AppRuntime`; remove the former local functions/calls from `src/app.ts`.
  The resulting `src/app.ts` remains at or below 1050 lines with more than three lines of margin;
  all new files are below 500.
- TypeScript and committed JS are byte-parity clean.
- Pointer and keyboard paths work for all converted controls.
- Forced failure → visible retry → successful recovery is observed on all three pages.
- Desktop and 390px screenshots show no new horizontal overflow or visual regression.
