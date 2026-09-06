# wp2 implementation notes

## Guide changes
Five existing motion.json records now explain real state triggers, required JS semantics, CSS-only responsibilities and reduced-motion state preservation. IDs, categories, duration/easing and image prompts unchanged. verify:catalog passed after the data changes.
Progress explicitly avoids invented completion percentages in real products. Scroll reveal defaults visible before observer enhancement. Disclosure explains hidden/inert and accessibility timing. Tabs include roving tabindex, selected/hidden states and keyboard focus. Reorder explains actual DOM order and FLIP measurements.

## Source evidence
Opened 2026-09-06:
- https://developer.mozilla.org/en-US/docs/Web/API/Animation/pause — pauses the animation; unresolved currentTime plus infinite end time may throw.
- https://developer.mozilla.org/en-US/docs/Web/API/Animation/currentTime — read/write animation time in milliseconds, whether running or paused.
- https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ — one active panel, keyboard movement and selected/tabindex management. This is interaction guidance, not a claim of screen-reader certification.

## A verdict
Descartes: PASS, no boundary blockers. Five recognized IDs replace stage and own controls; null preserves generic stage. Disposal starts before old DOM replacement, because onModalOpen occurs after rendering.

## Review synthesis
Archimedes wp2 review FAIL: one Medium blocker in main-authored reusable FLIP CSS. `.is-inverting` specificity exceeded the reduced-motion reset, leaving its translation active if preference changed mid-inversion. Accepted; both snippet.css and reducedMotion.css now include the explicit `.is-inverting` selector. Runtime demo uses WAAPI and already cancelled effects, but the exported recipe independently needed this fix. No cross-blocker conflict; re-audit same reviewer after targeted browser activation.

## Render-discovered correction
Inspected mobile disclosure screenshot revealed the easing SVG rendered as a black filled wedge. Computed styles confirmed curve/control paths had fill:black and stroke:none: renderer classes lacked styling. Added scoped no-fill, curve/control/grid strokes and endpoint fill in existing motion.css. This corrects the actual curve diagram inside the affected motion guide. Follow-up captures wait for modal opening transitions to finish; earlier translucent captures were intermediate frames, not final visual proof.

## Fresh evidence
check-motion.mjs passed: actual animation time73.336ms and transform were identical across pause frames; replay time0; manual pause survives real Chrome tab activation and live reduced preference. Five controls changed DOM/ARIA as intended, missing-IntersectionObserver fallback exposed all five items, double dispose removed effects/listeners. evidence/motion-qa.json records results.
Main inspected stable desktop progress and mobile tabs/disclosure/scroll/reorder captures. Easing curves now render as stroked curves rather than wedges. All five specimens fit 390/1440; reorder also tested320/768/1024. flip-reduced-css.json proves standalone recipe inversion resets with reduced preference. Archimedes re-audit PASS for specificity fix and curve styling.
