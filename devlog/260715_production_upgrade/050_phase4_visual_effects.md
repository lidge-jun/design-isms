# 050 — Expand the Visual Effect Catalog from 46 to 64

## Outcome

Add eighteen high-demand visual-effect references across six families: scroll/parallax, text motion, hero/background, cursor/pointer, view transitions, and micro-interactions. Each addition ships as a complete unit: data entry, unique demo registry entry, CSS/JS behavior, detailed documentation, original guide image, and WebP preview.

```text
Effects:              46 → 64
Effect docs:          46 → 64
Demo registry types:  46 → 64
Guide PNG originals:  46 → 64
Guide WebP previews:  46 → 64
```

## Dependencies

- **Requires:** Phase 020 shared shell, responsive header, and modal/a11y baseline.
- **Requires:** Phase 030 image audit/thumbnail tooling.
- **Independent of:** Phase 040’s content work after the shared prerequisites, but the documentation commit after both should report 49/64.
- **Blocks:** Phase 060 effect snippets and Phase 080 final count/asset verification.

## API/platform basis

Use CSS/native platform features as progressive enhancement, never as the only way to understand a demo. Scroll timelines can drive animations from scroll progress, while View Transition APIs can enhance state/page changes where supported. Static or time-based fallbacks remain required. [Source: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations] [Source: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API] [Source: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition]

Animation work should prefer `transform` and `opacity`, avoid layout-triggering properties, and respect reduced-motion preferences. [Source: https://web.dev/articles/animations-guide] [Source: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion]

## File operations

| Marker | Exact path | Purpose |
|---|---|---|
| **NEW** | `src/effects-filters.ts` | Classic namespace for family/device filter state and rendering. |
| **NEW** | `assets/js/effects-filters.js` | Committed generated script loaded before `effects.js`. |
| **NEW** | `src/effects-interactions.ts` | Delegated pointer/click/visibility behavior for demos; no per-card global listeners. |
| **NEW** | `assets/js/effects-interactions.js` | Committed generated script loaded before `effects.js`. |
| **NEW** | `assets/css/effects-demos-patterns.css` | Existing 46 interface-pattern demo CSS moved out of the near-limit candidate file. |
| **NEW** | `scripts/verify-effects.mjs` | Effects data/docs/demo-registry/family validator backing the new `verify:effects` script. |
| **NEW** | eighteen `assets/images/effects/{new-id}/guide.png` files | Accepted `1536×1024` originals. |
| **NEW** | eighteen mirrored `assets/images/thumbs/effects/{new-id}/guide.webp` files | Generated `768×512` previews. |
| **MODIFY** | `assets/data/effects.json` | Backfill `family` on 46 entries and append 18 entries. |
| **MODIFY** | `assets/data/effects-docs.json` | Append eighteen complete documentation records. |
| **MODIFY** | `src/effects-demos.ts` | Add eighteen literal types and unique render cases. |
| **MODIFY** | `assets/css/effects-demos-candidates.css` | Retain only the eighteen new visual-effect demos; keep below 500 lines. |
| **MODIFY** | `src/effects.ts` | Delegate filtering/interactions and shrink from 493 to ≤450 lines; keep parsing/render orchestration only. |
| **MODIFY** | `assets/css/effects.css` | Family filter controls, capability labels, demo/reduced-motion states. |
| **MODIFY** | `effects.html` | Add filter mounts, load new CSS/scripts, update all 46 counts to 64. |
| **MODIFY** | `index.html` | Update any cross-catalog 46 references only. |
| **MODIFY** | `faq.html` | Update any cross-catalog 46 references only. |
| **MODIFY** | `assets/data/faq.json` | (Created by Phase 020.) Update cross-catalog 46 references inside answers only. |
| **MODIFY** | `scripts/audit-effect-guides.mjs` | Read expected count from data; report 64 after additions. |
| **MODIFY** | `package.json` | Add `verify:effects`; include it in `verify`. |
| **MODIFY** | `README.md`, `AGENTS.md`, `structure/README.md` | Update 49/64 counts, schema, scripts, and file map. |
| **DELETE** | existing 46-pattern rules from `effects-demos-candidates.css` | Move byte-for-byte to `effects-demos-patterns.css` before adding new rules. |

No existing effect ID is renamed or removed.

## 1. Add a discovery family separate from device category

The existing `category` field means `Mobile`, `Desktop`, or `Shared`. Do not overload it with visual-effect families. Add:

```ts
type EffectFamily =
  | 'Interface Pattern'
  | 'Scroll & Parallax'
  | 'Text Motion'
  | 'Hero & Background'
  | 'Cursor & Pointer'
  | 'View Transition'
  | 'Micro-interaction';
```

Data migration:

```diff
 {
   "id": "bottom-sheet",
+  "family": "Interface Pattern",
   "category": "Mobile",
   ...
 }
```

Backfill all original 46 with `family: "Interface Pattern"`. Every new entry uses one of the other six exact strings. `category` remains one of `Mobile | Desktop | Shared`.

`effects.html` toolbar:

```diff
 <section class="effects-toolbar" aria-label="Effect filters">
-  <div class="effects-filter-row" id="effects-filter-row"></div>
+  <div class="effects-filter-group">
+    <span class="effects-filter-label">Family</span>
+    <div class="effects-filter-row" id="effects-family-filter" role="group" aria-label="Effect family"></div>
+  </div>
+  <div class="effects-filter-group">
+    <span class="effects-filter-label">Device</span>
+    <div class="effects-filter-row" id="effects-device-filter" role="group" aria-label="Device fit"></div>
+  </div>
   <label ...><input ... id="effects-search"></label>
 </section>
```

`EffectsFilters` namespace contract:

```ts
namespace EffectsFilters {
  export interface State { family: string; device: string; query: string; }
  export function create(effects: readonly FilterableEffect[], onChange: (state: State) => void): Controller;
}
```

- default `family='all'`, `device='all'`;
- preserve filters in URL query parameters `?family=...&device=...&q=...` using `history.replaceState`;
- restore valid values on load; ignore unknown values;
- buttons use `aria-pressed`, not `aria-current`;
- result text says `18 of 64 effects` or localized equivalent;
- search matches ID, both names, summary, aliases, family, and best-for terms;
- no results state includes a reset button.

## 2. Exact eighteen-effect manifest

| ID | Family | Device | Trigger/state demonstrated | Required fallback |
|---|---|---|---|---|
| `scroll-progress-indicator` | Scroll & Parallax | Shared | Reading progress drives a top/side meter | Static meter plus numeric label |
| `layered-parallax` | Scroll & Parallax | Shared | Fore/mid/background layers move at restrained ratios | Fixed layered composition |
| `horizontal-scroll-gallery` | Scroll & Parallax | Shared | Vertical/track interaction reveals a horizontal sequence | Native horizontal scroll with snap |
| `split-text-reveal` | Text Motion | Shared | Words/lines reveal in staggered clipped groups | Fully visible text |
| `text-scramble` | Text Motion | Shared | Temporary character substitution resolves to label | Immediate final label |
| `number-ticker` | Text Motion | Shared | Metric rolls from prior to current value | Final value with no animation |
| `aurora-mesh-background` | Hero & Background | Shared | Low-frequency layered gradients drift behind content | Static mesh gradient |
| `spotlight-grid-background` | Hero & Background | Desktop | Pointer/focus position reveals a local grid highlight | Centered static spotlight on coarse/no pointer |
| `grain-noise-drift` | Hero & Background | Shared | Tiny translated noise texture prevents banding/sterility | Static low-opacity grain |
| `magnetic-button` | Cursor & Pointer | Desktop | Fine pointer draws button content toward cursor | Standard hover/focus state |
| `cursor-trail` | Cursor & Pointer | Desktop | Short-lived trail samples pointer movement | No trail; native pointer unchanged |
| `tilt-hover-card` | Cursor & Pointer | Desktop | Pointer position rotates card within strict bounds | Border/focus highlight, no tilt |
| `crossfade-view-transition` | View Transition | Shared | Two content states crossfade | Immediate state swap |
| `shared-element-transition` | View Transition | Shared | Thumbnail/title appears continuous into detail | Crossfade or immediate swap |
| `route-wipe-transition` | View Transition | Shared | Directional mask separates route-like states | Immediate route/state swap |
| `favorite-burst` | Micro-interaction | Shared | Favorite toggle emits restrained radial particles | Icon/state change only |
| `success-checkmark` | Micro-interaction | Shared | Completion path draws after successful action | Immediate success icon and text |
| `copy-confirmation` | Micro-interaction | Shared | Copy control changes label/icon then resets | Persistent live-region confirmation |

`effect.id === effect.demo.type` must hold verbatim for every row.

## 3. Data entry specification

Representative entry:

```json
{
  "id": "magnetic-button",
  "name": "Magnetic Button",
  "nameKr": "마그네틱 버튼",
  "family": "Cursor & Pointer",
  "category": "Desktop",
  "priority": "P1",
  "summary": "A fine-pointer enhancement that shifts button content slightly toward the pointer without moving its hit target.",
  "alsoCalled": ["magnetic hover", "cursor attraction", "끌리는 버튼"],
  "bestFor": ["single hero CTA", "portfolio navigation", "high-attention action"],
  "avoidWhen": ["dense toolbars", "touch-first flow", "precision-sensitive controls"],
  "implementation": ["Keep the semantic button and hit box stationary.", "Clamp inner transform to 6px and reset on pointerleave."],
  "accessibility": ["Preserve keyboard focus styling.", "Disable movement for reduced motion and non-fine pointers."],
  "performance": ["Batch pointer updates in one animation frame.", "Animate only transform on the inner span."],
  "demo": { "type": "magnetic-button", "label": "Pointer attraction with a fixed hit target" },
  "guide": { "file": "guide.png", "alt": "...", "prompt": "..." }
}
```

Minimum arrays per new entry:

```text
alsoCalled >= 3
bestFor >= 3
avoidWhen >= 2
implementation >= 2
accessibility >= 2
performance >= 2
```

Writing rules:

- explain the interaction’s purpose before its visual novelty;
- state when not to use it;
- never imply hover as the only affordance;
- identify whether support is progressive, simulated, or native;
- avoid unqualified “GPU accelerated,” “zero cost,” or browser-support claims;
- include a visible status/label for feedback effects, not animation alone.

## 4. Detailed docs contract

Add one `effects-docs.json` key per new ID with the existing fields:

```text
background, history, useWhen, examples, anatomy, misuse,
implementationNotes, researchRefs
```

Additional quality gates:

- `background`: 2–4 sentences defining the user problem and effect;
- `history`: distinguish older technique from current web API support;
- `useWhen`: 3–5 concrete contexts;
- `examples`: three scenario descriptions, not brand claims;
- `anatomy`: 4–8 named parts/states;
- `misuse`: at least three failure cases;
- `implementationNotes`: include progressive enhancement, reduced motion, and cleanup;
- `researchRefs`: at least two HTTPS references; at least one primary/official source for web APIs or accessibility.

Required reference mapping:

| Effects | Minimum official reference |
|---|---|
| three scroll effects | MDN scroll-driven animations and/or Intersection Observer docs |
| three view transitions | MDN View Transition API and `@view-transition` docs |
| pointer effects | Pointer Events and `matchMedia('(pointer: fine)')` references |
| all motion effects | reduced-motion reference |
| copy confirmation | Clipboard API plus live-region/accessibility reference |

Do not claim the View Transition API is universally supported; the demo must expose its fallback behavior.

## 5. Demo registry and markup

Append all eighteen IDs to `EffectsDemos.demoTypes` and add one explicit switch case each. No shared alias is allowed even when markup helpers are reused.

```diff
 export const demoTypes = [
   ...,
-  'notification-center'
+  'notification-center',
+  'scroll-progress-indicator',
+  ...,
+  'copy-confirmation'
 ] as const;
```

Representative cases:

```ts
case 'scroll-progress-indicator':
  return '<div class="demo-scroll-track"><div class="demo-scroll-progress"></div></div><article class="demo-scroll-copy"><i></i><i></i><i></i></article>';
case 'magnetic-button':
  return '<button class="demo-magnetic" type="button"><span>Open</span></button>';
case 'copy-confirmation':
  return '<button class="demo-copy-confirm" type="button"><span>Copy</span></button><span class="sr-only" aria-live="polite"></span>';
```

Even demo controls must be semantically valid. Decorative shapes use `aria-hidden="true"`; buttons require readable labels.

Modify `readDemo` in `src/effects.ts`:

```diff
 if (!EffectsDemos.isDemoType(type)) throw ...;
+if (type !== effectId) {
+  throw new Error(`${effectId}.demo.type must equal id; received ${type}`);
+}
```

## 6. Split CSS before adding rules

Current `effects-demos-candidates.css` is already close to the 500-line constraint. Move all existing 46 candidate-specific rules to:

```text
assets/css/effects-demos-patterns.css
```

Then rebuild `effects-demos-candidates.css` with only shared primitives for the new families and eighteen new demos. Both authored files must stay below 500 lines.

Load order:

```diff
 <link rel="stylesheet" href="./assets/css/effects-demos.css?...">
+<link rel="stylesheet" href="./assets/css/effects-demos-patterns.css?...">
 <link rel="stylesheet" href="./assets/css/effects-demos-candidates.css?...">
```

CSS requirements:

- namespace all selectors under `.effect-demo` or a unique `.demo-*` class;
- no global `button`, `i`, `span`, or `body` selectors;
- only `transform`/`opacity` for continuous animation; clip/mask may be used for bounded reveal;
- no `filter: blur()` animation, layout-changing width/height loops, or endless large-area paint;
- infinite ambient animations pause when the card is outside the viewport;
- reduced motion sets animation duration to near-zero or removes it and shows the final state;
- `@supports` gates `animation-timeline`, `view-transition-name`, masks, and other optional features;
- coarse/no-hover media disables pointer-following effects.

## 7. Delegated interaction controller

`src/effects-interactions.ts` compiles to the classic namespace `EffectsInteractions`:

```ts
namespace EffectsInteractions {
  export function mount(root: HTMLElement): Controller;
  export interface Controller { refresh(): void; destroy(): void; }
}
```

Implementation rules:

- one delegated `pointermove`, `pointerleave`, and `click` listener on the effects grid;
- activate pointer effects only when `matchMedia('(hover: hover) and (pointer: fine)')` matches;
- one pending `requestAnimationFrame` maximum; drop duplicate pointer events until it runs;
- clamp magnetic translation to 6px and card tilt to 4deg;
- cursor trail pool at most eight nodes; reuse nodes and hide them after 450ms;
- no custom cursor replacement and no `cursor: none`;
- `IntersectionObserver` toggles `.is-demo-active` so ambient loops pause off-screen;
- click-triggered demos can replay without opening the effect modal only when the click target has `data-demo-action`; other card clicks retain modal behavior;
- remove listeners/observers in `destroy()` and before grid rerender;
- dispatch a custom `effect-demo-statechange` event for Phase 080 tests, not for application logic.

`src/effects.ts` calls `refresh()` after filter rerenders and never creates one controller per card.
Move existing filter/search/query-state ownership into `effects-filters.ts` before adding the
family axis. This split is mandatory: `effects.ts` starts at 493 lines and may not absorb the
new responsibility.

Top-level evaluation contract: `effects-filters.js` and `effects-interactions.js` load BEFORE
`effects-demos.js` in the page order, so neither namespace may reference `EffectsDemos` (or any
later namespace) during top-level evaluation. All cross-namespace access happens inside
functions invoked by `effects.js` after every classic script has evaluated. Violations must
throw an explicit initialization error, not fail silently.

## 8. Guide image set

Create exactly these original paths, each with `guide.png`, plus mirrored previews:

```text
assets/images/effects/scroll-progress-indicator/guide.png
assets/images/effects/layered-parallax/guide.png
assets/images/effects/horizontal-scroll-gallery/guide.png
assets/images/effects/split-text-reveal/guide.png
assets/images/effects/text-scramble/guide.png
assets/images/effects/number-ticker/guide.png
assets/images/effects/aurora-mesh-background/guide.png
assets/images/effects/spotlight-grid-background/guide.png
assets/images/effects/grain-noise-drift/guide.png
assets/images/effects/magnetic-button/guide.png
assets/images/effects/cursor-trail/guide.png
assets/images/effects/tilt-hover-card/guide.png
assets/images/effects/crossfade-view-transition/guide.png
assets/images/effects/shared-element-transition/guide.png
assets/images/effects/route-wipe-transition/guide.png
assets/images/effects/favorite-burst/guide.png
assets/images/effects/success-checkmark/guide.png
assets/images/effects/copy-confirmation/guide.png
```

Each guide must show at least three labeled states: **trigger/context**, **transition rule**, and **result/fallback**. A still image must explain time by frames, paths, arrows, or state labels; do not submit an attractive hero screenshot that fails to teach the effect.

Use the Phase 030 prompt, manifest, review rubric, and thumbnail command. Add the eighteen review rows to a new file:

```text
devlog/effects-guide-audit/new-effects-guide-audit.csv
```

Do not modify the historical 46-row baseline CSV.

## 9. Count propagation

After all 64 entries and assets pass:

```diff
-effects.html description/OG/Twitter: 46
-effects.html header: 46 candidates
-effects intro: 46 patterns
+effects.html description/OG/Twitter: 64
+effects.html header: 64 effects
+effects intro: 64 patterns
```

Update `README.md`, `AGENTS.md`, `structure/README.md`, index cross-copy, and FAQ references to **49 ISMs / 64 effects**. Search:

```bash
git grep -nE '46(개| candidates| effects| patterns)|guide.*46|UI candidates.*46'
```

Only clearly labeled historical/baseline notes may remain.

## 10. Validator specification

Add the standalone `scripts/verify-effects.mjs` (NEW, per File operations; the `verify:effects` package script requires this exact path). It must report:

```text
effects ok: 64 entries, 64 docs, 64 demos, 64 png, 64 webp, 7 families
```

Checks:

- exact key/count parity across `effects.json`, `effects-docs.json`, and `EffectsDemos.demoTypes`;
- exact `id === demo.type` for all 64;
- IDs unique and kebab-case; families/categories from the fixed enums;
- original 46 retain IDs and device categories;
- exact eighteen new IDs exist and use expected family/device pairs;
- every new content array meets minimum length;
- every doc has complete fields and 2+ valid research refs;
- every guide pair exists with required format/dimensions/freshness;
- no duplicate guide hashes;
- every touched authored TS/CSS file is `<= 500` lines; `src/effects.ts <= 450`;
- generated JS exists and is current after `npm run build`.

`package.json`:

```diff
+"verify:effects": "node scripts/verify-effects.mjs",
 "verify": "npm run typecheck && npm run build && npm run verify:nav && npm run verify:isms && npm run verify:effects"
```

## Acceptance criteria

Run:

```bash
npm ci
npm run images:thumbs -- --scope effects
npm run images:audit
npm run verify
```

Expected tail:

```text
assets ok: 64 effect png, 64 effect webp, 0 invalid, 0 stale, 0 orphan
effects ok: 64 entries, 64 docs, 64 demos, 64 png, 64 webp, 7 families
```

Browser acceptance at 1440, 1180, 1024, 860, 640, and 390 widths:

- header and intro say 64, result count starts at `64 of 64 effects`;
- family and device filters combine correctly and survive reload via query string;
- each new card has a distinct animated/static demo, modal, docs, and guide;
- demos remain understandable with JavaScript-disabled animation, unsupported APIs, coarse pointer, and reduced motion;
- pointer demos never move the actual hit target or hide the system cursor;
- view-transition demos swap content without error in unsupported browsers;
- keyboard users can trigger interactive demos and open/close the modal;
- no horizontal overflow, frame-rate-blocking loop, console error, unhandled promise, or broken guide image.

Manual differentiation check: hide names and verify reviewers can distinguish all three members within each new family from their visual/state sequence. Any pair that appears interchangeable must be redesigned before merge.

## Completion handoff

Stage the 18 data/docs/demo additions, CSS split, interaction/filter scripts and generated
JS, 18 original/preview pairs, validators, and 64-count updates as one reviewed phase set.
The user has authorized phase commits for this loop. Phase 060 may assume a stable, validated
64-ID registry and must produce one snippet record per ID.
