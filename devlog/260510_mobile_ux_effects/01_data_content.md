---
created: 2026-05-10
status: implemented
tags: [design-isms, data, content, effects-json]
---

# Phase 1 — Data and Content Plan

효과 페이지의 핵심은 사용자가 정확한 이름을 몰라도 찾는 것이다. 데이터는 정식 명칭보다 “사용자가 부르는 말”을 더 강하게 지원해야 한다.

---

## Goal

- [x] `assets/data/effects.json`을 새 source of truth로 만든다.
- [x] 첫 12개 effect 데이터를 같은 스키마로 작성한다.
- [x] category filter, search, modal rendering에 필요한 필드를 빠짐없이 둔다.
- [x] guide image가 없어도 fallback demo가 렌더링되게 한다.
- [x] 2026-05-10 15:24 피드백 후 현재 데이터는 46개 모바일/데스크탑/공통 UI 후보군으로 확장한다.
- [x] 46개 후보군의 `demo.type`은 각 effect `id`와 일치한다.

## New File

```text
assets/data/effects.json
```

## Schema

```json
{
  "id": "bottom-sheet",
  "name": "Bottom Sheet",
  "nameKr": "바텀 시트",
  "alsoCalled": ["아래 팝업", "아래에서 올라오는 창", "모바일 메뉴"],
  "category": "Navigation & Sheet",
  "summary": "화면 하단에서 올라와 선택지나 상세 행동을 보여주는 모바일 중심 패턴.",
  "description": "복잡한 페이지 이동 없이 현재 맥락 위에서 선택, 필터, 공유, 장바구니 옵션을 처리할 때 적합하다.",
  "bestFor": ["필터", "공유 메뉴", "장바구니 옵션", "간단한 폼"],
  "avoidWhen": ["긴 문서", "복잡한 설정", "키보드 입력이 많은 화면"],
  "motion": {
    "property": "transform + opacity",
    "duration": "220-320ms",
    "easing": "cubic-bezier(0.16, 1, 0.3, 1)"
  },
  "implementation": [
    "fixed overlay 안에 sheet를 두고 translateY로 열고 닫는다.",
    "열릴 때 body scroll을 잠그고 닫을 때 원복한다.",
    "drag handle은 장식이 아니라 닫을 수 있다는 신호로 사용한다."
  ],
  "accessibility": [
    "role=\"dialog\"와 aria-modal=\"true\"를 둔다.",
    "Escape로 닫는다.",
    "닫힌 뒤 trigger로 focus를 돌린다."
  ],
  "performance": [
    "height 대신 transform을 애니메이션한다.",
    "backdrop-filter는 약하게 쓰거나 fallback 배경색을 둔다."
  ],
  "demo": {
    "type": "bottom-sheet",
    "label": "하단에서 올라오는 선택 패널"
  },
  "guide": {
    "file": "guide.png",
    "alt": "Bottom sheet guide showing backdrop, drag handle, option rows, and primary CTA",
    "prompt": "Clean instructional mobile UX guide image for Bottom Sheet..."
  }
}
```

Final schema rule:

- `demo.type` must match an entry in `src/effects-demos.ts`.
- Current release uses 46 unique demo types, one per effect id.

## TypeScript Types

`src/effects.ts`에 명시 타입과 런타임 검증을 둔다. 기존 `src/app.ts`의 `parseIsms()` 패턴을 따른다.

```ts
interface UxEffect {
  id: string;
  name: string;
  nameKr: string;
  alsoCalled: string[];
  category: EffectCategory;
  summary: string;
  description: string;
  bestFor: string[];
  avoidWhen: string[];
  motion: EffectMotion;
  implementation: string[];
  accessibility: string[];
  performance: string[];
  demo: EffectDemo;
}

type EffectDemoType = EffectsDemos.DemoType;

interface EffectDemo {
  type: EffectDemoType;
  label: string;
}
```

The final `EffectDemoType` registry lives in `src/effects-demos.ts` and contains 46 entries, one per effect id.

## Categories

| Category | Meaning | Included Effects |
| --- | --- | --- |
| Navigation & Sheet | 화면 이동, 메뉴, 하단 고정 행동 | Bottom Sheet, Drawer Navigation, Sticky CTA Bar |
| Reveal & Scroll | 스크롤 또는 순차 등장 | Scroll Reveal, Staggered Cards |
| Touch Feedback | 터치/스와이프 반응 | Press Scale, Swipe Action |
| Micro Interaction | 상태 안내와 작은 피드백 | Skeleton Loading, Toast, Segmented Control |
| Modal & Popup | 맥락 위 레이어 | Full-screen Mobile Modal, Image Lightbox |

## First 12 Content Notes

Each first-release effect must have complete `motion`, `implementation`, `accessibility`, `performance`, and `demo` fields. The table below is the minimum content skeleton; implementation can copy these into `effects.json` and refine copy without changing structure.

| Effect | alsoCalled | motion | implementation | accessibility | performance | demo |
| --- | --- | --- | --- | --- | --- | --- |
| Bottom Sheet | 아래 팝업, 아래에서 올라오는 창, 모바일 메뉴 | `transform + opacity`, `220-320ms`, ease-out | fixed overlay, translateY sheet, body scroll lock | dialog label, Escape, focus return | transform only, weak backdrop blur | `bottom-sheet`, guide |
| Full-screen Mobile Modal | 전체 팝업, 새 화면 같은 팝업 | `opacity + scale`, `180-260ms`, ease-out | full viewport panel, close affordance, internal scroll | focus trap, labelled title, close button | no background layout animation, scroll contained | `full-screen-mobile-modal` |
| Drawer Navigation | 햄버거 메뉴, 옆 메뉴 | `translateX + opacity`, `220-300ms`, ease-out | side panel, backdrop, nav groups | Escape close, focus trap, active link state | transform only, no body horizontal shift | `drawer-navigation` |
| Sticky CTA Bar | 아래 고정 버튼, 구매 버튼 고정 | `translateY + opacity`, `180-240ms`, ease-out | fixed bottom bar, safe-area padding, content bottom spacer | button label, reachable close/secondary path, no content trap | avoid layout jumps, reserve bottom space | `sticky-cta-bar`, guide |
| Scroll Reveal | 내려가면 나타남, 스크롤 애니메이션 | `translateY + opacity`, `240-360ms`, ease-out | IntersectionObserver, visible class, final state fallback | content exists without animation, reduced motion final state, no hidden critical info | observe once, no scroll listener, pause offscreen | `scroll-reveal`, guide |
| Staggered Cards | 카드가 하나씩 뜸, 순서대로 뜸 | `translateY + opacity`, `300ms`, stagger delay | CSS custom index, visible class, grid stable sizing | order remains DOM order, reduced motion removes delay, focus unaffected | small stagger only, no infinite loop | `staggered-cards` |
| Press Scale | 누르면 작아짐, 버튼 눌림감 | `scale`, `80-140ms`, ease-out | active state, pointer feedback, no layout shift | keyboard active equivalent, visible focus, not color-only | transform scale, no width/height change | `press-scale` |
| Swipe Action | 옆으로 밀기, 삭제 액션 | `translateX`, `180-260ms`, ease-out | pointer threshold, reveal action area only, visible fallback button | keyboard equivalent, destructive action not triggered by swipe alone, vertical scroll preserved | `touch-action: pan-y`, cancel vertical gestures | `swipe-action`, guide |
| Skeleton Loading | 회색 로딩, 반짝 로딩 | `background-position`, `900-1400ms`, linear | placeholder blocks, final content mapping, demo label | `aria-busy` for real loading, reduced motion static, not used as only status | small shimmer area, stop when loaded | `skeleton-loading`, guide |
| Toast | 잠깐 뜨는 알림, 복사 완료 | `translateY + opacity`, `160-240ms`, ease-out | queue or replace, auto dismiss, manual close if long | `role=status`, `aria-live=polite`, not critical-only | no layout shift, fixed layer only | `toast` |
| Segmented Control | 탭 토글, 선택 버튼 | `translateX`, `160-220ms`, ease-out | button group, active indicator, stable widths | `aria-pressed` or tabs, keyboard activation, active state not color-only | transform indicator, no width animation | `segmented-control` |
| Image Lightbox | 이미지 크게 보기, 확대 보기 | `opacity + scale`, `180-260ms`, ease-out | overlay, image frame, close paths | dialog semantics, Escape, alt text | lazy original, constrain max size | `image-lightbox` |

## Search Behavior

검색 대상은 아래 필드를 모두 포함한다.

```text
name
nameKr
alsoCalled[]
category
summary
bestFor[]
```

사용자가 “아래 팝업”이라고 검색하면 `Bottom Sheet`가 나와야 하고, “회색 로딩”이라고 검색하면 `Skeleton Loading`이 나와야 한다.

## Diff-Level Plan

### NEW `assets/data/effects.json`

- 46개 object 배열 생성
- category는 `Mobile`, `Desktop`, `Shared`를 사용한다.
- 모든 배열 필드는 빈 배열 금지
- 모든 `id`는 kebab-case
- `id` 중복 금지
- `category`는 허용 category만 통과
- `demo.type`은 허용 `EffectDemoType`만 통과
- `guide.file`, `guide.alt`, `guide.prompt`가 있으면 guide image를 렌더링한다
- preview path는 `./assets/images/thumbs/effects/${effect.id}/guide.webp`, 원본 path는 `./assets/images/effects/${effect.id}/guide.png`로 계산

### NEW parser in `src/effects.ts`

- `isStringArray`
- `isRecord`
- `parseEffects`
- `readRequiredString`
- `readRequiredStringArray`
- `readOptionalGuideImage`
- fetch 실패 또는 JSON parse 실패 시 loading overlay를 제거하고 error state 렌더

### No Change

- `assets/data/isms.json`은 수정하지 않는다.
- 기존 ISM modal 데이터 schema에는 손대지 않는다.

## Verification

- JSON parse: `node -e "JSON.parse(require('fs').readFileSync('assets/data/effects.json','utf8'))"`
- Typecheck: `npm run typecheck`
- Runtime: `effects.html`에서 46개 카드 렌더 확인
