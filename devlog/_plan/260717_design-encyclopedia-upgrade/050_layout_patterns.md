# 050 — Layout Patterns 페이지 DIFFLEVEL 로드맵

> **[001 로드맵 잠금 각서 — 010 Canonical Registry가 이 문서의 개별 가정을 우선한다]**
> 1) 이미지 root/scope는 전 도메인 **단수**(`color`/`typography`/`layout`/`motion`) — 이 문서에 `layouts` 등 복수형이 있으면 단수로 읽는다.
> 2) `generate-thumbnails.mjs` scope enum 확장은 015에서 1회(`effects|isms|color|typography|layout|motion|all`) 수행 — 각 사이클이 다시 설계하지 않는다.
> 3) manifest 쌍 카운트는 절대값이 아니라 **누적**: 211 → +30(020) → +25(030) → +20(040) → +25(050) → +20(060) = 최종 331. 이 문서 안의 236/231 등 절대값은 "이 사이클 완료 시점의 예시값"으로만 읽는다.
> 4) `verify-catalog.mjs`는 registry 배열 순회 단일 스크립트(도메인별 인자 없음).
> 5) sot 마커 네이밍은 `data-sot:{domain}-count`.
> 6) 페이지 스크립트 로드 순서는 `app-runtime.js` → `nav-dropdown.js` → `catalog-shell.js` → 도메인 렌더러 — 이 문서의 script 순서 표기에 `nav-dropdown.js`가 빠져 있으면 이 계약을 따른다.
> 7) 이 문서 안의 `generate-thumbnails.mjs`/타 도메인 count 관련 '변경 없음' 행은 변경 맵이 아니라 UNCHANGED 참고로 읽는다. manifest allowlist는 '이 도메인 행만 추가'가 아니라 '기존 additive registry(선행 사이클의 신규 행 포함)를 보존하며 이 도메인 행을 추가'로 읽는다.


상태: **WP7 구현 대기**  
의존: **010 `assets/data/schema/layout.schema.json` 확정 + 015 `CatalogShell`/`layout.html` placeholder 완료**  
카드 수: **25개 고정(5 family × 5)**

## 1. Goal

`layout.html`을 빈 셸에서 25개 반응형 레이아웃 레시피 카탈로그로 전환한다.
각 카드는 정적인 CSS 와이어프레임을 보여 주고, 모달은 Desktop/Tablet/Mobile 세 구성을
동시에 비교하며 한국어 설명, 변환 규칙, HTML/CSS 스니펫, ima2 guide 이미지를 제공한다.

완료 상태는 “카드가 보임”이 아니라 데이터·wireframe registry·PNG/WebP·공유 이미지 manifest가
1:1로 맞고, 검색/필터/해시/모달/라이트박스/키보드 접근성과 무가로-overflow를 검증한 상태다.

## 2. Current Signals와 재사용 근거

| 현재 사실 | 근거 | 050의 결정 |
| --- | --- | --- |
| Effects 데모는 non-module `namespace EffectsDemos`, readonly type registry, type guard, HTML 문자열 renderer를 사용한다. | `src/effects-demos.ts:1-26` | 동일한 구조적 패턴만 재사용하고 Layout 전용 namespace를 만든다. |
| `effects.json`의 `demo.type`은 id와 같아야 하며 런타임 parser도 이를 fail-closed 검증한다. | `src/effects.ts:108-168` | `wireframe.type === layout.id`를 schema+runtime+verifier에서 강제한다. |
| 카드 renderer는 안전하게 escape한 data와 데모 HTML을 결합하고, 모달/해시/포커스 복귀를 관리한다. | `src/effects.ts:233-247`, `src/effects.ts:268-291` | 015의 `CatalogShell.mount(config)`에 Layout의 card/modal callback만 연결한다. |
| Effects guide는 WebP preview 우선, PNG original/lightbox 구조다. | `src/effects.ts:325-330` | Layout guide도 같은 `<picture><source webp><img png>` 계약을 따른다. |
| 현재 effect id에 `command-palette`, `breadcrumb`, `mobile-stepper-form`, `filter-sidebar`, `desktop-wizard`가 이미 있다. | `assets/data/effects.json` 내 실존 id (`mobile-stepper-form`:17, `command-palette`:21, `breadcrumb`:27 등 — 감사 라운드 1에서 라인 매핑 정정) | 모든 Layout id에 `layout-` 접두어를 붙인다. |
| 현재 thumbnail scope는 `effects`와 “그 외=isms” 둘뿐이다. | `scripts/generate-thumbnails.mjs:10-12`, `scripts/generate-thumbnails.mjs:32-43` | `layouts`를 독립 scope로 추가하지 않으면 Layout PNG가 ISM scope에 섞이므로 반드시 분리한다. |
| asset verifier는 ISM+Effects만 canonical inventory로 본다. | `scripts/verify-assets.mjs:45-62`, `scripts/verify-assets.mjs:110-118` | Layout 25쌍을 additive non-baseline inventory로 등록한다. |
| 기존 211쌍 이미지 품질 baseline은 immutable이다. | `scripts/verify-image-quality.mjs`, `devlog/_fin/260715_production_upgrade/093_image_baseline_assets.jsonl` | 211쌍 baseline은 재작성하지 않고 Layout은 신규 non-baseline 검증 경로로 추가한다. |

## 3. IN / OUT

### IN

- 확정된 25개 Layout 데이터와 5개 family 필터
- 카드의 정적 CSS 와이어프레임과 모달의 3단 반응형 비교
- Layout 전용 runtime parser/renderer, HTML/CSS 스니펫 표시·복사
- 25개 1536×1024 PNG guide와 25개 768×512 WebP preview
- Layout 이미지 scope, hash manifest, asset/catalog 검증 확장
- `layout.html` 활성화, 카운트 SoT, 공개 stage 및 브라우저 QA

### OUT

- 49 ISM, 기존/확장 Effects 항목 또는 Effects demo registry 수정
- 실제 페이지 빌더, drag-and-drop 편집기, 코드 실행 sandbox
- JS 프레임워크용 React/Vue/Svelte 스니펫
- 동영상 guide, Lottie, Canvas/WebGL, 카드 내 애니메이션
- 외부 디자인 시스템/Figma/Storybook 연동
- 093–098 기존 211쌍 image-quality baseline 재생성 또는 역사 파일 수정
- 010 schema나 015 shared shell 계약을 050에서 몰래 변경하는 일

`layout.schema.json` 또는 `CatalogShell`이 아래 계약을 수용하지 못하면 050에서 우회 구현하지 않는다.
010/015 owning phase로 fold-back할 변경점을 보고한 뒤 선행 계약을 먼저 고친다.

## 4. 파일 변경 맵

### 4.1 런타임·데이터·스타일

| 구분 | 정확한 경로 | diff 내용 |
| --- | --- | --- |
| MODIFY | `layout.html` | placeholder 제거, 5 family 필터/검색/grid/modal/lightbox/count 마운트 추가. 로드 순서 `app-dialog.js` → `app-runtime.js` → `catalog-shell.js` → `layout-wireframes.js` → `layout.js`; CSS는 공통 CSS 뒤 `layout.css` → `layout-wireframes.css`. Catalog 드롭다운의 Layout을 활성화하고 `aria-current`는 페이지당 하나만 둔다. |
| NEW | `assets/data/layout.json` | 아래 schema를 만족하는 25개 엔트리. 한 엔트리를 한 줄에 저장해 500줄 제한을 지킨다. |
| NEW | `src/layout-wireframes.ts` | `namespace LayoutWireframes`; 25 type registry, type guard, `render(type, viewport)` 정적 HTML renderer. |
| NEW | `assets/js/layout-wireframes.js` | `npm run build` 산출물. 수동 편집 금지. |
| NEW | `src/layout.ts` | fetch/strict parse, filter config, card/modal callback, guide fallback, snippet 복사, Layout 페이지 mount. 500줄 이하. |
| NEW | `assets/js/layout.js` | `npm run build` 산출물. 수동 편집 금지. |
| NEW | `assets/css/layout.css` | Layout 페이지 카드/필터/모달/3단 비교/guide/snippet 스타일. 500줄 이하. |
| NEW | `assets/css/layout-wireframes.css` | `.layout-wireframe-*`로 완전히 scope된 25종×3 viewport 도식. 500줄 이하; 초과 시 family별 파일 추가는 별도 scope 승인을 받는다. |

### 4.2 이미지·검증·SoT

| 구분 | 정확한 경로 | diff 내용 |
| --- | --- | --- |
| NEW | `assets/images/layout/<확정-id>/guide.png` | 아래 25개 exact asset manifest의 source. 모두 1536×1024 static PNG. |
| NEW | `assets/images/thumbs/layout/<확정-id>/guide.webp` | source와 1:1인 768×512 WebP preview. |
| MODIFY | `assets/data/image-pairs-manifest.json` | `npm run images:thumbs -- --scope layout`가 source/preview SHA·dimensions를 원자 갱신. 기존 row byte 안정성 유지. |
| MODIFY | (없음) `scripts/generate-thumbnails.mjs` | 변경 없음 — 015에서 확장된 scope enum(`layout` 포함)을 그대로 사용 |
| MODIFY | `scripts/verify-assets.mjs` | `layout.json`에서 25 guide pair를 유도하고 path/hash/dimensions/MAE≤18/orphan 검사를 공통 inventory에 추가. |
| MODIFY | `scripts/verify-catalog.mjs` | `(인자 없음 — registry 순회)` adapter: schema 필드, 25/5×5, id/type 일치, snippet 안전성, crosslink 실존성, guide path, renderer registry 전단사 검증. |
| MODIFY | `scripts/verify-image-quality.mjs` | immutable 211 baseline 검증은 그대로 유지하고 그 밖의 manifest row는 `verify-assets`가 승인한 additive catalog pair인지 확인. 기존 093–098 receipt/row 수는 수정하지 않는다. |
| MODIFY | `scripts/stage-pages.mjs` | PNG/WebP count를 211 같은 상수가 아니라 검증된 image-pairs manifest 길이에서 유도. 015가 추가한 7 HTML public list는 유지. |
| MODIFY | `scripts/run-final-static-qa.mjs` | staged PNG/WebP 예상값을 manifest 기반으로 전환. |
| MODIFY | `scripts/sync-sot.mjs` | `layout.json` 길이(25)와 `layout.html` count marker를 동기화. 기존 49/Effects/18 marker는 데이터 유도 상태 유지. |
| MODIFY | `README.md` | Layout 25개 카탈로그와 실행 경로를 SoT marker/카탈로그 표에 반영. |
| MODIFY | `AGENTS.md` | 카탈로그 수와 Layout source/image/runtime 불변조건 반영. marker 본문은 `npm run sot:sync`만 수정. |
| MODIFY | `structure/README.md` | `layout.html`, `src/layout*.ts`, `assets/data/layout.json`, 이미지 namespace를 현재 구조에 반영. |
| NEW | `devlog/_plan/260717_design-encyclopedia-upgrade/051_layout_guide_audit.csv` | 25행 visual audit evidence: id, source SHA, preview SHA, anatomy/text/responsive/contrast 판정, reviewer, reviewedOn. 050 실행 중 생성하고 완료 시 unit과 함께 `_fin`으로 이동. |

### 4.3 25개 exact asset manifest

`<확정-id>`는 임의 glob이 아니라 아래 닫힌 목록만 뜻한다.

| id | PNG source | WebP preview |
| --- | --- | --- |
| `layout-hero-centered` | `assets/images/layout/layout-hero-centered/guide.png` | `assets/images/thumbs/layout/layout-hero-centered/guide.webp` |
| `layout-hero-split` | `assets/images/layout/layout-hero-split/guide.png` | `assets/images/thumbs/layout/layout-hero-split/guide.webp` |
| `layout-hero-full-media` | `assets/images/layout/layout-hero-full-media/guide.png` | `assets/images/thumbs/layout/layout-hero-full-media/guide.webp` |
| `layout-hero-interactive` | `assets/images/layout/layout-hero-interactive/guide.png` | `assets/images/thumbs/layout/layout-hero-interactive/guide.webp` |
| `layout-hero-video-bg` | `assets/images/layout/layout-hero-video-bg/guide.png` | `assets/images/thumbs/layout/layout-hero-video-bg/guide.webp` |
| `layout-grid-equal` | `assets/images/layout/layout-grid-equal/guide.png` | `assets/images/thumbs/layout/layout-grid-equal/guide.webp` |
| `layout-grid-masonry` | `assets/images/layout/layout-grid-masonry/guide.png` | `assets/images/thumbs/layout/layout-grid-masonry/guide.webp` |
| `layout-grid-bento` | `assets/images/layout/layout-grid-bento/guide.png` | `assets/images/thumbs/layout/layout-grid-bento/guide.webp` |
| `layout-grid-featured` | `assets/images/layout/layout-grid-featured/guide.png` | `assets/images/thumbs/layout/layout-grid-featured/guide.webp` |
| `layout-grid-magazine` | `assets/images/layout/layout-grid-magazine/guide.png` | `assets/images/thumbs/layout/layout-grid-magazine/guide.webp` |
| `layout-content-zigzag` | `assets/images/layout/layout-content-zigzag/guide.png` | `assets/images/thumbs/layout/layout-content-zigzag/guide.webp` |
| `layout-content-timeline` | `assets/images/layout/layout-content-timeline/guide.png` | `assets/images/thumbs/layout/layout-content-timeline/guide.webp` |
| `layout-content-comparison` | `assets/images/layout/layout-content-comparison/guide.png` | `assets/images/thumbs/layout/layout-content-comparison/guide.webp` |
| `layout-content-testimonial` | `assets/images/layout/layout-content-testimonial/guide.png` | `assets/images/thumbs/layout/layout-content-testimonial/guide.webp` |
| `layout-content-pricing` | `assets/images/layout/layout-content-pricing/guide.png` | `assets/images/thumbs/layout/layout-content-pricing/guide.webp` |
| `layout-nav-top-bar` | `assets/images/layout/layout-nav-top-bar/guide.png` | `assets/images/thumbs/layout/layout-nav-top-bar/guide.webp` |
| `layout-nav-sidebar` | `assets/images/layout/layout-nav-sidebar/guide.png` | `assets/images/thumbs/layout/layout-nav-sidebar/guide.webp` |
| `layout-nav-bottom` | `assets/images/layout/layout-nav-bottom/guide.png` | `assets/images/thumbs/layout/layout-nav-bottom/guide.webp` |
| `layout-nav-command-palette` | `assets/images/layout/layout-nav-command-palette/guide.png` | `assets/images/thumbs/layout/layout-nav-command-palette/guide.webp` |
| `layout-nav-breadcrumb` | `assets/images/layout/layout-nav-breadcrumb/guide.png` | `assets/images/thumbs/layout/layout-nav-breadcrumb/guide.webp` |
| `layout-form-multi-step` | `assets/images/layout/layout-form-multi-step/guide.png` | `assets/images/thumbs/layout/layout-form-multi-step/guide.webp` |
| `layout-form-settings` | `assets/images/layout/layout-form-settings/guide.png` | `assets/images/thumbs/layout/layout-form-settings/guide.webp` |
| `layout-form-search-results` | `assets/images/layout/layout-form-search-results/guide.png` | `assets/images/thumbs/layout/layout-form-search-results/guide.webp` |
| `layout-form-filter-list` | `assets/images/layout/layout-form-filter-list/guide.png` | `assets/images/thumbs/layout/layout-form-filter-list/guide.webp` |
| `layout-form-auth` | `assets/images/layout/layout-form-auth/guide.png` | `assets/images/thumbs/layout/layout-form-auth/guide.webp` |

DELETE 없음.

## 5. 데이터 계약 — `assets/data/layout.json`

010에서 만든 `assets/data/schema/layout.schema.json`이 아래 상세 계약을 구현해야 한다.
050 실행 시 schema를 수정하지 않고 먼저 data를 schema에 대조한다.

### 5.1 필수 필드

| 필드 | 형식·제약 |
| --- | --- |
| `id` | `^layout-[a-z0-9]+(?:-[a-z0-9]+)*$`; 25개 전역 중복 없음. |
| `name` | 비어 있지 않은 영문 표제. |
| `nameKr` | 비어 있지 않은 한국어 표제. |
| `family` | `Hero` / `Card Grid` / `Content Section` / `Navigation` / `Form & Input`; 각 5개. |
| `category` | 용도 필터용 영문 값. 이 문서의 확정 카드 표 값을 그대로 사용. |
| `summary` | 패턴의 구조와 선택 이유를 설명하는 한국어 2~4문장. 이름 번역만 반복하지 않는다. |
| `breakpoints.desktop` | `{minWidth:1025, referenceWidth:1440, composition:"한국어 구성 설명"}`. |
| `breakpoints.tablet` | `{minWidth:641, maxWidth:1024, referenceWidth:1024, composition:"한국어 구성 설명"}`. |
| `breakpoints.mobile` | `{maxWidth:640, referenceWidth:390, composition:"한국어 구성 설명"}`. |
| `composition` | 3~10개 `{role, labelKr, required}`. `role`은 kebab-case slot, `labelKr`은 한국어, `required`는 boolean. DOM/CSS wireframe slot 이름의 SoT. |
| `responsive` | 정확히 2개 `{from,to,rule}`: `desktop→tablet`, `tablet→mobile`. `rule`은 숨김/재배치/stack/overflow 정책을 포함한 한국어 문장. |
| `bestFor` | 중복 없는 한국어 string 2~4개. |
| `avoidWhen` | 중복 없는 한국어 string 2~4개. |
| `snippet.html` | 독립적으로 읽히는 semantic HTML 문자열. inline event/script/iframe 금지. root class는 `.layout-example-<id suffix>`. |
| `snippet.css` | 위 root 아래로 scope된 CSS. desktop-first 또는 mobile-first 중 하나를 끝까지 유지하고 1024/640 변환을 포함. `@import`, 외부 URL, 전역 selector 금지. |
| `relatedEffects` | 실존 `effects.json` id 0~4개. field 자체가 domain을 나타내므로 `effects/` 접두어를 값에 중복 저장하지 않는다. |
| `relatedIsms` | 실존 `isms.json` id 0~4개. `anti-pattern`인 `ai-slop`은 연결 금지. |
| `wireframe` | `{type,label}`. `type`은 반드시 해당 `id`와 같고 `label`은 도식의 한국어 accessible name. |
| `guide` | `{file:"guide.png", alt, prompt}`. `alt`는 패턴명+세 viewport 변화 설명, `prompt`는 아래 ima2 패턴을 구체화한 원문. null 금지. |

모든 object는 `additionalProperties:false`, 모든 필수 배열은 `uniqueItems:true`를 사용한다.
런타임은 JSON을 곧바로 cast하지 않고 Effects parser처럼 unknown → record → field reader 순서로 검증한다.

### 5.2 대표 엔트리 shape

```json
{
  "id": "layout-hero-split",
  "name": "Split Hero",
  "nameKr": "분할형 히어로",
  "family": "Hero",
  "category": "Marketing",
  "summary": "핵심 메시지와 미디어를 나란히 배치해 가치 제안과 시각 증거를 동시에 전달합니다. 좁은 화면에서는 텍스트를 먼저 읽고 미디어를 뒤에서 확인하도록 한 열로 전환합니다.",
  "breakpoints": {
    "desktop": {"minWidth": 1025, "referenceWidth": 1440, "composition": "텍스트와 미디어를 5:7 비율의 두 열로 배치한다."},
    "tablet": {"minWidth": 641, "maxWidth": 1024, "referenceWidth": 1024, "composition": "두 열을 유지하되 간격과 미디어 높이를 줄인다."},
    "mobile": {"maxWidth": 640, "referenceWidth": 390, "composition": "텍스트, CTA, 미디어 순의 한 열로 쌓는다."}
  },
  "composition": [
    {"role": "copy", "labelKr": "메시지 영역", "required": true},
    {"role": "actions", "labelKr": "주요 행동", "required": true},
    {"role": "media", "labelKr": "시각 자료", "required": true}
  ],
  "responsive": [
    {"from": "desktop", "to": "tablet", "rule": "열 비율과 gap을 줄이고 미디어 최대 높이를 제한한다."},
    {"from": "tablet", "to": "mobile", "rule": "한 열로 stack하고 DOM 읽기 순서대로 copy, actions, media를 배치한다."}
  ],
  "bestFor": ["제품 가치 제안", "캠페인 랜딩"],
  "avoidWhen": ["텍스트가 매우 긴 문서", "미디어가 핵심 증거가 아닌 화면"],
  "snippet": {
    "html": "<section class=\"layout-example-hero-split\"><div><h1>Build with clarity</h1><p>One focused value proposition.</p><a href=\"#start\">Start</a></div><figure aria-label=\"Product preview\"></figure></section>",
    "css": ".layout-example-hero-split{display:grid;grid-template-columns:5fr 7fr;gap:clamp(2rem,6vw,6rem);align-items:center}.layout-example-hero-split figure{aspect-ratio:4/3;background:#ddd}@media(max-width:640px){.layout-example-hero-split{grid-template-columns:1fr}.layout-example-hero-split figure{aspect-ratio:16/10}}"
  },
  "relatedEffects": ["scroll-reveal"],
  "relatedIsms": ["minimalism"],
  "wireframe": {"type": "layout-hero-split", "label": "분할형 히어로의 반응형 구조 도식"},
  "guide": {"file": "guide.png", "alt": "분할형 히어로가 데스크탑 2열에서 모바일 1열로 전환되는 가이드", "prompt": "<6절 패턴을 구체화한 전체 프롬프트>"}
}
```

## 6. 카드 25개 확정 목록

`category`는 family와 별개인 용도 축이다. “Desktop ↔ Mobile” 열은 `breakpoints`와
`responsive` 두 규칙을 작성할 때 보존해야 할 최소 의미이며, 단순 축소 설명으로 대체할 수 없다.

| # | id | name | nameKr | family / category | Desktop ↔ Mobile 변환 요약 |
| ---: | --- | --- | --- | --- | --- |
| 1 | `layout-hero-centered` | Centered Hero | 중앙 정렬 히어로 | Hero / Marketing | 넓은 중앙 copy+CTA+하단 media → 한 열 유지, 폭·여백 축소, CTA full-width 선택. |
| 2 | `layout-hero-split` | Split Hero | 분할형 히어로 | Hero / Marketing | copy/media 2열 → copy·CTA·media 읽기 순서의 1열 stack. |
| 3 | `layout-hero-full-media` | Full-media Hero | 풀 미디어 히어로 | Hero / Storytelling | viewport media 위 inset copy → 안전한 대비 overlay와 짧은 mobile crop, CTA 하단 고정 금지. |
| 4 | `layout-hero-interactive` | Interactive Hero | 인터랙티브 히어로 | Hero / Campaign | copy+interactive stage 병렬 → stage를 copy 뒤로 이동하고 touch 가능한 정적 fallback을 우선. |
| 5 | `layout-hero-video-bg` | Video-background Hero | 비디오 배경 히어로 | Hero / Campaign | full-bleed video+overlay copy → poster-first crop, muted video는 조건부, copy 대비/재생 제어 유지. |
| 6 | `layout-grid-equal` | Equal Card Grid | 균등 카드 그리드 | Card Grid / Collection | 4열 동등 카드 → 2열 tablet → 1열 mobile, DOM 순서 보존. |
| 7 | `layout-grid-masonry` | Masonry Grid | 메이슨리 그리드 | Card Grid / Gallery | 높이가 다른 다열 masonry → 2열 → 읽기 순서가 예측 가능한 1열; CSS columns 사용 시 순서 주의. |
| 8 | `layout-grid-bento` | Bento Grid | 벤토 그리드 | Card Grid / Dashboard | span이 다른 12-column mosaic → span 단순화 → 중요도 순 1열 cards. |
| 9 | `layout-grid-featured` | Featured + Grid | 피처드 플러스 그리드 | Card Grid / Editorial | 큰 featured 1개+보조 grid → featured 유지 후 보조 2열 → 전부 1열. |
| 10 | `layout-grid-magazine` | Magazine Grid | 매거진 그리드 | Card Grid / Editorial | headline/rail/mixed cards 비대칭 → rail 하단 이동 → headline-first 1열 feed. |
| 11 | `layout-content-zigzag` | Zigzag Sections | 지그재그 섹션 | Content Section / Storytelling | copy/media 좌우 교대 → DOM 순서와 무관한 시각 교대 제거, 매 섹션 copy→media stack. |
| 12 | `layout-content-timeline` | Timeline | 타임라인 | Content Section / Storytelling | 중앙선 양측 이벤트 → 좌측 단일 rail과 우측 카드 1열. |
| 13 | `layout-content-comparison` | Comparison Table | 비교표 | Content Section / Decision | 항목×플랜 table → 핵심 열 고정/가로 scroll 또는 항목별 cards; 정보 삭제 금지. |
| 14 | `layout-content-testimonial` | Testimonial Section | 추천사 섹션 | Content Section / Trust | featured quote+보조 quotes 3열 → featured 유지, 보조는 1열/scroll-snap 중 명시 선택. |
| 15 | `layout-content-pricing` | Pricing Section | 가격표 섹션 | Content Section / Decision | 3개 plan 병렬 비교 → 추천 plan 먼저, 나머지 순차 cards, 기능 비교 링크 유지. |
| 16 | `layout-nav-top-bar` | Top Bar Navigation | 상단 바 내비게이션 | Navigation / Global Navigation | logo+primary+utility 한 줄 → 핵심 행동만 bar에 두고 나머지는 labeled menu로 이동. |
| 17 | `layout-nav-sidebar` | Sidebar Navigation | 사이드바 내비게이션 | Navigation / Application Navigation | 고정/접이식 sidebar+main → off-canvas drawer 또는 compact rail, main 폭 100%. |
| 18 | `layout-nav-bottom` | Bottom Navigation | 하단 내비게이션 | Navigation / Mobile Navigation | desktop에서는 top/side navigation → mobile에서 safe-area를 고려한 3~5개 bottom destinations. |
| 19 | `layout-nav-command-palette` | Command Palette Layout | 커맨드 팔레트 레이아웃 | Navigation / Power Navigation | centered overlay+grouped results → viewport 폭 modal, touch 진입 버튼과 keyboard 대체 유지. |
| 20 | `layout-nav-breadcrumb` | Breadcrumb Layout | 브레드크럼 레이아웃 | Navigation / Hierarchy Navigation | 전체 계층 path → 중간 항목 축약/overflow, 현재 항목과 상위 이동은 보존. |
| 21 | `layout-form-multi-step` | Multi-step Form | 다단계 폼 | Form & Input / Task Flow | 좌측 step rail+form+summary → 상단 progress+현재 step+접이식 summary 1열. |
| 22 | `layout-form-settings` | Settings Layout | 설정 페이지 레이아웃 | Form & Input / Account | section nav+grouped settings 2열 → anchor select/목차 뒤 grouped form 1열. |
| 23 | `layout-form-search-results` | Search Results Layout | 검색 결과 레이아웃 | Form & Input / Discovery | query bar+facets+results+sort → sticky query, filter sheet trigger, sort, 1열 results. |
| 24 | `layout-form-filter-list` | Filter + List | 필터 플러스 리스트 | Form & Input / Discovery | persistent facet sidebar+list → 선택 filter chips+modal/sheet filters+list. |
| 25 | `layout-form-auth` | Authentication Layout | 인증 레이아웃 | Form & Input / Identity | brand/media+auth form 분할 → 장식 media 축소/제거, form 우선 1열과 오류 영역 유지. |

## 7. ID 충돌 회피 및 crosslink 규칙

1. Layout primary key, `wireframe.type`, URL hash는 모두 `layout-*`다.
2. `wireframe.type === id`를 강제한다. 별칭(`command-palette`, `breadcrumb`)을 type으로 허용하지 않는다.
3. CSS root는 `.layout-*` 또는 `.layout-wireframe-*`만 사용한다. Effects의 `.effect-*`, `.demo-*`,
   공통 `.card`, `.modal`을 독자 정의하지 않는다.
4. guide asset namespace는 `assets/images/layout/`와 `assets/images/thumbs/layout/`다.
   기존 `effects/` 또는 ISM root 폴더에 Layout guide를 넣지 않는다.
5. crosslink 값은 field가 domain을 결정한다. 예:
   `layout-nav-command-palette.relatedEffects=["command-palette"]`,
   `layout-nav-breadcrumb.relatedEffects=["breadcrumb"]`.
6. collision verifier는 Layout 내부 중복, Effects id와의 exact 중복, wireframe registry 중복을 각각 검사한다.

실제 현재 Effects exact collision 후보는 `command-palette`와 `breadcrumb`다. 의미상 인접하지만
exact id는 다른 후보로 `mobile-stepper-form`, `desktop-wizard`, `progress-stepper`, `filter-sidebar`,
`resizable-sidebar`, `drawer-navigation`, `sticky-tab-bar`, `master-detail`이 있다. 이들은 이름을 합치지
않고 `relatedEffects[]`로 연결한다.

## 8. 카드 내 CSS 와이어프레임 renderer 설계

### 8.1 선택: Effects 패턴 재사용 + 전용 renderer

- 재사용: namespace, readonly registry, union type, `isWireframeType`, exhaustive renderer,
  escaped wrapper, data id와 registry 전단사 검증.
- 분리: `EffectsDemos`에 Layout 25개를 추가하지 않는다. Effects는 interaction/effect이고 Layout은
  viewport별 정적 composition이므로 타입·CSS·접근성 의미가 다르다.
- signature:

```ts
namespace LayoutWireframes {
  export const wireframeTypes = [/* 이 문서의 25 id */] as const;
  export type WireframeType = typeof wireframeTypes[number];
  export type Viewport = 'desktop' | 'tablet' | 'mobile';
  export function isWireframeType(value: string): value is WireframeType;
  export function render(type: WireframeType, viewport: Viewport): string;
}
```

`render`는 검증된 union만 받고 event handler, input, button, timer를 만들지 않는다. 도식 내부 block은
`aria-hidden="true"`; 바깥 wrapper가 `wireframe.label` 하나를 accessible name으로 제공한다.

### 8.2 카드와 모달

- 카드: `render(type, 'desktop')` 한 개를 16:10 canvas 안에 렌더한다. family/category와
  “Desktop → Mobile” 한 줄 요약은 텍스트로 별도 노출한다.
- 모달 desktop(>1024): Desktop/Tablet/Mobile `<figure>` 3열.
- 모달 tablet(641~1024): Desktop/Tablet 2열 + Mobile 다음 행. 각 canvas는 자체 aspect-ratio 유지.
- 모달 mobile(≤640): 3개 figure를 vertical stack. 페이지 전체 가로 scroll 금지.
- 각 figure에는 viewport label, 기준 폭(1440/1024/390), `breakpoints.*.composition` figcaption을 둔다.
- 와이어프레임은 animation/transition/keyframes를 사용하지 않는다. `prefers-reduced-motion` 분기 자체가
  필요 없고, 카드 reveal 같은 공통 셸 모션만 기존 fallback을 따른다.
- CSS slot은 `composition[].role`과 대응한다. renderer에 존재하지 않는 role 또는 사용되지 않는
  required role은 verifier 실패다.

## 9. ima2 guide 생성 계약

### 9.1 공통 프롬프트 패턴

각 `guide.prompt`는 placeholder를 실제 카드 값으로 치환한 완성 문자열을 저장한다.

```text
Create one instructional responsive layout reference plate for {name} ({nameKr}),
1536x1024 landscape. Show the same realistic product content in three aligned wireframe
frames labeled Desktop 1440, Tablet 1024, and Mobile 390. Desktop composition: {desktop}.
Tablet composition: {tablet}. Mobile composition: {mobile}. Explicitly visualize these
transformations with restrained arrows: {responsiveRules}. Include and label these structural
parts in Korean: {compositionLabels}. Use a warm off-white technical-paper background
(#F1F1EB), thin charcoal rules (#11120F), light gray content blocks, and restrained orange
signal marks (#FF4D1F) only for transformation arrows and breakpoint labels. Flat vector-like
wireframe documentation, crisp spacing, readable Korean labels, no brand logos, no copied UI,
no browser chrome, no people, no photos, no decorative 3D icons, no gradients, no watermark,
no fake paragraphs, no unreadable tiny text. The responsive composition change must be the
dominant evidence, not poster decoration.
```

비디오/interactive hero도 정적 구조 plate로 생성한다. 재생 중 프레임이나 실제 motion을 흉내 내지 않고
poster/control/fallback 영역을 명확히 표시한다.

### 9.2 deterministic 생성 순서

1. 25개 `layout.json` 엔트리와 target path를 먼저 확정하고 id 순 JSONL job manifest를 작업 receipt로 만든다.
2. `ima2 ping` 성공을 확인한다.
3. 각 prompt를 stdin으로 전달한다.

```bash
ima2 gen --stdin -q high -s 1536x1024 \
  -o assets/images/layout/<id>/guide.png --json --timeout 300
```

4. PNG 25개 dimensions/decode를 검사하고 25-cell contact sheet로 anatomy, responsive 차이,
   한국어 text, 대비, 금지 요소를 감사해 `051_layout_guide_audit.csv`에 기록한다.
5. `npm run images:thumbs -- --scope layout`로 WebP와 manifest를 갱신한다.
6. 실패한 한 슬롯만 새 candidate path에 재생성한 뒤 승인된 파일만 canonical path로 교체한다.

## 10. 구현 순서(DIFFLEVEL)

### P1 — 계약 게이트

- 010 schema가 5절 필드와 `additionalProperties:false`를 포함하는지 확인한다.
- 015의 `layout.html`, `CatalogShell`, `verify-catalog.mjs`, 7-page stage가 존재하는지 확인한다.
- 현재 `effects.json`/`isms.json` id set을 추출하고 25개 id/crosslink를 collision 검사한다.
- 선행 계약이 다르면 **중단하고 owning phase expansion을 보고**한다.

### P2 — data + renderer

- `layout.json` 25개를 확정 순서로 작성한다.
- `layout-wireframes.ts` registry/render와 두 CSS 파일을 구현한다.
- `layout.ts` strict parser 및 `CatalogShell.mount` callback을 구현한다.
- `npm run build`로 두 JS 산출물을 생성한다.

### P3 — page activation

- `layout.html` placeholder를 thin entry page로 교체한다.
- family filter는 각 5개, category filter는 데이터 유도, 검색은 name/nameKr/summary/bestFor 대상이다.
- modal에 3단 비교, 변환 규칙, best/avoid, snippets, crosslinks, guide/lightbox를 연결한다.
- hash `#layout-*` 직링크와 닫은 뒤 focus return을 확인한다.

### P4 — guide + asset pipeline

- 25 PNG 생성·감사 후 WebP/manifest를 갱신한다.
- thumbnail scope, asset verifier, additive image-quality, stage count를 확장한다.
- 기존 211 baseline 파일과 기존 raster/hash row가 바뀌지 않았는지 비교한다.

### P5 — SoT + 검증

- `sot:sync`, README/AGENTS/structure를 실제 25개 상태와 동기화한다.
- focused verifier → 전체 verify → pages stage → 브라우저 QA 순으로 수행한다.
- 증거가 모두 통과한 뒤 050 완료로 표시한다.

## 11. 검증 계획

### 11.1 정적·데이터·빌드

```bash
node -e "const d=require('./assets/data/layout.json'); if(d.length!==25) process.exit(1); console.log(d.map(x=>x.id).join('\n'))"
node scripts/verify-catalog.mjs (인자 없음 — registry 순회)
npm run images:thumbs -- --scope layout
npm run build
npm run typecheck
npm run verify:generated
npm run verify:assets
npm run verify:image-quality
npm run sot:check
npm run verify
npm run pages:stage
```

`npm run verify`는 파일을 생성하지 않으므로 반드시 `build`와 `images:thumbs` 뒤에 실행한다.

### 11.2 필수 negative fixtures

`verify-catalog (인자 없음 — registry 순회)`은 임시 fixture root를 지원하거나 in-memory fixture를 사용해 아래를
각각 실패시켜야 한다. 실제 repo data를 고장 낸 뒤 되돌리는 방식은 금지한다.

- 24개/26개 카드, family별 4개 또는 6개
- 중복 id 또는 `layout-` 접두어 누락
- `wireframe.type !== id`, registry 누락/extra
- desktop/tablet/mobile 구성 설명 또는 두 responsive rule 누락
- 존재하지 않는 `relatedEffects`/`relatedIsms`, `ai-slop` 참조
- snippet의 `<script>`, `on*`, `iframe`, `@import`, 외부 URL, unscoped selector
- guide null/`guide.png` 외 파일, PNG/WebP/manifest 누락

### 11.3 브라우저 QA

로컬 `npm run serve` 후 1440, 1024, 640, 390 폭에서 확인한다.

- 카드 수 25, family 필터 결과 각 5, 검색 0건 empty/reset, count `25 layouts`
- `layout-hero-split` 카드 → 모달 → 3 viewport figure/설명 → HTML/CSS 탭/복사
- guide preview `currentSrc=.webp`, natural 768×512; lightbox `.png`, natural 1536×1024
- `#layout-nav-command-palette` 직링크, Escape 순서(lightbox→modal), trigger focus 복귀
- keyboard-only filter/card/modal/snippet copy 동작, modal focus trap
- 모든 폭에서 `document.documentElement.scrollWidth <= innerWidth`
- console error, failed request, CSP violation 0
- 기존 `effects.html`의 `command-palette`와 `breadcrumb` 카드/해시가 그대로 동작

## 12. 수용 기준

1. `layout.json`은 정확히 25개이며 5 family가 각 5개다.
2. 25개 모든 엔트리가 5절 필드를 갖고 summary/breakpoint/responsive 설명은 한국어다.
3. 모든 id는 `layout-` 접두어, 모든 `wireframe.type === id`, registry/data/CSS selector가 전단사다.
4. 카드 25개가 고유 정적 CSS 도식으로 식별되며 animation 없이 렌더된다.
5. 모든 모달이 Desktop/Tablet/Mobile 3단 비교, composition, 두 변환 규칙, best/avoid,
   HTML/CSS snippet, crosslinks, guide를 노출한다.
6. PNG/WebP가 각각 25개, 1536×1024/768×512이고 manifest SHA와 MAE≤18 검사를 통과한다.
7. 기존 211 baseline/093–098와 기존 ISM/Effects raster bytes는 변경되지 않는다.
8. 1440/1024/640/390에서 가로 overflow와 console/network/CSP error가 0이다.
9. `npm run build`, `npm run verify`, `npm run pages:stage`가 모두 통과하고 `.pages/layout.html`과
   Layout assets가 stage manifest에 포함된다.
10. 신규 TS/CSS/MJS는 500줄 이하이고 non-module namespace 및 committed JS 산출물 계약을 지킨다.
11. README/AGENTS/structure/카운트 marker가 실제 25개 상태와 일치한다.
12. 기존 Effects `command-palette`, `breadcrumb`와 Layout-prefixed 대응 카드가 서로 다른 hash/data/asset
    namespace에서 공존한다.

## 13. 충돌 가능성 지점과 대응

| 지점 | 실패 형태 | 사전 대응 |
| --- | --- | --- |
| `command-palette`, `breadcrumb` | hash/card lookup이 Effects 항목을 열거나 verifier 중복 | 모든 Layout id/hash/type에 `layout-` 강제, crosslink로만 bare Effects id 사용 |
| multi-step/sidebar/filter 의미 중복 | 같은 개념을 복제하거나 이름이 흔들림 | Layout은 전체 composition, Effects는 interaction pattern으로 경계; `relatedEffects[]` 연결 |
| `EffectsDemos` registry | Layout 25개 추가로 Effects 64/확장 count 계약 오염 | 전용 `LayoutWireframes` namespace/registry 사용 |
| 전역 CSS | `.demo-*`, `.card`, `.modal` selector가 기존 페이지를 덮음 | `.layout-*` root scope와 unscoped-selector verifier |
| thumbnail `isms` scope | `layouts/`가 “non-effects=isms”로 처리됨 | top-level catalog classifier 도입, `--scope layout` negative test |
| 211 immutable baseline | 새 manifest row를 baseline drift로 오판하거나 baseline을 재작성 | baseline set과 additive catalog set 분리, 093–098 수정 금지 |
| stage hardcoded count | PNG/WebP 증가 후 `pages:stage`/static QA 실패 | manifest-derived count로 전환 |
| 010 schema drift | runtime만 허용하는 비표준 필드 발생 | P1에서 schema gate, 불일치 시 010 fold-back |
| 015 shell drift | Layout 전용 복제 shell이 생김 | `CatalogShell.mount` callback 경계 유지, shell 수정 필요 시 scope expansion 보고 |
| 3단 모달 | 390px에서 figure가 가로 overflow | 3→2+1→1 grid, canvas `min-width:0`, 내부 label wrap 검사 |
| snippet 표시 | data HTML이 실행되거나 CSS가 페이지를 오염 | textContent/code block 렌더, 복사만 허용, script/event/global selector fail-closed |
| guide 텍스트 | ima2가 깨진 한국어/장식 중심 plate 생성 | contact sheet 25행 audit, 실패 슬롯만 재생성, alt/구성 설명이 정보 SoT |
