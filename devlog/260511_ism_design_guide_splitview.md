---
created: 2026-05-11
tags: [devlog, design-guide, split-view, 모달UX, jawdev]
aliases: [ISM 디자인 가이드 스플릿 뷰, 구현 매핑 가이드]
supersedes: devlog/260510_popup_development_guide_plan.md
---

# ISM 디자인 가이드 — Split View 모달

## Goal

ISM 모달에서 "Design Guide" 버튼을 누르면 해당 스타일로 웹사이트를 만들 때 필요한 5축(Layout, Typography, Color, Motion, Do/Don't) 매핑 가이드를 보여준다. 데스크탑에서는 좌우 split 뷰, 모바일에서는 스크롤 확장 뷰.

기존 `260510_popup_development_guide_plan.md`의 접힘 섹션 방식을 대체한다. 접힘 대신 별도 패널을 열어 ISM 시각 정보와 구현 가이드를 동시에 볼 수 있게 한다.

## Current Signals

| 항목 | 현재 상태 | 해석 |
|---|---|---|
| 모달 | `modal-container` 720px 고정폭, 문자열 렌더링 | split 시 컨테이너 폭 확장 필요 |
| 데이터 | `isms.json` 43개, 별도 `dev-guides.json` 없음 | 가이드 데이터 신규 생성 필요 |
| 런타임 | `src/app.ts` strict TS, `npm run build` | 타입 확장 가능 |
| 기존 계획 | collapsible 방식 plan 존재 | split-view로 방향 변경 |
| ISM 데이터 | palette, keywords, history, examples 존재 | 가이드는 이들과 보완 관계 |

## UX 설계

### 데스크탑 (≥1024px)

```
┌──────────────────────────────────────────────────────┐
│  ✕                                                   │
│ ┌─────────────────────┐ ┌──────────────────────────┐ │
│ │   ISM 기존 콘텐츠     │ │   Design Guide 패널      │ │
│ │                     │ │                          │ │
│ │  제목 / 역사         │ │  ▸ Layout                │ │
│ │  이미지 / 프롬프트    │ │  ▸ Typography            │ │
│ │  팔레트 / 키워드      │ │  ▸ Color Usage           │ │
│ │  예시 / 관련 ISM     │ │  ▸ Motion & Interaction  │ │
│ │                     │ │  ▸ Do & Don't            │ │
│ │                     │ │                          │ │
│ │  [Design Guide →]   │ │                          │ │
│ └─────────────────────┘ └──────────────────────────┘ │
└──────────────────────────────────────────────────────┘
         420px                    420px
         modal-container expands to ~880px
```

- 버튼 클릭 → `modal-container`에 `expanded` 클래스 토글
- 왼쪽 패널: 기존 `modal-scroll` (폭 축소, 독립 스크롤)
- 오른쪽 패널: `modal-guide-panel` (독립 스크롤)
- 다시 클릭하면 가이드 패널 닫힘

### 모바일 (<1024px)

```
┌──────────────────────┐
│  ISM 기존 콘텐츠       │
│  ...                 │
│  ┌─────────────────┐ │
│  │ Design Guide ▼  │ │  ← sticky 하단 버튼
│  └─────────────────┘ │
│                      │
│  ═══ Guide 시작 ═══  │  ← 스크롤 확장
│  Layout              │
│  Typography          │
│  Color Usage         │
│  Motion              │
│  Do & Don't          │
└──────────────────────┘
```

- sticky 버튼 클릭 → 가이드 콘텐츠가 모달 하단에 append
- 자동 스크롤로 가이드 시작점으로 이동
- 다시 클릭하면 가이드 제거 + 원래 위치로 복귀

## 데이터 설계

### 파일

```
assets/data/
├── isms.json           ← 기존 (수정 없음)
└── dev-guides.json     ← 신규 (lazy-load)
```

### JSON 스키마 (확정)

```json
{
  "<ism-id>": {
    "layout": {
      "grid": "modular asymmetric grid",
      "columns": "12-column flexible",
      "gutter": "20-40px",
      "margins": "generous white space",
      "spacing": "rhythmic baseline grid",
      "symmetry": "asymmetry for dynamic balance",
      "geometry": "circles, squares, triangles"
    },
    "typography": {
      "fontPairing": "Futura (display) + system sans (body)",
      "sizeHierarchy": "H1: 48-72px, H2: 32-40px, body: 16-18px",
      "lineHeight": "1.2-1.5",
      "letterSpacing": "tight headings (-0.02em), normal body",
      "weightStrategy": "bold headings, medium body, no serifs"
    },
    "color": {
      "usage": "primary: red/yellow/blue, secondary: black/white",
      "bgFg": "white background + bold color blocks",
      "contrast": "high contrast blocks, color as function"
    },
    "motion": {
      "easing": "linear or ease-in-out",
      "duration": "150-300ms",
      "hover": "simple scale or color shift",
      "scroll": "minimal or no parallax",
      "transition": "fade or slide, grid preserved"
    },
    "dos": [
      "Use geometric shapes and grids for structure",
      "Prioritize form follows function",
      "Apply primary colors with bold contrast"
    ],
    "donts": [
      "Add decorative ornamentation",
      "Use ornate serifs or complex typography",
      "Create cluttered non-hierarchical layouts"
    ]
  }
}
```

### TypeScript 타입

```ts
interface IsmGuide {
  layout: {
    grid: string;
    columns: string;
    gutter: string;
    margins: string;
    spacing: string;
    symmetry: string;
    geometry: string;
  };
  typography: {
    fontPairing: string;
    sizeHierarchy: string;
    lineHeight: string;
    letterSpacing: string;
    weightStrategy: string;
  };
  color: {
    usage: string;
    bgFg: string;
    contrast: string;
  };
  motion: {
    easing: string;
    duration: string;
    hover: string;
    scroll: string;
    transition: string;
  };
  dos: string[];
  donts: string[];
}

type GuideMap = Record<string, IsmGuide>;
```

### Lazy-load 전략

- 첫 화면에서는 `dev-guides.json`을 fetch하지 않는다.
- "Design Guide" 버튼을 최초 클릭 시 1회 fetch → 메모리 캐시.
- 같은 세션에서 다른 ISM 가이드를 열면 캐시에서 꺼낸다.
- fetch 실패 시 패널에 "가이드를 불러오지 못했습니다" 표시. 모달 전체는 깨지지 않는다.
- 가이드 데이터가 없는 ISM은 "가이드 준비 중" fallback.

## 구현 단계

### P1 — 데이터 생성

- [ ] 43개 ISM 가이드를 Grok 리서치로 일괄 생성
- [ ] `assets/data/dev-guides.json` 저장
- [ ] `scripts/validate-dev-guides.mjs` — id 매칭 + 스키마 검증
- [ ] TypeScript 타입을 `src/app.ts`에 추가

완료 기준: JSON parse 성공, 43개 id 전부 매칭, `npm run typecheck` 통과.

### P2 — 모달 split-view CSS

- [ ] `modal-container.expanded` 클래스 추가 (width 확장)
- [ ] `modal-guide-panel` 오른쪽 패널 CSS
- [ ] 데스크탑: `display: grid; grid-template-columns: 1fr 1fr`
- [ ] 모바일: 가이드가 기존 콘텐츠 아래에 block으로 append
- [ ] 버튼 스타일 (데스크탑: 모달 내 우측 pill, 모바일: sticky 하단)
- [ ] 패널 열림/닫힘 transition

완료 기준: 데스크탑 1024px↑에서 좌우 split, 모바일에서 스크롤 확장, 기존 모달 동작 유지.

### P3 — 인터랙션 로직

- [ ] `loadDevGuides()` — fetch + 캐시
- [ ] `renderGuidePanel(guide: IsmGuide)` — 5축 섹션 HTML
- [ ] `toggleGuidePanel(ismId)` — 버튼 클릭 핸들러
- [ ] `openModal()` 확장 — 버튼 삽입 + 이벤트 바인딩
- [ ] 모달 닫기 시 `expanded` 해제

완료 기준: 가이드 버튼 → fetch → 패널 렌더 → 닫기 복원 전 흐름 정상 동작.

### P4 — 빌드 + 검증

- [ ] `npm run build` → `assets/js/app.js` 갱신
- [ ] cache-bust 쿼리 버전 갱신
- [ ] 브라우저 검증: 데스크탑 split / 모바일 확장 / 빈 가이드 fallback / 네트워크 실패
- [ ] Lighthouse 성능 변화 없음 확인 (가이드는 lazy-load)
- [ ] 커밋 + 푸시 + Pages 배포

## Verification

자동:
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `node scripts/validate-dev-guides.mjs` — 43개 id 매칭, 스키마 통과
- [ ] `dev-guides.json` 파일 크기 < 200KB

브라우저:
- [ ] 모달 열기 → Design Guide 버튼 보임
- [ ] 데스크탑: 클릭 시 좌우 split (기존 콘텐츠 왼쪽 유지)
- [ ] 모바일: 클릭 시 하단 스크롤 확장
- [ ] 5축 섹션 모두 표시 (Layout, Typography, Color, Motion, Do/Don't)
- [ ] 다른 ISM으로 이동 시 가이드 갱신
- [ ] 가이드 닫기 시 원래 모달 폭 복원
- [ ] `dev-guides.json` 네트워크 요청 세션당 1회
- [ ] 가이드 없는 ISM → fallback 표시
- [ ] 콘솔 오류 0개

## Out Of Scope

- ISM 카드 디자인 변경
- 기존 `isms.json` 스키마 수정
- 외부 CMS, Markdown parser 도입
- 가이드 내 코드 예제 (팝업은 참조 UI, 문서 사이트 아님)
- 가이드 편집 UI

## 파일 변경 목록

| 파일 | 작업 |
|---|---|
| `assets/data/dev-guides.json` | NEW — 43개 ISM 가이드 데이터 |
| `src/app.ts` | MODIFY — 타입, lazy-load, split-view 렌더러, 버튼 |
| `assets/js/app.js` | MODIFY — 빌드 산출물 |
| `assets/css/style.css` | MODIFY — split-view, guide-panel, 버튼 스타일 |
| `index.html` | MODIFY — cache-bust 쿼리 갱신 |
| `scripts/validate-dev-guides.mjs` | NEW — 검증 스크립트 |
| `devlog/260511_ism_design_guide_splitview.md` | NEW — 이 계획 문서 |

## 변경 기록

- 2026-05-11: split-view 모달 가이드 기능의 UX, 데이터, 구현 계획을 작성했다. 기존 collapsible 방식(260510)을 대체한다.
