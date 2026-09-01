# 020 — wp3: 접근성 베이스라인 수리 (2판, A라운드 반영)

선행: wp2. 대상: 001 2판 §3.1 A1~A11.

## 스코프 경계

IN: `assets/css/theme-atlas.css`(색 토큰), `assets/css/style.css`(reduced-motion, 포커스),
`assets/css/effects.css`(포커스 제거 해제), 7개 HTML의 **속성**(aria-label, 시맨틱 태그),
`src/app.ts`(제자리 수정, 순증 ≤1줄), `src/catalog-shell.ts`, `src/app-dialog.ts`.
OUT: 글리프→SVG 교체(wp5 소유), `.search-input` 폭/전이(wp5 소유), `text-wrap`(wp4 소유),
`src/faq.ts`(이미 aria-label 보유 — 건드리지 않는다).

## A7/A8 — 색 대비 (STRICT, 최우선)

실측: `--ink-muted #8A8C83` on `--atlas-paper #F1F1EB` = **3.007:1** (AA 본문 4.5 미달),
`--atlas-signal #FF4D1F` = **2.925:1** (AA 큰 텍스트 3.0도 미달).

MODIFY `assets/css/theme-atlas.css:15`(signal), `:28`(ink-muted)

**후보값 검산 완료** (`.tmp/contrast2.cjs`, 배경 3종: paper #F1F1EB / surface #FAFAF6 /
warm #E9E9E1). 첫 후보 `#6F7169`는 paper에서 **4.366:1로 미달**이었다 — 추정으로
커밋했다면 결함이 그대로 남았을 값이다.

| 후보 | paper | surface | warm | 판정 |
|------|-------|---------|------|------|
| `#6F7169` | 4.366 | 4.731 | 4.057 | 탈락 |
| `#6A6C64` | 4.699 | 5.091 | 4.365 | warm 미달 |
| `#65675F` | 5.062 | 5.486 | 4.703 | 통과 |
| **`#62645D`** | **5.292** | **5.734** | **4.916** | **채택** |
| `#C3350D` | 4.829 | 5.233 | 4.486 | warm 미달 |
| **`#B82E06`** | **5.398** | **5.849** | **5.015** | **채택** |

`--ink-muted`는 `#62645D`로 확정한다. 이 값은 이미 `--atlas-muted`(`theme-atlas.css:13`)로
정의돼 있어 **새 색을 도입하지 않고 기존 팔레트 안에서 해결**된다(2라운드 blocker 1).

`--ink-muted`는 `style.css:524,707`에서 `var(--bg-warm)` 위에도 쓰이므로 warm 기준까지
통과해야 한다. 확정:

```
- --ink-muted: #8A8C83;
+ --ink-muted: #62645D;           /* = --atlas-muted, 팔레트 내 해결 */
- --atlas-signal: #FF4D1F;
+ --atlas-signal: #FF4D1F;        /* 그래픽·보더·배경 전용 — 텍스트 금지 */
+ --atlas-signal-text: #B82E06;   /* 텍스트 소비처 전용 */
```

토큰 정의 위치(2라운드 blocker 6 정정): `--atlas-signal`은 `theme-atlas.css:15`,
`--ink-muted`는 :28, `:focus-visible`은 :57-59, A6의 `outline:none`은 `effects.css:192`다.

### signal 텍스트 소비처 전수 이관 (2라운드 blocker 2)

세 곳만 옮기는 것으로는 A8이 닫히지 않는다. `--atlas-signal`을 **직접** 텍스트로 쓰는
곳이 더 있다: `theme-atlas.css:117` `.nav-link[aria-current="page"]`,
`theme-atlas.css:198` `.ism-kind-label`. 별칭 `--accent`를 텍스트로 쓰는 곳도
`style.css:143,275,395,540,657,734,745,811,856`, `effects.css:59,100,328`,
`effects-docs.css:24,93`, `effects-demos-*.css` 일부가 있다.

B 절차: `rg -n "color: var\(--accent\)|color: var\(--atlas-signal\)" assets/css/`로
전수 추출 → 각 줄이 **텍스트 색인지** 확인(`border-color`/`background`는 제외) →
**모두** `--atlas-signal-text`로 이관. demo 카드 안의 장식용 색은 UI 텍스트가 아니므로
제외하되, 제외한 목록과 이유를 D에 기록한다. 보더/배경 소비처
(`style.css:190,519,775`)는 원 토큰 유지 — 시각 인상은 보존된다.

3라운드에서 확인된 추가 텍스트 소비처: `theme-atlas.css:118`
(`.nav-link[aria-current="page"]`), `:190` (`.ism-name-btn:hover`), `:198`
(`.ism-kind-label`), `style.css:379` (`.ism-example-link:hover`), `:598`
(`.prompt-copy-btn:hover`). 위 인벤토리는 시작점일 뿐이고 **`rg` 전수 추출이 기준**이다.

시각적 인상(주황 signal)은 보존된다 — 보더·배경·마크는 `#FF4D1F`를 그대로 쓰고,
읽어야 하는 텍스트만 어두운 변종으로 간다. 방향 변경이 아니라 가독성 수리다.

## A6 — 포커스 제거 해제

MODIFY `assets/css/effects.css:190-193` (`outline: none`은 :192)
before: `.effect-card:hover, .effect-card:focus-visible { ... outline: none; }`
after: hover와 focus-visible을 분리하고 focus-visible에 링을 준다:
```css
.effect-card:hover { border-color: ...; box-shadow: ...; }
.effect-card:focus-visible { border-color: ...; box-shadow: ...; outline: 2px solid var(--atlas-focus); outline-offset: 2px; }
```

## A1 — reduced-motion (shimmer 한정)

MODIFY `assets/css/style.css:973-976`에 추가:
```css
  .ism-skeleton-block { animation: none; background: var(--bg-warm); }
```
`cardFadeIn`은 `theme-atlas.css:272`가, `loading-fill`은 1회 `forwards`라 대상이 아니다.

## A5 — search focus (NOOP 확정 + 방어)

캐스케이드 판정: `.search-input{outline:none}`(style.css:185, 특이도 0-1-0)와
`:focus-visible{outline:2px}`(theme-atlas.css:57, 0-1-0)는 동률이고 theme-atlas가 뒤에
로드되므로 **링이 이긴다**. 기능적으로 이미 정상이다.
회귀 방어로 `.search-input:focus-visible`(0-2-0) 명시 규칙만 추가한다. wp5가
`.search-input` 블록을 소유하므로 **이 규칙은 wp5에서 함께 넣는다** — wp3은 손대지 않는다.

## A2 — 닫기 접근명 통일

실측 전수(2라운드 blocker 3): `aria-label="Close"`는 **5곳**이다 —
`index.html:73,110,116`, `effects.html:124`, **`effects.html:130`**(라이트박스, 1판 누락).
전부 `"닫기"`로 바꾼다. color/typography/layout/motion은 이미 `"닫기"` — 무변경.
faq.html은 닫기 버튼 없음.

## A9 — 문서 제목 계층

실측 결과(2라운드 blocker 8): `h1`이 없는 페이지는 **`index.html` 하나뿐**이다.
effects(:88), faq(:57), color(:59), typography/layout/motion(:60)은 모두 보유.
또한 `.sr-only` 유틸리티가 `nav.css:2`에 이미 있으므로 새 유틸리티를 만들지 않는다.

MODIFY `index.html` `<main>` 최상단에 한 줄:
```html
<h1 class="sr-only">Design -isms — 49개 디자인 사조 시각 레퍼런스</h1>
```
두 번째 `h1`을 만들지 않는다.

모달 제목(`src/app.ts:815`)의 `<div class="modal-title">`은 `<h2>`로 바꾼다. 같은 줄
치환이므로 줄 수 순증 0. `aria-labelledby="ism-modal-title"`은 이미 연결돼 있다.

## A10 — 검색 입력 접근명

실측(2라운드 blocker 8): `effects.html:103`은 이미 `<span class="sr-only">효과 검색</span>`
을 갖고 있다. 접근명이 없는 곳은 `index.html:95` 하나다.
MODIFY `index.html:95`: `aria-label="ism 검색"` 추가. 다른 페이지는 무변경.

## A4 — lang toggle 상태 노출 (순증 ≤1줄)

MODIFY `src/app.ts` `updateLangUI()`(:1032-1039). 기존 줄을 제자리 수정한다:
```ts
  document.documentElement.lang = currentLang;
+ queryRequired<HTMLElement>('#lang-toggle').setAttribute('aria-label', currentLang === 'ko' ? 'Switch language to English' : '언어를 한국어로 전환');
```
순증 1줄 → 1050줄, 상한과 동일하므로 통과. **B에서 `wc -l`로 확인 후 커밋**한다.
1050을 넘으면 대신 기존 빈 줄을 제거해 상쇄한다.
`src/catalog-shell.ts:127-140`에도 동일 2줄 추가(상한 여유 있음).
`src/faq.ts:280`은 이미 동일 동작 — 무변경.

## A11 — 배경 inert

실측(2라운드 blocker 4): `app-dialog.ts`에 `activate`/`deactivate`는 없다. 실제 진입점은
`open()`(:136)과 `close()`(:178)다.

MODIFY `src/app-dialog.ts` `open()`/`close()`: `<header>`, `<main>`, `<footer>`에만
`inert`를 걸고 해제한다. 오버레이 자신과 `#toast`, `.scroll-top`은 랜드마크 밖이므로
대상에서 제외한다. 모달 위에 라이트박스가 겹치는 **레이어 스택**이 존재하므로,
마지막 레이어가 닫힐 때만 해제하도록 기존 layer 스택 로직에 연동한다.
Tab 트랩은 이미 있으므로 이것은 스크린리더 가상 커서 대응이다.

## 수용 기준

- `npm run build` exit 0, `npm run verify` exit 0 (verify:lines 포함 — app.ts ≤1050).
- 대비 재계산: 텍스트 소비 토큰 전부 ≥4.5:1.
- 브라우저 실측: reduced-motion 강제 시 `animationName === 'none'`,
  `.effect-card` Tab 포커스 시 `outlineWidth !== '0px'`, 모달 열림 시 배경 `inert` 존재,
  `h1` 존재, 검색 입력 접근명 존재.

## 활성화 시나리오

reduced-motion·focus-visible·inert 모두 조건부 경로다. 브라우저에서 각 조건을 실제로
발생시키고(에뮬레이션, Tab, 모달 열기) 계산값을 읽어 발화를 증명한다. 마우스 클릭
포커스와 키보드 포커스를 둘 다 측정해 대비를 남긴다.
