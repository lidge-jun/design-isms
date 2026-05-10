---
created: 2026-05-10
tags: [TypeScript, strict-mode, 정적사이트, 리팩터링]
aliases: [Strict TypeScript 전환, Design Isms TS 리팩터링, JS TS 전환]
---

# Strict TypeScript Refactor

## Goal

`assets/js/app.js`에 모여 있는 런타임 로직을 strict TypeScript 원본으로 전환한다. GitHub Pages는 여전히 정적 파일만 배포하므로, 최종 브라우저 진입점은 기존처럼 `assets/js/app.js`를 유지한다.

## Current Signals

- 사이트는 빌드 없는 정적 HTML/CSS/JS 구조다.
- `index.html`은 `<script src="./assets/js/app.js"></script>`를 사용한다.
- UI 스타일과 콘텐츠 데이터는 이미 완료 상태이므로 이번 변경에서 CSS, 이미지, `isms.json`의 디자인/콘텐츠 필드는 건드리지 않는다.
- 런타임 로직은 데이터 fetch, 카드 렌더링, 모달 렌더링, lightbox, language toggle, lazy loading을 한 파일에서 처리한다.
- 배포 안정성을 위해 TypeScript 소스와 컴파일된 JS를 함께 보관한다.

## P1 — Build Contract

### Solution

- `package.json`을 추가하고 TypeScript만 dev dependency로 둔다.
- `tsconfig.json`은 `strict: true`를 기본으로 하고 DOM lib를 명시한다.
- `src/app.ts`를 원본으로 두고 `tsc`가 `assets/js/app.js`를 생성한다.

### Files

- `NEW` `package.json`
- `NEW` `package-lock.json`
- `NEW` `tsconfig.json`
- `NEW` `src/app.ts`
- `GENERATED` `assets/js/app.js`

## P2 — Data Model

### Solution

- `DesignIsm`, `IsmImage`, `IsmExample`, `IsmPrompt` 타입을 정의한다.
- `currentLang`, UI string key, related-ism score 등 런타임 상태를 좁은 타입으로 제한한다.
- JSON parse 결과는 `unknown`에서 최소 검증 후 `DesignIsm[]`로 확정한다.

## P3 — DOM Boundary

### Solution

- DOM 조회는 `querySelectorRequired`, `getElementRequired` helper로 감싸 null 접근을 제거한다.
- 이벤트 핸들러는 `EventTarget`을 `Element`/`HTMLElement`/`HTMLImageElement`로 좁힌 뒤 사용한다.
- 브라우저 전용 확장 상태는 `WeakMap`으로 관리해 DOM 객체에 임의 프로퍼티를 붙이지 않는다.

## P4 — Runtime Parity

### Solution

- 카드 3개 예시 사이트 + 더 보기 접기 동작을 유지한다.
- 모달, URL hash, 팔레트 복사, 관련 ISM, lightbox, lazy loading을 유지한다.
- 언어 토글 후 버튼 문구가 현재 언어로 유지되도록 기존 i18n helper를 재사용한다.

## P5 — Verification

자동:

1. `npm run typecheck`
2. `npm run build`
3. `node -e "JSON.parse(require('fs').readFileSync('assets/data/isms.json','utf8')); console.log('json ok')"`

수동:

4. 로컬 정적 서버에서 첫 화면 카드 렌더링 확인.
5. 카드 클릭 → 모달 오픈 확인.
6. 카드/모달의 예시 사이트가 3개만 먼저 보이고 더 보기로 확장되는지 확인.
7. ESC, 오버레이, 닫기 버튼으로 모달/lightbox가 닫히는지 확인.
8. 디자인/CSS visual diff가 의도적으로 없음을 확인.

## Out Of Scope

- CSS 리디자인.
- `isms.json` 콘텐츠/프롬프트/예시 사이트 수정.
- 번들러(Vite/Webpack/Rollup) 도입.
- 모듈 분할 리팩토링.
- GitHub Actions 배포 파이프라인 변경.
