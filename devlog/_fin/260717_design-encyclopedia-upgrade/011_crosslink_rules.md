# 011 — 크로스링크 / 에셋 전략 / Registry 결정 기록 (WP2 산출물)

## 크로스링크 ID 규칙 (확정)

- 카드 id는 카탈로그 내부에서만 유일하면 된다. 전역 유일성은 `카탈로그명/id` 조합이 보장.
- 단, effects 기존 id와 표제어가 겹칠 수 있는 layout/motion은 `layout-`/`motion-` 접두어 필수
  (스키마 pattern으로 강제). color/typography는 접두어 없음(충돌 표제어 없음 확인).
- 크로스링크 필드는 단방향 저장: `relatedIsms[]`, `relatedEffects[]`(+ 070에서 필요 시
  `relatedColor[]` 등). 값에 카탈로그 접두어를 중복 저장하지 않는다(필드명이 도메인).
- 역방향(ISM → 관련 팔레트 등)은 런타임 계산. `isms.json` 스키마는 불변.
- dangling 참조는 `verify-catalog.mjs`가 FAIL 처리(070에서 활성화).

## 스키마 소유권 경계 (감사 라운드 확정)

- JSON Schema(이 디렉토리의 5개 파일): 레코드 내부 구조 제약만 — type/required/enum/const/
  pattern/길이/uniqueItems/중첩 구조. common은 `$defs` 확장 가능하게 두고 도메인 스키마
  결합부에 `unevaluatedProperties:false`.
- verify-catalog.mjs 런타임: 배열 전체 id 고유성, family/category 분포, light/dark role 집합
  동일성, contrast role 실존성, 크로스링크 실존성 + `ai-slop` 금지, `wireframe.type === id`,
  폰트 URL weight 일치, snippet 안전성, renderer registry 전단사.
- 현재 repo에 JSON Schema validator 패키지 없음 → 010은 선언형 SoT + 파싱 검증까지.
  실제 schema evaluation 도입(Ajv 등)은 015에서 verify-catalog 구현 시 결정.

## 에셋 전략 (확정)

| 도메인 | 카드 프리뷰 | 모달 | guide 이미지 |
| --- | --- | --- | --- |
| Color | CSS 스와치 그리드(이미지 불필요) | role 매핑 표 + 대비율 계산 | ima2 PNG 1536x1024 |
| Typography | 라이브 웹폰트 스페시멘 | 타입 스케일 + 혼조 샘플 | ima2 PNG |
| Layout | CSS 와이어프레임 도식(정적) | 3단 반응형 비교 + 스니펫 | ima2 PNG(와이어프레임 스타일) |
| Motion | 라이브 CSS demo | easing SVG 곡선 + 파라미터 + 코드 | ima2 PNG |

- 이미지 root: `assets/images/{color|typography|layout|motion}/{id}/guide.png` (전부 단수)
- WebP: `assets/images/thumbs/{동일 상대경로}/guide.webp`
- 생성: `ima2 gen --stdin -q high -s 1536x1024 --json --timeout 300`, `ima2 ping` 선행

## Verify 기준선 수리 기록 (이 사이클 B에서 실행)

- baseline/audit 7개 스크립트(`apply-image-candidates`, `capture-image-baseline`,
  `finalize-image-quality`, `image-attempt`, `image-quality-lib`, `init-image-quality-audit`,
  `verify-image-quality`): `devlog/260715_production_upgrade` → `devlog/_fin/260715_production_upgrade`
  리터럴 치환. `capture-image-baseline`/`init-image-quality-audit`는 재실행 금지(산출물 존재).
- final-QA 6개 스크립트(`final-qa-lib`, `final-preservation`, `run-final-static-qa`,
  `run-final-server-qa`, `run-final-browser-qa`, `verify-final-qa`): `EVIDENCE_ROOT` 런타임 계약으로
  전환 — `DESIGN_ISMS_EVIDENCE_ROOT` 환경변수(기본 `devlog/_plan/260717_design-encyclopedia-upgrade/qa`),
  `final-qa-lib.mjs`가 resolve/검증(absolute/`..`/repo 밖/symlink 거부) 후 export.
  `FINAL_ALLOWLIST`는 고정 정규식에서 evidence root 유도 함수 `finalAllowed(root, path)`로 대체.
  브라우저 receipt의 스크린샷 경로는 하드코딩 문자열에서 `relativePath()` 계산값으로 전환
  (verify-final-qa의 기대값도 동일 유도 — 계약 일치 유지).
- 기존 112~115 receipt는 무수정(증거 원본성 유지). `verify:local-final`은 080에서 새 receipt
  전체 재생성 후에만 통과 대상 — `npm run verify` 체인에는 포함되지 않음(확인됨).
