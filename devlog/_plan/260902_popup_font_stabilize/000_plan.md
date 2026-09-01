# 000 — 팝업 닫힘 버그 + 폰트 토큰 통일 + Design Read 안정화 (2판, A라운드 반영)

unit: `devlog/_plan/260902_popup_font_stabilize/`
session: 01a05db6-4aa4-7190-80db-a06354f0001c
goalplan slug: `701-design-isms-7-pabcd-1-src-app-dialog-ts-setb`
work class: C2 (다중 표면 CSS/TS/HTML 수정, 데이터·이미지 무변경)
base: `main` @ `ce7025d` (clean)

## 목적

7개 공개 페이지에서 확인된 두 결함을 고정하고, 그 위에서 셸/모달/카탈로그 표면의
타이포 위계와 상태 화면을 리터럴 수준에서 맞춘다.

1. 카탈로그 4페이지(color/typography/layout/motion)에서 카드 모달이 열린 뒤 닫히지 않는다.
2. `--font-sans/--font-display/--font-mono` 토큰이 있는데도 CSS 20곳이 폰트 리터럴로, 2곳이 fallback 문자열로 우회한다.
3. 빈 상태·로딩·에러 표면의 폰트/색 위계가 페이지마다 조금씩 다르다.

## 제약

- 49 ISMs / 94 effects / 18 FAQ 카운트와 `assets/data/*.json`, 331 이미지 쌍은 건드리지 않는다.
- `src/*.ts` 수정 시 `npm run build` 후 `assets/js/*.js` 산출물을 diff에 포함한다(커밋 대상 파일).
- 토큰 정의는 `style.css :root`(폰트 3종)와 `theme-atlas.css`(색·셸)가 소유한다. 새 토큰 파일을 만들지 않는다.
- 새 디자인 방향을 들이지 않는다(uiux-design 자기평가: 기존 dials 유지).
- nav 구조, 플러그인/스킬 파일, data-sot 마커, `src/app.ts` 1050줄 상한은 건드리지 않는다.
- **git 커밋/푸시는 NEEDS_HUMAN** (AGENTS.md:88 — 같은 턴 명시 요청 없이는 커밋도 금지). 이번 요청에는
  커밋 지시가 없다. phase별 성공 기준은 working-tree diff + verify receipt로 대체하고, 전체 완료 후
  사용자에게 커밋·푸시·배포를 한 번에 묻는다. 사용자가 턴 중 지시하면 그 시점부터 진행한다.
  goalplan c-3의 "wp별 로컬 커밋 존재"는 이 판단으로 "wp별 diff receipt(`evidence/wp{N}_diff.txt`) 존재"로 읽는다.

## 의존성 정렬 work-phase 맵 (PHASE-SPLIT-01)

| wp | 문서 | 산출물 | 선행 |
|----|------|--------|------|
| wp1 | 000, 001, 010, 020, 030, 040 | 이 로드맵(diff-level) + 실측 인벤토리 | — |
| wp2 | 010 | 모달 inert 버그 수정 + 정적 계약 (기반: 상호작용 복구) | wp1 |
| wp3 | 020 | 폰트 토큰 통일 (코어: 토큰 단일 SoT) | wp2 |
| wp4 | 030 | Design Read 기반 상태/위계 정합 (통합: 토큰 위에서 표면 정리) | wp3 |
| wp5 | 040 → 041 | 브라우저 QA 매트릭스 + 증거 (경화) | wp4 |

wp2가 먼저인 이유: 모달이 닫히지 않으면 wp3·wp4의 모달 내부 폰트/위계 확인이 브라우저에서
불가능하다. wp3가 wp4보다 앞서는 이유: 상태 표면 정합은 토큰 위에서 해야 리터럴이 다시 생기지 않는다.

### 쓰기 소유권

| 대상 | 단독 소유 |
|------|-----------|
| `src/app-dialog.ts` → `assets/js/app-dialog.js`, `color/typography/layout/motion.html` overlay 블록, `scripts/verify-nav.mjs` §8 | wp2 |
| `style.css :root` 폰트 토큰(:61-63), `style.css:21`, `finder.css`, `export.css`, `color/typography/layout/motion.css` 폰트 줄, `catalog.css:10`, `effects-demos-candidates.css:432` | wp3 |
| `catalog.css` 빈 상태 블록, `color/typography/layout/motion.css` `*-empty` 블록, `src/{color,typography,layout,motion}.ts` 빈 상태 한 줄 → `assets/js/{color,typography,layout,motion}.js`, `style.css:23` | wp4 |
| `evidence/`, `041_wp5_qa_record.md` | wp5 (코드 무변경; 회귀 발견 시 P 개정으로 해당 wp 문서를 고치고 그 wp 소유 파일만 수정) |

## IN / OUT

IN: 위 표의 파일들, `npm run build`/`npm run verify` 실행, aside repl 브라우저 실측.
OUT: 데이터 JSON, 이미지 재생성, 새 페이지, nav 축 구조, 플러그인/스킬, `src/app.ts`, git 커밋/푸시.

## 롤백 (phase별, patch 스냅샷 기반)

wp3와 wp4가 같은 CSS 파일(`style.css`, `catalog.css`, 카탈로그 4 CSS)을 만지므로 `git checkout -- <file>`은
wp4만 되돌릴 수 없다(리뷰 blocker). 대신 **각 wp의 B 시작 직전과 C 통과 직후에 patch 스냅샷**을 남기고,
그 patch만 역적용한다.

정본 경로는 하나다: `devlog/_plan/260902_popup_font_stabilize/evidence/`(이미 존재). 아래 블록은 경로를 리터럴로 쓴다.
스냅샷은 **그 wp의 소유 파일만** 대상으로 뜬다(include glob 불필요). wp4 예시(다른 wp는 표의 소유 파일로 치환):

```
# B 시작 직전
git diff -- assets/css/catalog.css assets/css/color.css assets/css/typography.css assets/css/layout.css assets/css/motion.css assets/css/style.css src/color.ts src/typography.ts src/layout.ts src/motion.ts > devlog/_plan/260902_popup_font_stabilize/evidence/wp4_before.patch
# C 통과 직후
git diff -- assets/css/catalog.css assets/css/color.css assets/css/typography.css assets/css/layout.css assets/css/motion.css assets/css/style.css src/color.ts src/typography.ts src/layout.ts src/motion.ts > devlog/_plan/260902_popup_font_stabilize/evidence/wp4_after.patch

# wp4만 되돌리기
git checkout -- assets/css/catalog.css assets/css/color.css assets/css/typography.css assets/css/layout.css assets/css/motion.css assets/css/style.css src/color.ts src/typography.ts src/layout.ts src/motion.ts
git apply devlog/_plan/260902_popup_font_stabilize/evidence/wp4_before.patch   # wp3 변경(before에 포함)만 다시 얹힘
npm run build                                                                  # TS 원복 → 산출물 JS 원복
```

`before.patch`가 비어 있으면(선행 변경 없음) `git apply`를 생략한다. wp2/wp3는 선행 wp와 파일이 겹치지 않아
`git checkout --`만으로 충분하지만 절차 통일을 위해 같은 스냅샷을 남긴다.

| wp | 소유 파일(=checkout 대상) | before.patch에 담기는 선행 변경 |
|----|------|------|
| wp2 | `src/app-dialog.ts color.html typography.html layout.html motion.html scripts/verify-nav.mjs` + build | 없음(HEAD clean) |
| wp3 | `assets/css/{style,finder,export,color,typography,layout,motion,catalog,effects-demos-candidates}.css` | wp2(파일 겹침 없음 → 사실상 `git checkout --`와 동치) |
| wp4 | `assets/css/{catalog,color,typography,layout,motion,style}.css src/{color,typography,layout,motion}.ts` + build | **wp3의 CSS 변경** — 반드시 before.patch 재적용 |
| wp5 | 코드 변경 없음. `evidence/` 삭제만 | — |

롤백 트리거: `npm run verify` 실패, 브라우저 QA에서 회귀(모달 안 열림, 레이아웃 붕괴, 콘솔 에러), 사용자 반려.
롤백도 워킹트리 변경이므로 사용자 승인 후 실행한다.

## 종료 조건 (criteria 매핑)

- c-1 ← wp2 + wp5 브라우저 증거 (4페이지 × 3경로 닫힘, index/effects 회귀 없음)
- c-2 ← wp3 + wp5 computed font-family 증거 (7페이지 body/h1/code) + 리터럴 0건 + fallback 0건
- c-3 ← 매 wp C단계 `npm run build && npm run verify` exit 0 + wp별 `evidence/wp{N}_diff.txt` (커밋은 NEEDS_HUMAN)
- c-4 ← 이 unit의 000/010/020/030/040 존재 (wp1 D에서 충족)

## 리뷰어 레인

A와 C마다 `gpt-5.6-sol` medium 리뷰어 1레인. 최종 줄 `VERDICT:` 필수. 무응답 3회면 BUDGET_EXHAUSTED.

