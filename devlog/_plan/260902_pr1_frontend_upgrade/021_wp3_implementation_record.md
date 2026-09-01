# 021 — wp3 구현 기록 + 토큰 이관 제외 대장

구현 커밋: `2dd4f94` (12 files). 020 문서가 "제외한 목록과 이유를 D에 기록한다"고
요구한 대장을 여기에 남긴다.

## 절차 위반 기록 (정직성)

wp3의 구현은 FSM 상 **P 단계에서 수행**됐고, 그 뒤 A(감사 PASS)를 거쳐 B로 들어왔다.
`cxc orchestrate C`가 SOURCE-DELTA-01로 거부한 것이 정확한 지적이다: B 구간에 소스
델타가 없었기 때문이다. 이 문서가 B 구간의 산출물이며, 다음 사이클(wp4·wp5)은
P에서 stale check만 하고 **구현은 B에서** 한다.

## 색 토큰 이관 대장

### 이관함 — 읽는 텍스트 (22곳)

| 파일 | 라인 | 셀렉터 | 이유 |
|------|------|--------|------|
| style.css | 143 | `.lang-option.active` | 언어 표시 텍스트 |
| style.css | 275 | `.ism-tagline` | 12px 본문 |
| style.css | 379 | `.ism-example-link:hover` | 링크 텍스트 |
| style.css | 395 | `.ism-examples-toggle` | 버튼 텍스트 |
| style.css | 540 | `.modal-tagline` | 13px 본문 |
| style.css | 598 | `.prompt-copy-btn:hover` | 버튼 텍스트 |
| style.css | 657 | `.modal-*` 라벨 | 10px 대문자 라벨 |
| style.css | 734 | `.modal-example-link:hover` | 링크 텍스트 |
| style.css | 745 | `.modal-examples-toggle` | 버튼 텍스트 |
| style.css | 811 | 섹션 제목 | 11px 대문자 |
| style.css | 856 | 리스트 마커 텍스트 | 읽히는 기호 |
| effects.css | 59, 100, 328 | eyebrow / hero / 배지 텍스트 | 본문 |
| effects-docs.css | 24, 93 | 문서 h4 / 링크 hover | 본문 |
| theme-atlas.css | 122 | `.nav-link[aria-current="page"]` | 현재 페이지 표시 텍스트 |
| theme-atlas.css | 152 | `.lang-option.active` | 언어 표시 |
| theme-atlas.css | 194 | `.ism-name-btn:hover` | 카드 제목 |
| theme-atlas.css | 202 | `.ism-kind-label` | 10px 라벨 |

### 제외함 — 장식 (원 `#FF4D1F` 유지)

| 파일:라인 | 대상 | 제외 이유 |
|-----------|------|-----------|
| theme-atlas.css:98 | `.logo-sketch` | `aria-hidden` SVG 마크의 `currentColor`. 읽는 텍스트가 아니며 WCAG 텍스트 대비 대상이 아니다 |
| theme-atlas.css:123 | `.nav-link` `border-bottom-color` | 보더 |
| style.css:137, 190, 775 | 보더 색 | 보더 |
| style.css:519 | `.modal-close:hover` 배경 | 배경. 그 위 텍스트는 `#fff`이고 `#FF4D1F` 대비 3.316:1 — 아이콘 전용 버튼이라 큰 그래픽 기준 3:1을 만족 |
| effects-demos-patterns.css:77 | `border-top-color` | 보더 |
| effects-demos-expansion-text.css:21, effects-demos-candidates.css:428 | demo 장식 | 효과 카드 내부의 시연용 장식. 실제 UI 텍스트가 아니라 "이 효과가 어떻게 보이는가"의 표본이며, 색을 바꾸면 시연 대상이 왜곡된다 |

### 시각 인상 보존 근거

`--atlas-signal` `#FF4D1F`는 보더·배경·마크에서 그대로 유지된다. 바뀐 것은 **읽어야
하는 텍스트**뿐이며 같은 주황 계열(`#B82E06`)이다. 디자인 방향 변경이 아니라 가독성
수리다(dev-frontend §5: 구현 tell 제거는 이 스킬 소관, 방향 판단은 아님).

## 렌더 관찰 증거 (C-RENDER-GROUNDING-01)

로컬 정적 서버(`127.0.0.1:4173`, `.pages` 루트) + aside repl 실측:

| 관찰 | 결과 |
|------|------|
| index 카드 수 / scrollWidth | 49 / 1440 = innerWidth 1440 (overflow 0) |
| `h1` | `sr-only` "Design -isms — 49개 디자인 사조 시각 레퍼런스" |
| 검색 접근명 / lang 접근명 | `ism 검색` / `Switch language to English` |
| 닫기 접근명 | `["닫기","닫기","닫기"]` |
| `.ism-tagline` 계산색 | `rgb(184, 46, 6)` = `#B82E06` |
| `.ism-number` 계산색 | `rgb(98, 100, 93)` = `#62645D` |
| `nav-link[aria-current]` / `.lang-option.active` | `rgb(184, 46, 6)` |
| 모달 열기 | `aria-hidden=false`, title `H2`, header/main inert **true**, 포커스 모달 내부 |
| Escape 닫기 | inert 전부 **false**로 해제 |
| effects 카드 수 / focus ring | 94 / `2px solid rgb(0, 95, 204)` (기존 `outline:none`에서 복원) |
| reduced-motion CSSOM | `.ism-skeleton-block { animation: ... none; background: var(--bg-warm); }` 규칙 존재 |
| console error | index 0건, effects 0건 |

스크린샷: `evidence/wp3-index-1440.png` (1440x900, 실제 육안 확인 완료).

로드 순서 함정 검증: `--accent-text`는 `theme-atlas.css:34`(`:root`)에 정의되고
`style.css`가 먼저 로드되지만, `var()`는 **계산값 시점**에 요소의 캐스케이드에서
해석되므로 정상 동작한다. 브라우저 실측 `rgb(184,46,6)`이 이를 증명한다.
