# 000 — effects-modal-flicker: Plan

## Objective

Effects 카탈로그(`effects.html`) 카드 팝업이 열릴 때 화면이 살짝 깜빡이는(뒤 배경이 옆으로 밀리는) 문제 제거.

**관측된 실패:** 모달 open 시 `document.documentElement.clientWidth`가 1583 → 1600으로 17px 점프,
`PerformanceObserver({type:'layout-shift'})`에 value 0.0047 엔트리 기록
(headless Chrome, `agbrowse evaluate`, http://localhost:8642/effects.html, 2026-07-15).

**근본 원인:**

1. `src/effects.ts:272` — `openEffectModal()`이 `document.body.classList.add('modal-open')`을
   `AppDialogA11y.open()`(276행)보다 **먼저** 호출.
2. `assets/css/effects.css:246` — `body.modal-open { overflow: hidden; }`이 즉시 스크롤바 제거.
3. `assets/js/app-dialog.js:31-41` — 이후 실행되는 `lockScroll()`이
   `window.innerWidth - document.documentElement.clientWidth`로 스크롤바 폭을 재는데,
   이미 스크롤바가 사라진 뒤라 0으로 계산 → `padding-right` 보정 생략 → 17px 레이아웃 점프.

`index.html` ISM 모달은 `modal-open`을 쓰지 않고 `AppDialogA11y` 잠금만 사용하므로 깜빡이지 않음
(사용자 리포트가 effects 팝업에 한정된 것과 일치). 라이트박스(`#effect-lightbox`)도
`AppDialogA11y` 스택(2번째 push는 `lockScroll` skip)만 사용, `modal-open` 비의존.

**진단 보조:** sol 서브에이전트(explorer, gpt-5.6-sol, agent 019f651f-0f67) 랭킹 진단에서
동일 원인이 1순위. 차순위 후보(backdrop-filter pop, scale shimmer 등)는 계측 증거 없음 → OUT.

## Loop-spec

- Loop archetype: spec-satisfaction repair (verifier-defined: layout-shift 계측 + npm run verify)
- Write scope: `src/effects.ts`, `assets/css/effects.css`, 빌드 산출물 `assets/js/effects.js`, 본 devlog 유닛
- Out-of-scope: `assets/css/style.css`의 `.modal-overlay`/`.modal-container`(backdrop-filter, scale),
  `assets/js/app-dialog.js`(공유 헬퍼 — ISM 모달 영향), DesignExport mount, guide 이미지 로딩
- Verifier: (1) agbrowse evaluate — open 시 widthDelta=0, layout-shift 0건, open 중 body padding-right 보정 활성,
  close 후 원상복구; (2) `npm run build` + `npm run verify` 통과; (3) 콘솔 에러 0; (4) 모달 스크린샷 관측
- Stop condition: 위 verifier 전부 green
- Escalation: 수정 후에도 사용자 깜빡임 재현 시 → 차순위 후보(backdrop-filter/scale)로 별도 work-phase 추가

## Work-phase map (one phase = one full PABCD cycle)

| WP | Doc | Slice | Depends on |
|----|-----|-------|------------|
| 1 | 010_phase1.md | modal-open 스크롤 잠금 이중화 제거 + 재빌드 + 계측 검증 | — |

## Accept criteria

- AC1: 모달 open 시 `documentElement.clientWidth` 델타 0, layout-shift 엔트리 0건 (agbrowse 계측)
- AC2: 모달 open 중 `body.style.overflow === 'hidden'` && `body.style.paddingRight === '<scrollbarWidth>px'`,
  close 후 두 값 모두 원복 (활성화 시나리오 — C-ACTIVATION-GROUNDING-01)
- AC3: `npm run build` 후 `assets/js/effects.js`에 `modal-open` 토글 부재, `npm run verify` 통과
- AC4: effects 페이지 콘솔 에러 0, 모달 정상 open/close 스크린샷 관측 (C-RENDER-GROUNDING-01)
