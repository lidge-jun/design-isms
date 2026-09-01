# 001 — 실측 baseline 감사 (리서치, 코드 변경 없음)

2026-09-02, `main` @ `943a87e` 기준. **개정 2판** — A라운드 리뷰(002 문서)의 blocker
1·6·7을 반영해 행 번호를 현재 트리에 재조준하고, 누락 결함을 추가했다.
워킹트리: clean(시험 병합은 `git merge --abort`로 되돌림), `devlog/_plan/`만 untracked.

## 1. 저장소 상태 (실행 확인)

`npm run verify` / `verify:nav` / `sot:check`(13 markers; 49/94/18) /
`pages:stage`(7 HTML, 331 PNG, 331 WebP, **0 forbidden**) 전부 exit 0.
배포: push to main → verify → pages:stage → `.pages` 업로드.

## 2. PR #1 실측 (시험 병합으로 증명 완료)

`git merge --no-commit --no-ff pr-1` → "Automatic merge went well". 충돌 없음.
병합 트리에서 `npm run pages:stage` 실행 결과:
`.pages` 최상위 = 7개 HTML + `favicon.svg` + `assets/` + `.nojekyll` + `manifest.json`.
`skills/`·`.claude/`·`plugin.json`·`docs/`·`commands/`·`.codex-plugin/` **0건**.

- 심링크: `git ls-files -s` mode `120000`, `readlink` → `../../skills/{style,effect}`,
  `ls -L`로 `SKILL.md` 해석 확인.
- 매니페스트 4종 `JSON.parse` 통과.
- 데이터 계약 실측: isms 49, dev-guides 49키 ism id와 1:1, effects 94,
  `effects-snippets.json.snippets` 94개 1:1, docs 키 존재. priority
  P0=19/P1=49/P2=23/P3=3, category Mobile=11/Shared=51/Desktop=32 — PR 본문 수치와 일치.
- **경미한 문서 오류**: `skills/effect/SKILL.md`가 예시 id로 `sticky-cta`를 들지만
  실제 id는 `sticky-cta-bar`다. `isms.json`에는 `descriptionEn`도 있으나 style SKILL은
  이미 이를 나열한다.

격리 메커니즘(리뷰 blocker 9 확인): `stage-pages.mjs:17-19`의 `publicFiles` 허용목록과
`assetDirs`(`assets/{css,data,icons,images,js}`)만 복사 대상이고 `copyTree`는 저장소
루트를 순회하지 않는다. 새 최상위 디렉터리는 구조적으로 도달 불가다. 루트 워크를
추가로 발명해 재증명하지 않는다.

## 3. 프런트엔드 결함 (재조준 완료)

### 3.1 접근성 — wp3

| # | 위치 | 결함 |
|---|------|------|
| A1 | `style.css:227-236` (`shimmer`) | 유일하게 남은 무한 모션. `prefers-reduced-motion` 블록(`:973-976`)이 커버하지 않는다. `cardFadeIn`은 `theme-atlas.css:272`가 이미 끄고, `loading-fill`(`:34`)은 `forwards` 1회이므로 **대상 아님**(1판 오류 정정) |
| A2 | `aria-label="Close"` **5곳**: `index.html:73,110,116`, `effects.html:124,130` / `color·typography·layout·motion`은 `"닫기"` | `lang="ko"` 문서 안에서 닫기 접근명이 갈린다. faq.html은 닫기 버튼 자체가 없다 |
| A3 | `index.html:110,116` `✕`, `:73` `×`, `:42` `▾`, `:53` `↗` | 텍스트 글리프를 UI 아이콘으로 사용 |
| A4 | `src/app.ts:1032-1039` `updateLangUI()`, `src/catalog-shell.ts:127-140` | lang toggle이 클래스만 바꾼다. **`src/faq.ts:280`은 이미 `aria-label`을 갱신하므로 수정 대상이 아니다**(1판 오류 정정) |
| A5 | `style.css:185` `outline:none` vs `theme-atlas.css:57-59` `:focus-visible` | **캐스케이드는 결정 가능하다**: 둘 다 특이도 (0,1,0)이고 theme-atlas가 나중에 로드되므로 atlas 링이 이긴다 → **NOOP 후보**. 방어적 `.search-input:focus-visible`(0,2,0)는 wp5가 넣는다 |
| **A6** | `effects.css:190-193` (`outline:none`은 :192) | `.effect-card:hover, .effect-card:focus-visible { ... outline: none; }` — 후행·고특이도 포커스 제거. **실제 §7 위반** |
| **A7** | `theme-atlas.css:28` `--ink-muted:#8A8C83` | paper 대비 **3.007:1**, warm 3.26 — AA 본문 4.5:1 미달. 텍스트 소비처 28곳 |
| **A8** | `theme-atlas.css:15` `--atlas-signal:#FF4D1F` | paper 대비 **2.925:1** — 큰 텍스트 3:1도 미달. 텍스트 소비처: `theme-atlas.css:117`(`.nav-link[aria-current]`), `:198`(`.ism-kind-label`), 별칭 `--accent`로 `style.css`·`effects.css`·`effects-docs.css` 다수 |
| **A9** | `index.html` **단독** | `h1` 없음(`h2` :71, :81만). 나머지 6개는 보유(effects:88, faq:57, color:59, typography/layout/motion:60). 모달 제목도 `src/app.ts:815`에서 `<div class="modal-title">` |
| **A10** | `index.html:95` **단독** | 검색 입력 접근명 없음. `effects.html:103`은 이미 `.sr-only` 라벨 보유 |
| **A11** | `src/app-dialog.ts` `open()`:136 / `close()`:178 | 커스텀 모달/라이트박스가 배경 랜드마크에 `inert`를 걸지 않는다. Tab 트랩은 있으나 배경이 접근성 트리에 남는다 |

대비 실측(WCAG 상대휘도 계산, `.tmp/contrast.cjs`): ink 16.58, muted 5.29,
ink-muted 3.007, signal 2.925, cobalt 5.42, focus 5.28 (모두 paper #F1F1EB 기준).

### 3.2 반응형 / 타이포그래피 — wp4

| # | 위치 | 결함 |
|---|------|------|
| B1 | `style.css` 전역 | `text-wrap` 선언 0개. `.ism-name`(:260), `.ism-tagline`(:272), `.ism-desc`(:279) 미제어 |
| B2 | `style.css:279-284` | `.ism-desc`에 `word-break:keep-all`만. 한국어 마지막 행 orphan 위험 |
| B3 | `nav.css`, `finder.css`, `export.css`, `app-crosslinks.css` | `text-wrap` 0개 — `catalog/faq/typography/effects.css`와 불일치 |
| ~~B4~~ | — | **철회**. `nav.css:160-165`가 이미 `@media (max-width:640px)`에서 `.search-input,.search-input:focus{width:100%}`로 덮는다. 640px overflow 위험은 실재하지 않으며, wp5 C2가 폭을 단일값으로 정리하므로 중복이다 (리뷰 blocker 4·5) |

### 3.3 anti-slop / 성능 — wp5

| # | 위치 | 결함 |
|---|------|------|
| C1 | `style.css:166`, `:596` | `transition: all` 2건 |
| C2 | `style.css:186,187,189-192` | `width:200px` + `transition: ...width 0.3s` + `:focus{width:260px}` — 레이아웃 전이 |
| C3 | `style.css:227-236` | shimmer 페인트 애니메이션 — 기본 상태는 현행 유지(NOOP), reduced-motion만 wp3에서 처리 |
| C4 | 7개 HTML `↗` | 외부 링크 화살표 텍스트 글리프 |
| C5 | 7개 HTML `▾` (`index.html:42` 등) | 드롭다운 캐럿 텍스트 글리프 |

## 4. 이미 만족 — 수정 금지

skip link 7개, 전역 `:focus-visible`(`theme-atlas.css:57`), `html lang="ko"`,
페이지 컨테인먼트 1440px, 1024/640 masonry 붕괴, 이모지 UI 0건,
gradient 페이퍼 텍스처 1건(opacity 0.03), one-note 아님(중립 페이퍼 + signal 1색),
`--atlas-muted` 5.29:1 / `--atlas-cobalt` 5.42:1 / `--atlas-focus` 5.28:1 은 AA 통과.
