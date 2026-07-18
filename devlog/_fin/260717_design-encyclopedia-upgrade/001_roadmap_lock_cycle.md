# 001 — WP1 Roadmap Lock Cycle (docs-first P)

## Loop-spec

- **Loop archetype**: spec-satisfaction (docs-only Phase-0 pass, LOOP-DOCS-FIRST-01)
- **Trigger**: HOTL goal "Design Encyclopedia Upgrade 최소 10 PABCD 사이클"
- **Goal**: 010~080 decade doc 9개를 DIFFLEVEL-ROADMAP-01 수준(정확한 경로, NEW/MODIFY/DELETE, 수용 기준, 활성화 시나리오)으로 승격하고 goalplan workPhases와 1:1 매핑을 잠근다.
- **Non-goals**: 프로덕션 코드 변경, 이미지 생성, 배포.
- **Verifier**: 문서 구조 검사(각 decade doc에 파일 변경 맵/IN-OUT/수용 기준 존재), 코드 무변경 확인(git status) + typecheck 통과 + verify 실패가 기존 결함(`_fin` 경로 ENOENT)과 정확히 일치함, sol high 리뷰어 VERDICT.
- **Stop condition**: 9개 doc 승격 + 리뷰어 pass/near-pass + D 커밋.
- **Memory artifact**: 이 문서 + 승격된 decade docs + goalplan/ledger.
- **Expected terminal outcomes**: DONE. 리뷰어가 구조 결함을 지적하면 fold-back 후 재감사.
- **Escalation**: 로드맵 자체의 방향 충돌(예: effects 카운트 계약 불가 확장) 발견 시 NEEDS_HUMAN.
- **HOTL bounds**: 이 사이클은 문서 작업만. 쓰기 스코프 `devlog/_plan/260717_design-encyclopedia-upgrade/`, `.codexclaw/goalplans/`. 서브에이전트 4개(030/040/050/060 초안), 벽시계 ~40분.

## 현재 트리 재검증 결과 (stale check)

| 기존 doc 가정 | 현재 트리 사실 | 조치 |
| --- | --- | --- |
| effects 64개 고정 검증 | `scripts/verify-effects.mjs:16` `EXPECTED_EFFECTS = 64` 하드코딩 | 의도적 계약 상수 유지 — 020에서 94로 의식적 갱신(데이터 유도로 바꾸지 않음, 저장소 철학) |
| nav 3페이지 | `scripts/verify-nav.mjs` pages=['index','effects','faq'], 6축 고정 | 015에서 pages 배열 + Catalog 드롭다운 계약 확장 diff 명시 |
| 공유 셸 없음 | `src/effects.ts` 420줄, filters/interactions 분리 존재 | catalog-shell 추출 범위를 실제 심볼 기준으로 명시 |
| sot 카운트 49/64/18 | `scripts/sync-sot.mjs`가 데이터에서 유도, AGENTS 마커 | 확장 시 sot:sync 절차 각 doc에 명시 |
| 이미지 감사 | `image-pairs-manifest.json` 211쌍, `verify:image-quality` immutable baseline | 신규 이미지는 baseline 비대상 — 검증기 확장 diff를 020/030~060에 명시 |
| 파일 500줄 제한 | `verify-line-limits.mjs` (app.ts 1050 예외) | 새 렌더러/CSS 파일 분할 계획에 반영 |
| finder 144 콤보 | `verify-finder.mjs` 144/432 고정 | 스코프 밖 유지(변경 없음) 명시 |
| devlog가 루트에 존재 | 이전 세션이 `devlog/_fin/`으로 이동(uncommitted), 스크립트 13개 파일이 옛 경로 `devlog/260715_production_upgrade` 하드코딩 → **현재 `npm run verify` 기준선 실패**(`095_image_baseline_sheet_receipts.json` ENOENT) | WP2(010)에 "verify 기준선 수리: 스크립트 devlog 경로를 `devlog/_fin/260715_production_upgrade`로 일괄 이전" 추가 |

## 감사 라운드 기록 (A-phase)

- 라운드 1 (sol-high 리뷰어, 2026-07-18): VERDICT FAIL, blocker 10건.
  전부 수용(7번은 부분 수용 — 카운트 상수는 유지하되 문서 간 일치화).
  fold-back: 010(경로 수리 + 스키마 필드 정합 + scope registry 소유), 015(변경 맵 완결
  + 셸 lifecycle 훅 + verify-content), 020(image-quality 스크립트 + 산출물 JS),
  030/040/050/060(canonical registry 각서), 070(선행조건 Color 포함), 080(최종 계약 수치),
  050(라인 인용 정정).

## 분담

- 메인: 000 갱신, 010/015/020/070/080 diff-level 승격, 최종 일관성 병합.
- sol high 서브에이전트 4개(병렬, 쓰기 스코프 분리): 030 Color / 040 Typography / 050 Layout / 060 Motion 초안 — 카드 데이터 스키마 필드, 항목 목록(~25/~20/~25/~20), 파일 변경 맵, ima2 프롬프트 패턴, 수용 기준.
- 메인이 초안을 검수·수정 후 확정(서브에이전트 산출물은 candidate).

## 수용 기준

1. 각 decade doc: 파일 변경 맵(NEW/MODIFY/DELETE + 경로), IN/OUT 스코프, 검증 명령, 카드/데이터 항목 목록 포함.
2. 코드 무변경 확인(`git status`에 코드/데이터 파일 변경 없음). `npm run verify` 통과는
   기준선이 이미 깨져 있음(pre-existing `_fin` 이동)이 발견되어 WP2로 이관 — 이 사이클의
   C는 "typecheck + verify 실패가 기존 결함과 정확히 일치함"을 증거로 남긴다.
3. goalplan workPhases 10개가 decade doc과 1:1 매핑.
4. 리뷰어 VERDICT pass 또는 near-pass(잔여 blocker 처분 기록).
