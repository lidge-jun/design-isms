# 006 — 런타임·데이터 아키텍처 감사

## 현재 계약

- 정적 HTML/CSS + TypeScript source. `tsc`가 `src/*.ts`를 동일 basename의
  `assets/js/*.js`로 생성한다.
- tsconfig module은 ES2020이지만 source는 import/export 없이 전역 namespace/IIFE로
  작성하고 HTML은 classic script로 순서를 보장한다.
- index: app.js. effects: effects-demos.js → effects-docs.js → effects.js.
- 데이터: isms.json 43, dev-guides.json 43키, effects.json/effects-docs 46.

## 확장 구조

| 책임 | 신규 source | 전역 namespace | 소비자 |
|------|-------------|----------------|--------|
| index dialog a11y | `src/app-dialog.ts` | `AppDialogA11y` | app.ts |
| style export | `src/app-export.ts` | `DesignExport` | app.ts/effects.ts |
| finder | `src/finder.ts` | `DesignFinder` | app.ts |
| effects filters | `src/effects-filters.ts` | `EffectsFilters` | effects.ts |
| effects interactions | `src/effects-interactions.ts` | `EffectsInteractions` | effects.ts |
| FAQ renderer | `src/faq.ts` | `DesignFaq` | faq.html |

각 source/generated 쌍은 HTML에서 consumer보다 먼저 로드한다. import/export를 넣지
않으며 namespace 미존재 시 조용히 실패하지 말고 명확한 초기화 오류를 낸다.

## 데이터 SoT

- count validator는 숫자를 코드에 하드코딩하지 않고 JSON length와 registry를 교차검증.
- dev-guides가 ISM 구현 가이드의 유일한 데이터 SoT. app.ts 내 중복 map은 wp3에서 제거.
- effects snippet은 `effects-snippets.json`, Finder 규칙은 `finder-config.json`.
- 정적 HTML count/SEO copy는 `sync-sot --check`가 JSON과 맞는지 검증한다.

## 파일 크기

- 신규 authored 파일 ≤500줄.
- 기존 app.ts 1342, effects.ts 493은 더 키우지 않는다. 기능을 namespace 파일로 추출해
  phase 종료 시 app.ts ≤1300, effects.ts ≤450을 목표로 한다.
- generated JS는 line limit 대상이 아니지만 source와 parity가 필수.

## 실패 경로

- guide/finder/snippet JSON fetch 실패: 카탈로그 기본 탐색은 유지하고 해당 보조 패널만
  복구 메시지+재시도를 제공.
- namespace script 누락: console error + feature mount 실패를 QA가 차단.
- invalid JSON: validator와 runtime parser 모두 fail closed, innerHTML에 원문 삽입 금지.

