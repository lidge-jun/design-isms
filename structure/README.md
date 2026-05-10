# Design -isms Structure

이 문서는 현재 구현 상태를 기준으로 한 프로젝트 구조 요약입니다. README는 사용자용 개요, AGENTS.md는 작업 규칙, devlog는 변경 계획과 검증 기록, structure는 현재 source-of-truth 지도를 담당합니다.

## Runtime Pages

| Page | Purpose | Script | Data |
| --- | --- | --- | --- |
| `index.html` | 35개 디자인 ism 레퍼런스 보드 | `assets/js/app.js` | `assets/data/isms.json` |
| `effects.html` | 모바일/데스크탑 프런트엔드 UI 후보군 보드 | `assets/js/effects.js` | `assets/data/effects.json` |

## Source and Build

```text
src/app.ts      -> assets/js/app.js
src/effects.ts  -> assets/js/effects.js
```

- TypeScript source is the editable logic layer.
- `assets/js/*.js` is committed because GitHub Pages serves static files directly.
- Run `npm run verify` before claiming implementation is complete.

## Assets

```text
assets/images/{ism-id}/*.png
assets/images/thumbs/{ism-id}/*.webp
assets/images/effects/{effect-id}/guide.png
```

- ISM cards use generated thumbnails and original PNG lightbox views.
- Effects cards use CSS demos.
- Effect demo styling is split between `assets/css/effects.css` and `assets/css/effects-demos.css`.
- Effects guide images are generated for all 46 candidates and shown in the modal only.

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
```

This phase folder records the Jawdev/PABCD-style plan, GPT Pro review result, and final verification notes for the Frontend UI Candidates release.
