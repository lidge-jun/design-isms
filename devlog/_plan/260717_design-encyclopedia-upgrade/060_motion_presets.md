# 060 — Motion Presets 페이지 (DIFFLEVEL-ROADMAP-01)

> **[001 로드맵 잠금 각서 — 010 Canonical Registry가 이 문서의 개별 가정을 우선한다]**
> 1) 이미지 root/scope는 전 도메인 **단수**(`color`/`typography`/`layout`/`motion`) — 이 문서에 `layouts` 등 복수형이 있으면 단수로 읽는다.
> 2) `generate-thumbnails.mjs` scope enum 확장은 015에서 1회(`effects|isms|color|typography|layout|motion|all`) 수행 — 각 사이클이 다시 설계하지 않는다.
> 3) manifest 쌍 카운트는 절대값이 아니라 **누적**: 211 → +30(020) → +25(030) → +20(040) → +25(050) → +20(060) = 최종 331. 이 문서 안의 236/231 등 절대값은 "이 사이클 완료 시점의 예시값"으로만 읽는다.
> 4) `verify-catalog.mjs`는 registry 배열 순회 단일 스크립트(도메인별 인자 없음).
> 5) sot 마커 네이밍은 `data-sot:{domain}-count`.
> 6) 페이지 스크립트 로드 순서는 `app-runtime.js` → `nav-dropdown.js` → `catalog-shell.js` → 도메인 렌더러 — 이 문서의 script 순서 표기에 `nav-dropdown.js`가 빠져 있으면 이 계약을 따른다.
> 7) 이 문서 안의 `generate-thumbnails.mjs`/타 도메인 count 관련 '변경 없음' 행은 변경 맵이 아니라 UNCHANGED 참고로 읽는다. manifest allowlist는 '이 도메인 행만 추가'가 아니라 '기존 additive registry(선행 사이클의 신규 행 포함)를 보존하며 이 도메인 행을 추가'로 읽는다.
> 8) [WP8 감사 fold-back] ledger 파일명 확정: `061_motion_guide_audit.csv` + `061_motion_guide_manifest.jsonl` (validateGuideLedger helper 사용). 전용 verify-motion.mjs/verify:motion 금지. easing은 validateMotionDomain에서 완전 파싱(cubic-bezier 4-number/x∈0..1, linear() stop 규칙). reduce 환경에서 재생 버튼도 정적 미리보기로 전환(예외 없음). 카드 demo 기본 paused+IntersectionObserver, 무한 루프는 skeleton/spinner/pulse 3개만.


의존: 010 `assets/data/schema/motion.schema.json` 확정 + 015 `CatalogShell`/`motion.html` placeholder 완료

## 1. 목표와 카드 단위

`motion.html`을 준비 중 placeholder에서 **20개의 구현 가능한 모션 레시피 카탈로그**로 승격한다.
카드 1장은 효과 이름 소개가 아니라 다음 값을 함께 복사·조정할 수 있는 레시피 1개다.

- 정확한 CSS easing 값
- 기본 duration(ms), trigger, intensity
- 재사용 가능한 CSS snippet
- `prefers-reduced-motion` 대응 전략
- 관련 Effects 패턴으로 가는 `relatedEffects[]`
- 카드 안 라이브 CSS demo와 모달의 곡선/파라미터/guide

Effects가 “어떤 UI 패턴을 언제 쓰는가”를 설명한다면 Motion은 “그 패턴을 어떤 수치와 코드로
움직이는가”를 제공한다. 기존 Effects(060 시점 누적 94개)는 수정하거나 복제하지 않는다.

## 2. IN / OUT

### IN

- Motion 데이터 20건, 전용 renderer/demo registry/CSS, 빌드 JS
- category/trigger/intensity 검색·필터, 카드 demo 재생/일시정지, 모달/해시/라이트박스
- cubic-bezier 및 `linear()` curve 시각화, CSS snippet 표시/복사
- 20개 ima2 guide PNG와 WebP preview, 해시 manifest 반영
- Motion 전용 정적 검증, 기존 이미지 baseline과 신규 catalog asset의 경계 보강
- `motion.html` Catalog nav 항목 활성화와 `20 motions` count

### OUT

- 기존 Effects(누적 94개) 데이터, `EffectsDemos` registry, 기존 effect guide 이미지의 변경
- JS 물리 엔진, Web Animations API 전용 런타임, 캔버스/WebGL demo
- 실제 라우터·드래그앤드롭·네트워크 로딩 구현
- 070의 역방향 cross-catalog 계산 및 ISM 모달 통합
- 배포 실행과 라이브 검증(080 담당)

## 3. 현재 저장소와의 경계

현재 `src/effects-demos.ts`는 id별 순수 markup을 반환하고,
`assets/css/effects-demos.css`/`effects-demos-candidates.css`는 카드가 보일 때만 animation을
실행한다. `src/effects-interactions.ts`도 `IntersectionObserver`로 `.is-demo-active`를 토글하며
reduced motion에서 애니메이션을 정지한다. Motion도 이 구조를 재사용하되 별도
`MotionDemos` namespace와 `.motion-*` selector를 사용해 Effects 구현에 결합하지 않는다.

중복 경계는 다음처럼 고정한다.

| 기존 Effect | Effects의 책임 | Motion의 책임 |
| --- | --- | --- |
| `scroll-reveal` | viewport 진입 패턴, 사용 시점, 접근성 | `motion-scroll-reveal`의 threshold/distance/duration/easing/CSS |
| `press-scale` | 누름 피드백 패턴과 44px target | `motion-scale`/spring/back curve의 scale 범위와 timing |
| `skeleton-loading` | 실제 레이아웃과 맞는 placeholder 상태 | `motion-skeleton-shimmer`의 gradient 폭·방향·주기 레시피 |
| `scroll-progress-indicator` | 읽기 진행 UI와 숫자 fallback | `motion-scroll-timeline`/`motion-progress`의 progress mapping |
| `accordion`, `tabs`, `drag-reorder` | 상태/키보드/ARIA를 포함한 UI 패턴 | expand, tab, FLIP 전환의 시각 파라미터 |
| `crossfade-view-transition` | View Transition API와 즉시 교체 fallback | `motion-fade`/`motion-tab-transition`의 CSS-only timing recipe |

ID는 010 계약대로 모두 `motion-` 접두어를 사용한다. `relatedEffects[]`는 실존 Effects id만
저장하며, 빈 배열을 허용한다. Motion 카드가 Effects id와 같은 문자열을 쓰거나 Effects에
Motion 레시피를 복사해 넣는 것은 금지한다.

## 4. 파일 변경 맵

DELETE 없음. 015에서 먼저 생긴 파일은 NEW가 아니라 MODIFY로 취급한다.

### NEW

| 경로 | 역할 |
| --- | --- |
| `assets/data/motion.json` | 20개 Motion recipe source of truth |
| `src/motion-demos.ts` | `MotionDemos` namespace, 20-id registry와 안전한 demo markup |
| `src/motion.ts` | 데이터 로드/검증, `CatalogShell` adapter, 필터, demo control, curve SVG renderer |
| `assets/js/motion-demos.js` | `npm run build`로 생성하는 non-module 브라우저 산출물 |
| `assets/js/motion.js` | `npm run build`로 생성하는 non-module 브라우저 산출물 |
| `assets/css/motion.css` | Motion 페이지 카드/toolbar/modal/curve/guide 스타일 |
| `assets/css/motion-demos.css` | 20개 전용 demo와 keyframes, reduced-motion 정적 상태 |
| `scripts/verify-motion.mjs` | 스키마/20-id/registry/easing/reference/image/fallback 검증 |

### MODIFY

| 경로 | 변경 |
| --- | --- |
| `motion.html` | placeholder 제거, toolbar/grid/modal/lightbox 추가, Catalog의 Motion 활성화 |
| `package.json` | `verify:motion` 추가 및 `verify` 체인에 연결 |
| `scripts/verify-catalog.mjs` | Motion schema/profile과 20건 catalog를 범용 검증 대상에 등록 |
| `scripts/verify-nav.mjs` | `motion.html` count=`20 motions`, Motion link 활성 상태 검증 |
| `scripts/generate-thumbnails.mjs` | 변경 없음 — 015에서 확장된 scope enum(`motion` 포함)을 그대로 사용 |
| `scripts/verify-assets.mjs` | `motion.json` guide PNG/WebP 20쌍과 orphan 검증 추가 |
| `scripts/sync-sot.mjs` + AGENTS/README/structure 마커 | `motion.json` 길이(20) 유도 count와 `data-sot:motion-count` 마커 추가, `npm run sot:sync` |
| `scripts/verify-image-quality.mjs` | immutable 211쌍 검사는 legacy ism/effect subset에만 적용하고 신규 Motion은 별도 검증에 위임 |
| `scripts/stage-pages.mjs` | raster count를 manifest/데이터에서 유도해 Motion 20쌍 포함 |
| `assets/data/image-pairs-manifest.json` | Motion source/preview SHA·크기 20행 추가 |
| `README.md` | Motion catalog 20건, 사용법, 데이터/asset 경로 반영 |
| `AGENTS.md` | Motion count/registry/build/reduced-motion/guide 불변조건 반영 |
| `structure/README.md` | Motion source→build→runtime 구조와 검증기 반영 |

`motion.html`의 script 순서는 015 산출물인 `app-dialog.js`/`app-runtime.js`/
`catalog-shell.js` 뒤에 `motion-demos.js`, 마지막에 `motion.js`다. 모든 script는 non-module이다.
CSS는 `style.css → theme-atlas.css → nav.css → catalog.css → motion.css →
motion-demos.css → runtime-states.css` 순서를 유지한다. 신규 authored 파일은 각각 500줄 이하다.

### NEW guide asset 20쌍

아래 경로는 `{id}` wildcard가 아니라 생성할 정확한 id 목록이다. 각 행마다 두 파일이 생긴다.

| id | PNG 원본 | WebP preview |
| --- | --- | --- |
| `motion-linear` | `assets/images/motion/motion-linear/guide.png` | `assets/images/thumbs/motion/motion-linear/guide.webp` |
| `motion-ease-in-out` | `assets/images/motion/motion-ease-in-out/guide.png` | `assets/images/thumbs/motion/motion-ease-in-out/guide.webp` |
| `motion-spring` | `assets/images/motion/motion-spring/guide.png` | `assets/images/thumbs/motion/motion-spring/guide.webp` |
| `motion-bounce` | `assets/images/motion/motion-bounce/guide.png` | `assets/images/thumbs/motion/motion-bounce/guide.webp` |
| `motion-elastic` | `assets/images/motion/motion-elastic/guide.png` | `assets/images/thumbs/motion/motion-elastic/guide.webp` |
| `motion-back` | `assets/images/motion/motion-back/guide.png` | `assets/images/thumbs/motion/motion-back/guide.webp` |
| `motion-fade` | `assets/images/motion/motion-fade/guide.png` | `assets/images/thumbs/motion/motion-fade/guide.webp` |
| `motion-slide` | `assets/images/motion/motion-slide/guide.png` | `assets/images/thumbs/motion/motion-slide/guide.webp` |
| `motion-scale` | `assets/images/motion/motion-scale/guide.png` | `assets/images/thumbs/motion/motion-scale/guide.webp` |
| `motion-blur-reveal` | `assets/images/motion/motion-blur-reveal/guide.png` | `assets/images/thumbs/motion/motion-blur-reveal/guide.webp` |
| `motion-skeleton-shimmer` | `assets/images/motion/motion-skeleton-shimmer/guide.png` | `assets/images/thumbs/motion/motion-skeleton-shimmer/guide.webp` |
| `motion-spinner` | `assets/images/motion/motion-spinner/guide.png` | `assets/images/thumbs/motion/motion-spinner/guide.webp` |
| `motion-progress` | `assets/images/motion/motion-progress/guide.png` | `assets/images/thumbs/motion/motion-progress/guide.webp` |
| `motion-pulse` | `assets/images/motion/motion-pulse/guide.png` | `assets/images/thumbs/motion/motion-pulse/guide.webp` |
| `motion-scroll-timeline` | `assets/images/motion/motion-scroll-timeline/guide.png` | `assets/images/thumbs/motion/motion-scroll-timeline/guide.webp` |
| `motion-scroll-reveal` | `assets/images/motion/motion-scroll-reveal/guide.png` | `assets/images/thumbs/motion/motion-scroll-reveal/guide.webp` |
| `motion-sticky-transition` | `assets/images/motion/motion-sticky-transition/guide.png` | `assets/images/thumbs/motion/motion-sticky-transition/guide.webp` |
| `motion-expand-collapse` | `assets/images/motion/motion-expand-collapse/guide.png` | `assets/images/thumbs/motion/motion-expand-collapse/guide.webp` |
| `motion-tab-transition` | `assets/images/motion/motion-tab-transition/guide.png` | `assets/images/thumbs/motion/motion-tab-transition/guide.webp` |
| `motion-list-reorder` | `assets/images/motion/motion-list-reorder/guide.png` | `assets/images/thumbs/motion/motion-list-reorder/guide.webp` |

## 5. 데이터 스키마 계약

010의 common schema를 `allOf`로 참조하며 아래 profile을 필수로 한다. `family`는 전 항목
`Motion Preset`, `category`는 아래 5개 enum 중 하나다.

| 필드 | 타입/제약 |
| --- | --- |
| `id` | string, kebab-case, `motion-` prefix, 20건 unique |
| `name` | non-empty English display name |
| `nameKr` | non-empty 한국어 표시명 |
| `family` | literal `Motion Preset` |
| `category` | `Easing Curve` / `Entry & Exit` / `Loading Feedback` / `Scroll-based` / `State Transition` |
| `summary` | 한국어 2~4문장; 사용 목적과 주의점 포함 |
| `easing` | CSS timing function string; 허용형은 `cubic-bezier(...)` 또는 명시 stop의 `linear(...)` |
| `duration` | integer milliseconds, 80~5000; scroll-linked 항목은 fallback preview 주기 |
| `trigger` | `hover` / `scroll` / `click` / `load` |
| `intensity` | `subtle` / `normal` / `dramatic` |
| `snippet` | `{ "css": string }`; selector+property+reduced-motion rule을 포함한 복사 가능 코드 |
| `reducedMotion` | `{strategy, css, noteKr}`; strategy=`static-end`/`instant`/`preserve-progress` 중 하나 |
| `relatedEffects` | unique string[]; `effects.json`의 실존 id만 허용 |
| `guide` | `{file:"guide.png", alt, prompt}`; alt/prompt non-empty |

예시 레코드 형상:

```json
{
  "id": "motion-skeleton-shimmer",
  "name": "Skeleton Shimmer Recipe",
  "nameKr": "스켈레톤 시머 레시피",
  "family": "Motion Preset",
  "category": "Loading Feedback",
  "summary": "스켈레톤 표면을 한 방향으로 훑는 저강도 로딩 레시피입니다. 실제 콘텐츠 구조와 같은 placeholder에만 적용합니다.",
  "easing": "cubic-bezier(0.4, 0, 0.2, 1)",
  "duration": 1200,
  "trigger": "load",
  "intensity": "subtle",
  "snippet": {"css": ".skeleton::after { animation: motion-shimmer 1200ms cubic-bezier(0.4, 0, 0.2, 1) infinite; }"},
  "reducedMotion": {
    "strategy": "static-end",
    "css": "@media (prefers-reduced-motion: reduce) { .skeleton::after { animation: none; opacity: 0; } }",
    "noteKr": "광택 이동을 제거하고 placeholder 형태만 유지합니다."
  },
  "relatedEffects": ["skeleton-loading"],
  "guide": {"file": "guide.png", "alt": "스켈레톤 시머의 방향과 정적 대안을 비교한 가이드", "prompt": "..."}
}
```

`snippet.css`는 데이터로 표시·복사하지만 실행할 때 임의 `<style>`로 삽입하지 않는다. 라이브 demo는
검토된 `motion-demos.css`의 id별 class만 사용한다. 데이터 문자열은 모두 escape하고 easing parser는
허용 grammar를 통과한 값만 SVG 계산에 사용한다.

## 6. 확정 카드 20개

### Easing Curve 6

| id | name / nameKr | easing | duration / trigger / intensity | 핵심 파라미터 | relatedEffects |
| --- | --- | --- | --- | --- | --- |
| `motion-linear` | Linear / 선형 | `cubic-bezier(0, 0, 1, 1)` | 240ms / hover / subtle | progress 0→1, overshoot 0 | `[]` |
| `motion-ease-in-out` | Ease In Out / 부드러운 가감속 | `cubic-bezier(0.42, 0, 0.58, 1)` | 320ms / hover / normal | symmetric acceleration, hold 0ms | `[]` |
| `motion-spring` | Spring / 스프링 | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 500ms / click / normal | overshoot 1.56, scale 0.92→1 | `press-scale` |
| `motion-bounce` | Bounce / 바운스 | `linear(0 0%, 0.72 20%, 1.08 36%, 0.88 52%, 1.04 68%, 0.98 84%, 1 100%)` | 700ms / click / dramatic | 3회 감쇠 반동, peak 1.08 | `favorite-burst` |
| `motion-elastic` | Elastic / 엘라스틱 | `linear(0 0%, 1.22 18%, 0.86 32%, 1.1 46%, 0.94 60%, 1.04 74%, 0.98 88%, 1 100%)` | 900ms / click / dramatic | 6회 감쇠 진동, peak 1.22 | `favorite-burst` |
| `motion-back` | Back / 백 오버슈트 | `cubic-bezier(0.68, -0.6, 0.32, 1.6)` | 480ms / hover / dramatic | anticipation -0.6, overshoot 1.6 | `press-scale` |

Easing 값은 문자열과 curve SVG가 공유하는 단일 값이다. CSS keyword `ease`, 라이브러리 별칭
`spring(…)`, 프레임레이트 의존 JS 적분값은 저장하지 않는다.

### Entry & Exit 4

| id | name / nameKr | 기본값 | 핵심 파라미터 | relatedEffects |
| --- | --- | --- | --- | --- |
| `motion-fade` | Fade In/Out / 페이드 진입·퇴장 | 220ms, `cubic-bezier(0.22, 1, 0.36, 1)`, load, subtle | opacity 0↔1, mode enter/exit | `crossfade-view-transition` |
| `motion-slide` | Slide In/Out / 슬라이드 진입·퇴장 | 320ms, `cubic-bezier(0.22, 1, 0.36, 1)`, load, normal | axis x/y, distance 16px, direction ±1 | `drawer-navigation`, `bottom-sheet` |
| `motion-scale` | Scale In/Out / 스케일 진입·퇴장 | 240ms, `cubic-bezier(0.34, 1.56, 0.64, 1)`, click, normal | scale .94↔1, transform-origin center | `press-scale`, `modal-dialog` |
| `motion-blur-reveal` | Blur Reveal / 블러 리빌 | 420ms, `cubic-bezier(0.22, 1, 0.36, 1)`, scroll, subtle | blur 12px→0, opacity 0→1, y 8px→0 | `scroll-reveal`, `split-text-reveal` |

### Loading Feedback 4

| id | name / nameKr | 기본값 | 핵심 파라미터 | relatedEffects |
| --- | --- | --- | --- | --- |
| `motion-skeleton-shimmer` | Skeleton Shimmer Recipe / 스켈레톤 시머 레시피 | 1200ms, `cubic-bezier(0.4, 0, 0.2, 1)`, load, subtle | highlight width 36%, x -120%→220%, infinite | `skeleton-loading` |
| `motion-spinner` | Spinner Recipe / 스피너 레시피 | 800ms, `cubic-bezier(0.5, 0, 0.5, 1)`, load, normal | 1turn, stroke 3px, infinite | `pull-to-refresh` |
| `motion-progress` | Progress Recipe / 진행률 레시피 | 1600ms, `cubic-bezier(0.65, 0, 0.35, 1)`, load, normal | scaleX 0→1, origin left, numeric state 병행 | `progress-stepper`, `scroll-progress-indicator` |
| `motion-pulse` | Pulse Recipe / 펄스 레시피 | 1200ms, `cubic-bezier(0.4, 0, 0.6, 1)`, load, subtle | opacity .55↔1, scale .98↔1, infinite | `notification-center` |

`skeleton-loading`은 placeholder라는 UI 패턴이고 `motion-skeleton-shimmer`는 그 표면에 선택적으로
적용하는 파라미터+코드다. spinner/progress/pulse도 상태 의미나 ARIA를 대체하지 않으며,
`motion-` prefix로 현재/향후 Effects id와 충돌을 피한다.

### Scroll-based 3

| id | name / nameKr | 기본값 | 핵심 파라미터 | relatedEffects |
| --- | --- | --- | --- | --- |
| `motion-scroll-timeline` | Scroll Timeline / 스크롤 타임라인 | fallback 600ms, `cubic-bezier(0, 0, 1, 1)`, scroll, normal | `animation-range: entry 0% cover 100%`, progress 0→1 | `scroll-progress-indicator`, `layered-parallax` |
| `motion-scroll-reveal` | Scroll Reveal Recipe / 스크롤 리빌 레시피 | 420ms, `cubic-bezier(0.22, 1, 0.36, 1)`, scroll, subtle | threshold .15, rootMargin `0px 0px -10%`, y 20px | `scroll-reveal` |
| `motion-sticky-transition` | Sticky Transition / 스티키 전환 | fallback 600ms, `cubic-bezier(0.42, 0, 0.58, 1)`, scroll, normal | sticky range 0→240px, scale 1→.92, opacity 1→.7 | `sticky-cta-bar`, `sticky-table-header` |

`animation-timeline: scroll()`/`view()`는 progressive enhancement다. 미지원 환경은 수동 mini-stage
스크롤 위치 또는 최종 정적 상태를 보여 주며 콘텐츠 접근성을 숨기지 않는다.

### State Transition 3

| id | name / nameKr | 기본값 | 핵심 파라미터 | relatedEffects |
| --- | --- | --- | --- | --- |
| `motion-expand-collapse` | Expand & Collapse / 펼침·접힘 | 280ms, `cubic-bezier(0.42, 0, 0.58, 1)`, click, normal | grid rows 0fr↔1fr, opacity .4↔1 | `accordion` |
| `motion-tab-transition` | Tab Transition / 탭 전환 | 220ms, `cubic-bezier(0.22, 1, 0.36, 1)`, click, subtle | opacity 0↔1, x 8px→0, state 즉시 갱신 | `tabs`, `crossfade-view-transition` |
| `motion-list-reorder` | FLIP List Reorder / FLIP 목록 재정렬 | 300ms, `cubic-bezier(0.22, 1, 0.36, 1)`, click, normal | measured delta→0, max 이동 96px, 3 items | `drag-reorder` |

## 7. 카드 라이브 CSS demo

### Renderer/상태

- `MotionDemos.demoTypes`는 위 20 id를 정확히 한 번씩 갖고 `render(id)`는 정적 markup만 반환한다.
- 카드에는 `data-motion-id`, demo stage, `재생`/`일시정지` toggle button을 둔다. 버튼은
  `type="button"`, `aria-pressed`, 가시 label을 가지며 클릭이 카드 모달 열기로 전파되지 않는다.
- 기본은 viewport 밖 `paused`; `IntersectionObserver`로 보이는 카드만 `.is-demo-active`가 된다.
  사용자가 멈추면 `.is-demo-paused`가 우선하고, 재생은 class를 제거한 뒤 animation을 처음부터 재시작한다.
- 모달 demo도 같은 control을 쓰며, 닫을 때 observer/listener/timer를 정리한다. 무한 demo는
  skeleton/spinner/pulse에만 허용하고 viewport 밖에서는 반드시 pause한다.

### Trigger별 표현

- `hover`: fine pointer에서 stage hover/focus-within 동안 실행한다. coarse pointer와 키보드는 재생 버튼으로 동일 상태를 확인한다.
- `click`: demo 내부 전용 button이 state class를 토글한다. 실제 app state나 저장소를 바꾸지 않는다.
- `load`: 카드가 viewport에 들어온 첫 시점에 1회 재생하며, replay로 반복한다. 무한 loading은 pause 가능하다.
- `scroll`: 카드 내부의 독립 scroll stage를 사용한다. native scroll을 유지하고 CSS scroll timeline을 지원하지 않으면 정규화한 class 단계 또는 최종 상태를 쓴다.

### reduced motion

CSS의 `@media (prefers-reduced-motion: reduce)`와 JS `matchMedia`를 둘 다 사용한다.
reduce에서는 animation/transition/auto-scroll을 `none`으로 만들고 정보가 가장 잘 보이는 정적 완료 상태를
즉시 표시한다. 진행률처럼 위치 자체가 정보인 항목은 움직임 없이 현재 값을 보존한다. 재생 버튼은 비활성화
또는 `정적 미리보기`로 바꾸고, hover에도 위치/scale/blur가 변하지 않아야 한다.

## 8. 모달의 easing curve 시각화

- 240×160 반응형 `<svg viewBox="0 0 240 160">`에 축, 시작/끝점, curve, control point를 그린다.
- `cubic-bezier(x1,y1,x2,y2)`는 P0=(0,0), P1=(x1,y1), P2=(x2,y2), P3=(1,1)을
  SVG 좌표로 뒤집어 `M … C …` path로 변환한다. overshoot/anticipation을 보이도록 y domain은
  실제 min/max에 맞춰 padding한다.
- `linear()`는 명시된 percentage stop을 parser로 읽어 같은 SVG 안에 `M/L` path로 그린다.
  bounce/elastic을 cubic-bezier인 것처럼 오표기하지 않는다.
- 아래에 easing 원문, duration, trigger, intensity와 CSS snippet/copy button을 표시한다.
- 외부 chart 라이브러리나 inline SVG event handler를 사용하지 않는다. malformed easing은 데이터
  검증에서 차단하고 runtime에서는 curve 대신 안전한 오류 문구를 표시한다.

## 9. ima2 guide 생성 계약

먼저 `ima2 ping`으로 local server/provider를 확인한다. target path를 위 20개로 고정한 deterministic
manifest를 만든 뒤 병렬 생성하되 한 target당 결과는 하나만 채택한다.

명령:

```bash
ima2 gen --stdin -q high -s 1536x1024 -o assets/images/motion/<motion-id>/guide.png --json --timeout 300
```

공통 프롬프트 패턴:

```text
Create one instructional UI motion reference plate for {name} ({nameKr}), 1536x1024 landscape.
Show one realistic product UI in three chronological frames: start, peak/midpoint, and settled end.
Annotate the exact timing function "{easing}", duration {duration}ms, trigger {trigger}, and the
key parameters {parameters}. Include a small timing curve/timeline and a clearly labeled
"reduced motion" static fallback frame. The image must explain motion through frame-to-frame
state differences even though it is a still image. Editorial technical documentation style,
warm off-white background, charcoal UI, restrained orange accent, crisp vector-like interface,
short legible Korean labels, no logos, no browser chrome, no people, no watermark, no fake code,
no unreadable tiny text, no decorative 3D icons.
```

개별 prompt 전문은 각 `guide.prompt`에 저장한다. 생성 후 `npm run images:thumbs -- --scope motion`으로
768×512 WebP를 만들고 `image-pairs-manifest.json`의 두 SHA와 크기를 확인한다. 기존 211쌍의
immutable quality baseline을 다시 bootstrap하거나 Motion을 과거 감사 완료 자산인 것처럼 편입하지 않는다.

## 10. 구현 순서

1. 010 schema와 015 `CatalogShell` API를 다시 읽고 Motion profile/DOM hook을 고정한다.
2. `motion.json` 20건을 작성하고 id/easing/relatedEffects를 정적 검증한다.
3. `motion-demos.ts`와 demo CSS를 먼저 만들고 20-id registry parity를 맞춘다.
4. `motion.ts` renderer, filter, modal curve, controls를 `CatalogShell`에 연결한다.
5. `npm run build`로 두 browser JS를 생성하고 `motion.html` placeholder를 활성 페이지로 바꾼다.
6. ima2 guide 20개를 생성·검수한 뒤 `--scope motion` thumbnail/manifest를 갱신한다.
7. verifier/docs/staging을 동기화하고 정적·브라우저 QA를 수행한다.

## 11. 검증 계획

### 정적/데이터

```bash
node scripts/verify-motion.mjs
npm run build
npm run typecheck
npm run verify:generated
npm run images:thumbs -- --scope motion
npm run verify:assets
npm run verify
npm run pages:stage
```

`verify-motion.mjs`는 다음을 실패 조건으로 둔다.

- 정확히 20건/20 unique id, category 분포 6/4/4/3/3, registry/case parity
- 모든 id의 `motion-` prefix와 위 lock list의 누락·추가 없음
- trigger/intensity enum, duration 범위, 한국어 summary, non-empty snippet/reducedMotion/guide
- easing이 허용 grammar이며 위 6 easing card 값은 byte-normalized exact match
- `relatedEffects[]`가 `effects.json`에 존재하고 자기/중복 참조 없음
- 각 id의 1536×1024 PNG, 768×512 WebP, manifest SHA/경로 일치
- CSS에 20 demo selector와 `prefers-reduced-motion: reduce` block 존재
- `motion.ts`, `motion-demos.ts`, 각 신규 CSS가 500줄 이하

### 브라우저 QA

로컬 정적 서버에서 1440/1024/640/390px를 확인한다.

- 카드 20개, category/trigger/intensity filter 조합, 검색, 결과 count
- 카드 키보드 Enter/Space → 모달, Escape/close → 원래 카드로 focus 복귀, hash 직링크
- 모든 카드 재생/일시정지/replay, hover와 coarse-pointer fallback
- cubic 4종과 `linear()` 2종 curve가 clipping 없이 정확한 값/형태로 표시
- reduce emulation에서 자동 움직임 0, 정적 완료 상태와 정보/진행값 유지
- guide는 WebP 우선, lightbox는 PNG, 실패 시 `AppRuntime` fallback
- console error 0, broken request 0, horizontal overflow 0, viewport 밖 animation pause

## 12. 수용 기준

1. `motion.html`이 20개 확정 recipe를 렌더하고 nav에서 활성화되며 count가 데이터와 일치한다.
2. 20개 데이터 id, `MotionDemos` registry, demo selector, guide PNG/WebP가 1:1이다.
3. 6개 easing 값은 본 문서와 데이터/CSS/SVG 표시가 동일하며 bounce/elastic은 `linear()`로 보존된다.
4. 각 카드에 작동하는 demo와 재생/일시정지 경로가 있고 viewport 밖에서는 실행되지 않는다.
5. 모든 recipe에 복사 가능한 CSS와 명시적 `reducedMotion` 대응이 있으며 reduce에서 의미 손실 없이 정적이다.
6. `motion-skeleton-shimmer` 등 중복 가능 항목은 `motion-` id와 `relatedEffects[]`로 Effects와 역할이 분리된다.
7. 20개 guide가 1536×1024 PNG + 768×512 WebP로 존재하고 manifest SHA가 일치한다.
8. 기존 49 ISMs / 18 FAQ / (누적 시점 Effects 94 — immutable baseline 대상은 legacy 64) / immutable 211쌍 baseline에 비승인 변경이 없다.
9. 신규 authored 파일은 500줄 이하이며 browser JS는 `src/*.ts`와 최신 상태다.
10. `npm run verify`, `npm run pages:stage`, 4개 viewport browser QA가 모두 통과한다.

## 13. Proof lock — 카드 id 20개

```text
motion-linear
motion-ease-in-out
motion-spring
motion-bounce
motion-elastic
motion-back
motion-fade
motion-slide
motion-scale
motion-blur-reveal
motion-skeleton-shimmer
motion-spinner
motion-progress
motion-pulse
motion-scroll-timeline
motion-scroll-reveal
motion-sticky-transition
motion-expand-collapse
motion-tab-transition
motion-list-reorder
```
