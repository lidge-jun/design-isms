# 009 — 조사 종합과 제품 결정 Ledger

## 최종 제품 명제

Design-isms는 "예쁜 것 모음"이 아니라 **스타일을 고르고, 효과를 이해하고, 구현 가능한
코드와 AI 프롬프트까지 가져가는 디자인 결정 도구**가 된다.

## 결정

| 질문 | 결정 | 근거 |
|------|------|------|
| 자체 디자인 방향 | Annotated Specimen Atlas, 차가운 paper/ink + orange accent | 레퍼런스 사이트 정체성, generic beige/pill 탈피 |
| 카탈로그 구조 | 기존 routes 유지, family/Finder로 진입점 확장 | 공개 backlog 금지, 초심자 IA |
| 신규 ISM | ai-slop 포함 6종, 총 49 | 2025-26 트렌드 + 기존 overlap 경계 |
| 신규 effects | 6 family×3 = 18종, 총 64 | Aceternity/Codrops/React Bits 수요 클러스터 |
| 코드 handoff | CSS vars/Tailwind @theme/JSON + effect snippets | Realtime Colors/shadcn/Animista 성공 패턴 |
| 이미지 | ISM 기존 유지, effect guide 46장 전면 재생성 | 사용자 지적 + contact-sheet 일관성 실패 |
| 교육 포맷 | 규칙+이유+dos/donts+복사 가능한 starter | Refactoring UI/Practical UI 및 개발자 pain point |

## 폐기한 방향

- 별도 reference/backlog 공개 페이지: AGENTS 불변 조건과 충돌.
- 로그인/컬렉션/유료화: 정적 Pages 범위 밖.
- 임의 순서 기반 wide-card masonry: 정보 의미가 없는 장식.
- AI Slop을 추천 스타일로 노출: anti-pattern 목적과 충돌.
- GPT Pro 산출물의 origin/main 가정: 실제 로컬 workflow/dirty tree와 불일치.

## 다음 사이클

010/011 방향·표준과 020~080 diff-level 문서를 실제 레포 기준으로 고정한 뒤 wp0 C에서
lexico/file-path/acceptance 검증을 통과한다. 이후 wp1부터 한 work-phase당 한 PABCD를 돈다.

