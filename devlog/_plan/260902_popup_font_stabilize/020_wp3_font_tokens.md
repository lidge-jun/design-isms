# 020 — wp3: 폰트 토큰 통일 (2판, A라운드 반영)

선행: wp2. 대상: 001 §2 (리터럴 20건 + fallback 2건). 소유 파일: 000 §소유권 wp3 행.

## 원칙

- 폰트 스택의 단일 SoT는 `assets/css/style.css :root`의 `--font-sans/--font-display/--font-mono` 세 줄이다.
- 소비처는 전부 `var(--font-*)`만 쓴다. fallback 문자열도 두지 않는다 — 토큰이 사라졌을 때 조용히
  다른 스택으로 빠지는 것 자체가 "통일 안 됨"의 원인이다. fallback 잔존 2곳: `catalog.css:10`,
  `effects-demos-candidates.css:432`(리뷰 blocker 3).
- 폰트 링크는 7페이지 모두 이미 Pretendard + Outfit을 갖고 있다. HTML은 건드리지 않는다.

## 불변 조건의 범위 (A라운드 blocker 1 처분: 부분 반박)

토큰 강제 대상은 **셸·카탈로그·모달·도구 UI**(사용자가 읽고 조작하는 크롬)다.
다음은 "콘텐츠 스펙시멘"이라 토큰 대상에서 **명시적으로 제외**한다:

- `assets/css/effects-demos-*.css`, `assets/css/motion-demos.css`의 `.demo-*` / `.motion-demo-*` 규칙(30건, `font:` 단축).
  이 규칙들은 94개 효과/20개 모션의 미니 캔버스 안에서 **다른 사이트의 UI를 흉내내는 그림**이다.
  7-10px 크기의 레이블·버튼 목업이며 셸 타이포 위계와 무관하다. `src/typography.ts:143-186`이 데이터에서
  폰트 스택을 inline으로 찍는 것과 같은 성격(카탈로그가 전시하는 대상 자체).
- 이유: 이들을 토큰으로 바꾸면 `--font-mono` 조정 시 94개 데모 그림이 함께 흔들리고, 데모 소유 파일 9개가
  wp3 범위로 들어온다(000 §소유권 위반). 통일의 목적은 "사용자가 보는 크롬이 한 스택"이지 "모든 CSS 줄이 var()"가 아니다.

대신 게이트를 **단축 선언까지 보는 형태**로 강화하고, 제외 파일을 이름으로 명시한다(§검증 1-2).

## MODIFY `assets/css/style.css:63` — 모노 스택 통합

```
-  --font-mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;
+  --font-mono: 'SF Mono', ui-monospace, 'Menlo', 'Consolas', monospace;
```

`ui-monospace`가 macOS/iOS 시스템 모노를 잡고, Menlo/Consolas가 구형 macOS/Windows를 받는다.
Fira Code는 설치돼 있어야만 쓰이는 외부 폰트라 시스템 스택에서 뺀다. theme-atlas.css는 폰트 토큰을
재정의하지 않으므로(`rg -n '\-\-font-' assets/css/theme-atlas.css` → 소비만) 로드 순서 영향 없음.

## MODIFY `assets/css/style.css:21`

```
-  font-family: 'Outfit', sans-serif;
+  font-family: var(--font-display);
```

`.loading-text`는 `:root`(:49)보다 위에 있지만 CSS 변수는 선언 순서와 무관하게 해석된다.

## MODIFY `assets/css/finder.css` (10곳)

| 줄 | 변경 |
|----|------|
| 13, 154 | `font-family: 'SF Mono', monospace;` → `font-family: var(--font-mono);` |
| 21, 45, 110, 126, 139, 163, 190 | `font-family: 'Outfit', sans-serif;` → `font-family: var(--font-display);` |
| 206 | `font-family: 'Outfit', sans-serif; font-size: 0.75rem; font-weight: 600;` → `font-family: var(--font-display); font-size: 0.75rem; font-weight: 600;` |

## MODIFY `assets/css/export.css` (5곳)

| 줄 | 변경 |
|----|------|
| 12, 85, 145 | `font-family: 'Outfit', sans-serif;` → `font-family: var(--font-display);` |
| 35, 68 | `font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;` → `font-family: var(--font-mono);` |

## MODIFY 카탈로그 4 CSS

`color.css:49`, `typography.css:49`, `layout.css:45`, `motion.css:45`:

```
-  font-family: 'SF Mono', ui-monospace, monospace;
+  font-family: var(--font-mono);
```

## MODIFY `assets/css/catalog.css:10`

```
-  font-family: var(--font-display, 'Outfit', sans-serif);
+  font-family: var(--font-display);
```

## MODIFY `assets/css/effects-demos-candidates.css:432`

```
-  font-family: var(--font-mono, monospace);
+  font-family: var(--font-mono);
```

## 검증 (C)

1. 셸 CSS 리터럴 0건 (`font-family` + `font:` 단축 모두, 데모 파일 제외):

```
ls assets/css/*.css | grep -v -E 'effects-demos-.*\.css|motion-demos\.css' | xargs rg -n '\bfont(-family)?\s*:' | rg -v 'var\(--font-(sans|display|mono)\)|font(-family)?\s*:\s*inherit'
```

   → 0건. (`rg --glob` 부정은 명시 경로 인수에 적용되지 않으므로 파일 목록을 셸에서 거른다. 수정 전 실측: 21건 = font-family 리터럴 20 + catalog.css:10 fallback; effects-demos-candidates.css:432 fallback은 데모 파일 제외로 이 게이트 밖이지만 §2 fallback 게이트가 잡는다. 단축 `font:`는 셸 파일에 없음 — 리뷰어 확인.)
2. fallback 잔존 0건: `rg -n "var\(--font-[a-z]+," assets/css` → 0건.
3. 데모 예외 인벤토리 기록(변경 없음): `rg -c '\bfont\s*:' assets/css/effects-demos-*.css assets/css/motion-demos.css` → 파일별 카운트 합계 30건을
   `evidence/wp3_demo_exempt.txt`로 저장. 이 수가 늘면 데모 추가이지 셸 회귀가 아니므로 게이트 대상 아님.
3b. `npm run build && npm run verify` exit 0 (CSS만 바뀌므로 산출물 JS 무변경 확인).
4. aside repl로 7페이지 computed font 읽기. mono 소비처는 페이지 로드 직후 **항상 존재하는** 요소로 고정한다
   (리뷰 blocker: 카탈로그의 `code/pre`는 모달 안에서만 생성됨). 실측 기준(2026-09-02, 수정 전 트리):

| 페이지 | h1 selector | mono selector (항상 존재) | 수정 전 mono computed |
|--------|-------------|---------------------------|------------------------|
| index | `h1` (sr-only, sans 의도) | `.header-count` | 토큰(Fira Code 스택) |
| effects | `#effects-title` | `.effect-card-kicker` | 토큰 |
| faq | `h1` | `code` | 토큰 |
| color | `#catalog-title` | `.color-result-count` | **리터럴** `ui-monospace` 스택 |
| typography | `#catalog-title` | `.typo-result-count` | **리터럴** |
| layout | `#catalog-title` | `.layout-result-count` | **리터럴** |
| motion | `#catalog-title` | `.motion-result-count` | **리터럴** |

   `index.html`의 h1은 `sr-only`라 display 폰트 기대가 아니다(sans 그대로가 정상). index의 display 검증은 7페이지 공통 헤더의
   **`.logo`**(`style.css:101`, 이미 `var(--font-display)` 소비, 실측 computed `Outfit, sans-serif`)로 한다.
   `h2#style-finder-title`은 CSS에서 폰트를 받지 않아(sans) 검증 요소로 부적합 — 3라운드에서 실측 확인.
   **실행 확인된 명령**:

```
timeout 120 aside repl "const sel = { index: ['.logo','.header-count'], effects: ['#effects-title','.effect-card-kicker'], faq: ['h1','code'], color: ['#catalog-title','.color-result-count'], typography: ['#catalog-title','.typo-result-count'], layout: ['#catalog-title','.layout-result-count'], motion: ['#catalog-title','.motion-result-count'] };
const out=[]; for (const pg of Object.keys(sel)) { const p = await openTab('http://127.0.0.1:4173/'+pg+'.html'); await new Promise(r=>setTimeout(r,1800));
  out.push(await p.evaluate((list) => { const root = getComputedStyle(document.documentElement); const cs = s => { const el = document.querySelector(s); return el ? getComputedStyle(el).fontFamily : null; };
    return { page: location.pathname, tokens: { sans: root.getPropertyValue('--font-sans').trim(), display: root.getPropertyValue('--font-display').trim(), mono: root.getPropertyValue('--font-mono').trim() }, body: getComputedStyle(document.body).fontFamily, display: cs(list[0]), mono: cs(list[1]) }; }, sel[pg]));
  await p.close(); } console.log('FONTS=' + JSON.stringify(out));"
```

   비교 규칙: computed는 따옴표를 정규화하므로(`'SF Mono'`→`"SF Mono"`, `'Pretendard'`→`Pretendard`) 양쪽에서 `[\'"]`와 공백을 제거한 뒤 비교한다.
   기대: 7페이지 모두 `body≡sans`, `display≡display`, `mono≡mono`. stdout `FONTS=` 줄을 `evidence/wp3_fonts.json`에 저장.
5. `git diff --stat > evidence/wp3_diff.txt`.

## 롤백

000 §롤백 표 wp3 행. 트리거: verify 실패, 브라우저에서 폰트 fallback(serif/Times) 렌더.

