# Design -isms

[![Deploy to GitHub Pages](https://github.com/lidge-jun/design-isms/actions/workflows/deploy.yml/badge.svg)](https://github.com/lidge-jun/design-isms/actions/workflows/deploy.yml)
![Isms](https://img.shields.io/badge/design--isms-43-E8642C)
![UI candidates](https://img.shields.io/badge/UI%20candidates-46-2C2C2C)

43개 디자인 ism을 한 번에 훑어보는 시각 레퍼런스 보드입니다. 각 스타일은 AI mockup 이미지, 역사/맥락, 컬러 팔레트, 실제 사이트 예시, 이미지 생성 프롬프트, 관련 ISM, 그리고 팝업 하단의 개발 가이드까지 함께 제공합니다.

별도 페이지 `effects.html`에서는 모바일과 데스크탑 프런트엔드 UI 후보군을 이름을 몰라도 찾아볼 수 있게 정리합니다. 카드별 미니 데모, 상세 모달, 접근성 체크, 성능 체크, 46개 전체 ima2 guide 이미지와 WebP preview, 그리고 효과별 배경/히스토리/사용 시점 문서를 포함합니다.

[Live Site](https://lidge-jun.github.io/design-isms/) · [Effects](https://lidge-jun.github.io/design-isms/effects.html) · [FAQ](https://lidge-jun.github.io/design-isms/faq.html) · [Repository](https://github.com/lidge-jun/design-isms)

## Status

- Source of truth counts: `assets/data/isms.json` = 43 design isms, `assets/data/effects.json` = 46 frontend UI candidates.
- GitHub Pages deploys from the repository root through `.github/workflows/deploy.yml`.
- The deployment workflow runs `npm ci` and `npm run verify` before uploading the Pages artifact.
- No root `LICENSE` file is currently declared, so this README intentionally does not advertise an open-source license badge.
- Repository description metadata may lag behind the data files; trust the JSON counts and this README for current counts.

## What It Shows

- 43 design -isms from Minimalism to Pop Art
- 129 AI-generated ISM mockup images
- 129 lightweight ISM WebP thumbnails for fast card/modal loading
- Original PNG lightbox only when the user clicks an image
- 10 real website examples per ism, initially collapsed to 3
- Modal detail view with history, prompts, palette, keywords, related ISMs
- Development guide per ism: fitting components, build method, verification points
- Korean/English UI toggle
- Frontend UI Candidates page with 46 mobile, desktop, and shared patterns
- 46 dedicated live demo animation types for the candidate cards and modals
- 46 guide images under `assets/images/effects/`
- 46 guide WebP previews under `assets/images/thumbs/effects/`
- Long-form effect documentation in `assets/data/effects-docs.json`
- 8 newly added ima2-generated ISM styles: Editorial Typography, Variable Typography, Monospace / Terminal UI, Pixel Art UI, De Stijl, Constructivism, Isometric 3D UI, and Pop Art
- Grok research prompts and ima2 prompt manifests for the ISM/effects expansion batch

## Implementation Principles

- README, `AGENTS.md`, `structure/README.md`, and `devlog/` must stay aligned with the shipped behavior.
- `src/*.ts` is the editable source; `assets/js/*.js` is generated output and still committed because GitHub Pages serves static files directly.
- The site uses plain static scripts, not `script type="module"`. Keep script order explicit in HTML.
- The shared top navigation is duplicated in static HTML and must stay consistent across `index.html` and `effects.html`.
- The ISM modal is implemented: history appears under the title, the main prompt is always visible, secondary prompts are collapsible, example sites show 3 first and expand to the rest, and related ISMs are computed from keyword overlap.
- The effects page is a 46-candidate catalog across mobile, desktop, and shared frontend UI patterns.
- Every effects candidate must have a dedicated `demo.type` equal to its effect `id`, and that type must exist in `src/effects-demos.ts`. Do not reuse a generic seed demo for a new candidate.
- Effects long-form writing lives in `assets/data/effects-docs.json` and renders through `src/effects-docs.ts`. Keep `assets/data/effects.json` compact for operational card/demo data.
- Every effects guide image keeps the original PNG at `assets/images/effects/{effect-id}/guide.png` and uses a generated WebP preview at `assets/images/thumbs/effects/{effect-id}/guide.webp`.
- New ISM images keep originals at `assets/images/{ism-id}/` and runtime previews under `assets/images/thumbs/{ism-id}/`.
- Do not publish a separate reference/backlog page; generated visual styles belong in the ISMS catalog or the Effects catalog.
- Any visual or image pipeline change must run `npm run verify`; image changes must also run `npm run images:thumbs`.

## Project Structure

```text
701_design-isms/
├── index.html
├── effects.html
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   ├── nav.css
│   │   ├── effects.css
│   │   ├── effects-docs.css
│   │   ├── effects-demos.css
│   │   └── effects-demos-candidates.css
│   ├── data/
│   │   ├── isms.json
│   │   ├── effects.json
│   │   ├── effects-docs.json
│   │   └── research-prompts.json
│   ├── images/{ism-id}/*.png
│   ├── images/effects/{effect-id}/guide.png
│   ├── images/thumbs/{ism-id}/*.webp
│   ├── images/thumbs/effects/{effect-id}/guide.webp
│   └── js/
│       ├── effects-demos.js
│       ├── effects-docs.js
│       ├── app.js
│       └── effects.js
├── src/
│   ├── app.ts
│   ├── effects-demos.ts
│   ├── effects-docs.ts
│   └── effects.ts
├── scripts/generate-thumbnails.mjs
├── scripts/prepare-expansion-data.mjs
├── structure/
├── devlog/
├── package.json
└── tsconfig.json
```

## Development

```bash
npm install
npm run verify
npm run typecheck
npm run build
```

The browser entry files are generated for GitHub Pages:

- Edit `src/app.ts`, then run `npm run build` for `assets/js/app.js`.
- Edit `src/effects-demos.ts`, `src/effects-docs.ts`, or `src/effects.ts`, then run `npm run build` for `assets/js/effects-demos.js`, `assets/js/effects-docs.js`, and `assets/js/effects.js`.

## Verification Policy

- Run `npm run verify` after any TypeScript, data, or HTML change.
- Run `npm run images:thumbs` before `npm run verify` after adding or replacing PNG guide/mockup images.
- Check `index.html`, `effects.html`, and `faq.html` locally before publishing because GitHub Pages serves static files directly.
- Do not claim new ISM/effect counts until the matching JSON files and UI counts agree.
- Keep `README.md`, `AGENTS.md`, `structure/README.md`, and public page copy aligned with the shipped behavior.

## Image Pipeline

```bash
npm run images:thumbs
```

The static pages use WebP thumbnails/previews for card and modal image loading. The original 1536x1024 PNG files are kept for click-to-zoom lightbox views and source preservation.

Expansion image batches are generated from deterministic manifests. The current ima2 command shape is:

```bash
ima2 ping
ima2 gen --stdin -q high -s 1536x1024 -o <target.png> --json --timeout 300
```

The current expansion batch generated 24 new ISM PNG originals and `npm run images:thumbs` generated matching WebP previews.

## Data

- Edit core ISM data in `assets/data/isms.json`.
- Edit frontend UI candidate data in `assets/data/effects.json`.
- Edit frontend UI long-form documentation in `assets/data/effects-docs.json`.
- Edit reusable Grok/ima2 prompt records in `assets/data/research-prompts.json`.
- Add original images under `assets/images/{ism-id}/`.
- Add guide images under `assets/images/effects/{effect-id}/guide.png`.
- Regenerate thumbnails with `npm run images:thumbs` after changing images.
- Keep image filenames aligned with `isms.json`.

## Deploy

GitHub Pages deploys automatically on `main` pushes through `.github/workflows/deploy.yml`.
Agents should commit or push only when the user explicitly asks in the same turn.

```bash
git add -A
git commit -m "[agent] feat: update design isms"
git push origin main
```
