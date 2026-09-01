# 041 — wp5 구현 기록: 성능 가드레일 + 폐기된 글리프 작업

## C4/C5 폐기 (계획 대비 축소)

040 문서는 7개 HTML의 텍스트 글리프 28건(`▾` 7, `↗` 7, `✕` 12, `×` 2)을 인라인
SVG로 교체하도록 계획했다. **실행하지 않고 폐기한다.**

폐기 근거(A라운드 리뷰어 판정, 전면 수용):

1. `FE-AI-TELL-01`이 금지하는 것은 **이모지**를 UI 아이콘으로 쓰는 것이다.
   `▾`(U+25BE), `↗`(U+2197), `✕`(U+2715), `×`(U+00D7)는 이모지가 아니라 문장부호다.
2. 모두 이미 `aria-hidden="true"`이고 실제 접근명(`닫기`, `GitHub`, `Catalog`)을
   동반한다. 접근성 결함이 아니다.
3. 교체는 구체적 회귀 위험을 만든다: `nav.css:50`의 `font-size: 0.75em`은 SVG에
   무의미해져 캐럿 크기가 달라지고, `.finder-dialog-close`는 **CSS가 아예 없어서**
   12x12 SVG가 어색하게 렌더된다.

7파일 28곳을 고쳐서 얻는 것이 없고 잃을 것이 있는 변경이다. 규칙의 문구를 기계적으로
적용하는 대신 규칙이 막으려는 것(이모지 슬롭)을 보고 판단했다.

## 실행한 변경

### C1 — `transition: all` 제거 (§6)

| 파일:라인 | before | after | 근거 |
|-----------|--------|-------|------|
| style.css:166 `.filter-btn` | `all 0.2s` | `background-color 0.2s, border-color 0.2s, color 0.2s` | `:hover`는 border-color/color, `.active`는 background/color/border-color만 바꾼다 |
| style.css:602 `.prompt-copy-btn` | `all 0.15s` | `color 0.15s, border-color 0.15s` | `:hover`가 바꾸는 속성과 정확히 일치 |

(040 문서는 `.prompt-copy-btn`을 :596으로 적었으나 실제는 :602다 — 리뷰어 정정 반영.)

### C2 — `.search-input` 레이아웃 전이 제거

```
- width: 200px;
- transition: border-color 0.2s, width 0.3s;
+ width: 240px;
+ transition: border-color 0.2s;
  .search-input:focus { border-color: var(--accent); }   /* width: 260px 삭제 */
+ .search-input:focus-visible { outline: 2px solid var(--atlas-focus); outline-offset: 2px; }
```

`width` 전이는 매 프레임 레이아웃을 유발하고(§6 transform/opacity 한정), 포커스 시
인접 요소가 밀리는 것은 §7과도 충돌한다. 640px 이하는 `nav.css:160-165`가
`width: 100%`로 덮으므로 고정 240px가 좁은 뷰포트를 깨지 않는다.

### 추가 발견 — 검색 아이콘 대비 (wp3 성격의 뒤늦은 발견)

`.search-input` 배경의 인라인 SVG 돋보기가 `stroke='%239B9B9B'`로 하드코딩돼 있었다.
`--card-bg #FAFAF6` 대비 **2.656:1** — WCAG 1.4.11 비텍스트 대비 3:1 미달이다.
`#62645D`(= `--atlas-muted`, 5.734:1)로 교체했다.

이 항목은 성격상 wp3(접근성)에 속하지만 wp5에서 `.search-input` 블록을 만지다가
발견했다. 같은 블록을 두 번 열지 않기 위해 여기서 처리하고 사실대로 기록한다.
토큰 하드코딩이라 wp3의 `rg` 전수 추출(`color: var(--...)` 패턴)에 잡히지 않았던 것이
누락 원인이다.

### C3 — 의도적 NOOP 유지

스켈레톤 `shimmer`의 `background-position` 애니메이션은 그대로 둔다. 로딩 중에만
존재하고 개수가 제한적이며, `will-change` 추가는 §6이 금한다. reduced-motion 대응은
wp3의 A1이 이미 처리했다.
