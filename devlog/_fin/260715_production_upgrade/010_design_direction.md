# 010 — Design Direction: Annotated Specimen Atlas

## Outcome

Reframe the site from a generic beige card gallery into a recognizable **design instrument**: an annotated specimen atlas that feels editorial, indexed, and useful before it feels decorative. The shell must not impersonate any one ISM; it must provide a strong neutral frame in which radically different ISM imagery can coexist.

The direction is called **Annotated Specimen Atlas**.

## Baseline design read

### What currently works

- The content model is unusually rich: three visual examples, history, keywords, palette, examples, prompts, and implementation guidance.
- Pretendard, Outfit, and SF Mono already support readable Korean body copy, display hierarchy, and data annotations without another font request.
- The 1440 / 1024 / 640 grid behavior is understandable and the warm neutral background does not fight the reference images.
- The split-view ISM development guide is a strong foundation for action-oriented learning.

### What currently weakens the product

- `#FAF8F5` background + white rounded cards + pill navigation + pill filters + equal three-column cards reads like a generic generated dashboard rather than a reference archive.
- The visual system repeats the same rounded silhouette for navigation, counts, language, filters, cards, close buttons, and tags; hierarchy is carried by label text instead of form.
- Equal card sizing hides the difference between “browse,” “compare,” and “study.”
- Decorative sparkle/star language and emoji category icons resemble common AI-generated UI tells.
- The site explains design movements but does not visibly model disciplined hierarchy, annotation, or editorial composition.

Current implementation anchors:

- `assets/css/style.css:49-64` — beige/warm token set and `12px` global radius.
- `assets/css/style.css:116-162` — pill navigation/count/language controls.
- `assets/css/style.css:173-209` — pill filters and width-expanding search.
- `assets/css/style.css:211-230` — equal three-column cards and rounded card shell.
- `assets/css/nav.css:61-71` — mobile column wrap without resetting the fixed `64px` header height.

## Design thesis

The product should look like a cross between:

1. a museum collection index;
2. a typographic design annual;
3. a calibrated inspection tool.

It should **not** look like:

- a startup landing page with gradient hero copy;
- a dashboard made entirely of rounded cards;
- a portfolio that applies a single fashionable ISM to all content;
- an AI assistant interface covered in sparkles, purple glows, and vague “magic” copy.

## Design dial

| Axis | Target | Avoid |
|---|---|---|
| Editorial ↔ App-like | 70% editorial / 30% app utility | SaaS dashboard chrome |
| Dense ↔ Airy | Structured density with deliberate white space | Sparse hero followed by repetitive cards |
| Neutral ↔ Branded | Neutral shell with one orange accent; blue is link/focus semantics only | Multiple decorative accents or one-note color fields |
| Flat ↔ Dimensional | Primarily flat rules and planes | Soft floating shadows on every surface |
| Formal ↔ Playful | Precise but not sterile | Sticker/emoji decoration |
| Static ↔ Kinetic | Motion only for state, comparison, and teaching | Ambient motion with no instructional value |
| Rounded ↔ Angular | Mostly angular, 2–4px radii | Universal 12–24px rounding |
| Symmetric ↔ Asymmetric | Controlled asymmetric rhythm | Random masonry or arbitrary span changes |

## Visual grammar

### Palette

Use a cold paper base and high-contrast ink, not another warm beige-card theme.

```css
:root {
  --atlas-paper: #f1f1eb;
  --atlas-surface: #fafaf6;
  --atlas-ink: #11120f;
  --atlas-muted: #62645d;
  --atlas-rule: #b8b9b0;
  --atlas-signal: #ff4d1f;
  --atlas-link: #2446c8;
  --atlas-focus: #005fcc;
  --atlas-radius-xs: 2px;
  --atlas-radius-sm: 4px;
}
```

`--atlas-signal` is the single visual accent for actions, active state, and instructional
annotation. `--atlas-link` is restricted to semantic links and may not decorate cards,
headings, or backgrounds. Neither color becomes a gradient.

### Typography

- Keep existing fonts; adding a fourth webfont is explicitly out of scope.
- Outfit: product name, large specimen number, major section headings.
- Pretendard: descriptions, FAQ, guide content, controls.
- SF Mono stack: IDs, counts, categories, code, source labels, timestamps.
- Use visible type contrast: 11–12px mono metadata, 16px body, 28–48px display, 72–120px specimen numerals where space permits.
- Never use uppercase tracking as the only hierarchy device; combine size, rule, and position.

### Geometry and depth

- Replace blanket pill shapes with rectangular nav cells and index labels.
- Remove default card shadows; use a one-pixel rule and occasional offset keyline for selected/featured specimens.
- Reserve rounded surfaces for the semantic cases that need them: dialog backdrop controls, color swatches, and touch handles.
- Use `box-shadow` only to communicate elevation, never as baseline decoration.

### Grid

Desktop catalog:

```css
.masonry {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1px;
  background: var(--atlas-rule);
  border: 1px solid var(--atlas-rule);
}
.ism-card { grid-column: span 4; }
```

The baseline remains an equal comparison grid because catalog order alone is not a semantic
reason to make a specimen wide. A future featured span requires an explicit data field and
editorial rationale; renderer index arithmetic is forbidden. At 1024px, cards span six
columns; at 640px, every card spans twelve.

### Annotation system

Every catalog card gains a small, consistent metadata rail:

```text
014 / GLASSMORPHISM
ERA 2013—
TRAITS translucency · blur · depth
OPEN SPECIMEN ↗
```

The metadata rail gives novices names and vocabulary without requiring them to open every modal. It also creates the signature visual language missing from the current equal-card grid.

### Motion

- Card hover: rule color + image crop shift of at most 4px; no floating-card lift.
- Modal open/close: opacity plus a small 8–12px translation.
- Filter result changes: brief opacity transition, not staggered theatrical entrances.
- Teaching demos may animate; navigation and reading surfaces should remain calm.
- Reduced-motion mode must present the final informative state, not hide content.

## Page compositions

### ISMs page

1. Compact atlas masthead: title, one-sentence purpose, counts, and “How to use this reference.”
2. Style Finder teaser/entry point, introduced fully in Phase 070.
3. Filter/search as an indexed toolbar, not a row of pills.
4. Controlled asymmetric specimen grid.
5. Modal remains split-view but gains a tabbed “Use this style” workbench in Phase 060.

### Effects page

- Retain card scanning, but render as a technical catalog with a family label, device applicability, demo stage, and explicit “Demo / Guide / Code” affordances.
- Add family navigation for motion categories while preserving Mobile/Desktop/Shared applicability.
- Use demos as the visual accent; the shell remains flat and restrained.

### FAQ page

- Use an editorial contents rail for the three categories.
- Category icons become line SVGs with consistent 20px geometry.
- Questions use numbered rows and visible source links.
- Answers use normal document surfaces; no warm rounded speech-card effect.

## File operations

| Marker | Path | Design role |
|---|---|---|
| NEW | `assets/css/theme-atlas.css` | Cross-page atlas tokens and shared primitives; loaded after base style and before page-specific CSS; under 500 lines. |
| NEW | `assets/icons/atlas-mark.svg` | Purpose-built registration/index mark replacing sparkle glyphs. |
| NEW | `assets/css/faq.css` | Editorial FAQ layout extracted from inline styles. |
| MODIFY | `index.html` | Load atlas CSS, replace logo/nav classes, add compact masthead hooks. |
| MODIFY | `effects.html` | Load atlas CSS, apply catalog metadata/family hooks. |
| MODIFY | `faq.html` | Load atlas and FAQ CSS, replace inline icon/style/script treatment. |
| MODIFY | `assets/css/style.css` | Remove/alias obsolete pill/card assumptions; do not increase total line count. |
| MODIFY | `assets/css/nav.css` | Angular nav cells and stable mobile wrapping. |
| MODIFY | `assets/css/effects.css` | Align effect cards/modal with atlas rules and metadata hierarchy. |
| MODIFY | `src/app.ts` | Emit metadata hooks only; do not add order-derived specimen sizing. |
| MODIFY | `src/effects.ts` | Emit family/metadata hooks without growing past the current 493 lines; extraction occurs in Phase 050. |
| DELETE | none | Existing URLs and pages remain stable. |

## Representative before/after diff

```diff
-<div class="logo-sketch">✦</div>
+<img class="atlas-mark" src="./assets/icons/atlas-mark.svg" alt="">
@@
-<a class="star-pill" href="./effects.html">Effects</a>
+<a class="nav-link" data-nav-axis="effects" href="./effects.html"><span aria-hidden="true">02</span> Effects</a>
@@
-<span class="header-count">43 isms</span>
+<span class="nav-meta header-count" data-nav-axis="count">43 isms</span>
```

```diff
-.ism-card {
-  background: var(--card-bg);
-  border: 1px solid var(--border);
-  border-radius: var(--radius);
-  box-shadow: var(--card-shadow);
-}
+.ism-card {
+  background: var(--atlas-surface);
+  border: 0;
+  border-radius: 0;
+  box-shadow: none;
+  grid-column: span 4;
+}
```

## `assets/icons/atlas-mark.svg` content specification

- 28×28 `viewBox`.
- Single-color paths using `currentColor` through CSS masking or a plain monochrome SVG file.
- Shape: square registration frame, one corner crop mark, and an offset dot; no sparkle, magic wand, emoji, gradient, or embedded text.
- Decorative in the header (`alt=""`); the adjacent text link remains the accessible name.
- Favicon update is optional only after 16px legibility inspection.

## Acceptance criteria

### Static inspection

```bash
rg -n "border-radius: 20px|Give me a star|>✦<|⚡|🔥|🛠" index.html effects.html faq.html assets/css
```

Expected: no navigation/FAQ emoji matches; any remaining 20px radius is documented as a semantic exception rather than the default control shape.

```bash
wc -l assets/css/theme-atlas.css assets/css/faq.css
```

Expected: each new file is below 500 lines.

### Render inspection

At 1440×900:

- the first viewport reads as an indexed reference archive, not a centered startup hero plus cards;
- at least two card widths are visible without random gaps;
- image content remains the primary color source;
- nav, search, count, and language each have distinct form/role;
- no card uses an ambient shadow by default.

At 390×844:

- logo and all six nav axes fit in document flow;
- filter/search starts below the complete sticky header;
- one-column cards preserve index metadata and readable 16px body text;
- no horizontal overflow.

Also verify 1180, 1024, 860, and 640 widths. Existing 1180/860 effects-grid breaks are
measured content-break exceptions until Phase 020 deliberately preserves or consolidates
them.

## Accessibility direction lock

- Every page gains a skip link to `<main id="main-content">`.
- Sticky chrome must not obscure focused anchors or controls (`scroll-margin-top` or an
  equivalent content offset).
- Index modal reaches Effects parity: `role="dialog"`, `aria-modal`, `aria-labelledby`,
  trigger capture, initial focus, Tab trap, Escape close, and focus restoration.
- Mobile nav cells use `min-block-size: 44px`; wrapped rows retain at least 8px separation.

### Novice-use test

Give a first-time user 30 seconds on the home page. They should be able to answer:

1. What is this site for?
2. How many styles are available?
3. How do I compare or open a style?
4. Where do implementation guidance and effects live?

A failure on any answer blocks sign-off even if the layout looks distinctive.

## Dependencies

- No prior phase.
- `011_frontend_standards.md` turns this visual direction into enforceable implementation rules.
- Phase 020 owns actual theme integration and regression repair.

## References

- Live baseline: [Source: https://lidge-jun.github.io/design-isms/]
- Public repository baseline: [Source: https://github.com/lidge-jun/design-isms]
- WCAG focus visibility guidance: [Source: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html]
- Reduced motion behavior: [Source: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion]
- Research on homogenization in web vibe coding: [Source: https://arxiv.org/abs/2603.13036]
