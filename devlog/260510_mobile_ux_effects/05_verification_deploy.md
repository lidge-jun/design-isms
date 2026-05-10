---
created: 2026-05-10
status: implemented
tags: [design-isms, verification, deploy, github-pages]
---

# Phase 5 — Verification and Deploy Plan

이 phase는 구현 후 실제 GitHub Pages에서 깨지지 않는지 확인한다. 이 프로젝트는 정적 배포라서 “로컬 파일은 되는데 배포 후 경로가 깨지는 문제”가 가장 흔한 리스크다.

---

## Goal

- [ ] TypeScript compile과 build 산출물이 일치한다.
- [ ] `effects.html`이 상대 경로로 모든 asset을 로드한다.
- [ ] 모바일/데스크톱에서 layout overflow가 없다.
- [ ] modal, lightbox, toast, filter, search가 동작한다.
- [ ] GitHub Pages 배포 후 직접 URL이 응답한다.

## Required Commands

```bash
npm run typecheck
npm run build
npm run verify
```

현재 `npm run verify`는 typecheck와 build를 포함한다. 구현 후에는 `npm run verify`를 최종 gate로 사용한다.

## Static Path Checks

모든 path는 GitHub Pages project site 기준에서 상대 경로여야 한다.

| Good | Bad |
| --- | --- |
| `./assets/css/style.css` | `/assets/css/style.css` |
| `./assets/js/effects.js` | `/assets/js/effects.js` |
| `./assets/data/effects.json` | `/assets/data/effects.json` |
| `./assets/images/effects/...` | `/images/effects/...` |

## Manual Browser QA

### Desktop

- `index.html` loads existing ISM board
- Header `Effects` link opens `effects.html`
- `effects.html` renders 46 cards
- Category filter changes visible cards
- Search finds aliases such as `아래 팝업`, `회색 로딩`, `옆으로 밀기`
- Card click opens modal
- Modal close button works
- Overlay click closes modal
- Escape closes modal

### Mobile

Viewport widths:

```text
360px
375px
390px
430px
640px
```

Checks:

- Header does not overflow
- Search input does not exceed viewport
- Cards are one column under 640px
- Mini demos stay inside phone frame
- Modal scrolls internally
- Close button remains reachable
- Sticky CTA demo does not cover modal controls
- Swipe demo has non-gesture fallback
- `./effects.html`, `./index.html`, and `./assets/...` links work from project-site path

## Accessibility QA

- All interactive cards are buttons or keyboard-activatable elements.
- Focus indicator is visible.
- Escape closes modal.
- Focus returns to the opened card.
- Tab and Shift+Tab stay inside the active modal/lightbox.
- Modal has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
- Guide image has alt text.
- Reduced motion setting stops nonessential animation.
- Toast is not used as the only error channel.

## Performance QA

- Animated properties are `transform` or `opacity`.
- No long-running global scroll listener.
- No layout shift when demo starts.
- Guide images are lazy loaded.
- Card animation does not run for every offscreen card forever.
- Offscreen demo animation is paused.

## Local Verification Result

Executed after implementation:

```bash
npm run verify
node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('assets/data/effects.json','utf8')); console.log(d.length)"
python3 -m http.server 4173 --bind 127.0.0.1
cli-jaw browser navigate "http://127.0.0.1:4173/effects.html"
cli-jaw browser console --json --clear --reload --duration 1500 --limit 20
```

Result:

- `npm run verify`: pass.
- `effects.json`: 46 rows parsed successfully.
- Guide images: 46 `guide.png` files generated and all are 1536x1024 PNG.
- `effects.html`: HTTP 200 from local static server.
- Browser snapshot: 46 keyboard-activatable effect cards rendered.
- Command Palette modal: opens from desktop candidate card.
- Bottom Sheet modal: opens from card, guide image loads at 1536x1024, lightbox opens, Escape closes lightbox first and modal second.
- Search: `데이터 테이블` finds `data-table` and related table candidates.
- Desktop filter: shows 23 desktop candidates.
- Mobile 390x844: 46 cards render in one column, console entries empty.
- Screenshots captured:
  - `/Users/jun/.cli-jaw-3468/screenshots/screenshot_1778394118499.png`
  - `/Users/jun/.cli-jaw-3468/screenshots/screenshot_1778394147140.png`
  - `/Users/jun/.cli-jaw-3468/screenshots/screenshot_1778394973295.png`

## Deploy Flow

```bash
git status --short
npm run verify
git add effects.html index.html assets/css/effects.css assets/css/effects-demos.css assets/data/effects.json src/effects.ts assets/js/effects.js assets/images/effects/ README.md AGENTS.md structure/ devlog/260510_mobile_ux_effects/
git commit -m "[agent] feat: add mobile UX effects catalog"
git push origin main
```

Commit and push require explicit user approval in the same turn. This document only defines the future deploy flow.

`assets/js/effects.js` is generated from `src/effects.ts`, but it must be committed because GitHub Pages publishes static files from the repository artifact.

## GitHub Pages Post-Deploy Checks

```text
https://lidge-jun.github.io/design-isms/
https://lidge-jun.github.io/design-isms/effects.html
https://lidge-jun.github.io/design-isms/assets/data/effects.json
```

Expected:

- `/design-isms/` still shows existing ISM board.
- `/design-isms/effects.html` shows effects page.
- `effects.json` is reachable and valid JSON.
- No 404 for `effects.js`, CSS, guide images.

## Rollback Plan

If deploy breaks:

1. Revert only `effects.html`, `src/effects.ts`, `assets/js/effects.js`, `assets/data/effects.json`, and effect CSS section.
2. Keep existing ISM board untouched.
3. Do not alter `assets/data/isms.json`.
4. Re-run `npm run verify`.
5. Push rollback only after explicit user approval.

## Completion Report Format

When implemented, report:

```text
Changed:
- effects.html
- src/effects.ts
- assets/js/effects.js
- assets/data/effects.json
- assets/css/effects.css
- assets/css/effects-demos.css

Verified:
- npm run verify: pass
- local effects.html: pass
- mobile 390: pass
- GitHub Pages URL: pass

Known limits:
- guide images only for 5 effects
- no external animation library
```
