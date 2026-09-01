# 040 — wp5: anti-slop 렌더 tell + 성능 가드레일 (2판)

선행: wp4. 대상: 001 2판 §3.3 C1~C5. 이 phase가 `.search-input` 블록과 7개 HTML의
아이콘 글리프를 **단독 소유**한다.

## 스코프 경계

IN: `assets/css/style.css`의 transition/폭, 7개 HTML의 글리프→SVG 교체.
OUT: 색 방향·레이아웃 재구성(직전 확정 방향 유지). tell 제거만 한다.

## C1 — transition: all 제거

MODIFY `style.css:166` (`.filter-btn`): `all 0.2s` →
`background-color 0.2s, border-color 0.2s, color 0.2s`
(`:hover` :168-171은 border-color/color, `.active` :172-176은 background/color/border-color)

MODIFY `style.css:596` (`.prompt-copy-btn`): `all 0.15s` → `color 0.15s, border-color 0.15s`
(`:hover` :598이 바꾸는 속성과 일치)

## C2 — .search-input 단독 정리

MODIFY `style.css:186-192`
```
- width: 200px;
- transition: border-color 0.2s, width 0.3s;
+ width: 240px;
+ transition: border-color 0.2s;
  }
  .search-input:focus {
    border-color: var(--accent);
-   width: 260px;
  }
+ .search-input:focus-visible {
+   outline: 2px solid var(--atlas-focus);
+   outline-offset: 2px;
+ }
```

근거: `width` 전이는 매 프레임 레이아웃을 유발하고(§6), 포커스 시 인접 요소가 밀리는
것은 §7과도 충돌한다. 640px 이하는 `nav.css:160-165`가 `width:100%`로 덮으므로 고정
240px가 좁은 뷰포트를 깨지 않는다. `:focus-visible` 규칙은 wp3 A5의 방어 조치를
여기로 이관한 것이다(블록 단독 소유 원칙).

## C3 — shimmer: 의도적 NOOP

기본 상태의 `background-position` 애니메이션은 유지한다. 스켈레톤은 로딩 중에만
존재하고 개수가 제한적이며, `will-change` 추가는 §6이 금한다. reduced-motion 대응은
wp3 A1이 이미 처리했다. **근거 없는 변경을 하지 않는다.**

## C4/C5 — 글리프 → SVG

MODIFY 7개 HTML.

| 위치 | before | after |
|------|--------|-------|
| GitHub 링크 (`index.html:53` 외 6) | `<span aria-hidden="true">↗</span>` | 10x10 인라인 SVG |
| 드롭다운 캐럿 (`index.html:42` 외 6) | `<span class="nav-dropdown-caret" aria-hidden="true">▾</span>` | 8x5 인라인 SVG, **class 유지** |
| 닫기 버튼 `✕`/`×` | 텍스트 자식 노드 | 12x12 인라인 SVG |

**닫기 버튼 이중 쓰기 주의(2라운드 blocker 5)**: wp3이 같은 버튼의 `aria-label`을
`"닫기"`로 바꾼다. wp5는 `<button ...>` **여는 태그를 절대 다시 쓰지 않고**, 그 안의
텍스트 노드(`✕`/`×`)만 SVG로 치환한다. 즉 편집 단위는 태그가 아니라 자식 노드다.
P에서 wp3의 결과를 읽어 `aria-label="닫기"`가 살아 있는지 확인한 뒤 진행한다.

`verify:nav`는 `verify-nav.mjs:76`에서 여는 태그만 매치하므로 이 교체로 깨지지 않는다
(A라운드 blocker 8에서 확인). **실제 위험은 CSS다**: `nav.css:50`의
`font-size: 0.75em`이 SVG에는 무의미하므로 캐럿 크기가 달라진다. SVG에 명시적
`width`/`height`를 주고 `nav.css:49-52`에서 정렬(`vertical-align` 또는 flex)을
재확인한다. `nav.css:54-56`의 `.nav-dropdown.is-open .nav-dropdown-caret{transform:
rotate(180deg)}`는 class를 유지하므로 계속 동작한다.

SVG:
```html
<svg class="nav-dropdown-caret" width="8" height="5" viewBox="0 0 8 5" aria-hidden="true" focusable="false"><path d="M1 1l3 3 3-3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
```

## 수용 기준

- `rg -n "transition: all" assets/css/` → 0건.
- UI 아이콘 텍스트 글리프 0건(콘텐츠 텍스트 제외).
- `npm run verify` exit 0 (특히 verify:nav).
- 브라우저 실측: 드롭다운 개폐 시 캐럿 회전 관찰, GitHub 링크·닫기 버튼 렌더 관찰,
  `getComputedStyle(filterBtn).transitionProperty !== 'all'`.

## 활성화 시나리오

캐럿 회전은 `.is-open` 토글에 연동된 조건부 스타일이다. 트리거를 실제로 클릭해
`aria-expanded="true"` 상태의 회전을 관찰한다.
