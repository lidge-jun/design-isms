# 041 — wp5 QA 기록

base: `ce7025d` / dirty: 24 tracked files(wp2 7 + wp3 9 + wp4 10, 파일 겹침 있음) + untracked `devlog/_plan/260902_popup_font_stabilize/`.
서버 `127.0.0.1:4173`(`.pages/` 스테이지, 실행 전 `npm run pages:stage`), aside repl. 명령 원문: `evidence/wp5_commands.sh`.

## 매트릭스 결과

| # | 페이지 | 시나리오 | 결과 | 증거 |
|---|--------|----------|------|------|
| M1-M3 | color | button / backdrop / escape | PASS ×3 | wp5_modal.json modal[0] |
| M4-M6 | typography | 동일 | PASS ×3 | modal[1] |
| M7-M9 | layout | 동일 | PASS ×3 | modal[2] |
| M10-M12 | motion | 동일 | PASS ×3 | modal[3] |
| M13 | index | `.ism-card-header` 클릭 → Escape | PASS | wp5_fonts_regression.json regression.indexEscape |
| M14 | effects | `.effect-card` → `.modal-close` | PASS | regression.effectsButton |
| F1-F7 | 7페이지 | body/display/mono computed == 토큰 | PASS ×7 | fonts[*].ok |
| L1 | 저장소 | 셸 리터럴 gate / fallback gate | 0 / 0 | wp5_gates.txt |
| V1 | 저장소 | `npm run build && npm run verify` | exit 0 | `.codexclaw/evidence/<session>/test-receipt.json` |
| V2 | 저장소 | `npm run pages:stage` | 0 forbidden | wp5_gates.txt |
| R1 | 4페이지 | 390px button 닫힘 + overflow 없음 | PASS ×4 (innerW 390) | wp5_modal.json mobile[*] |
| G1 | index/effects × 1440/390 | pageOverflow=false, 모달 cells(.header-count/.export-tab/.export-title) allOk + index finder cells(.finder-result-num ×3, dialog **열린 상태**에서 visible, sw=cw=32) allOk | PASS ×4 | wp5_geometry.json (C라운드 blocker 1 반영: 숨김 요소 0/0 통과 차단 → visible 조건 추가) |

12개 모달 경로 전부: `opened.mainInert=true, overlayInert=false, focusInDialog=true` → `after.closed=true, mainInert=false, focusOnTrigger=true`, consoleErrors 0.
wp1 시점 재현 결과(`wp1_repro_modal_prefix.json`)와 대비: 당시 button/backdrop 8경로가 `overlayInert=true, closed=false`였다.

## 실패 처분

없음.

## criteria 매핑

- c-1: M1-M14 + R1 → 충족
- c-2: F1-F7 + L1 + G1 → 충족
- c-3: 각 wp C단계 `cxc receipt test` exit 0(FSM ledger) + `evidence/wp{2,3,4}_after.patch`(소유 파일 + 산출물 JS 한정 diff: wp2 7 / wp3 9 / wp4 14 files — C라운드 blocker 2 반영) → 충족. **커밋은 NEEDS_HUMAN** — 000 §제약, AGENTS.md:88.
- c-4: wp1 D에서 충족.

## 리뷰 레인 총계

| wp | A 라운드 | C 라운드 | 리뷰어 |
|----|---------|---------|--------|
| wp1 | 4 (FAIL×3 → GO-WITH-FIXES 1) | GO-WITH-FIXES 1 | Rawls |
| wp2 | PASS | GO-WITH-FIXES 1(RED receipt 재생성) | Hume |
| wp3 | 2 (FAIL → GO-WITH-FIXES 1) | PASS | Locke |
| wp4 | GO-WITH-FIXES 2 | PASS | Raman |
| wp5 | GO-WITH-FIXES 4 | GO-WITH-FIXES 2 → 접음 | Fermat |

spawn 인자는 모두 `gpt-5.6-sol medium priority`. 실제 라우팅 모델은 이 저장소에서 검증 불가(002 참고).

## 사용자 확인 대기

커밋 / 푸시 / 배포 여부. 승인 시 순서는 040 §배포.

