# 004 — 2026 신규 ISM 후보와 편입 결정

근거: 001 lunasearch 리서치, 기존 43개 overlap 검사, 공개 사이트에서 별도 backlog를
만들지 않는 AGENTS 원칙. 후보는 승인 시 곧바로 isms.json과 이미지 폴더에 편입한다.

## 편입 6종

| id | 표시명 | 역할 | 기존과의 경계 |
|----|--------|------|---------------|
| `ai-slop` | AI Slop | 의도적 anti-pattern. 기본 추천에서 제외 | generic AI 산출물의 반복 문법을 진단; Anti-design은 의도적 파괴라 다름 |
| `refractive-glass-ui` | Refractive Glass UI | 2025-26 굴절/광학 material | 기존 glassmorphism의 정적 blur 카드와 달리 빛 굴절·specular depth 중심 |
| `spatial-ui` | Spatial UI | 깊이·anchored control·layered plane | isometric-3d-ui는 일러스트 관점, spatial-ui는 인터페이스 공간 관계 |
| `human-crafted-web` | Human-Crafted Web | AI 균질화 반동, 재료감/손흔적 | indie-web은 생태계/개인 웹, 이 항목은 제작 흔적과 촉각성 중심 |
| `generative-identity` | Generative Identity | 규칙 기반 가변 브랜드 시스템 | kinetic/variable typography보다 전체 identity system에 초점 |
| `technical-blueprint` | Technical Blueprint | 주석·도식·측정선 기반 UI | monospace terminal은 CLI 미학, blueprint는 시각적 설명/구조 노출 |

## 이미지 계약

- `ai-slop`: landing / saas / dashboard
- `refractive-glass-ui`: landing / mobile-app / dashboard
- `spatial-ui`: landing / dashboard / portfolio
- `human-crafted-web`: landing / shop / portfolio
- `generative-identity`: agency / pricing / portfolio
- `technical-blueprint`: landing / blog / dashboard

모두 AGENTS의 메인/상업/앱 카테고리 허용 파일명 안에서 3장을 고른다. `ai-slop`도
시각적으로 못 만든 이미지가 아니라, 반복되는 purple gradient·과도한 pill/card·의미 없는
sparkle·빈 카피를 잘 통제한 **교육용 실패 사례**여야 한다.

## 데이터 계약

- 기존 필수 필드 유지. 신규 선택 필드 `kind: style | anti-pattern`, `sources`,
  `reviewedOn`을 추가한다.
- 10개 실제 예시 사이트는 live verification 후 넣는다. AI Slop은 특정 사이트를 조롱하는
  목록 대신 현상을 설명하는 출처와 synthetic mockup을 사용하며, examples 정책 예외가
  필요하면 040 P에서 명시적으로 AGENTS를 갱신한다.
- 프롬프트는 `assets/data/research-prompts.json`과 기존 canonical ledger
  `devlog/260510_nav_taxonomy_effect_docs/grok_research_prompts.md`에 함께 남긴다.
- dev-guides에는 layout/typography/color/motion/dos/donts와 실행용 implementation 필드를
  추가한다.

## 수용 기준

- 49 ISM, guide key 49, 각 신규 원본 3 + WebP 3, 중복 id/폴더 0.
- anti-pattern은 스타일 파인더 기본 추천에서 제외되며 직접 탐색/교육 맥락에서만 노출.
- README/AGENTS/structure/header count가 phase 완료 시점의 49/46 상태와 일치.

