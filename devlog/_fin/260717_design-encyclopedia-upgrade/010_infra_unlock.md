# 010 — Schema & Contract Design + Verify 기준선 수리

## 목적

콘텐츠 확장 전에 모든 카탈로그 도메인의 데이터 스키마, 카드 단위, 필터 축,
에셋 전략, 크로스링크 ID 규칙을 문서로 확정하고, 깨져 있는 `npm run verify`
기준선(devlog `_fin` 이동으로 인한 스크립트 경로 ENOENT)을 수리한다.

## 파일 변경 맵

| 구분 | 경로 | 내용 |
| --- | --- | --- |
| NEW | `assets/data/schema/catalog-common.schema.json` | 공통 카드 필드 계약 |
| NEW | `assets/data/schema/color.schema.json` | Color 고유 필드 |
| NEW | `assets/data/schema/typography.schema.json` | Typography 고유 필드 |
| NEW | `assets/data/schema/layout.schema.json` | Layout 고유 필드 |
| NEW | `assets/data/schema/motion.schema.json` | Motion 고유 필드 |
| NEW | `devlog/_plan/260717_design-encyclopedia-upgrade/011_crosslink_rules.md` | 크로스링크/에셋 전략/registry 결정 기록 |
| MODIFY | 정확히 13개 파일: `scripts/apply-image-candidates.mjs`, `capture-image-baseline.mjs`, `final-preservation.mjs`, `final-qa-lib.mjs`, `finalize-image-quality.mjs`, `image-attempt.mjs`, `image-quality-lib.mjs`, `init-image-quality-audit.mjs`, `run-final-browser-qa.mjs`, `run-final-server-qa.mjs`, `run-final-static-qa.mjs`, `verify-final-qa.mjs`, `verify-image-quality.mjs` | devlog 경로 참조 이전. **read/write 분리**: immutable baseline READ root(091~098 감사 산출물, 093~097 baseline)는 `devlog/_fin/260715_production_upgrade`로 이전, 새 QA receipt WRITE root(11x receipts, qa/ 스크린샷)는 현행 유닛 `devlog/_plan/260717_design-encyclopedia-upgrade/qa/`(080에서 `_fin` 아카이브)로 분리 — 과거 유닛 receipt를 덮어쓰지 않는다. root는 **두 개의 명시적 계약으로 분리**한다(단일 상수 아님):
  (a) `BASELINE_ROOT` — 고정 `devlog/_fin/260715_production_upgrade`. **immutable READ subset은 093~097 baseline뿐**이며 소비자는 `image-quality-lib.mjs`, `verify-image-quality.mjs`다. 같은 디렉토리의 mutable 감사 ledger(091 audit CSV, 092 attempts, 098 final receipt, 031/032 guide ledger)는 **AUDIT_LEDGER 계약**으로 분리: writer(`capture-image-baseline.mjs`=093~097 최초 생성 전용 — 재실행 금지, `image-attempt.mjs`=092 append, `apply-image-candidates.mjs`=091+031/032 승인 교체, `finalize-image-quality.mjs`=095/098, `init-image-quality-audit.mjs`=091 초기화)는 기존 ledger 연속성을 위해 같은 `_fin/260715` 경로에 append/update하되, `verify-image-quality.mjs`가 baseline(093~097) byte 불변 + ledger append 클래스(승인 교체 vs `kind=catalog-addition`)를 구분 검증한다(020 변경 맵과 동일 계약).
  (b) `EVIDENCE_ROOT` — 환경변수 `DESIGN_ISMS_EVIDENCE_ROOT`(기본 `devlog/_plan/260717_design-encyclopedia-upgrade/qa`)를 `final-qa-lib.mjs` 한 곳에서 resolve해 export. 현행 유닛 QA receipt(11x, qa/ 스크린샷) READ+WRITE. 소비자: `run-final-static-qa.mjs`, `run-final-server-qa.mjs`, `run-final-browser-qa.mjs`, `final-preservation.mjs`, `verify-final-qa.mjs`, `final-qa-lib.mjs`. `FINAL_ALLOWLIST`(final-qa-lib.mjs:30)도 `EVIDENCE_ROOT`에서 동적으로 유도.
  두 root는 절대 겹치지 않으며, 080의 환경변수 전환은 (b)에만 적용된다 — baseline reader는 영향받지 않는다. governed-tree SHA 계약은 소스 무변경 전환으로 유지. `final-qa-lib.mjs:30`의 escaped regex(`devlog\/260715...`)도 함께 갱신 |

런타임 코드(`src/`, HTML, CSS)는 변경하지 않는다. `scripts/`는 경로 상수 이전만 허용.
이 사이클 종료 시 `npm run verify` 전체가 통과해야 한다(기준선 복구 증명).

## IN / OUT

- IN: 스키마 JSON 5개, 011 결정 기록, scripts devlog 경로 상수 이전.
- OUT: 런타임 코드/HTML/CSS/데이터 변경, nav, Effects 수, 이미지 생성, 신규 페이지.

## Canonical Registry (병렬 phase 공통 계약 — 015~080은 이 표를 따른다)

| 항목 | 계약 |
| --- | --- |
| 이미지 root | 기존 `assets/images/effects/{id}/guide.png` 유지. 신규 도메인은 `assets/images/color/{id}/guide.png`, `assets/images/typography/{id}/guide.png`, `assets/images/layout/{id}/guide.png`, `assets/images/motion/{id}/guide.png` — 전부 **단수** |
| WebP preview | `assets/images/thumbs/{root와 동일 상대경로}/guide.webp` |
| thumbnail scope enum | `generate-thumbnails.mjs`를 `--scope effects\|isms\|color\|typography\|layout\|motion\|all`로 1회 확장(015에서 구현). `isms` 판정은 `!effects`가 아니라 명시적 루트 목록 |
| manifest 누적 | `image-pairs-manifest.json` 211 → 020 후 241 → 030 후 266 → 040 후 286 → 050 후 311 → 060 후 331쌍. 080 최종 계약 = 331쌍 / Effects 94 |
| image-quality baseline | 기존 211개 immutable 유지. `image-quality-lib.mjs`의 211 고정 inventory는 "legacy 슬롯 집합"(id 목록 스냅샷)으로 전환해 신규 도메인/신규 effects를 제외하는 allowlist 구조로 020에서 확장 |
| verify-catalog | `scripts/verify-catalog.mjs` 단일 파일이 도메인 registry 배열(`[{name, dataPath, imageRoot, schemaPath, expectedCount}]`)을 순회 — 도메인별 인자/별도 스크립트 없음. 데이터 파일 부재 시 skip |
| sot 마커 | `sync-sot.mjs` counts 확장은 각 콘텐츠 사이클에서 수행, 마커 네이밍 `data-sot:{domain}-count` 통일 |
| 카운트 계약 상수 | `verify-effects.mjs`의 `EXPECTED_EFFECTS`는 의도적 상수 유지, 020에서 64→94로 의식적 갱신 |
| CatalogShell lifecycle | 015의 `CatalogShell.mount(config)`는 `renderCard`/`renderModal` 외에 `onModalOpen(item)`(비동기 후처리: 폰트 로드, easing SVG 그리기)과 `getHashId(item)` 훅을 계약에 포함 — 040/060 요구 선반영 |

## 산출물 상세

`catalog-common.schema.json` (JSON Schema draft 2020-12):

- 필수: `id`(kebab-case, `^[a-z0-9]+(-[a-z0-9]+)*$`), `name`, `nameKr`, `family`,
  `category`, `summary`(한국어 2~4문장), `guide`(`{file, alt, prompt}` 또는 null)
- 선택: `relatedIsms[]`, `relatedEffects[]`, `relatedColor[]`, `relatedTypography[]`,
  `relatedLayout[]`, `relatedMotion[]` — 값은 각 카탈로그의 실존 id여야 함
- 도메인 스키마는 `allOf`로 공통 스키마를 참조하고 고유 필드만 추가

도메인 고유 필드 — **각 도메인 doc(030/040/050/060)의 스키마 절이 SoT이며, 010의 스키마
JSON은 그 절의 필드명을 그대로 옮겨 적는다**(필드명 재발명 금지):

- color: 030 §스키마 — light/dark `palette[]`(8~12색 `{hex, role}`), tone, WCAG 대비 판정
- typography: 040 §스키마 — `heading`/`body`/`mono`, `scale`, `supportsKorean`, `webfonts[]`
- layout: 050 §스키마 — `wireframe.type === id`, `breakpoints{desktop,tablet,mobile}`, `snippet`
- motion: 060 §스키마 — `easing`, `duration`, `trigger`, `intensity`, 구조화 `reducedMotion` 객체, `snippet.css`

크로스링크 규칙(011에 기록):

- 모든 id는 전 카탈로그에서 유일할 필요는 없고 `카탈로그명/id` 조합으로 유일
- 단 layout/motion이 effects 기존 id와 겹치는 표제어는 `layout-`, `motion-` 접두어로 회피
- 크로스링크는 단방향 저장(`relatedX[]`), 역방향은 런타임 계산(기존 관련 ISM 방식과 동일)

에셋 전략: Color=팔레트 스와치는 CSS 렌더(이미지 불필요)+가이드 PNG(ima2),
Typography=라이브 웹폰트 스페시멘+가이드 PNG, Layout=CSS 와이어프레임 도식+가이드 PNG,
Motion=CSS demo 애니메이션+가이드 PNG. 모든 PNG는 1536x1024, WebP 썸네일 파이프라인 재사용.

## 범위 밖

- 런타임 코드 구현, HTML 페이지, nav 변경, Effects 수 변경, 이미지 생성

## 완료 기준

- 5개 JSON schema 파일이 존재하고 서로 모순 없음
  (검증: `node -e` 파싱 + 도메인 doc의 카드 필드 목록과 대조)
- 각 도메인별 카드 단위, 필터 축, 에셋 종류가 명시됨
- 크로스링크 ID 네이밍 규칙이 ISM/Effects 기존 id 패턴과 호환
- `npm run verify` 전체 통과(기준선 복구 — `verify:image-quality` ENOENT 해소 포함)
- `rg -e "260715_production_upgrade" scripts/ | rg -v "_fin/"` 결과 0건(escaped-regex 참조 포함 이전 완결 증명)
