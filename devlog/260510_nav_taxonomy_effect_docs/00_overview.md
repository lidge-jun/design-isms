---
created: 2026-05-10
status: implemented
tags: [design-isms, navigation, taxonomy, effects-docs, ima2, webp, jawdev]
---

# Overview — ISMS and Effects Docs Expansion

이번 작업은 `design-isms`를 “디자인 스타일 보드 + UI 효과 문서”로 확장하기 위한 상세 계획이었고, 2026-05-10에 구현까지 진행했다.

사용자 결정:

- ima2는 다음 확장 계획에서 사실상 무제한 비동기 생성이 가능하다고 간주한다.
- 이미지 생성은 전량 배치로 한 번에 걸어두고, 그동안 자료조사와 문서 구조를 진행한다.
- 런타임에서는 WebP preview를 우선 로딩하고 원본 PNG는 lightbox/source asset으로만 남겨 가볍게 유지한다.
- 구현 전 계획을 매우 상세히 문서화하고, 구현 후 README/AGENTS/structure/devlog를 맞춘다.
- 커밋/푸시는 사용자가 같은 턴에서 명시 요청하기 전까지 하지 않는다.

## Goal

- [x] `index.html`, `effects.html` 상단 메뉴의 누락 항목과 불일치를 정리한다.
- [x] ISMS에 빠진 typography, classic design movement 축을 보완해 메인 ISMS에 편입한다.
- [x] effects 46개 각각에 배경 해설, 사용 시점, 예시, 짧은 히스토리를 붙일 수 있는 문서 스키마를 구현한다.
- [x] ima2 병렬 생성과 자료조사를 동시에 굴리는 실행 순서를 명확히 한다.
- [x] WebP-first image loading 원칙을 모든 신규 이미지에도 적용한다.
- [x] README, AGENTS, structure, devlog source-of-truth 문서가 같은 말을 하도록 갱신한다.

## Current Signals

| Area | Current State | Gap |
| --- | --- | --- |
| Main page nav | `Isms`, `Effects`, GitHub, language toggle, count | resolved |
| Effects page nav | `Isms`, `Effects`, GitHub, language toggle, count | resolved |
| ISMS data | 43 styles in `assets/data/isms.json` | 8 ima2-generated additions integrated |
| Effects data | 46 candidates in `assets/data/effects.json` | compact fields only; long background/history docs 없음 |
| Images | ISM thumbnails and effects guide WebP previews | next expansion needs batch manifest and async pipeline |
| Source-of-truth | README/AGENTS/structure already aligned | next feature must update all docs together |

## Implemented Result

- Public `references.html` page는 사용자 피드백에 따라 제거했다.
- 8개 ISM 후보를 `assets/data/isms.json`에 직접 편입했다.
- `assets/data/research-prompts.json`, `grok_research_prompts.md`, `image_jobs.jsonl`, `ima2_results.json`으로 Grok/ima2 제반 준비를 보존했다.
- `assets/data/effects-docs.json`과 `src/effects-docs.ts`로 46개 effects 장문 문서를 모달 안에 렌더링한다.
- ima2 병렬 실행으로 24개 신규 ISM PNG를 생성했고 `npm run images:thumbs`로 WebP preview를 만들었다.
- `assets/css/nav.css`로 두 페이지의 공통 메뉴 상태를 맞췄다.

## Phase Map

| Phase | Doc | Output |
| --- | --- | --- |
| 1 | [01_parallel_research_image_pipeline.md](01_parallel_research_image_pipeline.md) | all-at-once ima2 + WebP plan, queue manifest, research parallelization |
| 2 | [02_navigation_ia.md](02_navigation_ia.md) | shared header/menu IA for both pages |
| 3 | [03_ism_taxonomy_reference_backlog.md](03_ism_taxonomy_reference_backlog.md) | missing ISM categories and candidate backlog |
| 4 | [04_effects_docs_schema.md](04_effects_docs_schema.md) | effects docs schema and per-effect writing template |
| 5 | [05_runtime_implementation_plan.md](05_runtime_implementation_plan.md) | file-level implementation plan after approval |
| 6 | [06_verification_source_of_truth.md](06_verification_source_of_truth.md) | validation matrix, docs consistency gate |
| Audit | [AUDIT.md](AUDIT.md) | risks, open questions, pre-build checklist |

## File Map After Implementation

```text
701_design-isms/
├── index.html                         # MODIFY: shared nav, 43 ISMS
├── effects.html                       # MODIFY: shared nav, language toggle
├── assets/
│   ├── css/nav.css                    # NEW: shared nav
│   ├── css/effects-docs.css           # NEW: effects docs modal sections
│   ├── data/
│   │   ├── isms.json                  # MODIFY: 43 core ISMS
│   │   ├── effects.json               # KEEP: compact operational fields
│   │   ├── effects-docs.json          # NEW: long-form background/history/use examples
│   │   └── research-prompts.json      # NEW: reusable Grok/ima2 prompt records
│   ├── images/
│   │   ├── {new-ism-id}/*.png         # NEW originals for ISMS additions
│   │   └── thumbs/
│   │       ├── {new-ism-id}/*.webp    # generated WebP previews
│   └── js/
│       ├── app.js                     # GENERATED from src/app.ts
│       ├── effects-docs.js            # GENERATED from src/effects-docs.ts
│       └── effects.js                 # GENERATED from src/effects.ts
├── src/
│   ├── app.ts                         # existing main runtime
│   ├── effects-docs.ts                # NEW docs validation/render helpers
│   └── effects.ts                     # MODIFY to fetch/render effects-docs.json
├── structure/README.md                # MODIFY
├── README.md                          # MODIFY
├── AGENTS.md                          # MODIFY
└── devlog/260510_nav_taxonomy_effect_docs/
```

## Non-Goals

- No commit/push without explicit same-turn request.
- No destructive deletion of existing ISMS, effects, images, or generated JS.
- No SPA router; keep real static pages and `./` relative assets for GitHub Pages.
- No new runtime dependency unless explicitly approved.
- No raw PNG loading in card/grid views when a WebP preview exists.

## Decisions Resolved For This Pass

1. New ISM additions are included directly in `assets/data/isms.json`.
2. `references.html` is not a runtime page.
3. Effects long-form docs render inside the current effects modal.
4. ima2 generated images for 8 ISM additions only.
