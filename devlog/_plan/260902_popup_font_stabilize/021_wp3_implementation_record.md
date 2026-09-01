# 021 — wp3 구현 기록

base: `ce7025d` + wp2 dirty. 020 그대로 23줄 치환(토큰 정의 1 + 리터럴 20 + fallback 2), 9 CSS 파일.

## 게이트 결과

| 게이트 | 수정 전 | 수정 후 |
|--------|---------|---------|
| 셸 리터럴(`font-family` + `font:`, 데모 제외) | 21 | **0** |
| fallback `var(--font-*, ...)` | 2 | **0** |
| 데모 예외 인벤토리(변경 없음) | 30 | 30 (`evidence/wp3_demo_exempt.txt`) |
| `npm run build && npm run verify` | exit 0 | exit 0, 산출물 JS 무변경 |

## 브라우저 실측 (`evidence/wp3_fonts.json`)

7페이지 body/display/mono computed == 토큰(따옴표·공백 정규화 후). 수정 전에는 color/typography/layout/motion의
`*-result-count`가 `"SF Mono", ui-monospace, monospace` 리터럴이었고, index의 `.header-count`는 Fira Code 스택이었다.
지금은 7페이지 전부 `"SF Mono", ui-monospace, Menlo, Consolas, monospace`.

## 리뷰

A 2라운드(FAIL → GO-WITH-FIXES 1건 접음), C 1라운드 PASS(blocker 0). 리뷰어 레인 Locke(spawn: gpt-5.6-sol medium priority).
데모 CSS 30건 `font:` 단축은 부분 반박으로 제외(020 §불변 조건의 범위) — 리뷰어 수용.

## FSM 메모

C에서 receipt를 뜬 뒤 evidence 파일을 추가로 써서 CHECK-BINDING-01이 stale로 판정됐고, 이어진 `orchestrate P`가
wp3를 열어둔 채 P로 이동했다. 재진입(P→A→B)에서 이 문서를 B 산출물로 남기고 receipt를 다시 뜬다.
교훈: evidence 쓰기 → receipt → D 순서를 지킨다.
