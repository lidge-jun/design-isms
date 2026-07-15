# 060 — Style-to-Code Export and Effect Code Snippets

## Outcome

Turn the reference catalog into an implementation bridge:

- every one of the 49 ISM modals can copy **CSS custom properties**, **Tailwind CSS v4 `@theme`**, and **JSON design tokens** derived deterministically from `isms.json` plus `dev-guides.json`;
- every one of the 64 effect modals can copy runnable, dependency-free **HTML and CSS**, with JavaScript only where the interaction requires it;
- copy controls work on GitHub Pages HTTPS and degrade cleanly during local development;
- `src/app.ts` remains at or below the Phase 040 target of 1,050 lines; export logic stays extracted.

Counts do not change in this phase: **49 ISMs / 64 effects**.

## Dependencies

- **Requires:** Phase 040’s 49 complete ISM/guide records and single guide source.
- **Requires:** Phase 050’s stable 64 effect IDs and demo registry.
- **Blocks:** Phase 070 prompt-pack tab integration and Phase 080 snippet/clipboard tests.

Tailwind’s `@theme` syntax is version-specific; label the output as Tailwind CSS v4 rather than implying compatibility with older config files. [Source: https://tailwindcss.com/docs/theme]

Use the Design Tokens Community Group format conventions (`$type`, `$value`, groups) and verify the exact current draft during implementation. [Source: https://www.designtokens.org/tr/drafts/format/]

The asynchronous Clipboard API is available in secure contexts; GitHub Pages satisfies that requirement, while local/file contexts need an explicit fallback and visible failure state. [Source: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText]

## File operations

| Marker | Exact path | Purpose |
|---|---|---|
| **NEW** | `src/app-export.ts` | Classic `DesignExport` namespace: token derivation, tabs, snippet loading, and copy behavior; under 500 lines. |
| **NEW** | `assets/js/app-export.js` | Committed TypeScript output, loaded before both page controllers. |
| **NEW** | `assets/css/export.css` | Shared export/code-panel styles; under 420 lines. |
| **NEW** | `assets/data/effects-snippets.json` | Compact 64-key snippet source; formatted below 500 lines. |
| **NEW** | `scripts/verify-snippets.mjs` | Cross-checks IDs, required languages, scope, size, and unsafe constructs. |
| **MODIFY** | `index.html` | Load export CSS/script before `app.js`. |
| **MODIFY** | `effects.html` | Load export CSS/script before `effects.js`. |
| **MODIFY** | `src/app.ts` | Add ISM export mount and pass the loaded guide; no token-generation logic here. |
| **MODIFY** | `src/effects.ts` | Add effect code mount; lazy-load snippets through `DesignExport`. |
| **MODIFY** | `assets/css/style.css` | Remove any duplicate prompt/copy styling superseded by `export.css`. |
| **MODIFY** | `assets/css/effects.css` | Reserve modal placement for the shared code panel only. |
| **MODIFY** | `package.json` | Add `verify:snippets`; append to `verify`. |
| **MODIFY** | `README.md` | Document formats, Tailwind version, snippet limitations, and copy behavior. |
| **MODIFY** | `AGENTS.md` | Require one snippet key per effect and escaped code rendering. |
| **MODIFY** | `structure/README.md` | Add export source/data/generated files. |
| **DELETE** | direct palette clipboard listener from `src/app.ts` | Route all copy operations through `DesignExport.copyText`. |

## 1. Classic-script namespace and load order

`src/app-export.ts` must compile as a non-module namespace:

```ts
namespace DesignExport {
  export type ExportFormat = 'css' | 'tailwind' | 'tokens';

  export interface IsmInput {
    id: string;
    name: string;
    palette: string[];
  }

  export interface GuideInput {
    layout: Record<string, string>;
    typography: Record<string, string>;
    color: Record<string, string>;
    motion: Record<string, string>;
  }

  export function mountIsm(container: HTMLElement, ism: IsmInput, guide: GuideInput): void;
  export function mountEffect(container: HTMLElement, effectId: string): Promise<void>;
  export function copyText(text: string, announcement: string): Promise<boolean>;
  export function registerIsmTab(tab: IsmTabRegistration): void;
}
```

Runtime order:

```diff
 <!-- index.html -->
+<script src="./assets/js/app-export.js?..."></script>
 <script src="./assets/js/app.js?..."></script>
```

```diff
 <!-- effects.html -->
+<script src="./assets/js/app-export.js?..."></script>
 <script src="./assets/js/effects-filters.js?..."></script>
 <script src="./assets/js/effects-interactions.js?..."></script>
 <script src="./assets/js/effects-demos.js?..."></script>
 <script src="./assets/js/effects-docs.js?..."></script>
 <script src="./assets/js/effects.js?..."></script>
```

Retain the repository's end-of-body synchronous classic-script order. Source files use global
namespaces and contain no import/export syntax. Do not introduce mixed defer semantics.

Compiler note: `tsconfig.json` sets `"module": "ES2020"`, but the emitted JS stays classic
(non-module) only because source files contain zero import/export statements. "Non-module
compilation" is a source-discipline guarantee, not a compiler-setting guarantee — adding a
single `import` would silently change the emit shape. The generated-JS parity check in Phase
080 compiles with this same `tsconfig.json`.

## 2. ISM export mount

`src/app.ts` adds a mount point, not export logic:

```diff
 html += renderDevelopmentGuide(ism);
+html += '<section class="ism-export-mount" id="ism-export-mount" aria-label="Style code export"></section>';
```

After modal DOM insertion, start the cached guide request. The panel owns explicit
loading/error/ready states; opening the rest of the modal never waits for guide fetch:

```ts
const exportMount = document.querySelector<HTMLElement>('#ism-export-mount');
if (exportMount && guide) DesignExport.mountIsm(exportMount, ism, guide);
```

If guide loading fails, show a retry button and non-copyable error. Never silently export
guessed spacing/motion while presenting it as sourced from the guide.

The panel contains:

```text
Style to code
[CSS variables] [Tailwind @theme] [JSON tokens]
[read-only code region]
[Copy CSS variables]
[derivation notes / contrast warnings]
```

Tab behavior:

- use `<button role="tab">` within `role="tablist"` and matching `role="tabpanel"`;
- ArrowLeft/ArrowRight changes selected tab; Home/End jump to ends;
- use the APG manual-activation model with roving `tabindex`: one active tab has `0`, all
  others `-1`; Enter/Space activates after arrow focus movement;
- each tab and panel has stable paired IDs with `aria-controls`/`aria-labelledby`, and
  inactive panels use `hidden`;
- selected tab persists only for the current session (`sessionStorage['design-isms-export-tab']`);
- tab change does not move focus into the code automatically;
- code is rendered with `textContent` in `<pre><code>`, never interpolated as HTML;
- each format has one copy button with a format-specific accessible name;
- Phase 070 registers a fourth prompt tab through `registerIsmTab` without editing `app.ts`.

## 3. Deterministic semantic color derivation

Never label the first palette swatch “background” by assumption. Implement one deterministic algorithm and surface warnings.

### Normalize

- accept only `#RGB`, `#RRGGBB`, or `#RRGGBBAA`; normalize to uppercase `#RRGGBB` and reject alpha for semantic base tokens;
- preserve original palette order in numbered raw tokens (`color-1`, `color-2`, …);
- convert each color to sRGB relative luminance and an implementation-stable chroma measure;
- inspect `guide.color.bgFg` for explicit dark intent using a small, documented bilingual token set such as `dark`, `black`, `어두`, `검정`.

### Assign

```text
background = darkest palette color when dark intent, otherwise lightest
foreground = palette color with highest contrast ratio against background
accent     = highest-chroma remaining palette color; tie → earliest palette order
surface    = background mixed 8% toward foreground
muted      = background mixed 45% toward foreground
border     = background mixed 22% toward foreground
```

If fewer than three distinct colors remain, derive surface/muted/border by mixing rather than duplicating opaque roles.

### Warn

- calculate and display foreground/background contrast ratio;
- warn when body-text contrast is below 4.5:1 or large-text/UI contrast is below 3:1;
- do not claim that a palette is WCAG compliant solely from generated roles;
- make warnings plain text adjacent to the output and include them under `extensions.designIsms.warnings` in JSON tokens;
- never mutate the source palette or silently substitute a “compliant” color.

WCAG contrast thresholds and applicability should be linked rather than paraphrased as a blanket guarantee. [Source: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html]

## 4. Derive layout, type, and motion values conservatively

Parse only values that can be represented safely:

| Guide field | Export behavior |
|---|---|
| `layout.gutter` | first valid CSS length → `--ism-gutter`; otherwise omit with note |
| `layout.spacing` | one/two valid lengths → min/max spacing tokens |
| `layout.margins` | valid length/percentage/vw → `--ism-page-margin` |
| `typography.lineHeight` | unitless number or valid length → line-height token |
| `typography.letterSpacing` | valid `em`/`rem`/`px` → tracking token |
| `typography.fontPairing` | expose sanitized font stacks only when parseable; retain original as metadata |
| `motion.duration` | first valid `ms`/`s` token |
| `motion.easing` | allow named easing or a validated `cubic-bezier(…)` |

Do not parse prose such as “32px~64px” with arbitrary `eval`. Use regex extraction and strict allowlists. When a field cannot become CSS, preserve it as token metadata and show `/* source note: ... */` rather than inventing a value.

## 5. Exact export formats

### CSS custom properties

```css
:root {
  --ism-color-1: #F3F0E8;
  --ism-color-2: #161A1D;
  --ism-color-background: #F3F0E8;
  --ism-color-foreground: #161A1D;
  --ism-color-accent: #F0522D;
  --ism-color-surface: #E1DED6;
  --ism-color-muted: #91918E;
  --ism-color-border: #C6C3BA;
  --ism-gutter: 24px;
  --ism-space-min: 32px;
  --ism-space-max: 64px;
  --ism-motion-duration: 300ms;
  --ism-motion-easing: cubic-bezier(0.4, 0, 0.2, 1);
}
```

Only output lines backed by valid palette/guide values. Add a header comment with ISM name/ID and generation date derived from build data, not the user’s clock when tests need deterministic snapshots.

### Tailwind CSS v4 `@theme`

```css
@theme {
  --color-ism-background: #F3F0E8;
  --color-ism-foreground: #161A1D;
  --color-ism-accent: #F0522D;
  --spacing-ism-gutter: 24px;
  --ease-ism: cubic-bezier(0.4, 0, 0.2, 1);
}
```

- output only Tailwind-recognized namespaces where the source value is valid;
- include a comment `/* Tailwind CSS v4 */`;
- do not output a `tailwind.config.js` object or claim v3 support;
- keep raw numbered palette colors under `--color-ism-1` etc.

### JSON design tokens

Use a stable DTCG-shaped object:

```json
{
  "color": {
    "$type": "color",
    "background": { "$value": "#F3F0E8" },
    "foreground": { "$value": "#161A1D" },
    "accent": { "$value": "#F0522D" }
  },
  "dimension": {
    "gutter": { "$type": "dimension", "$value": { "value": 24, "unit": "px" } }
  },
  "duration": {
    "standard": { "$type": "duration", "$value": { "value": 300, "unit": "ms" } }
  },
  "extensions": {
    "designIsms": {
      "id": "minimalism",
      "source": "assets/data/dev-guides.json",
      "warnings": []
    }
  }
}
```

Before implementation, verify color-value representation against the then-current DTCG draft. If the current draft requires structured color objects, use that structure consistently and update the example in README. Do not call a private ad-hoc schema “DTCG compliant.”

## 6. Effect snippet data schema

`assets/data/effects-snippets.json`:

```json
{
  "version": "YYYY-MM-DD",
  "snippets": {
    "bottom-sheet": {
      "html": "<button ...>Open filters</button>\n<dialog ...>...</dialog>",
      "css": ".fx-bottom-sheet { ... }",
      "js": "const trigger = ...",
      "supports": ["HTMLDialogElement"],
      "reducedMotion": "Remove translate transition and show final open state immediately.",
      "a11yNotes": ["Use a labeled dialog.", "Restore focus to the trigger."],
      "sourceRefs": ["https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/"]
    }
  }
}
```

File-size/readability rules:

- format the top-level object and each effect entry compactly so the new file stays under 500 physical lines;
- keep each escaped snippet human-reviewable; do not minify CSS/HTML content into unreadable tokens;
- UTF-8 only; no generated binary/base64 content;
- no inline SVG longer than a small semantic icon; prefer CSS shapes or concise path markup;
- no external CDN/library dependency;
- no real brand names, tracking, analytics, network calls, `eval`, `new Function`, or inline event attributes;
- no `innerHTML` assignment in copied JavaScript;
- every selector starts with `.fx-{effect-id}` or is a documented child selector under that root;
- every entry has nonempty `html` and `css`; `js` is required for effects whose state cannot work semantically with HTML/CSS alone;
- copied examples use semantic elements first and ARIA only when native semantics are insufficient.

## 7. Snippet implementation tiers

| Tier | Examples | Required content |
|---|---|---|
| HTML/CSS only | skeleton, grain background, split-text final state | HTML + CSS, reduced-motion rule |
| HTML/CSS + small JS | magnetic button, copy confirmation, carousel | HTML + CSS + scoped initialization/cleanup |
| Progressive API | scroll timelines, view transitions | fallback CSS/JS first, then `@supports`/feature detection |
| Dialog/overlay | bottom sheet, modal, command palette | semantic open/close/focus behavior; APG notes |

JavaScript snippets must be idempotent and scoped:

```js
const root = document.querySelector('.fx-magnetic-button');
if (root && !root.dataset.enhanced) {
  root.dataset.enhanced = 'true';
  // attach bounded listeners
}
```

Any continuous listener must include cleanup guidance. Use `AbortController` where practical. Do not put a global `pointermove` listener in each copied component.

## 8. Effect modal integration

`src/effects.ts` adds a mount after docs:

```diff
 html += EffectsDocs.render(effect.id, effectDocs.get(effect.id) ?? null);
+html += '<section class="effect-code-mount" id="effect-code-mount" aria-label="Implementation code"></section>';
```

After insertion:

```ts
const mount = elements.modalContent.querySelector<HTMLElement>('#effect-code-mount');
if (mount) void DesignExport.mountEffect(mount, effect.id);
```

`DesignExport.mountEffect`:

- fetches `effects-snippets.json` only on first effect code-panel request, then caches the validated map;
- shows skeleton text while loading and a retry control on failure;
- validates the selected key before rendering;
- presents tabs for HTML, CSS, JavaScript (only when present), plus Notes;
- renders source code with `textContent`;
- gives each copy button a stable label and live confirmation;
- never blocks opening the rest of the modal if snippets fail to load.

The whole snippet file is accepted only if kept under a practical transfer budget: target under **180 KiB uncompressed** and **45 KiB gzip**. If it exceeds the target, split into family files and lazy-load by `effect.family`; document the actual choice rather than silently shipping a large eager payload.

## 9. Clipboard implementation

`DesignExport.copyText` order:

1. attempt `navigator.clipboard.writeText` when available in a secure context;
2. fallback to a temporary off-screen `<textarea>`, select it, and call `document.execCommand('copy')` only for local/legacy support;
3. always remove the temporary node and restore focus;
4. return `true/false` and dispatch `design-export-copy` with `{ success, announcement }` for tests;
5. update one global `role="status" aria-live="polite"` toast per document. Phase 020 adds
   the missing semantics to Index; Effects reuses its existing status node;
6. show `Copied` for success or `Copy failed — select the code manually` on failure;
7. never swallow permission errors silently.

Palette swatches in the ISM modal call the same function. Color copy announcements include the actual hex value.

## 10. Styling requirements

`assets/css/export.css` must implement:

- angular atlas panel with rule-based sections, no rounded “AI code card” styling;
- tab list that can horizontally scroll at 390px without page overflow;
- `<pre>` with `overflow:auto`, readable 13px SF Mono, and a max height around 420px;
- visible copy control outside the scrollable code region;
- contrast/warning block using icon+text, never color alone;
- `forced-colors` compatible borders and system focus colors;
- no syntax-highlighting dependency; a single readable foreground is acceptable;
- print styles that include the token text and hide copy buttons;
- reduced-motion rule for copy-state transitions.

## 11. Snippet validator

`scripts/verify-snippets.mjs` must enforce:

```text
snippets ok: 64 ids, 64 html, 64 css, N js, 0 unsafe, 0 unscoped
```

Checks (content-policy lint, not a security sandbox for code after a user pastes it):

- `snippets` key set exactly equals the 64 effect IDs;
- each HTML/CSS string is nonempty and below 12 KiB;
- expected root class `.fx-{id}` appears in HTML and CSS;
- `js` exists for a maintained allowlist of interactive/API effects;
- CSS contains a reduced-motion block or the entry documents why no motion runs;
- source refs are valid HTTPS URLs;
- reject `<script>` inside HTML, inline `on*=` handlers, `javascript:` URLs, `eval`, `new Function`, `document.write`, analytics/network calls, and remote imports;
- reject unscoped `body`, `html`, `*`, `button`, `a`, or heading selectors unless nested under the root class;
- JSON file under 500 lines and transfer-size target;
- `src/app-export.ts` and `assets/css/export.css` under 500 lines;
- generated `assets/js/app-export.js` exists after build.
- runtime never executes snippets with `innerHTML`, `eval`, iframe `srcdoc`, dynamic script
  insertion, or in-page preview; code is text-only.

`package.json`:

```diff
+"verify:snippets": "node scripts/verify-snippets.mjs",
 "verify": "npm run typecheck && npm run build && npm run verify:nav && npm run verify:isms && npm run verify:effects && npm run verify:snippets"
```

## Acceptance criteria

Run:

```bash
npm ci
npm run verify
```

Expected tail includes:

```text
snippets ok: 64 ids, 64 html, 64 css, N js, 0 unsafe, 0 unscoped
```

Browser acceptance:

| Scenario | Required result |
|---|---|
| Any of 49 ISM modals | Three export tabs render from that exact palette/guide. |
| Light and dark palettes | Semantic background/foreground are deterministic; contrast warning appears when needed. |
| Tailwind tab | Output begins with `@theme` and is labeled v4. |
| JSON tab | Parses with `JSON.parse` after copying. |
| Any of 64 effect modals | HTML/CSS code tabs exist; JS appears only when needed. |
| Copy on deployed HTTPS | Clipboard succeeds and live status announces success. |
| Denied/unavailable clipboard | Manual-copy message appears; modal remains usable. |
| 390×844 | Tabs/code scroll internally; page has no horizontal overflow. |
| Keyboard | Tabs, code region, copy, and modal close are all reachable in a sensible order. |
| Security | Code text never executes merely by opening a modal. |

Spot-test copied snippets for at least one entry from each of the seven families in a blank static HTML page. The visual behavior, fallback, keyboard behavior, and reduced-motion state must match the modal description; “looks similar” without working semantics is not acceptance.

## Completion handoff

Stage reviewed authored TS/CSS/JSON, generated JS, HTML load-order changes, removal of
duplicate clipboard logic, validator, and docs together. The user authorized phase commits.
Phase 070 consumes `DesignExport.registerIsmTab` without coupling prompt logic into app.ts.
