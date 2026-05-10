---
created: 2026-05-10
status: planning
tags: [design-isms, ima2, guide-images, image-pipeline]
---

# Phase 4 — ima2 Guide Image Pipeline Plan

효과 페이지는 live demo만으로도 작동한다. 하지만 일부 효과는 “화면의 어느 부분이 무엇인지”를 설명하는 guide image가 있으면 훨씬 빨리 이해된다. ima2식 가이드 이미지는 선택형 보조 자료로 둔다.

---

## Goal

- [ ] 효과별 guide image 슬롯을 만든다.
- [ ] guide image가 없는 효과도 정상 렌더링한다.
- [ ] 첫 release는 5개 guide image만 만든다.
- [ ] 이미지는 모바일 화면 구조를 설명하는 diagram-like mockup으로 통일한다.
- [ ] 기존 lightbox로 확대 가능하게 한다.

## First Guide Image Set

| Effect | Image | Reason |
| --- | --- | --- |
| Bottom Sheet | `assets/images/effects/bottom-sheet/guide.png` | sheet, backdrop, drag handle, CTA 구분이 필요 |
| Swipe Action | `assets/images/effects/swipe-action/guide.png` | 숨겨진 action 영역 설명 필요 |
| Skeleton Loading | `assets/images/effects/skeleton-loading/guide.png` | placeholder와 실제 content mapping 설명 |
| Scroll Reveal | `assets/images/effects/scroll-reveal/guide.png` | viewport 진입과 등장 타이밍 설명 |
| Sticky CTA Bar | `assets/images/effects/sticky-cta-bar/guide.png` | 하단 고정 영역과 콘텐츠 가림 방지 설명 |

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
"demo": {
  "type": "bottom-sheet",
  "image": "guide.png",
  "imageAlt": "Bottom sheet guide showing backdrop, handle, option rows, and CTA"
}
```

Computed path:

```text
./assets/images/effects/{effect.id}/{effect.demo.image}
```

Schema rule:

- `demo.image` is optional.
- If `demo.image` exists, `demo.imageAlt` is required.
- If the image fails to load, hide the image frame and keep all text sections.

## Optional Thumbnail Plan

Current ISM images use WebP thumbnails. The effects guide set now has 46 PNG images, one `guide.png` per candidate. If card-level thumbnails are introduced later, extend thumbnail generation; v1 keeps these images modal-only.

Future paths:

```text
assets/images/effects/{effect-id}/guide.png
assets/images/effects/thumbs/{effect-id}/guide.webp
```

## Rendering Rules

- Show guide image below the live demo in modal.
- Keep it collapsed by default only if modal feels too long.
- Clicking guide image opens existing lightbox.
- If image fails to load, hide image frame and keep text sections.
- Do not place guide images inside cards for v1; cards should stay light.
- Use `loading="lazy"` and `decoding="async"`.
- Set width/height or fixed `aspect-ratio` to avoid layout shift.
- Alt text describes the instructional content, not just the effect name.
- If guide images grow beyond 5, generate WebP thumbs before using them in card-level UI.

## Diff-Level Plan

### OPTIONAL NEW files

```text
assets/images/effects/bottom-sheet/guide.png
assets/images/effects/swipe-action/guide.png
assets/images/effects/skeleton-loading/guide.png
assets/images/effects/scroll-reveal/guide.png
assets/images/effects/sticky-cta-bar/guide.png
```

### MODIFY `src/effects.ts`

- Add optional image renderer
- Add lightbox event binding for guide images
- Add image error fallback
- Add `imageAlt` validation when `image` is present

### MODIFY `assets/css/style.css`

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
