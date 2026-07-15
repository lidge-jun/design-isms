# 011 — Frontend Implementation Standards

## Purpose

These are normative constraints for Phases 020–080. A later phase may be visually complete only when it also satisfies these standards. When a phase document and this document conflict, use the stricter requirement unless the phase records an explicit, tested exception.

## Dependencies

- Depends on `010_design_direction.md` for visual intent.
- All later phase documents depend on this file.

## File operations

This standards phase is a specification, not an independent production patch. The following future paths enforce it:

| Marker | Path | Enforcement role |
|---|---|---|
| NEW (020) | `scripts/verify-nav.mjs` | Six-axis nav structure and order. |
| NEW (030) | `scripts/audit-effect-guides.mjs` | Guide dimensions, pairing, freshness, quality manifest. |
| NEW (050) | `src/effects-filters.ts` | Typed family/device filtering outside the 493-line consumer. |
| NEW (050) | `src/effects-interactions.ts` | Pointer-safe demo behavior and teardown. |
| NEW (060) | `src/app-export.ts` | Shared escaping, clipboard fallback, token/snippet rendering. |
| NEW (070) | `src/finder.ts` | Deterministic, accessible recommendation logic. |
| NEW (080) | `scripts/verify-content.mjs` | Cross-file IDs, counts, schemas, URLs, exact demo equality. |
| NEW (080) | `scripts/verify-assets.mjs` | Exact PNG/WebP inventory and dimensions. |
| NEW (080) | `tests/site.spec.ts` | Browser, keyboard, overflow, console, copy, and reduced-motion checks. |
| MODIFY | `package.json` | Expose all checks through stable npm scripts. |
| MODIFY | `.github/workflows/deploy.yml` | Make deploy depend on build, data, asset, and browser QA. |
| DELETE | none | No standard requires deleting a public route or data set. |

## 1. Runtime architecture

### 1.1 Static, classic-script contract

- HTML, CSS, JSON, and compiled JavaScript remain directly hostable by GitHub Pages; browser scripts remain non-module/classic scripts.
- Do not add `type="module"`, dynamic imports, bundlers, JSX, a framework runtime, or a client-side router.
- Author TypeScript in `src/`; compile to `assets/js/`; commit both source and generated browser files.
- Each classic script exposes one intentionally named namespace when cross-file use is required:
  - `DesignExport`
  - `DesignFinder`
  - `EffectsFilters`
  - `EffectsInteractions`
  - existing `EffectsDemos` and `EffectsDocs`
- Script dependency order is explicit in HTML and covered by browser tests.

Representative load order:

```html
<script src="./assets/js/app-export.js"></script>
<script src="./assets/js/finder.js"></script>
<script src="./assets/js/app.js"></script>
```

```html
<script src="./assets/js/app-export.js"></script>
<script src="./assets/js/effects-filters.js"></script>
<script src="./assets/js/effects-interactions.js"></script>
<script src="./assets/js/effects-demos.js"></script>
<script src="./assets/js/effects-docs.js"></script>
<script src="./assets/js/effects.js"></script>
```

### 1.2 File-size and ownership limits

- Every **new authored file** must be below 500 physical lines.
- `src/app.ts` may remain at its 1,342-line baseline through wp2, then must reach ≤1,050
  in wp3 when the embedded guide map is extracted.
- `src/effects.ts` should end below its current 493 lines after filters/interactions/export code are extracted.
- `assets/css/style.css` should not grow beyond its current 992 lines; new visual systems go into dedicated files.
- Generated JS line count is not used as an architecture metric, but generated output must be deterministic.
- A file near 450 lines may not absorb another independent concern; split before crossing the limit.

### 1.3 Data is the source of truth

Do not derive public counts from hardcoded constants in JavaScript. Rendered counts may come from loaded data, while static SEO/nav text must be verified against data during CI.

Phase-gated invariants (validators derive expected counts from data; these numbers document
the transition and are never hardcoded into reusable validator logic):

```text
baseline/wp1/wp2: isms = guides = 43; effects = docs = demos = 46
after wp3: isms = guides = 49; effects = docs = demos = 46
after wp4: isms = guides = 49; effects = docs = demos = 64
after wp5: effects = docs = demos = snippet keys = 64
for every effect: id = demo.type
FAQ item count = 18
```

JSON parsers must reject:

- duplicate IDs;
- unknown enum values;
- missing/extra guide keys;
- non-HTTPS example URLs except explicitly documented local/demo URLs;
- image paths with traversal or filename mismatch;
- empty arrays where the UI expects content;
- untrusted strings inserted into HTML without escaping.

## 2. Responsive standards

### 2.1 Canonical breakpoints

| Width | Meaning | Required behavior |
|---:|---|---|
| `>1440px` | Wide canvas | Content caps at 1440px; whitespace grows outside the canvas. |
| `1180px` / `860px` | Existing effects content breaks | Preserve until Phase 020 render evidence justifies consolidation. |
| `1024px` | Tablet/small desktop | 12-column layouts reduce card spans; split views may narrow. |
| `640px` | Mobile layout | Single-column content, stacked modal/workbench, compact toolbar. |
| `390px` | QA viewport, not a new design token | Must pass header, search, dialog, and overflow tests. |

A defensive `520px` media query may remain for the six-axis nav, but new feature layout decisions must use 1024/640 unless a documented content break proves otherwise.

### 2.2 Overflow rules

- `document.documentElement.scrollWidth <= window.innerWidth` at 1440, 1180, 1024,
  860, 640, and 390 widths for all pages and open modal states.
- No fixed-width code panel may force page overflow; code blocks scroll internally.
- Grid children use `min-width: 0`.
- Search inputs use `min(100%, …)` and must not expand width on focus at 640px or below.
- Sticky-header height is content-driven on wrapped layouts; never combine fixed height with multi-row children.

## 3. Accessibility standards

### 3.1 Target size and spacing

WCAG 2.2 AA requires pointer targets to be at least 24×24 CSS pixels or receive sufficient spacing. This project adopts a stricter **44×44 preferred interactive box** for primary touch controls and never goes below the WCAG minimum for custom controls. [Source: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html]

- Nav links, language toggle, modal close, copy buttons, finder choices, and FAQ controls: minimum 44px block size on mobile.
- Small inline source links may use the inline-text exception.
- Visible icon size and active target size are separate; a 16px icon can sit inside a 44px button.

### 3.2 Keyboard and focus

- Every interactive element is reachable in DOM order without positive `tabindex`.
- `:focus-visible` must remain clearly visible against both paper and image-rich surfaces.
- Do not remove outlines unless replaced with a focus indicator of at least comparable area and contrast.
- Opening a modal stores the trigger, moves focus into the dialog, traps Tab/Shift+Tab, closes on Escape, and restores the trigger.
- Hidden tabs/panels are removed from the tab sequence.
- Every page exposes a skip link to `#main-content`.
- Sticky chrome may not obscure focused content; verify offsets at wrapped mobile header
  height rather than a desktop constant.

[Source: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html]
[Source: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/]

### 3.3 Semantics and announcements

- Modal containers use `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
- FAQ questions are `<button>` elements with `aria-expanded` and `aria-controls`; answers have stable IDs and `hidden` or equivalent semantic state.
- Finder questions use `<fieldset>` and `<legend>`; results use `aria-live="polite"` only after user submission.
- Copy feedback uses a polite status region, not focus theft.
- Icon-only buttons have accessible names; decorative SVGs use `aria-hidden="true"` and `focusable="false"`.
- Color is never the sole carrier of kind, score, warning, or selected state.

### 3.4 Contrast

- Normal body text meets 4.5:1; large text meets 3:1.
- Focus and UI component boundaries meet applicable non-text contrast requirements.
- Exported palettes are labeled “starter tokens” and show warnings when generated foreground/background pairs fail 4.5:1; the tool must not falsely claim compliance.

[Source: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html]

### 3.5 Motion

- `prefers-reduced-motion: reduce` must remove or replace non-essential scale, parallax, cursor trails, wipes, and long panning.
- Reduced mode shows the final content state immediately; it does not set important content to permanent opacity zero.
- Pointer effects only bind when `(hover: hover) and (pointer: fine)`.
- Repeated/ambient animation pauses when its card is outside the viewport or the document is hidden.
- Every effect demo has a reduced-motion assertion proving an informative static end state.

[Source: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion]

## 4. Anti-slop standards

A change fails review when it relies on generic polish instead of a specific information purpose.

### 4.1 Forbidden defaults

- Emoji as UI/category icons.
- Sparkle/magic-wand iconography for ordinary functionality.
- Purple/blue gradient as a default “AI” background.
- Rounded pill treatment for every control and label.
- Equal three-card rows used regardless of content hierarchy.
- Decorative floating blobs, glows, or glass panels without a demonstrated semantic role.
- Generic headings such as “Unlock the power of design” or unsupported “X% better” claims.
- Placeholder testimonial, fake metric, fake company, or invented research copy.
- AI images with gibberish text accepted as guide assets.

### 4.2 Required design rationale

Every new visual effect or component must answer in its phase review:

1. What user decision does this visual treatment support?
2. What is the static/reduced-motion fallback?
3. What existing project pattern does it replace rather than duplicate?
4. What evidence distinguishes it from a fashionable but inaccessible decoration?

### 4.3 AI-generated content review

- Generated images are drafts, never automatic approvals.
- Human review checks anatomy, legible labels, truthful UI state, unique composition, and consistency with the named style/effect.
- “AI Slop” is represented as a diagnostic anti-pattern with an explicit warning. It is excluded from normal Style Finder recommendations.
- No page claims a fixed “human editing percentage” creates copyright protection; the U.S. Copyright Office frames copyrightability around human authorship, not a numeric threshold. [Source: https://www.copyright.gov/ai/]

## 5. Performance standards

### 5.1 Network and code budgets

- No new production runtime dependency or framework.
- No new font request.
- PNG originals never load in a grid/card view.
- Images below the first viewport use `loading="lazy"` and explicit width/height or `aspect-ratio`.
- New JSON bundles over 25KB are lazy-loaded on first modal/tool use; `effects-snippets.json` must not block the catalog.
- Target uncompressed CSS+JS budget:
  - index page dependencies: ≤220KB;
  - effects page dependencies: ≤260KB;
  - FAQ page dependencies: ≤120KB.
- If a budget is exceeded, record the measured baseline and remove/defer code before release; do not silently relax the budget.

### 5.2 Animation cost

- Prefer `transform` and `opacity` for animated movement.
- Do not blanket-apply `will-change`; add immediately before a short interaction and remove afterward when JavaScript is involved.
- Avoid animating layout properties on scroll.
- Use `IntersectionObserver`, CSS timelines, or one coalesced `requestAnimationFrame` loop; never one scroll listener per card.
- Cap particle/trail DOM nodes and destroy them after animation.

[Source: https://web.dev/articles/animations-guide]

### 5.3 Rendering stability

- Reserve image aspect ratios to avoid layout shift.
- Modal opening must not move the underlying document horizontally when scroll locking is applied.
- Finder results reuse existing card/modal data rather than duplicate heavy image markup.
- Long code snippets render as escaped text, not nested syntax-highlighting dependencies.

## 6. Security and robustness

- Treat JSON strings and snippet content as untrusted at rendering boundaries; escape text and attributes.
- Use `textContent` for copied/generated code previews whenever possible.
- External links use `target="_blank" rel="noopener noreferrer"`.
- Validate URLs with `new URL()` and allow only `https:` for public examples/sources.
- Clipboard writes catch rejection and fall back to a temporary textarea/select/`execCommand('copy')` path; success is announced only after a confirmed copy.
- Local storage reads are wrapped against invalid values and storage exceptions.
- Event listeners on modal/demo content are scoped and cleaned up between renders to prevent duplicate handlers.

[Source: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText]

## 7. Content standards for novices

Every ISM and effect should teach a decision, not only define a term.

Required novice-facing pattern:

```text
What it is → What it changes visually → Use it when → Avoid it when
→ Small implementation recipe → Accessibility/performance caveat → Copyable starter
```

- Define jargon on first use.
- Use concrete page/component examples.
- Separate historical fact from current recommendation.
- Cite volatile or legal claims with a source and date.
- Avoid absolute language such as “always,” “standard,” or “guaranteed” unless a normative source supports it.
- Examples must be live sites verified near release; dead or redirected examples are replaced.

## 8. Verification standard

Each phase must provide:

1. a path manifest with `NEW`, `MODIFY`, `DELETE` markers;
2. representative diffs or complete schema/content specifications;
3. automated command(s) with expected output;
4. a desktop and 390px manual/browser check when UI changes;
5. explicit dependency and rollback notes.

Final release cannot rely only on `npm run build`. Phase 080 makes the following one release gate:

```bash
npm ci
npm run verify
npm run qa:e2e
npm run pages:stage
```

Expected hard failures include count drift, missing pair assets, `demo.type !== id`, stale generated JS, navigation-axis mismatch, console errors, overflow, inaccessible dialogs, and broken copy controls.

`verify:effects` also proves every effect id has a dedicated registry branch and an
identifiable CSS selector/keyframe; mapping a new id back to an original seed animation is
a hard failure. Generated parity is checked after build with a clean index or equivalent
temporary-output comparison, never assumed from `tsc` exit 0 alone.

## Representative standards diff

```diff
 "scripts": {
-  "verify": "npm run typecheck && npm run build"
+  "verify": "npm run typecheck && npm run build && npm run verify:generated && npm run verify:content && npm run verify:nav && npm run verify:assets && npm run verify:snippets",
+  "qa:e2e": "playwright test",
+  "pages:stage": "node scripts/stage-pages.mjs"
 }
```

The exact package manifest change lands in Phase 080 after each referenced script exists.

## Acceptance criteria

- Every later plan references this standards document.
- No proposed new file exceeds 500 lines in the implementation design.
- All proposed controls have keyboard, focus, motion, and touch behavior specified.
- All proposed effect families have reduced-motion and non-fine-pointer fallbacks.
- Count and asset invariants are machine-verifiable rather than checklist-only.
- No planned FAQ or UI copy preserves fabricated numerical claims.
- `src/app.ts` has a documented net-zero or net-negative line strategy before export/finder hooks are added.

## References

- WCAG target size: [Source: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html]
- WCAG focus appearance: [Source: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html]
- WCAG contrast: [Source: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html]
- ARIA modal dialog pattern: [Source: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/]
- Reduced motion: [Source: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion]
- Animation performance: [Source: https://web.dev/articles/animations-guide]
- Clipboard API: [Source: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText]
