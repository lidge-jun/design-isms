---
created: 2026-05-10
status: implemented
tags: [design-isms, ima2, guide-images, image-pipeline]
---

# Phase 4 — ima2 Guide Image Pipeline Plan

효과 페이지는 live demo만으로도 작동한다. 하지만 일부 효과는 “화면의 어느 부분이 무엇인지”를 설명하는 guide image가 있으면 훨씬 빨리 이해된다. ima2식 가이드 이미지는 선택형 보조 자료로 둔다.

---

## Goal

- [x] 효과별 guide image 슬롯을 만든다.
- [x] guide image가 없는 효과도 정상 렌더링한다.
- [x] 첫 release를 46개 guide image 전체 세트로 확장한다.
- [x] 46개 guide image를 WebP preview로 변환한다.
- [x] WebP preview는 modal에서 우선 로드하고 원본 PNG는 lightbox 확대용으로 유지한다.
- [x] 이미지는 모바일/데스크탑 UI 구조를 설명하는 diagram-like mockup으로 통일한다.
- [x] 기존 lightbox로 확대 가능하게 한다.

## Guide Image Set

초기 계획은 5개 우선 생성이었지만, 최종 구현은 사용자 요청에 따라 46개 후보군 모두에 guide image와 WebP preview를 생성했다. 아래 5개는 시각 기준을 정한 seed set으로 남긴다.

| Effect | Original | Preview | Reason |
| --- | --- | --- |
| Bottom Sheet | `assets/images/effects/bottom-sheet/guide.png` | `assets/images/thumbs/effects/bottom-sheet/guide.webp` | sheet, backdrop, drag handle, CTA 구분이 필요 |
| Swipe Action | `assets/images/effects/swipe-action/guide.png` | `assets/images/thumbs/effects/swipe-action/guide.webp` | 숨겨진 action 영역 설명 필요 |
| Skeleton Loading | `assets/images/effects/skeleton-loading/guide.png` | `assets/images/thumbs/effects/skeleton-loading/guide.webp` | placeholder와 실제 content mapping 설명 |
| Scroll Reveal | `assets/images/effects/scroll-reveal/guide.png` | `assets/images/thumbs/effects/scroll-reveal/guide.webp` | viewport 진입과 등장 타이밍 설명 |
| Sticky CTA Bar | `assets/images/effects/sticky-cta-bar/guide.png` | `assets/images/thumbs/effects/sticky-cta-bar/guide.webp` | 하단 고정 영역과 콘텐츠 가림 방지 설명 |

## Image Style Direction

Guide image는 실제 앱 스크린샷처럼 보이되, 정보 설명이 목적이다.

```text
mobile phone frame
clean neutral background
one highlighted interaction area
thin arrows
short labels
no brand logo
no fake app name
consistent warm Design-isms palette
```

## Prompt Template

```text
A clean instructional mobile UX guide image for [EFFECT_NAME].
Show a realistic mobile web screen inside a phone frame.
Highlight [KEY_PARTS] with subtle arrows and short labels.
Use warm off-white background, charcoal text, muted orange accent.
Minimal editorial diagram style, premium UX documentation, no browser chrome, no real brand logos.
Aspect ratio 3:2, high quality, crisp UI labels.
```

## Example Prompt — Bottom Sheet

```text
A clean instructional mobile UX guide image for Bottom Sheet.
Show a realistic mobile web screen inside a phone frame.
Highlight the dim backdrop, rounded bottom sheet, drag handle, option rows, and primary CTA with subtle arrows and short labels.
Use warm off-white background, charcoal text, muted orange accent.
Minimal editorial diagram style, premium UX documentation, no browser chrome, no real brand logos.
Aspect ratio 3:2, high quality, crisp UI labels.
```

## Data Link

`effects.json` points to guide assets, but the UI must treat it as optional.

```json
"guide": {
  "file": "guide.png",
  "alt": "Bottom sheet guide showing backdrop, handle, option rows, and CTA",
  "prompt": "Clean instructional mobile UX guide image for Bottom Sheet..."
}
```

Computed paths:

```text
./assets/images/effects/{effect.id}/{effect.guide.file}
./assets/images/thumbs/effects/{effect.id}/guide.webp
```

Schema rule:

- `guide` is optional.
- If `guide` exists, `guide.file`, `guide.alt`, and `guide.prompt` are required.
- If the image fails to load, hide the image frame and keep all text sections.

## Implemented Thumbnail Plan

Current ISM images use WebP thumbnails. The effects guide set now follows the same rule: each candidate keeps original `guide.png` and has generated `guide.webp` under `assets/images/thumbs/effects/`.

Final paths:

```text
assets/images/effects/{effect-id}/guide.png
assets/images/thumbs/effects/{effect-id}/guide.webp
```

Generation command:

```bash
npm run images:thumbs
```

## Rendering Rules

- Show guide image below the live demo in modal.
- Use `<picture>` with WebP `<source>` and PNG fallback.
- Keep it collapsed by default only if modal feels too long.
- Clicking guide image opens existing lightbox with the original PNG path.
- If image fails to load, hide image frame and keep text sections.
- Do not place guide images inside cards for v1; cards should stay light.
- Use `loading="lazy"` and `decoding="async"`.
- Set width/height or fixed `aspect-ratio` to avoid layout shift.
- Alt text describes the instructional content, not just the effect name.
- WebP previews are generated before completion verification.

## Diff-Level Plan

### NEW files

```text
assets/images/effects/{effect-id}/guide.png
assets/images/thumbs/effects/{effect-id}/guide.webp
```

### MODIFY `src/effects.ts`

- Add optional image renderer
- Add WebP source + PNG fallback rendering
- Add lightbox event binding for guide images
- Add image error fallback
- Add `guide.file`, `guide.alt`, and `guide.prompt` validation when `guide` is present

### MODIFY `assets/css/effects.css`

- `.effect-guide-image`
- `.effect-guide-caption`
- `.effect-guide-placeholder`
- fixed aspect-ratio for guide frame

## Out Of Scope

- Generating all images in the implementation phase unless explicitly requested
- Complex SVG diagrams inside the page
- Animated GIF/video guides
- External CDN image hosting

## Verification

- Missing image does not break modal
- Existing lightbox can open guide image
- Mobile modal does not overflow horizontally
- Image alt text exists
- 46 WebP previews exist
- Modal `currentSrc` uses WebP-capable preview while lightbox opens original PNG
