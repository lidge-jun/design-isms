# Design -isms

35개 디자인 ism을 한 번에 훑어보는 시각 레퍼런스 보드입니다. 각 스타일은 AI mockup 이미지, 역사/맥락, 컬러 팔레트, 실제 사이트 예시, 이미지 생성 프롬프트, 관련 ISM, 그리고 팝업 하단의 개발 가이드까지 함께 제공합니다.

별도 페이지 `effects.html`에서는 모바일과 데스크탑 프런트엔드 UI 후보군을 이름을 몰라도 찾아볼 수 있게 정리합니다. 카드별 미니 데모, 상세 모달, 접근성 체크, 성능 체크, 그리고 46개 전체 ima2 guide 이미지와 WebP preview를 포함합니다.

[Live Site](https://lidge-jun.github.io/design-isms/) · [Repository](https://github.com/lidge-jun/design-isms)

## What It Shows

- 35 design -isms from Minimalism to Indie Web
- 105 AI-generated mockup images
- 105 lightweight WebP thumbnails for fast card/modal loading
- Original PNG lightbox only when the user clicks an image
- 10 real website examples per ism, initially collapsed to 3
- Modal detail view with history, prompts, palette, keywords, related ISMs
- Development guide per ism: fitting components, build method, verification points
- Korean/English UI toggle
- Frontend UI Candidates page with 46 mobile, desktop, and shared patterns
- 46 dedicated live demo animation types for the candidate cards and modals
- 46 guide images under `assets/images/effects/`
- 46 guide WebP previews under `assets/images/thumbs/effects/`

## Implementation Principles

- README, `AGENTS.md`, `structure/README.md`, and `devlog/` must stay aligned with the shipped behavior.
- `src/*.ts` is the editable source; `assets/js/*.js` is generated output and still committed because GitHub Pages serves static files directly.
- The site uses plain static scripts, not `script type="module"`. Keep script order explicit in HTML.
- The ISM modal is implemented: history appears under the title, the main prompt is always visible, secondary prompts are collapsible, example sites show 3 first and expand to the rest, and related ISMs are computed from keyword overlap.
- The effects page is a 46-candidate catalog across mobile, desktop, and shared frontend UI patterns.
- Every effects candidate must have a dedicated `demo.type` equal to its effect `id`, and that type must exist in `src/effects-demos.ts`. Do not reuse a generic seed demo for a new candidate.
- Every effects guide image keeps the original PNG at `assets/images/effects/{effect-id}/guide.png` and uses a generated WebP preview at `assets/images/thumbs/effects/{effect-id}/guide.webp`.
- Any visual or image pipeline change must run `npm run verify`; image changes must also run `npm run images:thumbs`.

## Project Structure

```text
701_design-isms/
├── index.html
├── effects.html
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   ├── effects.css
│   │   ├── effects-demos.css
│   │   └── effects-demos-candidates.css
│   ├── data/
│   │   ├── isms.json
│   │   └── effects.json
│   ├── images/{ism-id}/*.png
│   ├── images/effects/{effect-id}/guide.png
│   ├── images/thumbs/{ism-id}/*.webp
│   ├── images/thumbs/effects/{effect-id}/guide.webp
│   └── js/
│       ├── effects-demos.js
│       ├── app.js
│       └── effects.js
├── src/
│   ├── app.ts
│   ├── effects-demos.ts
│   └── effects.ts
├── scripts/generate-thumbnails.mjs
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
- Edit `src/effects-demos.ts` or `src/effects.ts`, then run `npm run build` for `assets/js/effects-demos.js` and `assets/js/effects.js`.

## Image Pipeline

```bash
npm run images:thumbs
```

The static pages use WebP thumbnails/previews for card and modal image loading. The original 1536x1024 PNG files are kept for click-to-zoom lightbox views.

## Data

- Edit core ISM data in `assets/data/isms.json`.
- Edit frontend UI candidate data in `assets/data/effects.json`.
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
