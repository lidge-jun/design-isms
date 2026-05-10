---
created: 2026-05-10
status: implemented
tags: [ima2, webp, research, parallel-pipeline]
---

# Phase 1 — Parallel Research and Image Pipeline

## Goal

이미지 생성은 전량 비동기로 먼저 걸고, 생성이 돌아가는 동안 자료조사와 문서 구조화를 병렬 진행한다. 런타임은 WebP preview만 우선 로드하고 PNG 원본은 확대/보존용으로 남긴다.

## Implemented Result

- `image_jobs.jsonl`에 32개 job을 확정했다.
- `ima2 ping`으로 `http://127.0.0.1:3469` server와 provider 상태를 확인했다.
- `ima2 gen --stdin -q high -s 1536x1024 -o <target.png> --json --timeout 300` 형태로 32개 job을 병렬 실행했다.
- `ima2_results.json` 기준 32개 성공, 0개 실패다.
- `npm run images:thumbs`로 신규 PNG의 WebP preview를 생성했다.

## Current Constraints

- Existing ISM original images: `assets/images/{ism-id}/*.png`
- Existing ISM WebP previews: `assets/images/thumbs/{ism-id}/*.webp`
- Existing effects guide originals: `assets/images/effects/{effect-id}/guide.png`
- Existing effects guide WebP previews: `assets/images/thumbs/effects/{effect-id}/guide.webp`
- Thumbnail generator already exists: `scripts/generate-thumbnails.mjs`
- Static Pages load generated browser JS directly.

## Parallel Workstreams

| Stream | Runs First? | Owner | Output |
| --- | --- | --- | --- |
| A. Candidate manifest | yes | Boss | exact list of new ISMS/references/effects diagrams to generate |
| B. ima2 batch generation | after manifest | image process | PNG originals in deterministic folders |
| C. Research collection | parallel with B | Boss / researcher | source notes, history, usage examples |
| D. Data drafting | parallel with B/C | Boss | JSON stubs with IDs, names, categories |
| E. WebP generation | after image files land | script | WebP previews for all new originals |
| F. Runtime integration | after data/image docs approved | Boss | static page rendering |
| G. Verification | after integration | Boss | typecheck/build/browser QA |

## Batch Manifest Design

Implemented manifest:

```text
devlog/260510_nav_taxonomy_effect_docs/image_jobs.jsonl
devlog/260510_nav_taxonomy_effect_docs/ima2_results.json
```

Manifest sections:

```markdown
# Generated Image Manifest

## ISM Additions
| id | image file | page type | prompt status | source PNG | WebP |

## Reference Cards
| id | image file | reference type | prompt status | source PNG | WebP |

## Effects Docs Diagrams
| effect id | diagram file | purpose | prompt status | source PNG | WebP |
```

The markdown manifest shape was replaced with newline-delimited JSON jobs so generation and verification can parse it directly.

## Image Sets

### Set 1 — New ISM Images

Each approved new ISM gets 3 originals:

```text
assets/images/{ism-id}/landing.png
assets/images/{ism-id}/shop.png
assets/images/{ism-id}/dashboard.png
assets/images/thumbs/{ism-id}/landing.webp
assets/images/thumbs/{ism-id}/shop.webp
assets/images/thumbs/{ism-id}/dashboard.webp
```

Default page-type mix:

| Slot | File | Why |
| --- | --- | --- |
| Primary | `landing.png` | immediately shows the style language |
| Commercial | `shop.png` or `pricing.png` | tests product/card density |
| Functional | `dashboard.png` or `mobile-app.png` | tests UI controls and data layout |

### Set 2 — Reference System Images

If `references.html` is approved, each reference card gets 1 guide image:

```text
assets/images/references/{reference-id}/overview.png
assets/images/thumbs/references/{reference-id}/overview.webp
```

These should be explanatory, not brand-copying screenshots. The prompt must avoid official logos and exact proprietary screen replication.

### Set 3 — Effects Docs Diagrams

Current 46 effects already have guide images. New diagrams are optional. If approved, prefer one diagram per documentation group, not 46 more by default:

```text
assets/images/effects-docs/{group-id}/flow.png
assets/images/thumbs/effects-docs/{group-id}/flow.webp
```

Recommended groups:

- Overlays: modal, bottom sheet, popover, tooltip, lightbox
- Navigation: drawer, tabs, breadcrumb, pagination, sticky tab bar
- Lists and data: table, virtual list, sticky table header, kanban
- Feedback: toast, toast stack, skeleton, validation, notification center
- Input and selection: date picker, segmented control, file dropzone
- Motion: scroll reveal, stagger, press scale, drag reorder, swipe action

## Async Execution Model

The plan assumes ima2 can accept all jobs at once. Still, the output must be deterministic and auditable.

1. Build `image_jobs.json` from the approved manifest.
2. Submit all jobs asynchronously.
3. Save every job response with `id`, target path, prompt, model, size, quality, status.
4. Poll until all jobs are completed or failed.
5. Write failed jobs to a retry list.
6. Convert all completed PNGs to WebP with `npm run images:thumbs`.
7. Do not update runtime data to point at images until files exist and WebP previews pass count checks.

## Job Record Shape

```json
{
  "id": "editorial-typography",
  "kind": "ism",
  "target": "assets/images/editorial-typography/landing.png",
  "webp": "assets/images/thumbs/editorial-typography/landing.webp",
  "prompt": "...",
  "model": "gpt-image-2",
  "size": "1536x1024",
  "quality": "high",
  "status": "queued"
}
```

## Prompt Rules

- UI mockup, no browser chrome, no real brand logos.
- Keep Korean labels only when the asset is instructional.
- For ISM images, show the visual style, not a literal historical poster.
- For reference-system images, create neutral interpretive diagrams; avoid copying proprietary UI exactly.
- For effects docs, show anatomy and state transitions.
- Avoid dark/blurred/cropped stock-like media; the user needs inspectable UI.

## WebP Loading Rules

- Cards and modal previews use WebP when available.
- Lightbox opens original PNG.
- Data keeps canonical original filename; runtime derives WebP path consistently.
- Missing WebP is a verification failure for new assets.

## Research While Images Run

During image generation, run these research queues:

| Queue | Target | Output |
| --- | --- | --- |
| Typography | type-led movements and web typography references | candidates and history notes |
| Classic movements | widely known design movements missing from 35 ISMS | add/skip decision table |
| Design systems | HIG, Material, Fluent, Carbon, Atlassian, Polaris | reference entries, not necessarily ISMS |
| Effects history | origin and adoption of each UI pattern group | `effects-docs.json` background/history drafts |
| Accessibility | APG/MDN mapping for dialogs, tabs, accordions, tooltips | verification checklist |

## Research Source Seeds

- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- Material Design 3: https://m3.material.io/
- Microsoft Fluent 2: https://fluent2.microsoft.design/
- IBM Carbon Design System: https://carbondesignsystem.com/
- Atlassian Design System: https://atlassian.design/design-system
- Shopify Polaris Web Components: https://shopify.dev/docs/api/app-home/web-components
- WAI-ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/
- MDN dialog role: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/dialog_role
- GitHub Pages docs: https://docs.github.com/en/pages

## Verification Gates

```bash
npm run images:thumbs
npm run verify
```

Additional count checks:

```bash
node -e "const fs=require('fs'); /* verify manifest targets exist */"
find assets/images/thumbs -name '*.webp' | wc -l
```

Browser checks after runtime integration:

- `index.html`: no broken image placeholders.
- `effects.html`: 46 cards remain, docs sections render, modal opens.
- Mobile 390px: no horizontal overflow.
- Console: no runtime errors.

## Failure Policy

- If a generation job fails, record it and retry only that job.
- If WebP conversion fails, do not wire that asset into data.
- If research contradicts a candidate label, mark the item `needs_review` instead of inventing certainty.
