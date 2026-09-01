# 031 — wp4 구현 기록: 타이포그래피 래핑

## 실측 우선 원칙 적용

030 문서는 "orphan을 먼저 관찰하고, 없으면 선언을 넣지 않는다"고 정했다. 실제로
390px CDP 에뮬레이션으로 **패치 전** 7개 페이지를 측정했다.

패치 전 (마지막 행이 6자 이하인 orphan):

| 페이지 | 건수 | 예시 |
|--------|------|------|
| index | 1 | `.ism-desc` "추구." |
| effects | 17 | `.effect-card-summary` "씁니다." 등 |
| color | 4 | H1 "컬러 시스템", `.color-card-summary` "다." |
| typography | 5 | `.typo-card-body` "**악합니다.**", "**내합니다.**" |
| layout | 5 | `.layout-card-summary` "**니다.**", "**다.**" |
| faq / motion | 0 / 1 | — |

굵게 표시한 항목이 핵심 발견이다: "안내합니다."가 "**내**합니다."로, "파악합니다."가
"**악**합니다."로 **단어 중간에서** 끊기고 있었다. 이는 orphan이 아니라 한국어
줄바꿈 규칙 자체의 결함이다.

## 리뷰어 판정과 그에 대한 반박

리뷰어는 "color/layout/typo 카드 요약은 `-webkit-line-clamp`가 걸려 있으니 skip"으로
판정했다. **부분 반박했다.** 근거:

```
TYPO={"wordBreak":"normal","overflowWrap":"normal","lineClamp":"2",
      "clientH":42,"scrollH":42,"clamped":false}
```

`clientHeight === scrollHeight`이므로 실제로는 **잘리고 있지 않다**. 그리고
`line-clamp`는 넘칠 때 잘라내는 기능일 뿐 줄바꿈 규칙과 무관하다. 잘리든 아니든
`word-break: normal`인 한 한국어는 단어 중간에서 끊긴다. 따라서 clamp 여부와 별개로
`keep-all`이 필요하다.

## 적용 패치

| 파일:라인 | 셀렉터 | 값 | 근거 |
|-----------|--------|-----|------|
| style.css:265 | `.ism-name` | `text-wrap: balance` | "Swiss / International Style"(27자)가 카드 내부 폭에서 줄바꿈 |
| style.css:279 | `.ism-tagline` | `text-wrap: balance` | 태그라인 최대 58자 |
| style.css:286 | `.ism-desc` | `text-wrap: pretty` | 실측 orphan "추구." |
| style.css:536 | `.modal-title` | `text-wrap: balance` | 28px 긴 영문 제목 |
| style.css:558 | `.modal-history` | `text-wrap: pretty` | 긴 한국어 본문 |
| style.css:566 | `.modal-desc` | `text-wrap: pretty` | 긴 한국어 본문 |
| typography.css:94 | `.typo-card-body` | `word-break: keep-all` | 단어 중간 끊김(반박 근거) |
| color.css:115 | `.color-card-summary` | `word-break: keep-all` | 동일 |
| layout.css:99 | `.layout-card-summary` | `word-break: keep-all` | 동일 |

## 의도적 제외

- `nav.css`, `export.css`, `finder.css`, `app-crosslinks.css` — 리뷰어 확인대로 줄바꿈이
  필요한 heading이 없다. `theme-atlas.css:136` `white-space: nowrap`은 의도된 것이다.
- `.ism-name-kr` — 인라인 span이라 자체 블록이 아니다.
- `.effect-card-summary` 등 effects 페이지 — 이미 `keep-all`이 있고 남은 것은 정상적인
  단어 단위 줄바꿈이다. `pretty` 추가는 wp5 범위 밖의 별건이므로 이번 사이클에서
  다루지 않는다(스코프 경계 준수).

## 패치 후 재측정 (390px)

| 페이지 | 패치 전 | 패치 후 | 비고 |
|--------|---------|---------|------|
| index `.ism-desc` | 1 | **0** | `textWrap: pretty` 계산값 확인 |
| typography | 5 (단어 중간) | 4 (**전부 온전한 단어**) | "내합니다." → "안내합니다." |
| color | 4 | 1 | 단어 중간 끊김 해소 |
| layout | 5 | 3 | 단어 중간 끊김 해소 |

남은 건수는 "온전한 단어가 마지막 행에 오는" 정상적인 한국어 줄바꿈이다. 2행짜리
블록에서 마지막 단어를 끌어올리려면 `balance`가 필요한데, 그것은 본문에 쓰면 행
길이를 억지로 맞춰 오히려 부자연스러워진다. `keep-all`로 단어 무결성을 확보한 것이
이 단계의 목표이며 달성됐다.

모든 페이지에서 `scrollWidth === innerWidth === 390` — 가로 overflow 0.
