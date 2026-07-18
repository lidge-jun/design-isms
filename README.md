# Design -isms

49개 디자인 ism을 한 번에 훑어보는 시각 레퍼런스 보드입니다. 각 스타일은 AI mockup 이미지, 역사/맥락, 컬러 팔레트, 실제 사이트 예시, 이미지 생성 프롬프트, 관련 ISM, 그리고 팝업 하단의 개발 가이드까지 함께 제공합니다.

별도 페이지 `effects.html`에서는 모바일과 데스크탑 프런트엔드 UI 후보군을 이름을 몰라도 찾아볼 수 있게 정리합니다. 카드별 미니 데모, 상세 모달, 접근성 체크, 성능 체크, 94개 전체 ima2 guide 이미지와 WebP preview, 그리고 효과별 배경/히스토리/사용 시점 문서를 포함합니다.

[Live Site](https://lidge-jun.github.io/design-isms/) · [Repository](https://github.com/lidge-jun/design-isms)

## What It Shows

- 49 design -isms from Minimalism to the AI Slop anti-pattern diagnosis
- 147 AI-generated ISM mockup images
- 147 lightweight ISM WebP thumbnails for fast card/modal loading
- Original PNG lightbox only when the user clicks an image
- 10 real website examples per ism, initially collapsed to 3
- Modal detail view with history, prompts, palette, keywords, related ISMs
- Development guide per ism: fitting components, build method, verification points
- Korean/English UI toggle
- Frontend UI Candidates page with 46 mobile, desktop, and shared patterns
- 46 dedicated live demo animation types for the candidate cards and modals
- 94 guide images under `assets/images/effects/`
- 94 guide WebP previews under `assets/images/thumbs/effects/`
- Long-form effect documentation in `assets/data/effects-docs.json`
- 8 newly added ima2-generated ISM styles: Editorial Typography, Variable Typography, Monospace / Terminal UI, Pixel Art UI, De Stijl, Constructivism, Isometric 3D UI, and Pop Art
- Grok research prompts and ima2 prompt manifests for the ISM/effects expansion batch

## Implementation Principles

<!-- data-sot:readme-counts:start -->Catalog source-of-truth counts: 49 ISMs / 94 effects / 18 FAQ answers.<!-- data-sot:readme-counts:end -->

- README, `AGENTS.md`, `structure/README.md`, and `devlog/` must stay aligned with the shipped behavior.
- `src/*.ts` is the editable source; `assets/js/*.js` is generated output and still committed because GitHub Pages serves static files directly.
- The site uses plain static scripts, not `script type="module"`. Keep script order explicit in HTML.
- The shared top navigation is duplicated in static HTML across all seven public pages (`index.html`, `effects.html`, `faq.html`, `color.html`, `typography.html`, `layout.html`, `motion.html`); every page exposes the same six axes (Isms / Catalog / FAQ / GitHub / Lang / Count) in identical order, with the Catalog dropdown listing Effects / Color / Typography / Layout / Motion, validated by `npm run verify:nav`.
- FAQ content lives in `assets/data/faq.json` (bilingual, source-linked, 18 answers) and renders through `src/faq.ts` → `assets/js/faq.js`; `faq.html` is a thin entry document with no inline styles or scripts.
- Shared storage/history guards, loading dismissal, retryable fatal states, and broken-image fallbacks live in `src/app-runtime.ts` → `assets/js/app-runtime.js`; all three pages load it before their page renderer and share `assets/css/runtime-states.css`.
- The visual shell uses the Annotated Specimen Atlas system: shared tokens live in `assets/css/theme-atlas.css`, loaded after `style.css` and before `nav.css` on every page.
- The ISM modal on `index.html` uses `AppDialogA11y` (`src/app-dialog.ts`) for focus trap, Escape layering, scroll lock, and focus restore; `assets/js/app-dialog.js` must load before `assets/js/app.js`.
- The ISM modal is implemented: history appears under the title, the main prompt is always visible, secondary prompts are collapsible, example sites show 3 first and expand to the rest, and related ISMs are computed from keyword overlap.
- The effects page is a 94-entry catalog: 46 interface patterns plus 48 visual effects across 7 families (scroll, text motion, hero background, cursor, view transition, micro-interaction).
- Every effects candidate must have a dedicated `demo.type` equal to its effect `id`, and that type must exist in `src/effects-demos.ts`. Do not reuse a generic seed demo for a new candidate.
- Effects long-form writing lives in `assets/data/effects-docs.json` and renders through `src/effects-docs.ts`. Keep `assets/data/effects.json` compact for operational card/demo data.
- Every effects guide image keeps the original PNG at `assets/images/effects/{effect-id}/guide.png` and uses a generated WebP preview at `assets/images/thumbs/effects/{effect-id}/guide.webp`.
- New ISM images keep originals at `assets/images/{ism-id}/` and runtime previews under `assets/images/thumbs/{ism-id}/`.
- `assets/data/image-pairs-manifest.json` locks all 211 PNG/WebP pairs by path, dimensions, SHA-256, and an independent source-resize/preview pixel-relation limit; `npm run images:thumbs` updates it atomically and does not rely on mtimes.
- The production image-quality gate audits all 211 canonical slots in four complete contact sheets. `npm run verify:image-quality` checks the immutable baseline, per-slot rubric ledger, generation attempts, approved prompt changes, final sheets, and non-target byte stability.
- `npm run verify` is non-emitting: edit TypeScript, run `npm run build`, then verify committed JS parity and all content/asset/release gates.
- `npm run pages:stage` creates the only deployable tree at `.pages/`; Pages workflows upload that allowlisted tree, never the repository root.
- Do not publish a separate reference/backlog page; generated visual styles belong in the ISMS catalog or the Effects catalog.
- Any visual or image pipeline change must run `npm run verify`; image changes must also run `npm run images:thumbs` (sharp-based, `--force` / `--scope effects|isms|all`) and pass `npm run images:audit`.
- Effect guide regeneration is provenance-tracked: audit ledger `devlog/260715_production_upgrade/031_effect_guide_audit.csv`, manifest `devlog/260715_production_upgrade/032_effect_guide_manifest.jsonl`.

## Project Structure

```text
701_design-isms/
├── index.html
├── effects.html
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   ├── nav.css
│   │   ├── effects.css
│   │   ├── effects-docs.css
│   │   ├── effects-demos.css
│   │   └── effects-demos-candidates.css
│   ├── data/
│   │   ├── isms.json
│   │   ├── effects.json
│   │   ├── effects-docs.json
│   │   ├── image-pairs-manifest.json
│   │   └── research-prompts.json
│   ├── images/{ism-id}/*.png
│   ├── images/effects/{effect-id}/guide.png
│   ├── images/thumbs/{ism-id}/*.webp
│   ├── images/thumbs/effects/{effect-id}/guide.webp
│   └── js/
│       ├── effects-demos.js
│       ├── effects-docs.js
│       ├── app-runtime.js
│       ├── app.js
│       └── effects.js
├── src/
│   ├── app.ts
│   ├── app-runtime.ts
│   ├── effects-demos.ts
│   ├── effects-docs.ts
│   └── effects.ts
├── scripts/generate-thumbnails.mjs
├── scripts/verify-generated.mjs
├── scripts/verify-content.mjs
├── scripts/verify-assets.mjs
├── scripts/stage-pages.mjs
├── scripts/prepare-expansion-data.mjs
├── structure/
├── devlog/
├── package.json
└── tsconfig.json
```

## Development

```bash
npm install
npm run typecheck
npm run build
npm run verify
npm run pages:stage
```

The browser entry files are generated for GitHub Pages:

- Edit `src/app.ts`, then run `npm run build` for `assets/js/app.js`.
- Edit `src/effects-demos.ts`, `src/effects-docs.ts`, or `src/effects.ts`, then run `npm run build` for `assets/js/effects-demos.js`, `assets/js/effects-docs.js`, and `assets/js/effects.js`.

## Image Pipeline

```bash
npm run images:thumbs
```

The static pages use WebP thumbnails/previews for card and modal image loading. The original 1536x1024 PNG files are kept for click-to-zoom lightbox views and source preservation. The thumbnail command updates the 211-pair SHA manifest after every successful run.

Expansion image batches are generated from deterministic manifests. The current ima2 command shape is:

```bash
ima2 ping
ima2 gen --stdin -q high -s 1536x1024 -o <target.png> --json --timeout 300
```

The current expansion batch generated 24 new ISM PNG originals and `npm run images:thumbs` generated matching WebP previews. The production completion audit later replaced only the two rubric-failed landing images (`minimalism`, `indie-web`) using ima2 with `gpt-5.6-sol`, high reasoning, and high image quality; the other 209 slots remain byte-identical to their captured baseline.

## Data

- Edit core ISM data in `assets/data/isms.json`.
- Edit frontend UI candidate data in `assets/data/effects.json`.
- Edit frontend UI long-form documentation in `assets/data/effects-docs.json`.
- Edit reusable Grok/ima2 prompt records in `assets/data/research-prompts.json`.
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
