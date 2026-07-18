# 070 — Cross-Catalog Linking & ISM Integration

의존: 030~060 전부 완료 후 (이 로드맵의 순차 실행 순서상 070 시점에는 4개 카탈로그가 모두 존재하며, 수용 기준의 왕복 시나리오는 Color를 고정 참조한다)


> **[WP9 A-감사 fold-back — 활성 diff 축소]** WP8 완료 트리 기준으로 순방향 링크·dangling 검증은 이미 구현됨.
> 이 사이클의 실제 변경: NEW `src/app-crosslinks.ts`+`assets/js/app-crosslinks.js`+`assets/css/app-crosslinks.css`,
> MODIFY `src/app.ts`(862행 대체 1줄+881행 뒤 1줄 — 1050 상한 정확히 유지)/`assets/js/app.js`/`index.html`(finder dialog와
> filter-bar 사이 catalog-entry 섹션+스크립트 순서)/`scripts/verify-content.mjs`(index 행에 app-crosslinks).
> 데이터 4파일·catalog-shell·도메인 렌더러·verify-catalog은 UNCHANGED. 역인덱스는 첫 모달 hydrate에서 4 JSON 병렬 지연
> 로드+캐시(실패 시 retry 가능, 섹션만 error). 정식 browser receipt 편입은 080, 이 사이클은 focused agbrowse 왕복 증거만.

## 목적

개별 카탈로그를 하나의 백과사전으로 연결한다.

## 파일 변경 맵

| 구분 | 경로 | 내용 |
| --- | --- | --- |
| MODIFY | `assets/data/color.json`, `assets/data/typography.json`, `assets/data/layout.json`, `assets/data/motion.json` | `relatedIsms[]`/`relatedEffects[]` 크로스링크 필드 채움(010 규칙, dangling 0) |
| NEW | `src/app-crosslinks.ts` + `assets/js/app-crosslinks.js` | ISM 모달 "관련 카탈로그" 섹션 로직(현행 `src/app.ts`가 1049/1050줄이므로 분리는 필수). `index.html`에서 `app-dialog.js` → `app-runtime.js` → `nav-dropdown.js` → `app-crosslinks.js` → `app.js` 순서로 선로드 |
| MODIFY | `src/app.ts` | app-crosslinks 훅 호출 1~2줄만(상한 준수) |
| MODIFY | `assets/js/app.js` | tsc 산출물 |
| MODIFY | `src/catalog-shell.ts`(공통 크로스링크 섹션 렌더 헬퍼) + `src/color.ts`/`src/typography.ts`/`src/layout.ts`/`src/motion.ts`(모달에 관련 항목 섹션 추가) | 모달 크로스링크 렌더(`page.html#id` 해시 링크) |
| MODIFY | `assets/js/catalog-shell.js`, `assets/js/color.js`, `assets/js/typography.js`, `assets/js/layout.js`, `assets/js/motion.js` | tsc 산출물(커밋 대상) |
| MODIFY | `index.html` | 카탈로그 요약/탐색 시작 섹션 |
| MODIFY | `scripts/verify-catalog.mjs` | 크로스링크 id 실존성 검증(전 카탈로그 로드 후 dangling 참조 FAIL) |

## IN / OUT

- IN: 위 파일 변경 맵 전부 — 크로스링크 데이터 채움, ISM 모달 확장, 카탈로그 모달 크로스링크, 홈 요약 섹션, dangling 검증.
- OUT: isms.json 구조 변경(49개 카운트/스키마 불변), 신규 카드 추가, 이미지 생성, nav 구조 변경.

## 변경 범위

### ISM 모달 확장
- ISM 모달에 "관련 Color / Typography / Layout / Motion" 섹션 추가
- 기존 keyword overlap 기반 관련 ISM은 유지
- 새 관련 항목은 신규 카탈로그 데이터의 `relatedIsms[]`를 역방향으로 런타임 계산
  (isms.json은 구조 변경하지 않음 — 49개 카운트/스키마 불변 유지)

### 카탈로그 모달 크로스링크
- Color 모달에서 "이 팔레트를 쓰는 ISM" 표시
- Typography 모달에서 "이 페어링이 어울리는 ISM" 표시
- Effects/Layout/Motion 간 자연스러운 크로스 참조
- 링크는 `./index.html#{ism-id}`, `./color.html#{id}` 형태의 기존 해시 직링크 재사용

### 홈/랜딩 업데이트
- `index.html`에 카탈로그 요약 섹션 또는 "탐색 시작" 가이드 추가

## 완료 기준

- ISM 모달에서 관련 카탈로그 항목 클릭 → 해당 페이지 모달 오픈
  (활성화 시나리오: minimalism 모달 → 관련 팔레트 클릭 → color.html 해당 모달 자동 오픈 스크린샷)
- 역방향 링크도 동작
  (활성화 시나리오: 팔레트 모달 → ISM 링크 → index.html 해당 ISM 모달 오픈)
- `npm run verify` 통과
- dangling 크로스링크 0건(`verify-catalog.mjs` 출력)
