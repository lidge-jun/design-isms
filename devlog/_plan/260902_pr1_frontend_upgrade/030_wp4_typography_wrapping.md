# 030 — wp4: 타이포그래피 래핑 (2판)

선행: wp3. 대상: 001 2판 §3.2 B1~B3. **B4(search 폭)는 철회** — `nav.css:160-165`가
이미 640px에서 `.search-input,.search-input:focus{width:100%}`로 덮고 있고, 폭 정리는
wp5가 단독 소유한다(A라운드 blocker 4·5).

## 스코프 경계

IN: `assets/css/style.css`, `nav.css`, `finder.css`, `export.css`, `app-crosslinks.css`의
`text-wrap` 선언만.
OUT: 폭/그리드/브레이크포인트, 색, 글리프.

## B1/B2 — text-wrap 도입

규칙: heading과 1~3행 짧은 서술자는 `balance`, 4행 이상 본문은 `pretty`.

MODIFY `assets/css/style.css`

| 셀렉터:라인 | 역할 | 추가 |
|-------------|------|------|
| `.ism-name` :260 | 카드 제목 | `text-wrap: balance;` |
| `.ism-tagline` :272 | 1행 영문 태그라인 | `text-wrap: balance;` |
| `.ism-desc` :279 | 2~3문장 한국어 | `text-wrap: pretty;` (기존 `word-break: keep-all` 유지) |

`.ism-desc`의 `pretty` 채택 여부는 **640px 스크린샷에서 orphan을 먼저 관찰한 뒤**
결정한다. orphan이 없으면 선언을 넣지 않고 그 사실을 D에 기록한다(추측 패치 금지).
모달 제목은 wp3에서 `h2`로 바뀌므로 해당 셀렉터를 재확인해 대응한다.

## B3 — 페이지 간 일관성

`catalog.css`/`faq.css`/`typography.css`/`effects.css`는 이미 적용돼 있다.
`nav.css`·`finder.css`·`export.css`·`app-crosslinks.css`에서 heading 셀렉터를 실측한 뒤
**필요한 곳에만** 추가한다. nav의 `white-space: nowrap`(`theme-atlas.css:132`)은 의도된
것이므로 건드리지 않는다.

## 수용 기준

- `npm run verify` exit 0.
- 브라우저 실측: `getComputedStyle(el).textWrap` 적용 확인 + 640/390px 스크린샷에서
  한국어 orphan 부재 관찰. 브라우저 미지원이면 빈 문자열이 나오므로 그 사실도 기록한다.

## 활성화 시나리오

`text-wrap`은 조건부 분기가 아니라 렌더 속성이다. 계산값 확인 + 스크린샷 관찰이
곧 활성화 증거다.
