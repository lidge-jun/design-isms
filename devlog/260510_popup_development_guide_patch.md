---
created: 2026-05-10
tags: [devlog, 개발가이드, 컴포넌트, 모달UX]
aliases: [팝업 개발 가이드 구현, Development Guide 패치, 컴포넌트 추천 섹션]
---

# 팝업 개발 가이드 패치

팝업은 이제 시각 레퍼런스에서 끝나지 않는다. 사용자는 모달 최하단에서 해당 ISM을 실제 UI로 옮길 때 어떤 컴포넌트가 어울리는지, 어떤 순서로 구현하면 되는지, 무엇을 검증해야 하는지 바로 확인한다.

이번 패치는 별도 라우트나 문서 페이지를 만들지 않는다. 기존 모달 흐름을 유지하고, 가장 아래에 작은 개발 가이드 섹션을 붙인다. 그래서 디자인 감상, 실제 사이트 확인, 관련 ISM 탐색을 마친 뒤 구현 체크로 넘어갈 수 있다.

---

## Current Signals

| 항목 | 상태 |
|---|---|
| 런타임 | `src/app.ts` strict TypeScript |
| 모달 | 문자열 렌더링 기반 단일 상세 팝업 |
| 이미지 | WebP thumbnail + PNG lightbox |
| 요청 범위 | GitHub repo 정리 + 팝업 하단 개발 가이드 즉시 구현 |

## 구현 내용

- [x] `DevelopmentGuide` 타입 추가
- [x] 35개 ISM별 개발 가이드 데이터 추가
- [x] 팝업 최하단에 개발 가이드 렌더링
- [x] 어울리는 컴포넌트 chip 표시
- [x] 구현 방법 bullet 표시
- [x] 검증 포인트 checklist 표시
- [x] 모바일에서 1열로 접히는 CSS 추가
- [x] README를 현재 구조에 맞게 갱신
- [x] GitHub repo description, homepage, topics 갱신

## Verification

- [x] `npm run typecheck`
- [x] `npm run build`
- [x] desktop modal에서 개발 가이드가 related ISM 아래에 표시된다.
- [x] mobile modal에서 개발 가이드가 1열로 표시된다.
- [x] 기존 thumbnail/lightbox 동작이 유지된다.
- [x] GitHub Pages workflow가 성공한다.

## 변경 기록

- 2026-05-10: 모달 최하단 개발 가이드와 GitHub repo 정리 작업을 패치했다.
