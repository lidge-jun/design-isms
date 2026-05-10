---
created: 2026-05-10
status: implemented
tags: [runtime, implementation, files, static-site]
---

# Phase 5 — Runtime Implementation Plan

## Goal

사용자 승인 후 실제 코드와 데이터 변경을 할 때의 file-level plan이었다. 현재 구현은 이 계획을 기준으로 완료했다.

## Implementation Order

1. Navigation IA
2. Effects docs data
3. Effects modal rendering
4. Optional references data/page
5. Approved ISM additions
6. Image generation and WebP conversion
7. Source-of-truth docs sync
8. Verification and deployment readiness

## File-Level Plan

### `index.html` — MODIFY

Before:

- Header has logo text, Effects link, GitHub link, language toggle, count.
- Header links are inside a div.

After:

- Header uses semantic `<nav class="header-right" aria-label="Primary navigation">`.
- Logo links to `./index.html`.
- Adds `Isms` with `aria-current="page"`.
- Keeps compact `Isms`, `Effects`, GitHub, language toggle, and count links.
- Keeps Effects, GitHub, language toggle, count.

### `effects.html` — MODIFY

Before:

- Header has Isms, Effects, GitHub, count.
- No language toggle.

After:

- Same nav order as index.
- Adds language toggle.
- Keeps compact `Isms`, `Effects`, GitHub, language toggle, and count links.
- Keeps `effects-demos.js` before `effects.js`.

### `assets/css/nav.css` — NEW

Purpose:

- Shared header/nav responsive behavior.
- Active nav state.
- Mobile horizontal scroll/wrap without document overflow.

Constraints:

- Existing `style.css` is already large, so the implemented path uses a small `assets/css/nav.css` loaded from all three pages.
- Do not introduce decorative large hero sections.
- No layout that hides candidate cards below an oversized intro.

### `assets/data/effects-docs.json` — NEW

Purpose:

- Long-form docs for all 46 effects.

Contract:

- Keyed by effect id.
- Every effect id in `effects.json` must exist.
- Required fields defined in Phase 4.

### `src/effects.ts` — MODIFY

Responsibilities:

- Fetch `effects.json`.
- Fetch `effects-docs.json`.
- Validate docs map enough to avoid runtime crashes.
- Join docs by effect id for modal rendering.
- Render new sections in modal.

Constraints:

- Keep file under 500 lines. Current file was near the limit, so likely split helpers.
- Preferred split if needed:

```text
src/effects.ts                  # page lifecycle and events
src/effects-docs.ts             # docs validation/render helpers
assets/js/effects.js            # generated
assets/js/effects-docs.js       # generated only if non-module architecture can load safely
```

Because pages are non-module scripts, the simplest safe split is a namespace pattern like `EffectsDemos` if a second runtime helper is needed.

### `assets/js/effects.js` — GENERATED

- Do not edit manually.
- Generated from `src/effects.ts` via `npm run build`.
- Must be committed when implementation is approved.

### `assets/data/references.json` — REMOVED

Removed after user feedback. Visual-style candidates are part of `assets/data/isms.json`; official design-system references stay as source links inside effects docs only.

```json
{
  "id": "apple-hig",
  "name": "Apple Human Interface Guidelines",
  "type": "Platform guideline",
  "summary": "...",
  "bestFor": [],
  "officialUrl": "https://developer.apple.com/design/human-interface-guidelines/",
  "image": { "file": "overview.png", "alt": "..." }
}
```

### `references.html` — REMOVED

Removed from runtime after user feedback.

### `assets/data/isms.json` — MODIFY ONLY AFTER APPROVAL

Add approved ISM candidates only. Each addition requires:

- 10 real site examples.
- 3 images.
- prompts metadata.
- history and keywords.
- WebP thumbnails.

### `README.md`, `AGENTS.md`, `structure/README.md` — MODIFY

Update in the same implementation turn:

- New nav/page contract.
- New effects docs data contract.
- New image batch/WebP contract.
- New reference catalog contract if approved.

## Data Join Strategy

Do not duplicate long docs in `effects.json`.

Runtime shape after join:

```ts
type UxEffectWithDocs = UxEffect & {
  docs: EffectLongDocs | null;
};
```

If docs are missing:

- Render the existing compact modal.
- Add no broken empty section.
- Verification should fail before deployment.

## Static Asset Path Contract

All runtime paths must be relative:

```text
./assets/data/effects.json
./assets/data/effects-docs.json
./assets/images/thumbs/...
./assets/images/...
```

Do not use root paths like `/assets/...` because GitHub Pages project sites serve under `/design-isms/`.

## Build Commands

```bash
npm run images:thumbs
npm run verify
```

If implementing runtime split files, verify `tsconfig.json` output order and HTML script order before claiming completion.

## Browser QA

Desktop:

- `index.html`: nav present, Isms active, Effects link works.
- `effects.html`: nav present, Effects active, language toggle present.
- Effects modal shows new docs sections.
- WebP preview loads before PNG lightbox.

Mobile:

- 390x844 no horizontal overflow.
- Header/nav usable.
- Modal focus and close behavior intact.

Regression:

- 35 ISM cards still render.
- 46 effects cards still render.
- 46 unique demo classes remain.
- Existing modal/hash/lightbox behavior remains.
