# 051 — wp6 최종 QA + 배포 기록

## QA 매트릭스 (aside repl + CDP Emulation, 로컬 `.pages` 서버)

7페이지 x 2뷰포트 = 14조합 전부 통과.

| 페이지 | 기대 카드 | 1440 | 390 | overflow | console error | h1 | skip link | aria-current | 랜드마크 |
|--------|-----------|------|-----|----------|---------------|-----|-----------|--------------|----------|
| index | 49 | 49 | 49 | 없음 | 0 | 있음 | 있음 | 1 | 3종 |
| effects | 94 | 94 | 94 | 없음 | 0 | 있음 | 있음 | 1 | 3종 |
| faq | 18 | 18 | 18 | 없음 | 0 | 있음 | 있음 | 1 | 3종 |
| color | 25 | 25 | 25 | 없음 | 0 | 있음 | 있음 | 1 | 3종 |
| typography | 20 | 20 | 20 | 없음 | 0 | 있음 | 있음 | 1 | 3종 |
| layout | 25 | 25 | 25 | 없음 | 0 | 있음 | 있음 | 1 | 3종 |
| motion | 20 | 20 | 20 | 없음 | 0 | 있음 | 있음 | 1 | 3종 |

모든 조합에서 `scrollWidth === innerWidth` (가로 overflow 0).
demo: effects 94개 카드 전부가 demo 노드를 보유(`cardsWithDemo: 94`). demo type 94개
일치는 `verify:effects`가 데이터 계약으로 강제한다.

## 배포

- push: `943a87e..847ae91 main -> main` (14커밋)
- PR #1: `state: MERGED`, `mergedAt: 2026-09-01T17:19:15Z`, merge commit `c075f61`
- Actions run `33537065711`: **conclusion success**
  - `npm ci` success → `npm run verify` success → `npm run pages:stage` success
    → `upload-pages-artifact` success → `deploy-pages` success
  - 클린 클론에서 verify가 통과했다는 것은 커밋된 `assets/js/*.js`가 `src/*.ts`와
    일치함(`verify:generated`)을 독립적으로 증명한다.
- 라이브: `https://lidge-jun.github.io/design-isms/` HTTP 200,
  `last-modified: Tue, 01 Sep 2026 17:20:58 GMT` (배포 전 07-19에서 갱신됨)

## 라이브 사이트 실측 (배포 후 프로덕션 URL)

```
LIVE={"cards":49,"h1":"Design -isms — 49개 디자인 사조 시각 레",
      "tagline":"rgb(184, 46, 6)","inkMuted":"#62645D","signalText":"#B82E06",
      "searchLabel":"ism 검색","searchTransition":"border-color",
      "descWrap":"pretty","scrollW":1440,"innerW":1440}
ERRORS=[]
```

wp3~wp5의 모든 변경이 프로덕션에 반영됐음을 항목별로 확인:

| 변경 | 라이브 증거 |
|------|-------------|
| 대비 토큰 (wp3) | `inkMuted #62645D`, `signalText #B82E06`, tagline `rgb(184,46,6)` |
| 시맨틱 h1 (wp3) | `h1` 존재 |
| 검색 접근명 (wp3) | `aria-label="ism 검색"` |
| 타이포 래핑 (wp4) | `.ism-desc` `text-wrap: pretty` |
| 폭 전이 제거 (wp5) | `transitionProperty: "border-color"` (width 없음) |
| 전반 | console error 0, overflow 0 |

스크린샷: `evidence/wp6-live.png` (프로덕션 1440px, 육안 확인 완료).

## 종료 판정

**DONE.** PR #1 머지 + 6개 work-phase 완료 + CI 성공 + 라이브 실측 확인.
