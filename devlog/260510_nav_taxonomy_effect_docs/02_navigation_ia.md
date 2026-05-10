---
created: 2026-05-10
status: implemented
tags: [navigation, information-architecture, header]
---

# Phase 2 — Navigation IA

## Goal

`index.html`, `effects.html`의 상단 메뉴를 같은 정보 구조로 맞춘다. 사용자는 “스타일을 보고 싶다”, “UI 효과명을 찾고 싶다”를 상단에서 바로 이동할 수 있어야 한다. 별도 reference/backlog 페이지는 공개 런타임에 두지 않는다.

## Implemented Header State

| Page | Current Items | Missing |
| --- | --- | --- |
| `index.html` | logo link, `Isms`, `Effects`, GitHub, language toggle, count | none known |
| `effects.html` | logo link, `Isms`, `Effects`, GitHub, language toggle, count | none known |

## Proposed Shared Nav

Desktop order:

```text
Logo | Isms | Effects | GitHub | Lang | Count
```

Mobile order:

```text
Logo
wrapped compact nav: Isms / Effects / GitHub / Lang / Count
```

## Nav Item Contract

| Label | URL | Current Page Behavior |
| --- | --- | --- |
| `Isms` | `./index.html` | `aria-current="page"` on index |
| `Effects` | `./effects.html` | `aria-current="page"` on effects |
| `GitHub` | repo external URL | `target="_blank" rel="noopener"` |
| Language | current JS toggle | present on both pages |
| Count | current page count | not a link |

## Recommendation

Correction: `References` was removed after user feedback. Generated visual-style candidates belong in `assets/data/isms.json`, and effect documentation belongs inside `effects.html` modals.

## HTML Diff Plan

`index.html`:

- Convert `.header-right` div to `<nav class="header-right" aria-label="Primary navigation">`.
- Make logo a link to `./index.html`.
- Add `Isms` link with `aria-current="page"`.
- Keep `Isms`, `Effects`, GitHub, language toggle, and count.
- Keep GitHub link.
- Keep language toggle.
- Keep count.

`effects.html`:

- Keep semantic `<nav>`.
- Keep `Isms`, `Effects`, GitHub, language toggle, and count.
- Add language toggle using the same markup as index.
- Keep count.

## CSS Requirements

- Header must not overflow at 390px width.
- Nav pills should wrap or horizontally scroll inside header, not expand viewport.
- Active page marker must be visible but restrained.
- Count should be last and allowed to shrink/hide on very narrow screens if needed.
- Do not create large hero/nav blocks; current compact style is preferred.

## Accessibility Requirements

- `<nav aria-label="Primary navigation">` on both pages.
- Current page link gets `aria-current="page"`.
- External GitHub link keeps accessible text.
- Language toggle keeps `aria-label`.
- Keyboard tab order follows visual order.

## Verification

Browser desktop:

- Header links visible.
- Current page marker correct.
- No console errors.

Browser mobile 390px:

- No horizontal document overflow.
- Header remains usable.
- Language toggle is reachable on both pages.

Regression:

- index modal still opens.
- effects modal still opens.
- hash routes still work.
