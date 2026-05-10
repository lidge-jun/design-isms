# Design -isms

35개 디자인 ism을 한 번에 훑어보는 시각 레퍼런스 보드입니다. 각 스타일은 AI mockup 이미지, 역사/맥락, 컬러 팔레트, 실제 사이트 예시, 이미지 생성 프롬프트, 관련 ISM, 그리고 팝업 하단의 개발 가이드까지 함께 제공합니다.

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

## Project Structure

```text
701_design-isms/
├── index.html
├── assets/
│   ├── css/style.css
│   ├── data/isms.json
│   ├── images/{ism-id}/*.png
│   ├── images/thumbs/{ism-id}/*.webp
│   └── js/app.js
├── src/app.ts
├── scripts/generate-thumbnails.mjs
├── devlog/
├── package.json
└── tsconfig.json
```

## Development

```bash
npm install
npm run typecheck
npm run build
```

The browser entry file is still `assets/js/app.js` for GitHub Pages. Edit `src/app.ts`, then run `npm run build`.

## Image Pipeline

```bash
npm run images:thumbs
```

The static page uses WebP thumbnails for cards and modal images. The original 1536x1024 PNG files are kept for click-to-zoom lightbox views.

## Data

- Edit core ISM data in `assets/data/isms.json`.
- Add original images under `assets/images/{ism-id}/`.
- Regenerate thumbnails after changing images.
- Keep image filenames aligned with `isms.json`.

## Deploy

GitHub Pages deploys automatically on `main` pushes through `.github/workflows/deploy.yml`.

```bash
git add -A
git commit -m "[agent] feat: update design isms"
git push origin main
```
