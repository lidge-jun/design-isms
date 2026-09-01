# Design -isms Structure

이 문서는 현재 구현 상태를 기준으로 한 프로젝트 구조 요약입니다. README는 사용자용 개요, AGENTS.md는 작업 규칙, devlog는 변경 계획과 검증 기록, structure는 현재 source-of-truth 지도를 담당합니다.

## Source-of-Truth Principles

- README는 사용자가 보는 기능 개요와 실행법을 담당한다.
- `AGENTS.md`는 다음 작업자가 반드시 지켜야 할 구현 불변 조건을 담당한다.
- `structure/README.md`는 현재 파일 지도와 source/runtime 관계를 담당한다.
- `devlog/`는 계획, 리뷰, 검증 근거를 보관한다. 완료된 구현 여부는 runtime source와 이 structure 문서를 우선한다.
- 기능을 바꾸면 README, `AGENTS.md`, structure, 관련 devlog가 서로 다른 말을 하지 않도록 같은 턴에 갱신한다.

## Runtime Pages

| Page | Purpose | Script | Data |
| --- | --- | --- | --- |
| `index.html` | 49개 디자인 ism 레퍼런스 보드 | `assets/js/app.js` | `assets/data/isms.json` |
| `effects.html` | 모바일/데스크탑 프런트엔드 UI 후보군 보드와 효과별 문서 모달 | `assets/js/effects-demos.js`, `assets/js/effects-docs.js`, `assets/js/effects.js` | `assets/data/effects.json`, `assets/data/effects-docs.json` |

## Source and Build

<!-- data-sot:structure-counts:start -->Catalog source-of-truth counts: 49 ISMs / 94 effects / 18 FAQ answers.<!-- data-sot:structure-counts:end -->

```text
src/app.ts           -> assets/js/app.js
src/app-runtime.ts   -> assets/js/app-runtime.js
src/effects-demos.ts -> assets/js/effects-demos.js
src/effects-docs.ts  -> assets/js/effects-docs.js
src/effects.ts       -> assets/js/effects.js
```

- TypeScript source is the editable logic layer.
- `assets/js/*.js` is committed because GitHub Pages serves static files directly.
- Run `npm run build` after TypeScript edits; `npm run verify` is non-emitting and byte-checks every generated JS file.
- Do not edit generated browser JS without making the matching `src/*.ts` source change and rebuilding.

## Assets

```text
assets/images/{ism-id}/*.png
assets/images/thumbs/{ism-id}/*.webp
assets/images/effects/{effect-id}/guide.png
assets/images/thumbs/effects/{effect-id}/guide.webp
assets/data/image-pairs-manifest.json
```

- ISM cards use generated thumbnails and original PNG lightbox views.
- Effects cards use CSS demos.
- Effects demo registry provides one dedicated demo type per 94 entries (46 patterns + 48 visual effects).
- Effects modal guide previews and ISM card previews use WebP and keep original PNGs for source/lightbox use.
- The 331-pair image manifest (211 immutable legacy + 120 catalog additions) records source and preview SHA-256, dimensions, and the independent sRGB pixel-relation contract; the thumbnail generator owns atomic updates.
- Effect demo styling is split between `assets/css/effects.css`, `assets/css/effects-docs.css`, `assets/css/effects-demos.css`, and `assets/css/effects-demos-candidates.css`.
- Shared static navigation styling lives in `assets/css/nav.css`.
- Atlas shell tokens and shared primitives live in `assets/css/theme-atlas.css` (after `style.css`, before `nav.css`).
- FAQ page: `assets/data/faq.json` (data), `src/faq.ts` → `assets/js/faq.js` (renderer), `assets/css/faq.css` (styles), `assets/icons/faq-*.svg` (category icons).
- Dialog accessibility: `src/app-dialog.ts` → `assets/js/app-dialog.js` (global `AppDialogA11y`), loaded before `assets/js/app.js` in `index.html`.
- Runtime resilience: `src/app-runtime.ts` → `assets/js/app-runtime.js` (global `AppRuntime`) plus `assets/css/runtime-states.css`; loaded before the page renderer on index, effects, and FAQ.
- ISM guide data: `src/app-guides.ts` → `assets/js/app-guides.js` (global `AppGuides`), loaded before `assets/js/app.js`; `assets/data/dev-guides.json` (49 keys, each with layout/typography/color/motion/dos/donts/implementation) is the single guide SoT.
- ISM catalog validator: `scripts/verify-isms.mjs` (`npm run verify:isms`) — 49 entries/guides, 147 image pairs, sourcing, anti-pattern uniqueness, `src/app.ts` ≤1050 lines.
- Brand mark: `assets/icons/atlas-mark.svg` (currentColor line mark; no emoji glyphs in shell UI).

## Agent Plugin Surface

저장소는 정적 사이트인 동시에 멀티호스트 에이전트 플러그인이다. 사이트를 렌더링하는
`assets/data/*.json`을 스킬이 그대로 읽으므로 데이터 사본이 존재하지 않는다.

```text
plugin.json                  # agy 매니페스트
.claude-plugin/plugin.json   # Claude Code 매니페스트
.claude-plugin/marketplace.json
.codex-plugin/plugin.json    # Codex 매니페스트
skills/style/SKILL.md        # SoT — ism 49종 질의
skills/effect/SKILL.md       # SoT — UI 패턴 94종 질의
.claude/skills/style  -> ../../skills/style    # 발견용 심링크 (git mode 120000)
.claude/skills/effect -> ../../skills/effect
commands/                    # 예약(비어 있음)
docs/PLUGIN.md               # 설치·사용·문제 해결
```

- `skills/`가 유일한 SoT이고 `.claude/skills/`는 심링크다. 문서를 복제하지 않는다.
- 플러그인 파일은 `scripts/stage-pages.mjs`의 허용목록 밖이라 배포 트리에 들어가지
  않는다. `assetDirs`는 `assets/{css,data,icons,images,js}`뿐이고 `copyTree`는 저장소
  루트를 순회하지 않으며, `docs`는 `forbiddenTop`에도 등재돼 있다.
- 스킬이 인용하는 필드명은 실제 JSON과 일치해야 한다. `dev-guides.json`의
  `implementation`은 문자열이 아니라 `{summary, components, build, checks}` 객체다.
- Effects guide images are generated for all 94 entries and shown in the modal only.
- The current ISMS expansion generated 24 candidate UI mockups for 8 newly added ISMS, plus matching WebP previews.

## Current Feature Contracts

- Main ISM modal: title, tagline, history, description, WebP preview image, always-open main prompt, collapsible secondary prompts, 3 visible example links plus expand button, keyword-derived related ISMs, and PNG lightbox.
- Effects catalog: 94 entries (46 patterns + 48 visual effects), 94 unique `demo.type` values, 94 registry entries in `src/effects-demos.ts`, 94 original PNG guide images, 94 generated WebP guide previews, and 94 long-form docs records in `assets/data/effects-docs.json`; family axis with 7 values, family/device/q URL persistence via `src/effects-filters.ts`, delegated demo interactions via `src/effects-interactions.ts`, validator `scripts/verify-effects.mjs` (`npm run verify:effects`).
- ISMS expansion: 8 generated styles are now part of `assets/data/isms.json`; there is no public reference/backlog page.
- Prompt data: `assets/data/research-prompts.json`, `devlog/260510_nav_taxonomy_effect_docs/grok_research_prompts.md`, `image_jobs.jsonl`, and `ima2_results.json` record the current 24-job Grok/ima2 ISM batch.
- Sister catalogs (design encyclopedia, 2026-07-18): `color.html` (25 role-based palettes with dark variants and normative WCAG AA contrast checks), `typography.html` (20 font pairings with live webfont specimens via union text= subsets), `layout.html` (25 responsive section patterns with 3-viewport wireframe comparison via `src/layout-wireframes.ts`), `motion.html` (20 motion recipes with strict easing parsing and curve SVGs via `src/motion-demos.ts`). All run on `src/catalog-shell.ts` (shared modal/lightbox/hash primitives) and are validated by `scripts/verify-catalog.mjs` domain branches plus per-domain guide ledgers under `devlog/_fin/260717_design-encyclopedia-upgrade/`. Cross-catalog reverse links render in ISM modals via `src/app-crosslinks.ts`.
- Shared navigation: all seven public pages expose the six axes Isms / Catalog / FAQ / GitHub / Lang / Count in identical order; the Catalog axis is a dropdown (`src/nav-dropdown.ts` → `assets/js/nav-dropdown.js`) listing Effects / Color / Typography / Layout / Motion with not-yet-live entries marked `aria-disabled` + "준비 중"; `scripts/verify-nav.mjs` (via `npm run verify:nav`) enforces order, single `aria-current` (on the Catalog trigger for catalog pages), dropdown wiring, GitHub disclosure, typed lang button, count labels, skip link, and main landmark.
- FAQ: 3 categories × 6 items = 18 bilingual answers with per-item sources and review dates in `assets/data/faq.json`; renderer validates counts/locales/URLs and fails visibly.
- Verification for visual changes: `npm run verify`, plus browser desktop/mobile checks for card count, unique demo classes, horizontal overflow, and console errors.
- Verification for image changes: candidate generation and review are recorded in `092_image_generation_attempts/`; approved originals, previews, prompt records, and manifest rows are applied together before `npm run verify`.
- Image pipeline: `scripts/generate-thumbnails.mjs` (sharp, 768×512 WebP, `--force`/`--scope`), four complete contact-sheet builders (three 7×7 ISM sheets plus one 8×8 Effects sheet), `scripts/audit-effect-guides.mjs` (manifest-bound dimensions/hash/orphan gate), and `scripts/verify-image-quality.mjs` (211-slot immutable legacy baseline + catalog-addition live-hash gate).
- The completion audit replaced exactly `minimalism/landing.png` and `indie-web/landing.png`; all other raster paths are verified against the immutable 422-file baseline.
- Release integrity: `scripts/sync-sot.mjs`, `verify-generated.mjs`, `verify-content.mjs`, `verify-assets.mjs`, `verify-line-limits.mjs`, and `stage-pages.mjs`; `.pages/manifest.json` is the deterministic public-file receipt.
- Hosting boundary: `.github/workflows/ci.yml` verifies and stages on branch/PR work; deploy verifies, stages, then uploads `.pages` only.

## Documentation

```text
devlog/260510_mobile_ux_effects/
├── 00_overview.md
├── 01_data_content.md
├── 02_ui_interaction.md
├── 03_motion_accessibility.md
├── 04_image_guide_pipeline.md
├── 05_verification_deploy.md
└── AUDIT.md

devlog/260510_nav_taxonomy_effect_docs/
├── 00_overview.md
├── 01_parallel_research_image_pipeline.md
├── 02_navigation_ia.md
├── 03_ism_taxonomy_reference_backlog.md
├── 04_effects_docs_schema.md
├── 05_runtime_implementation_plan.md
├── 06_verification_source_of_truth.md
├── grok_research_prompts.md
├── image_jobs.jsonl
├── ima2_results.json
└── AUDIT.md
```

This phase folder records the Jawdev/PABCD-style plan, GPT Pro review result, and final verification notes for the Frontend UI Candidates release.

The `260510_nav_taxonomy_effect_docs` folder records the follow-up implementation that added shared navigation, long-form effects docs, Grok/ima2 prompt artifacts, and the 24-image ISMS expansion batch. A previously public reference page was removed from the runtime after user correction; official design-system links remain only as source references for effects documentation.
