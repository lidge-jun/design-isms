---
created: 2026-05-10
status: planning
tags: [design-isms, motion, accessibility, performance]
---

# Phase 3 — Motion, Accessibility, and Performance Plan

모바일 UX 효과 페이지는 “움직임을 보여주는 페이지”라서 과해지기 쉽다. 기준은 간단하다. 실제 제품에 써도 되는 움직임만 넣고, 사용성을 해치는 motion은 데모에서 제외한다.

---

## Goal

- [ ] 모든 애니메이션은 `transform`과 `opacity` 중심으로 구현한다.
- [ ] `prefers-reduced-motion: reduce`에서 움직임을 끈다.
- [ ] modal, drawer, bottom sheet는 keyboard close와 focus return을 지원한다.
- [ ] touch target은 최소 44px를 유지한다.
- [ ] guide image와 demo가 텍스트를 가리지 않는다.

## Motion Tokens

```css
:root {
  --effect-duration-fast: 160ms;
  --effect-duration-base: 240ms;
  --effect-duration-slow: 360ms;
  --effect-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --effect-ease-inout: cubic-bezier(0.65, 0, 0.35, 1);
}
```

If global tokens are considered too invasive, scope them under `.effects-page`.

## Allowed Animated Properties

| Property | Allowed | Notes |
| --- | --- | --- |
| `transform` | Yes | translate, scale, rotate in tiny demos |
| `opacity` | Yes | fade in/out |
| `box-shadow` | Limited | hover only, small elements |
| `filter` | Limited | avoid animated blur on mobile |
| `height` | No | use max-height only for existing collapsibles, not core demos |
| `top/left/right/bottom` | No | causes layout jank |
| `width` | No | use transform scale or clip illusion |

## Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .effect-demo *,
  .effect-card,
  .modal-container {
    animation: none !important;
    transition: none !important;
  }
}
```

Reduced motion must not hide content. For reveal demos, show the final visible state. For bottom sheet, show the sheet open without movement.

## Modal Accessibility

| Requirement | Implementation |
| --- | --- |
| Dialog semantics | `role="dialog"` and `aria-modal="true"` |
| Label | `aria-labelledby` pointing to modal title |
| Close | close button, overlay click, Escape |
| Focus on open | modal container or first close button |
| Focus on close | previously active card/button |
| Keyboard | Tab order remains inside visible modal content |

First release must implement focus containment for effect modal and lightbox. Tab and Shift+Tab wrap inside the active dialog. Focus returns to the triggering card or button on close.

Implementation requirements:

- `.modal-container` or effect modal container has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
- Modal title has a stable id.
- Store `lastFocusedElement = document.activeElement` before open.
- Move focus to close button or modal title on open.
- Escape closes modal.
- Close restores focus to `lastFocusedElement`.
- Background content should be inert when available; fallback must prevent keyboard navigation into hidden background controls.
- Close button should be near 44px touch target size.
- Toast uses `role="status"` and `aria-live="polite"`.

## Effect-Specific Accessibility

### Bottom Sheet

- Provide close button.
- Do not rely on drag gesture only.
- Keep dimmed backdrop clickable but not the only close path.

### Swipe Action

- Provide visible button fallback.
- Do not make destructive action fire from swipe alone.
- Keyboard user must see equivalent action.

### Toast

- Do not use toast for critical errors.
- Keep message concise.
- If status is important, also update visible UI state.

### Skeleton Loading

- Use `aria-busy` on content region if representing real loading.
- In demo, label as demonstration so it is not mistaken for broken content.

### Segmented Control

- Use button roles and `aria-pressed` or tab semantics.
- Active state cannot rely on color only.

## Performance Rules

- Demo animation loops must be short and isolated.
- Avoid global scroll listeners. Use IntersectionObserver where possible.
- Do not animate all cards constantly. Animate demo internals only when visible.
- Avoid `backdrop-filter` on large full-screen layers when a simple translucent background is enough.
- Reuse existing lazy image/lightbox behavior for guide images.
- Use IntersectionObserver to add `.is-visible` to visible effect cards.
- Offscreen demos use `animation-play-state: paused`.
- `prefers-reduced-motion: reduce` removes nonessential animation and applies final-state styling.
- No requestAnimationFrame loops in v1.
- `will-change` is not applied globally; use only on small elements if measured jank appears.

## Swipe Safety

Swipe Action is a demo, not a destructive product interaction.

```css
.effect-demo-swipe {
  touch-action: pan-y;
}
```

- Pointer handlers bind only inside the phone-frame demo.
- If vertical movement exceeds horizontal intent threshold, cancel swipe.
- Swipe reveals the action area only; it never deletes or executes a dangerous action.
- A visible fallback action or textual equivalent is always present.
- Keyboard users can understand the same behavior without performing a gesture.

## QA Matrix

| Viewport | Must Check |
| --- | --- |
| 375 × 667 | card width, modal padding, sticky CTA demo |
| 390 × 844 | bottom sheet demo, full-screen modal |
| 430 × 932 | drawer and swipe demo |
| 768 × 1024 | two-column/tablet grid |
| 1440 desktop | grid density, modal max width |
| 360 × 740 | smallest common mobile overflow check |

## Diff-Level Plan

### MODIFY `assets/css/style.css`

- Add motion tokens
- Add `.effects-page` scoped styles
- Add reduced-motion overrides
- Add touch target minimums for effect controls

### NEW in `src/effects.ts`

- `getFocusableElements(container)`
- `rememberTriggerBeforeOpen()`
- `restoreFocusAfterClose()`
- `handleModalKeydown(event)`

### Avoid

- No library dependency
- No requestAnimationFrame loops
- No body-level wheel/touch hijacking
- No CSS animation that changes layout size

## Verification

- macOS/Chrome mobile emulation: no horizontal overflow
- Keyboard: open card, Escape close, focus returns
- Reduced motion emulation: demos stop moving but remain understandable
- Lighthouse-style manual check: no animation-driven content shift
