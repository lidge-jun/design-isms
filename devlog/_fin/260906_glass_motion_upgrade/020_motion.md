# wp2 — Motion with real state

## Loop specification
C3 spec-satisfaction repair. Depends on wp1 material semantics and 001 design lock. Goal: distinguish pause/resume/replay and let readers operate five stateful recipes. Existing 20 identities/categories/schema remain fixed. No shared CatalogShell changes, new animation library, or page-level spectacle. Resources/escalation as 000.

## Exact change map
- MODIFY src/motion.ts: replace current class-only toggle in wireModalControls with distinct start/pause/resume and replay controls. Pause calls animation.pause() without resetting visual state; resume calls play(); replay sets currentTime=0 before play. Give buttons aria-pressed/text matching actual state. Synchronize both grid and modal on visibilitychange and reducedMedia change. Keep manually paused state across visibility return. Dispose modal controller on CatalogShell.onModalClose and before replacement. Disconnect previous grid observer before empty render. Preview speed remains 0.4x and is labelled; interactive state demos use intended recipe timing.
- MODIFY assets/css/motion-demos.css: preserve animation properties across pause; separate pristine idle styling from a paused frame. Do not use the existing :not(.is-active) opacity/transform reset to represent pause. Reduced motion displays useful end states.
- MODIFY src/motion-demos.ts: change fixed numeric progress label to neutral visual label or actual corresponding value; decorative card previews stay aria-hidden. Interactive descendants must not go inside that hidden wrapper.
- NEW src/motion-interactions.ts: classic namespace MotionInteractions with mount(root: HTMLElement,id: string): controller|null and dispose(). Exactly motion-progress, motion-scroll-reveal, motion-expand-collapse, motion-tab-transition, motion-list-reorder get accessible modal specimens. All event listeners/observers/frames owned by controller and disposed. Use native controls, real DOM content, textContent for state. Reduced preference listener acts on open specimen. Purely decorative motion layers may be aria-hidden, controls may not.
- NEW assets/css/motion-interactions.css: scoped specimen styling, preserved Atlas typography, 44px native targets, solid content, light glass limited to control chrome when useful, reduced-motion and forced-colors treatments. No hidden essential content before script activates.
- MODIFY assets/data/motion.json five existing records summary/snippet.css/reducedMotion strings; no guide.prompt/image changes in this cycle. Explain triggers, state timing, focus, and fallback in concrete Korean. CSS snippets include reduced-motion and do not pretend to implement JS-only semantics; state required JS in summary.
- MODIFY motion.html script/style load order (motion-interactions before motion renderer) and affected cache versions. Text explains 0.4x decorative preview versus actual modal interaction.
- GENERATE assets/js/{motion,motion-demos,motion-interactions}.js with npm run build.
- MODIFY README.md, AGENTS.md and structure/README.md to document real demos and disposal owner.

## Five demo contracts
1. Progress: range/target controls change numeric value, progressbar aria-valuenow and fill. CSS transform interpolates visual fill; textual value is immediate. Reduced motion preserves value.
2. Scroll reveal: local scroll container with actual offscreen items; IntersectionObserver reveals once. No-observer and reduced-motion paths expose all items. Scroll is user-controlled, no synthetic scrolling loop.
3. Disclosure: button aria-expanded plus aria-controls, actual collapsed/expanded content, layout responds. Hidden content is not focusable. Reduced mode toggles immediately.
4. Tabs: role tablist, two tabs/panels, arrow/Home/End keyboard paths and roving tabindex; selected panel alone exposed. Focus remains on selected tab during transition.
5. Reorder: button changes actual list DOM order; FLIP captures old/new positions and animates translation. Preserve active control focus. Reduced motion reorders immediately. Repeated input cancels obsolete animations.

## Activation verification
Build + verify must pass (baseline observed in 000). Browser pause at an intermediate frame and compare transform across a bounded wait; resume must move, replay must return to beginning. Test live reduce/no-preference while modal remains open; returning from hidden state respects manual pause. Exercise every control with keyboard and pointer. Assert target values, DOM order, ARIA, hidden states and reveal state from real scrolling. Close/reopen different presets and verify stale callbacks stop. At 1440/1024/768/390/320 no overflow or overlap; 20 cards and no console errors. Effects desktop/mobile still 94 cards/types. Unsupported observer path verified with page-start override.

## Delegation
One worker owns src/motion.ts, src/motion-demos.ts, src/motion-interactions.ts, relevant motion CSS and motion.html; main owns data/docs/build. Read-only final reviewer distinct from builder. No concurrent edits to worker paths.

## wp2 P stale check and parallel interface
wp1 left all motion owners unchanged; full verify passed after wp1. Split implementation into two disjoint workers to avoid coupling waits:
- Core worker: src/motion.ts, src/motion-demos.ts, assets/css/motion-demos.css, assets/css/motion.css, motion.html.
- Interaction worker: src/motion-interactions.ts, assets/css/motion-interactions.css only.
Shared interface fixed before dispatch: namespace MotionInteractions exports interface Controller { dispose(): void } and mount(container: HTMLElement, id: string): Controller | null. Container is .motion-modal-stage; recognized five IDs replace its contents with accessible interaction markup and own their controls; other IDs return null without mutation. Core calls this before generic preview wiring, retains controller, disposes on close/replacement. Interaction module owns its own reduced-motion listener. Core owns decorative preview state/visibility. Main owns motion.json/docs/generated build. HTML loads interaction script before motion renderer. Source file <=500 lines; split roles further only with main P amendment.
