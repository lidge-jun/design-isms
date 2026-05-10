---
created: 2026-05-10
status: implemented
tags: [navigation, information-architecture, header]
---

# Phase 2 — Navigation IA

## Goal

`index.html`, `effects.html`, `references.html`의 상단 메뉴를 같은 정보 구조로 맞춘다. 사용자는 “스타일을 보고 싶다”, “UI 효과명을 찾고 싶다”, “레퍼런스 시스템을 보고 싶다”, “사용법/문서를 보고 싶다”를 상단에서 바로 이동할 수 있어야 한다.

## Implemented Header State

| Page | Current Items | Missing |
| --- | --- | --- |
| `index.html` | logo link, `Isms`, `Effects`, `References`, `Guide`, GitHub, language toggle, count | none known |
| `effects.html` | logo link, `Isms`, `Effects`, `References`, `Guide`, GitHub, language toggle, count | none known |
| `references.html` | logo link, `Isms`, `Effects`, `References`, `Guide`, GitHub, language toggle, count | none known |

## Proposed Shared Nav

Desktop order:

```text
Logo | Isms | Effects | References | Guide | GitHub | Lang | Count
```

Mobile order:

```text
Logo
horizontal scroll nav: Isms / Effects / References / Guide / GitHub / Lang / Count
```

## Nav Item Contract

| Label | URL | Current Page Behavior |
| --- | --- | --- |
| `Isms` | `./index.html` | `aria-current="page"` on index |
| `Effects` | `./effects.html` | `aria-current="page"` on effects |
| `References` | `./references.html` | `aria-current="page"` on references |
| `Guide` | `#guide` on the current page where available | anchor link |
| `GitHub` | repo external URL | `target="_blank" rel="noopener"` |
| Language | current JS toggle | present on both pages |
| Count | current page count | not a link |

## Recommendation

`References` was promoted immediately because `references.json` has 16 entries and generated images. `Guide` remains an in-page anchor on each static page instead of a separate page.

## HTML Diff Plan

`index.html`:

- Convert `.header-right` div to `<nav class="header-right" aria-label="Primary navigation">`.
- Make logo a link to `./index.html`.
- Add `Isms` link with `aria-current="page"`.
- Add `References` and `Guide` links after `Effects`.
- Keep GitHub link.
- Keep language toggle.
- Keep count.

`effects.html`:

- Keep semantic `<nav>`.
- Add `References` and `Guide`.
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
