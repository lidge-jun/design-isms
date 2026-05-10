---
created: 2026-05-10
status: implemented
tags: [design-isms, mobile-ux, effects, github-pages, jawdev]
---

# Phase Plan Overview — Frontend UI Candidates Page

Design -isms는 지금 “시각 스타일”을 중심으로 정리되어 있다. 이번 확장은 모바일뿐 아니라 데스크탑 프런트엔드 UI 후보군까지 이름을 몰라도 찾아볼 수 있는 별도 정적 페이지를 추가하는 작업이다.

사용자는 “아래에서 올라오는 팝업”, “누르면 작아지는 버튼”, “커맨드 팔레트”, “데이터 테이블”처럼 대략적인 감각만 알고 들어온다. 페이지는 정식 명칭, 흔한 별칭, 작은 데모, 언제 쓰는지, 어떻게 구현하는지를 한 번에 보여줘야 한다.

2026-05-10 15:24 피드백 반영: 큰 landing hero와 `12 first release patterns` 통계 패널은 제거했고, 현재 구현은 `Mobile`, `Desktop`, `Shared` 46개 후보군 catalog다.

---

## Goal

- [ ] `effects.html` 별도 정적 페이지를 추가한다.
- [ ] `assets/data/effects.json`으로 효과 데이터를 분리한다.
- [ ] 기존 ISM 보드와 같은 시각 언어, 카드, 모달, 토스트, 라이트박스 감각을 유지한다.
- [ ] 각 효과 카드는 작은 live demo를 가진다.
- [ ] 카드 클릭 시 기존 ISM 모달 계열의 상세 팝업을 연다.
- [ ] 사용자가 효과 이름을 몰라도 찾도록 `alsoCalled` 별칭 필드를 둔다.
- [ ] GitHub Pages에서 빌드 산출물만으로 동작한다.
- [ ] 모바일 접근성, reduced motion, 성능 기준을 효과별로 설명한다.
- [ ] ima2식 guide image를 붙일 수 있는 이미지 슬롯을 둔다.
- [x] landing hero/stat 패널을 제거하고 후보군 목록을 첫 화면에 더 가깝게 배치한다.
- [x] 모바일/데스크탑/공통 UI 후보군 46개를 `effects.json`에 작성한다.

## Current Signals

| Area | Current State | Decision |
| --- | --- | --- |
| Hosting | GitHub Pages | 서버 라우팅 없는 실제 `effects.html` 파일을 둔다 |
| Stack | `src/app.ts` TypeScript → `assets/js/app.js` | 새 효과 페이지도 `src/effects.ts`에서 작성하고 JS로 빌드한다 |
| Data | `assets/data/isms.json` | `effects.json`을 별도 생성한다 |
| UI | card grid, modal, lightbox, toast, collapsible 존재 | 기존 CSS token과 모달 패턴을 재사용한다 |
| Images | original PNG + generated WebP thumbnail | guide image도 같은 원칙으로 확장 가능하게 둔다 |
| Mobile | 640px breakpoint와 modal mobile CSS 존재 | bottom-sheet형 modal variant만 추가하면 된다 |
| Docs | `devlog/*.md` factual/diff-oriented plan 관례 | phase별 문서 세트로 관리한다 |

## Proposed File Map

```text
701_design-isms/
├── effects.html                         # NEW: frontend UI candidates page
├── index.html                           # MODIFY: header에 Effects 링크 추가
├── assets/
│   ├── css/style.css                    # MODIFY: header link only
│   ├── css/effects.css                  # NEW: effects page layout + modal styles
│   ├── css/effects-demos.css            # NEW: effect phone demos + animations
│   ├── data/
│   │   └── effects.json                 # NEW: effect data
│   ├── images/effects/
│   │   ├── bottom-sheet/guide.png       # OPTIONAL NEW
│   │   ├── swipe-action/guide.png       # OPTIONAL NEW
│   │   └── ...
│   └── js/effects.js                    # GENERATED from src/effects.ts
├── src/
│   └── effects.ts                       # NEW: effects page runtime
├── scripts/
│   └── generate-thumbnails.mjs          # MODIFY only if guide thumbs are generated
└── devlog/260510_mobile_ux_effects/
    ├── 00_overview.md
    ├── 01_data_content.md
    ├── 02_ui_interaction.md
    ├── 03_motion_accessibility.md
    ├── 04_image_guide_pipeline.md
    ├── 05_verification_deploy.md
    └── AUDIT.md
```

Implementation note: `style.css` already exceeds the project file-size target, so the final implementation keeps effect-specific CSS in `assets/css/effects.css` and `assets/css/effects-demos.css`, while reusing existing global tokens/components.

## Recommended First Release Scope

초기 계획은 12개 효과였지만 현재 구현은 사용자 피드백에 맞춰 46개 후보군으로 확장했다. 아래 12개는 seed list로 남기고, 실제 데이터는 `assets/data/effects.json`을 기준으로 한다.

| # | Effect | Korean | Category | Priority |
| ---: | --- | --- | --- | --- |
| 1 | Bottom Sheet | 바텀 시트 | Navigation & Sheet | P0 |
| 2 | Full-screen Mobile Modal | 모바일 전체 팝업 | Modal & Popup | P0 |
| 3 | Drawer Navigation | 드로어 메뉴 | Navigation & Sheet | P0 |
| 4 | Sticky CTA Bar | 하단 고정 버튼 | Navigation & Sheet | P0 |
| 5 | Scroll Reveal | 스크롤 등장 | Reveal & Scroll | P0 |
| 6 | Staggered Cards | 순차 등장 카드 | Reveal & Scroll | P0 |
| 7 | Press Scale | 눌림 축소 | Touch Feedback | P0 |
| 8 | Swipe Action | 스와이프 액션 | Touch Feedback | P0 |
| 9 | Skeleton Loading | 스켈레톤 로딩 | Micro Interaction | P0 |
| 10 | Toast | 토스트 알림 | Micro Interaction | P0 |
| 11 | Segmented Control | 세그먼트 컨트롤 | Micro Interaction | P0 |
| 12 | Image Lightbox | 이미지 확대 보기 | Modal & Popup | P0 |

## Phase Index

| Phase | Doc | Output |
| --- | --- | --- |
| 1 | [01_data_content.md](01_data_content.md) | `effects.json` schema, first 12 data rows, naming rules |
| 2 | [02_ui_interaction.md](02_ui_interaction.md) | `effects.html`, `src/effects.ts`, modal/card UX |
| 3 | [03_motion_accessibility.md](03_motion_accessibility.md) | motion tokens, reduced motion, focus/keyboard rules |
| 4 | [04_image_guide_pipeline.md](04_image_guide_pipeline.md) | ima2 guide image spec and optional thumbnail flow |
| 5 | [05_verification_deploy.md](05_verification_deploy.md) | local verify, browser QA, GitHub Pages deploy checks |

## Out Of Scope

- 서버 저장, 계정, 사용자 업로드
- SPA router 또는 client-side path router
- Framer Motion, GSAP, Lottie, Three.js 같은 외부 애니메이션 의존성
- 실제 iOS/Android native haptic
- 자동 웹 수집 또는 외부 API 호출

## Completion Definition

- `effects.html`이 GitHub Pages에서 직접 열립니다.
- 46개 effect card가 모바일/데스크톱에서 깨지지 않습니다.
- 각 card는 이름, 한국어명, 별칭, best-for chips, mini demo를 보여줍니다.
- 각 effect modal은 사용처, 피해야 할 때, 구현법, 접근성, 성능 체크를 보여줍니다.
- `prefers-reduced-motion`에서 핵심 정보가 사라지지 않습니다.
- `npm run verify`가 통과합니다.
- 배포 후 `https://lidge-jun.github.io/design-isms/effects.html`이 응답합니다.

## GPT Pro Review Decisions

GPT Pro review returned `NEEDS_FIX`, but approved the core direction after specific plan fixes. These decisions are now binding for implementation:

- `effects.html` must be a real static file. No clean route such as `/effects`.
- All asset paths must be relative and start with `./`.
- `src/effects.ts` must avoid global TypeScript name collisions with `src/app.ts`.
- The first release must implement modal focus containment, not treat it as optional.
- `effects.json` and guide image schema must be unified.
- All current effects must have full data fields before implementation.
- Demos should pause offscreen and respect `prefers-reduced-motion`.
- `assets/js/effects.js` is generated output but must be committed for GitHub Pages.
