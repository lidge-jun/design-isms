# 040 — Add Six Current ISMs, Including the AI Slop Anti-pattern

## Outcome

Add six differentiated, research-backed entries and eighteen original mockups. The catalog moves from **43 to 49 ISMs** while preserving the existing JSON-driven static architecture.

```text
ISMs:                 43 → 49
Detailed guide keys:  43 → 49
Original ISM PNGs:   129 → 147
ISM WebP previews:   129 → 147
```

One entry, `ai-slop`, is an anti-pattern diagnosis. It is visible and searchable, but it must never be presented as a recommended result, related style, or “trend to copy.”

## Dependencies

- **Requires:** Phase 020 shell/nav/dialog work.
- **Requires tooling from:** Phase 030 for deterministic WebP output and asset audit conventions.
- **Blocks:** Phase 060 export and Phase 070 Style Finder/prompt packs.
- **Can run in parallel with:** Phase 050 after 020/030 are complete.

## Research rationale

The six additions cover distinct design decisions rather than six names for the same aesthetic:

- `refractive-glass-ui` responds to platform-level refractive/translucent material systems rather than duplicating static glassmorphism. Apple publicly introduced Liquid Glass in June 2025. [Source: https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/]
- `human-crafted-web` and the `ai-slop` warning capture the visible reaction against repetitive, low-effort synthetic aesthetics and renewed interest in texture/process. [Source: https://www.vogue.com/article/the-anti-ai-slop-playbook] [Source: https://www.creativebloq.com/design/graphic-design/texture-warmth-and-tactile-rebellion-the-big-graphic-design-trends-for-2026]
- `ai-slop` is treated as a product/design quality failure, not as a label for all AI-assisted work. Emerging research has also examined aesthetic homogenization in AI-assisted interface production; describe findings with scope and caveats. [Source: https://arxiv.org/abs/2603.13036]

Trend sources justify investigation; the final entry definitions must be editorially authored and independently differentiated.

## File operations

| Marker | Exact path | Purpose |
|---|---|---|
| **NEW** | `scripts/verify-isms.mjs` | Count/schema/pair/source/example validator used immediately and later by Phase 080. |
| **NEW** | `devlog/260715_production_upgrade/041_trend_ism_research.md` | Numbered source notes, overlap checks, example-site review, and image-review ledger. |
| **NEW** | `assets/images/ai-slop/{landing,saas,dashboard}.png` | Three diagnostic anti-pattern mockups. |
| **NEW** | `assets/images/refractive-glass-ui/{landing,mobile-app,dashboard}.png` | Three refractive material mockups. |
| **NEW** | `assets/images/spatial-ui/{landing,dashboard,portfolio}.png` | Three depth/anchoring mockups. |
| **NEW** | `assets/images/human-crafted-web/{landing,shop,portfolio}.png` | Three material/process-led mockups. |
| **NEW** | `assets/images/generative-identity/{agency,pricing,portfolio}.png` | Three rule-based identity mockups using allowed categories. |
| **NEW** | `assets/images/technical-blueprint/{landing,blog,dashboard}.png` | Three annotated systems mockups using allowed categories. |
| **NEW** | mirrored `assets/images/thumbs/{new-id}/*.webp` | Eighteen previews generated from accepted PNGs. |
| **MODIFY** | `assets/data/isms.json` | Append six entries; add optional `kind`, `sources`, and `reviewedOn` schema. |
| **MODIFY** | `assets/data/dev-guides.json` | Add six complete guides and move embedded implementation guidance into data. |
| **MODIFY** | `assets/data/research-prompts.json` | Add six research/image targets and update version. |
| **MODIFY** | `devlog/260510_nav_taxonomy_effect_docs/grok_research_prompts.md` | Mirror Grok/ima2 prompt records per canonical project rule. |
| **MODIFY** | `src/app.ts` | Parse new fields, render anti-pattern/source treatment, remove embedded guide map. |
| **MODIFY** | `index.html` | Update all 43-count metadata/header copy to 49 and cache keys. |
| **MODIFY** | `effects.html` | Update any cross-catalog metadata that says 43 ISMs; do not change effect count yet. |
| **MODIFY** | `faq.html` | Update explicit catalog count references only; FAQ answer count stays 18. |
| **MODIFY** | `assets/data/faq.json` | (Created by Phase 020.) Update explicit catalog count references inside answers only. |
| **MODIFY** | `package.json` | Add `verify:isms`; include it in `verify`. |
| **MODIFY** | `README.md` | Update badges, counts, features, and asset totals to 49/46 interim. |
| **MODIFY** | `AGENTS.md` | Add `kind`/source rules and 49-count interim invariant. |
| **MODIFY** | `structure/README.md` | Document six directories and data-schema additions. |
| **DELETE** | `DEVELOPMENT_GUIDES` constant from `src/app.ts` | Make `dev-guides.json` the single guide source and reduce the 1,342-line file. |

## 1. Extend the ISM schema without breaking old records

Type additions in `src/app.ts`:

```diff
+type IsmKind = 'style' | 'anti-pattern';
+
+interface IsmSource {
+  label: string;
+  url: string;
+}
 interface DesignIsm {
   id: string;
+  kind?: IsmKind;
   name: string;
@@
   prompts?: IsmPrompt[];
+  sources?: IsmSource[];
+  reviewedOn?: string;
 }
```

Parser behavior:

- missing `kind` defaults to `style` for the original 43;
- allowed kinds are exactly `style` and `anti-pattern`;
- every new entry requires `reviewedOn` in ISO `YYYY-MM-DD` and at least two `https:` sources;
- reject unknown top-level keys only if the current parser already uses strict allowlisting; otherwise explicitly validate required/known field types;
- reject duplicate IDs, duplicate image filenames inside an entry, non-hex palette values, and prompt/image filename mismatch;
- require exactly 5–8 normalized lowercase kebab-case keywords;
- require exactly 10 current example sites and exactly 3 images/prompts.

Do not reinterpret existing historical ISMs as “trends.” The new entries are appended so existing numbering and deep links remain stable.

## 2. Make `dev-guides.json` the single guide source

The current `src/app.ts` embeds a separate `DEVELOPMENT_GUIDES` map in addition to loading `assets/data/dev-guides.json`. Consolidate the compact implementation guidance into each JSON guide:

```diff
 "minimalism": {
   "layout": { ... },
   "typography": { ... },
   "color": { ... },
   "motion": { ... },
   "dos": [ ... ],
-  "donts": [ ... ]
+  "donts": [ ... ],
+  "implementation": {
+    "summary": "...",
+    "components": ["..."],
+    "build": ["..."],
+    "checks": ["..."]
+  }
 }
```

Migration requirements:

- move all authored existing `DEVELOPMENT_GUIDES` values from TS into their matching 43 JSON keys;
- preserve wording unless a factual/accessibility claim needs correction;
- delete the TS constant and generic fallback; missing implementation data becomes a visible validation/load error in development and a concise “Guide unavailable” state in production;
- load the guide map once and use it for both the modal’s implementation block and split guide panel;
- reduce `src/app.ts` well below its 1,342-line ceiling; target below 1,050 after migration.

The six new keys must contain every layout/type/color/motion/do/don’t/implementation field. No generic generated guide text is acceptable.

## 3. Exact six-entry content matrix

| ID | Name / Korean | Kind | Tagline | Required keywords | Palette direction |
|---|---|---|---|---|---|
| `ai-slop` | AI Slop / AI 슬롭 | `anti-pattern` | “Generation without judgment” | `synthetic-clutter`, `generic-gradient`, `false-depth`, `random-iconography`, `weak-hierarchy`, `inconsistent-style` | intentionally discordant violet/cyan/orange plus muddy neutral; still readable |
| `refractive-glass-ui` | Refractive Glass UI / 굴절 유리 UI | `style` | “Interfaces shaped by light” | `refraction`, `translucency`, `specular`, `layered-depth`, `adaptive-material`, `soft-motion` | clear/ice neutrals, spectral highlight, dark readable ink |
| `spatial-ui` | Spatial UI / 공간형 UI | `style` | “Place information in depth” | `depth`, `anchoring`, `occlusion`, `spatial-navigation`, `layered-canvas`, `environmental-ui` | deep neutral space with one distance cue and one action signal |
| `human-crafted-web` | Human-crafted Web / 휴먼 크래프티드 웹 | `style` | “Leave evidence of the maker” | `texture`, `imperfection`, `handmade-type`, `materiality`, `collage`, `process` | warm paper, ink, one imperfect spot color, photographed material |
| `generative-identity` | Generative Identity / 제너러티브 아이덴티티 | `style` | “One system, many expressions” | `rule-based`, `variable-system`, `parametric`, `data-driven`, `modular-mark`, `controlled-variation` | stable brand anchors plus generated variable range |
| `technical-blueprint` | Technical Blueprint / 테크니컬 블루프린트 | `style` | “Explain the system visibly” | `schematic`, `annotation`, `measurement`, `diagram`, `monospace`, `process-visualization` | blueprint blue/ink or pale technical paper with orange status cue |

Differentiation gates:

- `refractive-glass-ui` must depict light-responsive depth/refraction and legibility treatment; a blurred translucent card alone is existing glassmorphism.
- `spatial-ui` must organize controls/content by depth and anchor, not merely render isometric 3D illustration.
- `human-crafted-web` must show authored material/process and readable product structure; random scrapbook stickers alone are not enough.
- `generative-identity` must expose a consistent rule with controlled variation across instances; random abstract gradients are not enough.
- `technical-blueprint` must use annotation/measurement to explain product or process; a blue monochrome theme alone is not enough.
- `ai-slop` must teach recognizable failure modes and corrective judgment; it cannot ridicule a person, tool, or demographic.

## 4. Entry content contract

Each `isms.json` object must include:

```json
{
  "id": "technical-blueprint",
  "kind": "style",
  "name": "Technical Blueprint",
  "nameKr": "테크니컬 블루프린트",
  "tagline": "Explain the system visibly",
  "description": "120–220 Korean characters defining visual traits and appropriate use.",
  "descriptionEn": "A complete, equivalent English definition.",
  "keywords": ["schematic", "annotation", "measurement", "diagram", "monospace", "process-visualization"],
  "palette": ["#...", "#...", "#...", "#...", "#..."],
  "examples": [{ "name": "...", "url": "https://..." }],
  "images": [{ "file": "landing.png", "label": "Landing Page" }],
  "history": "350–650 Korean characters: origin/context, digital interpretation, distinction, current use, and caveat.",
  "prompts": [{ "file": "landing.png", "prompt": "...", "model": "gpt-image-2", "quality": "high", "size": "1536x1024" }],
  "sources": [{ "label": "...", "url": "https://..." }],
  "reviewedOn": "YYYY-MM-DD"
}
```

Editorial rules:

- use “emerging direction,” “current material system,” or “anti-pattern” rather than declaring a universal 2026 trend;
- distinguish observation from history and link the source supporting each time-sensitive claim;
- do not copy source prose;
- no made-up adoption, conversion, preference, or productivity percentages;
- history may be short for newly named patterns but must openly say the label is contemporary;
- do not list Dribbble, Behance, Pinterest, Wikipedia, template marketplaces, or inaccessible localhost demos as examples;
- examples require a direct, live `https:` URL and a note in
  `041_trend_ism_research.md` explaining the visible fit;
- verify all ten examples on desktop and mobile on the review date; remove login-only, parked, or substantially unrelated sites.

## 5. Exact image manifest

| ID | File 1 | File 2 | File 3 | Visual purpose |
|---|---|---|---|---|
| `ai-slop` | `landing.png` | `saas.png` | `dashboard.png` | Expose weak hierarchy, incoherent generated assets, and generic sameness in three product contexts. |
| `refractive-glass-ui` | `landing.png` | `mobile-app.png` | `dashboard.png` | Show adaptive translucent navigation, layered mobile controls, and data legibility over refractive material. |
| `spatial-ui` | `landing.png` | `dashboard.png` | `portfolio.png` | Show anchored planes, distance/occlusion, and navigable depth—not an illustration board. |
| `human-crafted-web` | `landing.png` | `shop.png` | `portfolio.png` | Show paper/material evidence, product texture, and maker-process storytelling. |
| `generative-identity` | `agency.png` | `pricing.png` | `portfolio.png` | Show one rule creating related marks/layouts across instances. |
| `technical-blueprint` | `landing.png` | `blog.png` | `dashboard.png` | Show annotated product anatomy, process docs, and measured operational UI. |

Every prompt begins from this production-screen guardrail:

```text
Render one finished production website or app screen, full-bleed as if captured
from the product. Do not make a moodboard, poster sheet, style guide, comparison
board, or multiple labeled variants. Show real navigation, content, controls,
states, and responsive layout. No real logos, browser chrome, people, watermark,
meaningless microcopy, or decorative labels outside the product UI.
```

Additional AI Slop prompt rule:

```text
The screen is an instructional anti-pattern specimen. Make the failure modes
specific and readable, not merely ugly: conflicting visual languages, generic
purple gradient hero, unrelated 3D icons, inflated claims, inconsistent spacing,
and decorative glass cards without hierarchy. Keep text legible so a novice can
diagnose the problems. Do not imitate an identifiable product or artist.
```

Generate each original at exactly `1536×1024` PNG, review it at 100% and thumbnail size, then run the Phase 030 thumbnail pipeline. Reject provider watermarks, garbled text, duplicated layouts, clipped controls, or output that does not meet its differentiation gate.

## 6. Render anti-pattern semantics explicitly

Card markup from `src/app.ts`:

```diff
-<article class="ism-card" data-id="${ism.id}">
+<article class="ism-card" data-id="${ism.id}" data-kind="${ism.kind ?? 'style'}">
+  ${ism.kind === 'anti-pattern'
+    ? '<p class="ism-kind-label">Anti-pattern · Diagnose, do not copy</p>'
+    : ''}
```

Modal requirements:

- render a warning summary before images for `anti-pattern`;
- label its palette as “symptom palette,” not “recommended palette”;
- show “How to de-slop this direction” from the guide’s `dos`/implementation checks;
- source links use `target="_blank" rel="noopener"` and include a reviewed date;
- `getRelatedIsms` filters out any `kind === 'anti-pattern'` as both target recommendation and candidate;
- Phase 070’s finder also excludes it from positive results.

Do not hide AI Slop from search; novices need to find and recognize it.

## 7. Count and metadata propagation

After data/assets validate, update all literal 43 counts:

```diff
-index.html: "43개 디자인 ism"
-index.html: <span class="header-count">43 isms</span>
-README badges/copy: 43
+index.html: "49개 디자인 ism"
+index.html: <span class="header-count">49 isms</span>
+README badges/copy: 49
```

Search repository-wide:

```bash
git grep -nE '43(개| isms| design isms| ISMs)|129( ISM|개.*이미지)'
```

Every remaining match must be either historical migration text or explicitly marked baseline. Update OG/Twitter descriptions, README status, AGENTS invariants, structure docs, and FAQ count references. Keep effect count at 46 until Phase 050.

## 8. Validator specification

`scripts/verify-isms.mjs` must print and enforce:

```text
isms ok: 49 entries, 49 guides, 147 png, 147 webp, 6 sourced additions, 1 anti-pattern
```

Checks:

- `isms.json` length 49 and `dev-guides.json` key count 49;
- key set exactly equals ISM ID set;
- six expected new IDs exist exactly once;
- every entry has 3 images and matching prompt filenames;
- every referenced original/preview exists and has Phase 030 dimensions;
- every new entry has 10 unique valid HTTPS references, 2+ sources, reviewed date,
  bilingual description, history, 5–8 keywords, and exactly 4 palette colors;
- only `ai-slop` has `kind: anti-pattern`;
- all detailed guide subfields and implementation subfields are nonempty;
- no `DEVELOPMENT_GUIDES` constant remains in `src/app.ts`;
- `src/app.ts` line count is `<= 1050` after removing the embedded guide map;
- no new authored file is `> 500` lines.

`package.json`:

```diff
+"verify:isms": "node scripts/verify-isms.mjs",
-"verify": "npm run typecheck && npm run build && npm run verify:nav"
+"verify": "npm run typecheck && npm run build && npm run verify:nav && npm run verify:isms"
```

## Acceptance criteria

Run:

```bash
npm ci
npm run images:thumbs
npm run verify
```

Expected tail:

```text
nav ok: index.html, effects.html, faq.html; axes=6; order consistent
isms ok: 49 entries, 49 guides, 147 png, 147 webp, 6 sourced additions, 1 anti-pattern
```

Browser acceptance at 1440, 1024, 640, and 390 widths:

- 49 cards render and the header says `49 isms`;
- each new card has three WebP previews and opens three PNG originals;
- each new modal has specific history, 10 examples, source links, and a complete guide;
- AI Slop visibly says “Anti-pattern · Diagnose, do not copy” and never appears in related recommendations;
- all six styles are visually distinguishable when names are hidden;
- AI Slop labels its ten links as diagnostic references/further reading rather than
  endorsing or shaming individual sites; the other five keep the ordinary example-site label;
- no text/image overflow, image placeholder, broken link, console error, or mixed-language blank state;
- language switching updates new descriptions and UI labels without changing IDs or losing modal focus.

Research acceptance:

```bash
for id in ai-slop refractive-glass-ui spatial-ui human-crafted-web generative-identity technical-blueprint; do
  grep -q "## $id" devlog/260715_production_upgrade/041_trend_ism_research.md || exit 1
done
```

Each section records definition evidence, overlap rejection, ten example-site checks, image pass/fail notes, reviewer, and date.

## Completion handoff

Commit data, eighteen originals, eighteen generated previews, guide migration, TypeScript/build output, validators, and count/docs updates together. The safe interim public state is **49 ISMs / 46 effects**. Phase 050 owns the next count change.
