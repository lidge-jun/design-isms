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
| `index.html` | 43개 디자인 ism 레퍼런스 보드 | `assets/js/app.js` | `assets/data/isms.json` |
| `effects.html` | 모바일/데스크탑 프런트엔드 UI 후보군 보드와 효과별 문서 모달 | `assets/js/effects-demos.js`, `assets/js/effects-docs.js`, `assets/js/effects.js` | `assets/data/effects.json`, `assets/data/effects-docs.json` |

## Source and Build

```text
src/app.ts           -> assets/js/app.js
src/effects-demos.ts -> assets/js/effects-demos.js
src/effects-docs.ts  -> assets/js/effects-docs.js
src/effects.ts       -> assets/js/effects.js
```

- TypeScript source is the editable logic layer.
- `assets/js/*.js` is committed because GitHub Pages serves static files directly.
- Run `npm run verify` before claiming implementation is complete.
- Do not edit generated browser JS without making the matching `src/*.ts` source change and rebuilding.

## Assets

```text
assets/images/{ism-id}/*.png
assets/images/thumbs/{ism-id}/*.webp
assets/images/effects/{effect-id}/guide.png
assets/images/thumbs/effects/{effect-id}/guide.webp
```

- ISM cards use generated thumbnails and original PNG lightbox views.
- Effects cards use CSS demos.
- Effects demo registry provides one dedicated demo type per 46 candidates.
- Effects modal guide previews and ISM card previews use WebP and keep original PNGs for source/lightbox use.
- Effect demo styling is split between `assets/css/effects.css`, `assets/css/effects-docs.css`, `assets/css/effects-demos.css`, and `assets/css/effects-demos-candidates.css`.
- Shared static navigation styling lives in `assets/css/nav.css`.
- Effects guide images are generated for all 46 candidates and shown in the modal only.
- The current ISMS expansion generated 24 candidate UI mockups for 8 newly added ISMS, plus matching WebP previews.

## Current Feature Contracts

- Main ISM modal: title, tagline, history, description, WebP preview image, always-open main prompt, collapsible secondary prompts, 3 visible example links plus expand button, keyword-derived related ISMs, and PNG lightbox.
- Effects catalog: 46 entries, 46 unique `demo.type` values, 46 registry entries in `src/effects-demos.ts`, 46 original PNG guide images, 46 generated WebP guide previews, and 46 long-form docs records in `assets/data/effects-docs.json`.
- ISMS expansion: 8 generated styles are now part of `assets/data/isms.json`; there is no public reference/backlog page.
- Prompt data: `assets/data/research-prompts.json`, `devlog/260510_nav_taxonomy_effect_docs/grok_research_prompts.md`, `image_jobs.jsonl`, and `ima2_results.json` record the current 24-job Grok/ima2 ISM batch.
- Shared navigation: `index.html` and `effects.html` expose Isms, Effects, GitHub, language toggle, and count where applicable.
- Verification for visual changes: `npm run verify`, plus browser desktop/mobile checks for card count, unique demo classes, horizontal overflow, and console errors.
- Verification for image changes: `npm run images:thumbs` before `npm run verify`.

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
