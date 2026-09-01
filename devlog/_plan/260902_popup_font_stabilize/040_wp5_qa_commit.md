# 040 — wp5: 최종 QA 매트릭스 + 증거 (2판, A라운드 반영)

선행: wp4. c-1 ~ c-4를 한 번에 닫는 통합 검증 사이클. **코드 변경 없음.**
회귀가 발견되면 이 wp에서 고치지 않는다 — P로 돌아가 해당 wp 문서(010/020/030)를 개정하고
그 wp 소유 파일만 수정한 뒤 wp5를 다시 돈다.

## QA 매트릭스

| # | 페이지 | 시나리오 | 통과 조건 |
|---|--------|----------|-----------|
| M1 | color | 카드 클릭 → 닫기 버튼 | overlay `.active` 제거, main inert 해제, 포커스가 트리거 카드로 복귀 |
| M2 | color | 카드 클릭 → backdrop 클릭 | 동일 |
| M3 | color | 카드 클릭 → Escape | 동일 |
| M4-M6 | typography | M1-M3 | 동일 |
| M7-M9 | layout | M1-M3 | 동일 |
| M10-M12 | motion | M1-M3 | 동일 |
| M13 | index | 카드 클릭 → Escape | 회귀 없음 |
| M14 | effects | 카드 클릭 → 닫기 버튼 | 회귀 없음 |
| F1-F7 | 7페이지 | `getComputedStyle` body / h1 / 모노 요소 fontFamily | 토큰 스택과 일치 |
| L1 | 저장소 | 020 §검증 1·2 rg 명령 | 0건 |
| V1 | 저장소 | `npm run build && npm run verify` | exit 0 |
| V2 | 저장소 | `npm run pages:stage` | 0 forbidden |
| R1 | 4페이지 | 모바일 390px에서 M1 | 닫힘 + horizontal overflow 없음 |
| G1 | index, effects | 1440 + 390에서 페이지 `scrollWidth <= clientWidth`, 그리고 `.header-count`, `.export-tab`(모달 열어 export 영역), finder 번호 요소의 개별 `scrollWidth <= clientWidth` | 모두 true (wp3 모노 스택 변경의 기하 회귀 게이트, A라운드 blocker 2) |

## 실행 명령 (3판 — 실제 실행해 evidence를 만든 명령은 `evidence/wp5_commands.sh`에 그대로 보관)

`aside repl`에 `--timeout`은 없으므로 호스트 `timeout`으로 감싼다. DOM 접근은 `p.evaluate` 안에서만, 인자는 **하나**(배열로 묶음 — A라운드 blocker 1).
뷰포트는 `p.setViewportSize`가 없고 `p._sendToTarget('Emulation.setDeviceMetricsOverride', {...})`를 쓴다.
정적 서버 :4173은 `.pages/`를 서빙하므로 실행 전 `npm run pages:stage`.

| 묶음 | 매트릭스 항목 | 절차 요약 | 산출 |
|------|---------------|-----------|------|
| 1 | M1-M12, R1 | 4 카탈로그 × (`.{color,typo,layout,motion}-card` 클릭 → button/backdrop/escape) → 390px 에뮬 후 button 1회 | `evidence/wp5_modal.json` |
| 2 | F1-F7, M13, M14 | 7페이지 computed(body/`.logo`·`#…-title`·`h1`/mono selector) vs 토큰; index `.ism-card .ism-card-header`→Escape; effects `.effect-card`→`.modal-close` | `evidence/wp5_fonts_regression.json` |
| 3 | G1 | index/effects × 1440/390; index는 `#finder-trigger` → 3 라디오 change → `#finder-submit` 클릭으로 `.finder-result-num` **실제 생성** → 모달 열어 `.export-tab` 측정; `allOk = cells.length>0 && every ok` (공집합 통과 차단 — blocker 2) | `evidence/wp5_geometry.json` |

M13/M14/R1은 위 묶음 안에 완성된 명령으로 들어 있다(blocker 3). L1: 020 §검증 1·2. V1: `cxc receipt test -- sh -c 'npm run build && npm run verify'`. V2: `npm run pages:stage`.

## c-3 per-wp 증거 (A라운드 blocker 4)

wp별 receipt는 두 종류다. (a) 각 wp C단계의 `cxc receipt test` — `.codexclaw/evidence/<session>/test-receipt.json`에 남고 D attest가 경로를 인용했다(FSM ledger가 wp별 D를 기록).
(b) 소유 파일 + 산출물 JS 한정 diff = `evidence/wp{N}_after.patch`(wp2 7 files, wp3 9, wp4 14). `wp{N}_diff.txt`는 누적 `--stat`이라 참고용이고 per-wp 증거는 after.patch다.

## receipt (`evidence/` 파일 집합)

- `wp5_modal.json`: `{modal:[4 pages × results[3]], mobile:[4]}`
- `wp5_fonts_regression.json`: `{fonts:[7 pages, ok], regression:{indexEscape, effectsButton}}`
- `wp5_geometry.json`: `[4 combos: pageOverflow, finderResults, exportTabs, cells, allOk]`
- `wp5_gates.txt`: L1 두 gate 출력 + V2 마지막 줄; V1은 `.codexclaw/evidence/<session>/test-receipt.json`

## NEW `041_wp5_qa_record.md`

```
+# 041 — wp5 QA 기록
+
+base: <HEAD> / dirty: <파일 수>
+
+## 매트릭스 결과
+
+| # | 페이지 | 시나리오 | 결과 | 증거 |
+|---|--------|----------|------|------|
+| M1 | color | button | PASS/FAIL | wp5_matrix.json#modal[0].results[0] |
+| ... (M1-M14, F1-F7, L1, V1, V2, R1, G1 전부) |
+
+## 실패 처분
+
+(없으면 "없음". 있으면 → P 개정 대상 wp 문서와 사유)
+
+## criteria 매핑
+
+- c-1: M1-M14 → 충족/미충족
+- c-2: F1-F7, L1, G1 → 충족/미충족
+- c-3: V1 + evidence/wp2_diff.txt, wp3_diff.txt, wp4_diff.txt → 충족/미충족 (커밋은 NEEDS_HUMAN)
+- c-4: wp1 D에서 충족
+
+## 사용자 확인 대기
+
+커밋 / 푸시 / 배포 여부 — AGENTS.md:88, 000 §제약.
```

## 검증 (C)

1. 위 매트릭스 전 항목 실행, `evidence/wp5_matrix.json` 저장.
2. `cxc receipt test`로 verify receipt 생성.
3. 041 작성.

## 배포 (NEEDS_HUMAN)

이 unit의 요청에는 커밋/푸시 지시가 없다. wp5 D 이후 사용자에게 "커밋 → push origin main → Actions deploy"를 묻는다.
승인 시 순서: wp2/wp3/wp4 diff를 각각 커밋(메시지: `fix(wp2): keep dialogs live and outside main`,
`style(wp3): route every font-family through the root font tokens`, `style(wp4): align empty/loading state typography`)
→ `docs(wp5): QA matrix evidence` → push → 라이브 URL에서 M1·F1 재확인.
