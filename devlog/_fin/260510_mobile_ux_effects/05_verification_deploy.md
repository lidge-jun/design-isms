---
created: 2026-05-10
status: implemented
tags: [design-isms, verification, deploy, github-pages]
---

# Phase 5 — Verification and Deploy Plan

이 phase는 구현 후 실제 GitHub Pages에서 깨지지 않는지 확인한다. 이 프로젝트는 정적 배포라서 “로컬 파일은 되는데 배포 후 경로가 깨지는 문제”가 가장 흔한 리스크다.

---

## Goal

- [x] TypeScript compile과 build 산출물이 일치한다.
- [x] `effects.html`이 상대 경로로 모든 asset을 로드한다.
- [x] 모바일/데스크톱에서 layout overflow가 없다.
- [x] modal, lightbox, toast, filter, search가 동작한다.
- [x] GitHub Pages 배포 후 직접 URL이 응답한다.
- [x] effects guide WebP preview 46개가 생성된다.

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
| `./assets/images/thumbs/effects/...` | `/images/thumbs/effects/...` |

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
- Guide originals: 46 `guide.png` files generated and all are 1536x1024 PNG.
- Guide previews: 46 `guide.webp` files generated under `assets/images/thumbs/effects/`.
- Size check: 46 original PNGs total about 61M; 46 WebP previews total about 1.0M.
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

## Final Optimization Verification Result

Executed after WebP preview optimization:

```bash
npm run images:thumbs
npm run verify
npm run verify
node -e "...effects/json + image integrity..."
cli-jaw browser navigate "http://127.0.0.1:4173/effects.html"
cli-jaw browser console --json --clear --reload --duration 1500 --limit 20
```

Result:

- `npm run images:thumbs`: 46 generated, 105 fresh, 151 total.
- `npm run verify`: pass after WebP implementation.
- Repeat `npm run verify`: pass after mobile overflow fix.
- `effects.json`: 46 rows parsed successfully.
- Guide originals: 46 PNG files, no missing file, all 1536x1024.
- Guide previews: 46 WebP files under `assets/images/thumbs/effects/`.
- Demo registry: 46 effects, 46 unique `demo.type` values, no mismatch between effect id and demo type.
- Size check: PNG total 60.47MB, WebP total 0.94MB, about 98.5% smaller.
- Browser DOM: 46 cards render.
- Browser demo check: 46 cards expose 46 unique `.effect-demo-*` classes; no duplicate demo classes.
- Browser animation samples: `mega-menu` uses `menuDrop`, `command-palette` uses `commandPop`, `data-table` uses `rowHighlight`, `kanban-board` uses `cardMove`, `notification-center` uses `notifySlide`, `file-dropzone` uses `dropPulse`.
- Browser image check: modal preview `currentSrc` uses `assets/images/thumbs/effects/bottom-sheet/guide.webp`.
- Browser lightbox check: lightbox opens `assets/images/effects/bottom-sheet/guide.png`.
- Browser console after reload: empty.
- Mobile 390x844: 46 cards, 46 unique demo classes, one grid column, `scrollWidth` equals viewport width, no horizontal overflow.

## Deploy Flow

```bash
git status --short
npm run verify
git add effects.html index.html assets/css/effects.css assets/css/effects-demos.css assets/css/effects-demos-candidates.css assets/data/effects.json src/effects.ts src/effects-demos.ts assets/js/effects.js assets/js/effects-demos.js assets/images/effects/ assets/images/thumbs/effects/ README.md AGENTS.md structure/ devlog/260510_mobile_ux_effects/
git commit -m "[agent] feat: add mobile UX effects catalog"
git push origin main
```

Commit and push require explicit user approval in the same turn. This document only defines the future deploy flow.

`assets/js/effects.js` and `assets/js/effects-demos.js` are generated from `src/effects.ts` and `src/effects-demos.ts`, but both must be committed because GitHub Pages publishes static files from the repository artifact.

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
- assets/js/effects-demos.js
- src/effects-demos.ts
- assets/data/effects.json
- assets/css/effects.css
- assets/css/effects-demos.css
- assets/css/effects-demos-candidates.css

Verified:
- npm run verify: pass
- local effects.html: pass
- mobile 390: pass
- GitHub Pages URL: pass

Known limits:
- no external animation library
- commit/push require explicit user approval in the same turn
```
