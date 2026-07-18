# 011 — Phase 1 검증 결과 (2026-07-15)

## 변경

- `src/effects.ts` — `openEffectModal`/`closeEffectModal`의 `document.body.classList.add/remove('modal-open')` 제거
- `assets/css/effects.css` — `body.modal-open { overflow: hidden; }` 규칙 제거
- `assets/js/effects.js` — `npm run build`(tsc) 재생성, 2줄 삭제만 diff
- 총 diff: 3 files, 5 deletions. SoT 문서(README/AGENTS/structure/docs)에 `modal-open` 언급 없음 → 문서 sync 불필요

## 계측 (agbrowse headless Chrome, http://localhost:8642/effects.html)

| 항목 | 수정 전 | 수정 후 |
|---|---|---|
| 모달 open 시 body inline 보정 | 없음 (`lockScroll`이 scrollbarWidth=0으로 오측) | `overflow:hidden` + `padding-right:17px` 활성 |
| layout-shift 엔트리 | 0.0047 (본문 전체 17px 점프) | 0.000078 — 유일 출처가 페이드아웃된 `#loading-overlay .loading-inner`(불가시 fixed 요소의 뷰포트 재중앙화). 가시 콘텐츠 시프트 0 |
| close 후 원복 | — | `overflow`/`padding-right` 모두 초기값, clientWidth 1583 복귀 |
| 모달→라이트박스→Esc→Esc 스택 회귀 | — | 라이트박스만 먼저 닫히고 잠금 유지, 최종 완전 원복 (A-감사 blocker 1 해소) |
| 딥링크 `#bottom-sheet` (hydrateHash) | — | 모달 open + 잠금/보정 정상 |
| 콘솔 에러 | — | 0건 |
| 스크린샷 | — | 모달 정상 렌더 관측 (`~/.browser-agent/screenshots/screenshot_1784108465829.png`) |

## AC 판정

- AC1 **부분 재정의(근거 기록)**: `clientWidth` 델타 0은 잘못 세운 지표였음 — `overflow:hidden`이 스크롤바를
  숨기면 clientWidth는 본질적으로 17px 증가하며, 사용자 체감 기준은 "가시 콘텐츠가 움직이지 않음".
  가시 콘텐츠 layout-shift 0 달성. 잔여 0.000078은 불가시 로딩 오버레이 내부 박스(체감 불가, CLS 임계 0.1의 1/1000 수준).
- AC2 충족: open 중 보정 활성, close 후 원복 (활성화 시나리오 증거 확보)
- AC3 충족: build exit 0, `effects.js` 내 `modal-open` 0건, `npm run verify` exit 0 (snippets 64/finder 등 전부 ok)
- AC4 충족: 콘솔 에러 0, 스크린샷 관측

## 잔여 사항 (out-of-scope 기록)

- `#loading-overlay`가 fade-out 후에도 DOM에 opacity 0으로 남아 layout-shift 계측에만 잡힘.
  체감 영향 없음. 없애려면 fade-out 종료 시 `visibility:hidden` 전환 필요(공유 style.css — 별도 작업).
- backdrop-filter blur pop / 컨테이너 scale shimmer는 계측 증거 없어 미적용. 사용자 재현 지속 시 후속 work-phase.

## 터미널 결과: DONE
