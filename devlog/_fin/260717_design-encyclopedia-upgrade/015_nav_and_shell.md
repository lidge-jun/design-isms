# 015 — Nav Dropdown & Shared Catalog Shell

의존: 010 스키마 확정 후

## 파일 변경 맵

| 구분 | 경로 | 내용 |
| --- | --- | --- |
| MODIFY | `index.html`, `effects.html`, `faq.html` | nav의 `effects` 축을 `catalog` 드롭다운으로 교체(details/summary 또는 button+listbox), 축 순서 `Isms / Catalog / FAQ / GitHub / Lang / Count` |
| NEW | `color.html`, `typography.html`, `layout.html`, `motion.html` | placeholder 페이지(공유 셸 로드, 데이터 0건 → "준비 중") |
| MODIFY | `assets/css/nav.css` | 드롭다운 스타일(데스크탑 hover/focus, 모바일 탭 토글), "준비 중" 배지 |
| NEW | `assets/css/catalog.css` | 신규 카탈로그 페이지 공통 CSS(빈 상태 포함) |
| NEW | `src/catalog-shell.ts` | 카드 그리드/모달/검색/필터/라이트박스 공통 로직(`CatalogShell` namespace, ≤500줄) |
| NEW | `src/nav-dropdown.ts` | Catalog 드롭다운 토글/키보드 로직(전역 `NavDropdown`, 3+4페이지 공용) |
| MODIFY | `src/effects.ts` | CatalogShell 위에 재구성(기능 변경 없음) — 페이지 요소 획득/모달 열기/해시 처리 위임 |
| NEW | `assets/js/catalog-shell.js`, `assets/js/nav-dropdown.js` | tsc 산출물(커밋 대상) |
| MODIFY | `assets/js/effects.js` | src/effects.ts 재구성의 산출물 |
| MODIFY | `scripts/verify-nav.mjs` | pages 배열 7페이지로 확장, `catalog` 축 계약(드롭다운 마크업+coming soon 상태) 추가 |
| MODIFY | `scripts/verify-content.mjs` | pages 7페이지 확장 + placeholder 빈 상태 문구 허용(영문 `coming soon` 금지 유지, 한국어 "준비 중" 배지만 사용) + 7페이지 스크립트 로드 순서 검증(`app-runtime.js` → `nav-dropdown.js` → 페이지 렌더러) |
| MODIFY | `scripts/generate-thumbnails.mjs` | `--scope` enum을 010 Canonical Registry(`effects\|isms\|color\|typography\|layout\|motion\|all`)로 확장, isms 판정을 명시적 루트 목록으로 변경 |
| NEW | `scripts/verify-catalog.mjs` | 범용 카탈로그 검증기(데이터 존재 시 카드 수=JSON 길이, demo/guide 계약) |
| MODIFY | `package.json` | `verify:catalog` 스크립트 추가, `verify` 체인에 포함 |
| MODIFY | `scripts/stage-pages.mjs` | `publicFiles`에 4개 신규 HTML 추가 + hardcoded stage count 3→7 갱신(106행 부근, 감사 fold-back) |
| MODIFY | `scripts/run-final-static-qa.mjs`, `scripts/run-final-server-qa.mjs`, `scripts/run-final-browser-qa.mjs`, `scripts/verify-final-qa.mjs` | pages 목록을 7페이지로 확장할 수 있는 구조(receipt 계약 수치는 080에서 최종 갱신) |

## 설계 결정

### Nav 드롭다운
- "Effects" 축 → "Catalog" 드롭다운 (Effects / Color / Typography / Layout / Motion)
- 구현: `<div class="nav-dropdown" data-nav-axis="catalog">` + `<button aria-expanded>` +
  `<ul role="list">` — JS는 `src/nav-dropdown.ts`(키보드 Esc/화살표, 바깥 클릭 닫기)
- 준비 안 된 카탈로그는 `aria-disabled="true"` + "준비 중" 배지 — 콘텐츠 사이클(030~060)이
  하나 끝날 때마다 활성화로 전환
- 활성 페이지 표시는 드롭다운 버튼에 `aria-current="page"` 유지(페이지당 1개 불변)
- 모바일(≤640px): 드롭다운을 인라인 접이식으로 전환, 44px 터치 타겟

### 공유 카드/모달 셸
- `src/catalog-shell.ts` — `CatalogShell` namespace: `mount(config)` 하나로
  `{grid, searchInput, filterRows, modal, lightbox, resultCount}` 요소를 받아
  검색 디바운스/필터 상태/모달 포커스 트랩(AppDialogA11y 재사용)/해시 라우팅 제공
- 도메인 페이지 콜백 계약: `renderCard(item): string`, `renderModal(item): string`,
  선택 훅 `onModalOpen(item, dialogEl)`(폰트 로드/easing SVG 등 비동기 후처리),
  `getHashId(item)` — 010 Canonical Registry의 lifecycle 계약과 동일
- Effects는 `EffectsFilters`/`EffectsInteractions`를 유지한 채 셸 계약에 맞춰 재배선
  (동일 DOM id 유지 — 기존 CSS/QA 계약 보존)
- **filter/search 소유권 고정(감사 fold-back)**: CatalogShell은 debounce/rerender 요청/UI
  lifecycle만 소유. 도메인 adapter가 query/filter state와 `matches(item)` 소유. Effects
  adapter는 EffectsFilters에 위임. 같은 search input에 Shell과 도메인이 이중 listener 금지.
- **aria-current 배치**: index=Isms 링크, faq=FAQ 링크, effects+신규 4페이지=Catalog 드롭다운
  trigger 버튼. 내부 메뉴 항목은 `data-catalog-target`+`data-catalog-current`(중복 aria-current 금지).
- placeholder count 라벨: `0 colors` / `0 pairings` / `0 layouts` / `0 motions` (콘텐츠 사이클에서 갱신).
- placeholder는 renderer 스텁/JSON fetch 없이 static 빈 상태만(030~060 NEW 계약 보존).

### 동적 불변조건
- `scripts/verify-effects.mjs`의 `EXPECTED_EFFECTS = 64` 하드코딩은 020 사이클에서
  카운트 SoT(`assets/data/effects.json` 길이 + sot 마커)와 함께 갱신 — 015에서는 유지
- `verify-catalog.mjs`: 신규 4개 데이터 파일이 아직 없으면 skip(placeholder 허용),
  있으면 스키마 필수 필드/중복 id/크로스링크 실존성 검증
- `sync-sot.mjs`: 신규 카탈로그 카운트 마커는 각 콘텐츠 사이클에서 추가

### Placeholder 페이지
- 4개 HTML은 `faq.html`(62줄) 수준의 thin entry: `style.css → theme-atlas.css → nav.css →
  catalog.css` 로드 순서, `app-runtime.js` 선로드
- 해당 JSON 부재/0건 → "준비 중" 안내 + Effects로 돌아가는 링크(빈 상태 UX-STATE-01)

## IN / OUT

- IN: 위 파일 변경 맵 전부(드롭다운, 셸, placeholder 4페이지, 검증기 확장, thumbnail scope enum).
- OUT: 새 콘텐츠 데이터, Effects 수 변경, 이미지 생성, 드롭다운 외 시각 디자인 변경.

## 범위 밖

- 새 콘텐츠 추가 (Effects 64개 유지)
- 시각 디자인 변경 (드롭다운 외)

## 완료 기준

- `npm run verify` 통과, 기존 49/64/18 동작 유지
- 드롭다운이 모든 페이지에서 렌더링
  (활성화 시나리오: 키보드 Enter로 열기 → 화살표 이동 → Esc 닫기, 모바일 뷰포트 스크린샷)
- Effects 페이지가 catalog-shell 위에서 동일 동작
  (활성화 시나리오: 검색/필터/모달/라이트박스/해시 직링크 각 1회 브라우저 확인)
- 4개 placeholder 페이지가 200 응답 + "준비 중" 표시
