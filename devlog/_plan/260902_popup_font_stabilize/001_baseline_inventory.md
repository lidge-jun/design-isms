# 001 — 실측 baseline 인벤토리 (리서치, 코드 변경 없음)

2026-09-02, `main` @ `ce7025d`, 워킹트리 clean. 모든 행 번호는 이 트리 기준이다.

## 1. 모달 닫힘 버그 — DOM 위치 실측

`src/app-dialog.ts:82-96` `setBackgroundInert()`는 첫 layer가 열릴 때
`header.site-header`, `main`, `footer.site-footer`에 `inert`를 건다.
overlay가 `<main>` 안에 있으면 overlay 자체가 inert가 되어 닫기 버튼·backdrop 클릭이
모두 죽는다. Escape는 `document` keydown이라 살아 있지만, 포커스가 inert 트리 안으로
들어갈 수 없어 초기 포커스도 실패한다.

| 페이지 | `<main>` | overlay | lightbox | `</main>` | 판정 |
|--------|----------|---------|----------|-----------|------|
| color.html | :57 | :77 | :84 | :88 | **버그** (내부) |
| typography.html | :58 | :79 | :86 | :90 | **버그** (내부) |
| layout.html | :58 | :79 | :86 | :90 | **버그** (내부) |
| motion.html | :58 | :79 | :86 | :90 | **버그** (내부) |
| index.html | :65 | :115 | :110 | :103 | 정상 (외부) |
| effects.html | :84 | :122 | :129 | :115 | 정상 (외부) |
| faq.html | :55 | — | — | :61 | 모달 없음 |

호출 경로: `src/catalog-shell.ts:63-71` `AppDialogA11y.open({overlay: elements.modalOverlay, ...})`,
`:84` `close`, lightbox는 `:93-96`/`:106`. 4페이지 모두 `catalog-shell.js`를 공유하므로
셸 로직 자체는 동일하고 HTML 구조만 다르다.

산출물 `assets/js/app-dialog.js:56-71`에 같은 로직이 컴파일되어 있다(커밋 대상).

## 2. 폰트 리터럴 인벤토리

토큰 정의 `assets/css/style.css:61-63`:

```
--font-sans: 'Pretendard Variable', 'Pretendard', -apple-system, system-ui, sans-serif;
--font-display: 'Outfit', sans-serif;
--font-mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;
```

토큰을 우회하는 `font-family` 리터럴 20건 (`rg -n font-family assets/css/*.css | rg -v 'var\(--font'`):

| 파일 | 줄 | 리터럴 | 치환 토큰 |
|------|----|--------|-----------|
| style.css | 21 | `'Outfit', sans-serif` (.loading-text) | `--font-display` |
| finder.css | 13, 154 | `'SF Mono', monospace` | `--font-mono` |
| finder.css | 21, 45, 110, 126, 139, 163, 190, 206 | `'Outfit', sans-serif` | `--font-display` |
| export.css | 12, 85, 145 | `'Outfit', sans-serif` | `--font-display` |
| export.css | 35, 68 | `'SF Mono', 'Menlo', 'Consolas', monospace` | `--font-mono` |
| color.css | 49 | `'SF Mono', ui-monospace, monospace` | `--font-mono` |
| typography.css | 49 | 위와 동일 | `--font-mono` |
| layout.css | 45 | 위와 동일 | `--font-mono` |
| motion.css | 45 | 위와 동일 | `--font-mono` |

이미 토큰을 쓰는 파일: `theme-atlas.css`(6곳), `faq.css`, `runtime-states.css`, `effects-docs.css`.

fallback 문자열을 단 토큰 소비처 2건 (`rg -n "var\(--font-[a-z]+," assets/css`): `catalog.css:10`
`var(--font-display, 'Outfit', sans-serif)`, `effects-demos-candidates.css:432` `var(--font-mono, monospace)`.
둘 다 wp3에서 fallback을 뗀다.

모노 스택이 3종으로 갈라져 있다: 토큰(`Fira Code, Consolas`) / export(`Menlo, Consolas`) /
카탈로그 4종(`ui-monospace`). wp3에서 토큰을 `'SF Mono', ui-monospace, 'Menlo', 'Consolas', monospace`로
한 번 정의하고 나머지를 전부 토큰으로 돌린다.

폰트 링크: 7페이지 모두 Pretendard + Outfit 링크를 갖고 있다(`effects.html:22`, `index.html:12` 확인).
goalplan objective의 "effects.html에 Outfit 링크 없음"은 오진이며, wp3 범위에서 제외한다(NOOP, 증거만 남김).

## 3. 상태 표면 인벤토리 (wp4 Design Read 입력)

| 표면 | 파일:줄 | 현재 |
|------|---------|------|
| 메인 빈 상태 | style.css:411 `.empty-state` + h3 | display 폰트, `--ink-muted`, padding 120px |
| 카탈로그 셸 빈 상태 | catalog.css:31 `.catalog-empty-state` + h2 | dashed 보더 카드, h2 20px(폰트 미지정=sans) |
| color 검색 빈 상태 | color.css:122 `.color-empty` | 텍스트 한 줄, `--ink-muted`, padding 48px |
| typography/layout/motion 검색 빈 상태 | typography.css:121 / layout.css:106 / motion.css:98 | color와 동일 규칙 4벌 복제 |
| 로딩 | style.css:20 `.loading-text` | Outfit 리터럴, 색 `#2C2C2C` 리터럴 |
| 에러 | runtime-states.css:1 `.page-error-state` | 토큰 사용, h2 display |

검색 빈 상태 문구(`src/{color,typography,layout,motion}.ts`)는 동일 패턴이며 JS는 건드리지 않는다.
4벌 복제된 `*-empty` 규칙은 wp4에서 `catalog.css`의 공용 규칙으로 합치는 것을 검토한다.

## 4. 브라우저 도구 상태

- 정적 서버: `http://127.0.0.1:4173` 이미 실행 중(`scripts/serve-static.mjs`). 재기동 금지.
- agbrowse: Chrome PID 43799가 9222 포트와 profile.lock을 잡고 있어 navigate가 ws disconnect로 실패.
  QA는 `aside repl`로 진행한다(이전 unit 051 기록과 동일한 방법).
