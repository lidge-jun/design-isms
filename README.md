# Design -isms

49개 디자인 ism을 한 번에 훑어보는 시각 레퍼런스 보드입니다. 각 스타일은 AI mockup 이미지, 역사/맥락, 컬러 팔레트, 실제 사이트 예시, 이미지 생성 프롬프트, 관련 ISM, 그리고 팝업 하단의 개발 가이드까지 함께 제공합니다.

별도 페이지 `effects.html`에서는 모바일과 데스크탑 프런트엔드 UI 후보군을 이름을 몰라도 찾아볼 수 있게 정리합니다. 카드별 미니 데모, 상세 모달, 접근성 체크, 성능 체크, 94개 전체 ima2 guide 이미지와 WebP preview, 그리고 효과별 배경/히스토리/사용 시점 문서를 포함합니다.

Catalog 드롭다운으로 이어지는 네 개의 자매 카탈로그가 백과사전을 완성합니다: `color.html`(역할 기반 팔레트 25종 — light/dark 변형과 WCAG AA 대비 검사), `typography.html`(폰트 페어링 20종 — 라이브 웹폰트 스페시멘과 타입 스케일), `layout.html`(반응형 섹션 패턴 25종 — 데스크탑/태블릿/모바일 3단 와이어프레임 비교와 코드 스니펫), `motion.html`(모션 레시피 20종 — easing 곡선 시각화, 라이브 데모, reduced-motion 대응). ISM 모달의 "관련 카탈로그" 섹션과 각 카탈로그 모달의 관련 ISM/Effects 링크가 서로를 잇습니다.

[Live Site](https://lidge-jun.github.io/design-isms/) · [Repository](https://github.com/lidge-jun/design-isms)

## AI Agent Plugin

이 저장소는 Claude Code · Codex · agy용 플러그인이기도 합니다. 사이트와 같은 데이터셋을 에이전트가 직접 질의해 팔레트·폰트·그리드 수치와 실행 가능한 UI 코드를 반환합니다.

```bash
claude plugin marketplace add lidge-jun/design-isms
claude plugin install design-isms@lidge-jun
```

설치·스킬 사용법·문제 해결은 [docs/PLUGIN.md](docs/PLUGIN.md)를 참고하세요.

## What It Shows

- 49 design -isms from Minimalism to the AI Slop anti-pattern diagnosis
- 147 AI-generated ISM mockup images
- 147 lightweight ISM WebP thumbnails for fast card/modal loading
- Original PNG lightbox only when the user clicks an image
- 10 real website examples per ism, initially collapsed to 3
- Modal detail view with history, prompts, palette, keywords, related ISMs
- Development guide per ism: fitting components, build method, verification points
- Korean/English UI toggle
- Frontend UI Candidates page with 94 entries: 46 interface patterns and 48 visual effects
- 94 dedicated live demo types for the candidate cards and modals
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
- `assets/data/image-pairs-manifest.json` locks all 331 PNG/WebP pairs (211 legacy + 30 effects expansion + 25 color + 20 typography + 25 layout + 20 motion) by path, dimensions, SHA-256, and an independent source-resize/preview pixel-relation limit; `npm run images:thumbs` updates it atomically and does not rely on mtimes.
- The production image-quality gate audits the 211 immutable legacy slots in four complete contact sheets; catalog additions are admitted by live hash and validated by `verify-catalog` domain ledgers. `npm run verify:image-quality` checks the immutable baseline, per-slot rubric ledger, generation attempts, approved prompt changes, final sheets, and non-target byte stability.
- `npm run verify` is non-emitting: edit TypeScript, run `npm run build`, then verify committed JS parity and all content/asset/release gates.
- `npm run pages:stage` creates the only deployable tree at `.pages/`; Pages workflows upload that allowlisted tree, never the repository root.
- Do not publish a separate reference/backlog page; generated visual styles belong in the ISMS catalog or the Effects catalog.
- Any visual or image pipeline change must run `npm run verify`; image changes must also run `npm run images:thumbs` (sharp-based, `--force` / `--scope effects|isms|color|typography|layout|motion|all`) and pass `npm run images:audit`.
- Effect guide regeneration is provenance-tracked: audit ledger `devlog/_fin/260715_production_upgrade/031_effect_guide_audit.csv`, manifest `devlog/_fin/260715_production_upgrade/032_effect_guide_manifest.jsonl`; sister-catalog guides use per-domain ledgers under `devlog/_fin/260717_design-encyclopedia-upgrade/`.

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

The static pages use WebP thumbnails/previews for card and modal image loading. The original 1536x1024 PNG files are kept for click-to-zoom lightbox views and source preservation. The thumbnail command updates the 331-pair SHA manifest after every successful run.

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

### Liquid Glass 구현 가이드

`#refractive-glass-ui`에서 Liquid Glass의 배경과 Apple 27 세대 프리뷰의 재질 개선을
읽을 수 있습니다. 모달의 재질 예제는 장면 선택과 불투명 대안을 직접 비교합니다.
웹용 CSS 응용이며 Apple 네이티브 굴절 렌더링과는 구별합니다.
본문은 안정된 면에 두고, 유리 재질은 내비게이션·제어부에 제한합니다.

### 직접 조작하는 모션 레시피

Motion Presets의 진행률·스크롤 등장·접기·탭·목록 재정렬은 상세 화면에서 직접 조작합니다.
카드의 반복 미리보기는 0.4배속이며, 상세 조작 예제는 레시피의 시간을 사용합니다.
일반 미리보기는 재생·일시정지·이어 재생·처음부터 재생을 구분합니다.
CSS 레시피에는 필요한 JavaScript 상태 관리와 모션 감소 대응을 함께 설명합니다.
재생 제어는 [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Animation),
키보드 탭은 [WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)을 참고합니다.

이미지 교체는 원본·WebP·프롬프트·검토 기록을 함께 갱신합니다. 이전 품질 감사 결과는
해시별 이력으로 보관하며, 후속 결과도 비대상 이미지가 그대로인지 검증합니다.

## References and acknowledgements

화면 조합과 에이전트 인터페이스 개선에는 다음 프로젝트의 설계 원칙을 참고합니다.
각 원본의 확인 버전, 적용 범위와 라이선스 고지는 [출처 기록](docs/ATTRIBUTION.md)에 정리했습니다.

| Project | Reference scope | License |
| --- | --- | --- |
| [StyleGallery](https://github.com/changeroa/StyleGallery) · IYEN | 화면 레시피의 필수·교체 가능 요소, 스크롤 책임, 검증 범위 구분 | Code: MIT / documentation: CC BY 4.0 |
| [Taste Skill](https://github.com/Leonxlnx/taste-skill) · Leonxlnx | 목적에 맞는 디자인 선택, 정보 밀도와 모션의 분리, 기존 디자인 시스템 보존 | MIT |
| [aside-codemode](https://github.com/lidge-jun/aside-codemode) · lidge-jun | 작은 MCP 도구 설명과 필요할 때 조회하는 상세 API | MIT |

기존 카탈로그 데이터와 이미지의 원본은 이 저장소에 있습니다. 위 프로젝트의 전체 자료나
프레임워크를 포함한다는 뜻은 아니며, 새 기능의 구현 상태는 해당 PR과 사용 문서를 따릅니다.

## 화면 레시피와 공통 검색 코어

`assets/data/recipes.json`은 제품 소개, 편집형 읽기, 설정 작업 화면의 세 레시피를 담습니다.
각 레시피는 기존 카탈로그 항목을 참조하며 필수·보조·교체 가능 역할, 허용 대안, 구현 제약과
확인할 항목을 제공합니다. 완성된 페이지 코드나 제품 검증 결과를 뜻하지 않습니다.

`src/design-*.ts`의 순수 코어는 브라우저와 Node에서 같은 검색·상세 조회·조합 규칙을 사용합니다.
검색 결과에는 데이터 버전과 다음 커서가 붙고, anti-pattern은 명시적 조회에서만 나옵니다.
`npm run test:design-core`로 검색·경계 입력·페이지 이동·레시피 계약을 검증합니다.
MCP와 CLI는 아래 명령으로 사용할 수 있습니다. 사이트에서는 상단의 화면 조합 도구를 펼쳐 같은 레시피를 선택합니다.

## Code Mode MCP와 NDJSON CLI

`node scripts/mcp/server.mjs`는 공개 도구 하나(`execute_code`)로 카탈로그를 조회합니다.
`actions.find()` / `actions.describe()`로 상세 API를 읽고, `design.search/get/recipes/compose/brief`를
일반 JavaScript와 조합합니다. 상주 설명은 2,000바이트 이하, 기본 응답은 전체 wire 기준 8KiB입니다.

`node scripts/design-query.mjs`는 같은 연산을 줄 단위 JSON으로 제공합니다. `compose`가 반환한
값을 `brief`에 넘기면 언어와 데이터 버전을 보존한 Markdown을 얻습니다.

```sh
printf '%s\n' '{"op":"design.search","args":{"query":"바텀 시트","limit":3}}' | node scripts/design-query.mjs
node scripts/design-query.mjs --help
```

설정과 파이프 예시, 크기·실행 제한은 [플러그인 안내](docs/PLUGIN.md#10-작은-연산을-조합하는-mcp--cli)에 있습니다.
이 MCP는 신뢰한 로컬 에이전트용이며 Worker/VM을 악성 코드용 보안 샌드박스로 취급하지 않습니다.

## 화면에 맞는 조합 찾기

메인 페이지에서 조합 도구를 펼치면 제품 소개·기사 읽기·설정 작업 중 목적을 고를 수 있습니다.
스타일, 배치, 색상, 서체, 효과와 모션을 허용된 대안으로 바꾸고 실제 레퍼런스를 열어보세요.
선택한 조합의 구현 제약·확인 항목·출처를 한영 브리프로 복사할 수 있습니다.

자료는 처음 펼칠 때 읽고 재사용합니다. 실패하면 도구 안에서 다시 시도할 수 있으며,
자동 복사가 막힌 환경에서는 전문을 직접 선택해 복사합니다. 기존 카탈로그 탐색과
스타일 찾기는 그대로 사용할 수 있습니다.
