# 001 — Lunasearch 5레인 리서치 종합 (2026-07-15)

수행: gpt-5.6-luna explorer 5레인 병렬 (cxc-lunasearch → cxc-search 증명 사다리).
메인 세션에서 핵심 기술 전제 2건(CSS 스크롤 드리븐, View Transitions) 재검증 완료.

## 핵심 결론

사이트는 레퍼런스 보드로는 상위권이나 "스타일 선택 → 실행 가능한 산출물" 연결
레이어가 없다. 검증된 성공 패턴: **스타일 선택 → 실제 컴포넌트 미리보기 → 조정 →
프레임워크용 코드 복사** (Realtime Colors, shadcn 테마 생성기, Animista 공통).

## 레인별 검증 발견 (소스 오픈 완료 = verified)

### L1. 갤러리 UX (Dewey)
- Land-book: 섹션 단위 브라우징(Hero/Pricing/FAQ...) + 타입/색/스타일 필터. 알못의
  "좋은 디자인 찾기"를 실행 가능한 질의로 바꿈. free tier 유지 + 조직화 기능만 유료.
  (land-book.com/pro, 2026-07-15 접근)
- Mobbin/Refero: 스타일→개별 화면→플로우 3계층. 자연어 검색("pricing page")이
  태그 어휘 학습 부담을 제거. (mobbin.com/mcp, doc.refero.design/mcp/tools)
- Dark.Design/Curated.design: 좁은 큐레이션 + 명시적 카테고리가 초심자 진입점.
  "추천 시작점 레이어 + 깊은 분류" 조합 권장.

### L2. 이펙트 카탈로그 (Cicero)
- 수요 집중: 스크롤/패럴랙스, 텍스트 애니메이션, 히어로/배경, 커서/마그네틱,
  페이지 전환, 경량 3D. (Aceternity 292 에셋, Codrops 2026 허브 분류, 접근 2026-07-15)
- 지배적 패키징: 라이브 데모 ↔ 코드 토글 + 복사. (Hover.dev Demo/Code, Animista
  플레이그라운드→CSS 복사)
- 프레임워크 변형(JS-CSS/TS-Tailwind) + shadcn CLI 배포가 테이블 스테이크.
  (React Bits README, Magic UI, ui.shadcn.com/docs)

### L3. 개발자 디자인 교육 (Hubble)
- 레시피형("규칙+이유+before/after")이 최강 포맷. (Refactoring UI, Practical UI
  100+ 규칙/300+ 예시)
- 알못의 실패 지점은 창의성이 아니라 결정: 색 조합, 폰트, 간격, 위계.
  (r/webdev 2022-2023 스레드, HN 25135215)
- 구현 시점 체크리스트 수요. (interfaces.rauno.me, MDN Design for developers
  2025-07-03 수정)

### L4. 토큰/테마 툴링 (Noether)
- Realtime Colors가 "스타일→스타터 코드" 모델의 정점: 컨텍스트 미리보기 + CSS/
  Tailwind/SCSS/변수 내보내기. (realtimecolors.com/docs/exporting)
- 최소 유용 표면 = 시맨틱 네이밍 CSS 변수(light/dark) + Tailwind `@theme`.
  (tailwindcss.com/docs/theme)
- DTCG JSON은 교환 포맷, CSS는 핸드오프 포맷. (designtokens.org, Format 2025.10
  draft 2026-06-17)
- 타이포는 개별 폰트 픽이 아니라 시스템(스케일+역할)으로 내보내야 유용.
  (typescale.org)

### L5. 2025-26 트렌드 (Euler)
- 네이티브 모션 API가 실용 단계: View Transitions same-document는 2025-10 Baseline,
  CSS scroll-driven animations는 Chrome 115+/Safari 26+, Firefox만 미지원(Baseline
  직전). [메인 세션 재검증 완료 — developer.chrome.com/blog/view-transitions-in-2025,
  webkit.org/blog/17101, MDN 2026-06-19]
- 지배 미학: 다크 파운데이션 + 글로우/그라데이션 + 반투명 표면 + 3D 공간감.
  (Webflow 2025 트렌드 리포트 — lead)
- 촉각 텍스처/그레인/수작업 불규칙성 = AI 광택 동일화에 대한 반동. (Creative Bloq
  2025-12-23 — lead)
- AI 생성 디자인 불만: "다 보라색 그라데이션 카드"(r/webdesign 2025-12, 2026-05).
  → 예시/팔레트/폰트/금지사항을 갖춘 프롬프트 스캐폴딩 수요 = AI 프롬프트 팩 근거.

## 미확정 리드 (unverified)

- Curated.design의 Craftwork 리디렉션 이후 구조 변화.
- Firefox 스크롤 드리븐 애니메이션 출시 시점(잠정).
- uiverse 7,372개 수치의 실시간 정확성.

## 사이트 개선 매핑

| 발견 | 반영 phase |
|------|-----------|
| 비주얼 이펙트 수요 클러스터 | wp4 (050) |
| 라이브 데모+코드 복사 패키징 | wp4/wp5 (050/060) |
| 시맨틱 CSS 변수+Tailwind 내보내기 | wp5 (060) |
| 추천 시작점/자연어 진입 | wp6 파인더 (070) |
| AI 프롬프트 스캐폴딩 | wp6 프롬프트 팩 (070) |
| 레시피형 가이드 (기존 dev-guides 활용) | wp5 export에 dos/donts 포함 |
| 트렌드 ISM (ai-slop 등) | wp3 (040) |
