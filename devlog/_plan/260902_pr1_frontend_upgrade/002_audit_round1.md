# 002 — A라운드 감사 기록 (리뷰어: xai/grok-4.6, explorer)

판정: **VERDICT: FAIL** (blocker 9건: High 6, Medium 1, Low 2).
FAIL은 A>B로 진행할 수 없다(AUDIT-LOOP-01). 아래 처분을 적용해 계획을 개정하고
같은 리뷰어로 재감사한다.

리뷰어가 독립 실행한 사전 스캔: `verify` / `verify:nav` / `sot:check` / `pages:stage`
모두 exit 0, `.pages`에 플러그인 유입 0건 — 우리 측정과 일치.

## 처분 (REVIEW-SYNTHESIS-01)

| # | 심각도 | 요지 | 처분 | 근거 |
|---|--------|------|------|------|
| 1 | High | `:focus-visible` 캐스케이드는 측정 불필요, 이미 결정 가능 | **수용** | 특이도 동률 (0,1,0) + theme-atlas 후행 로드 → atlas 링 승. 001 A5를 NOOP 후보로 재분류하고 방어적 `(0,2,0)` 규칙만 남김. 1판이 인용한 `theme-atlas.css:56`은 실제로 `.example-link` 색 규칙이었다 — 오인용 정정 |
| 2 | High | "verify가 CSS를 읽지 않는다"는 거짓 | **수용** | `verify-content.mjs:79`가 `assets/css` 전체를 읽어 `url()`을 해석하고, `verify-line-limits.mjs:30`이 줄 수를 센다. 000 문서의 검증기 표를 "CSS는 url·줄수·스니펫 계약에 대해서만 게이트되고, a11y/타이포/성능 렌더는 게이트 밖"으로 정정 |
| 3 | High | `src/app.ts`가 1049줄, 상한 1050 → 2줄 추가 시 verify:lines 실패 | **수용** | 실측 `wc -l` 1049, `verify-line-limits.mjs:12` `['src/app.ts', 1050]`. A4를 `updateLangUI()` 내부 **제자리 수정**(순증 0~1줄)으로 재설계 |
| 4 | High | `.search-input` 소유 phase가 3개로 흩어졌고 HTML 중복도 미고지 | **수용** | `.search-input` 단일 소유자 = wp5(C2). wp4의 B4 철회. 7개 HTML 글리프→SVG 교체는 wp5가 단독 소유하고, wp3은 닫기 버튼 **접근명(aria-label)만** 손댄다 → 파일은 겹치되 속성이 분리된다 |
| 5 | High | wp4의 폭 슬라이스는 effort bucket, `nav.css:160-165`가 이미 640px를 덮음 | **수용** | 실측 확인. B4 철회로 해소. 진행 중이던 시험 병합은 `git merge --abort`로 정리했고, wp2는 깨끗한 상태에서 다시 병합한다 |
| 6 | High | §7 베이스라인 결함 다수 누락 | **수용** | A6~A11로 001에 추가. 대비값은 자체 계산으로 재확인(ink-muted 3.007, signal 2.925) |
| 7 | Medium | file:line 다수가 어긋남 | **수용** | 001을 2판으로 재작성. `loading-fill`은 무한이 아님, `cardFadeIn`은 이미 처리됨, faq.ts는 이미 aria-label 보유, tagline은 :272, search 폭은 :186-191 |
| 8 | Low | verify:nav는 여는 태그만 검사하므로 SVG 교체로 깨지지 않음 | **수용** | `verify-nav.mjs:76`이 `<button[^>]*>`만 매치. 040의 "스크립트가 깨질 수 있다" 경고를 삭제하고, 진짜 위험인 `nav.css:50` `font-size:0.75em`이 SVG에 무의미해지는 점을 기록 |
| 9 | Low | 격리는 이미 증명됨, 재발명 불필요 | **수용** | 010에서 "루트 워크 발명" 없이 허용목록 인용으로 대체 |

반박(rebut) 없음 — 9건 전부 실측으로 재확인해 수용했다.

## 개정 요약

- 001 → 2판(행 재조준 + A6~A11 추가 + A1 축소 + B4 철회).
- 000 → 검증기 표 정정(CSS 게이트 범위), work-phase 맵에서 wp4 축소.
- 020 → A4 제자리 수정, A5 NOOP 재분류, A6~A11 편입, faq.ts 제외.
- 030 → B4 삭제, 래핑 전용 phase로 축소.
- 040 → `.search-input` 단독 소유 명시, verify:nav 경고 삭제, caret CSS 위험 기록.
