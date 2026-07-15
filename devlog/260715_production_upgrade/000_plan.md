# 000 — Production Upgrade Plan (MOC)

- 날짜: 2026-07-15
- 세션: 019f61c7-b43d-79d0-bda6-6a6246a8ce40 (HOTL goal loop)
- 골플랜: `.codexclaw/goalplans/design-isms-users-jun-developer-new-701-design-i/`
- 목표: design-isms를 "디자인 알못/에셋 알못이 연결해서 실제로 디자인을 잘하게 되는" 프로덕션급 사이트로 업그레이드. main push + GitHub Pages 배포 확인까지.

## 배경 (요약)

2026-07-15 lunasearch 5레인 리서치(문서 001)와 실측 감사(문서 002~003) 결론:
사이트는 레퍼런스 보드로는 이미 상위권이지만 "스타일 선택 → 실행 가능한 산출물"로
이어지는 연결 레이어가 없다. 성공 패턴은 `스타일 선택 → 실제 컴포넌트 미리보기 →
조정 → 프레임워크용 코드 복사` (Realtime Colors / shadcn 테마 생성기 / Animista 공통).

## 문서 맵 (이 유닛)

| 문서 | 내용 | 상태 |
|------|------|------|
| 000_plan.md | 이 문서. 목표/제약/phase 맵 | P에서 작성 |
| 001_research_lunasearch.md | 5레인 리서치 종합 (검증/리드 구분) | B |
| 002_site_audit.md | 실측 감사: build/verify/렌더/모바일/nav/콘솔 | B |
| 003_image_audit.md | guide 이미지 46장 감사 + ISM 이미지 상태 | B |
| 004_new_ism_candidates.md | 신규 트렌드 ISM 후보 조사 (ai-slop 포함) | B |
| 005_novice_journeys.md | 디자인 알못의 핵심 사용자 여정/정보구조 | B |
| 006_runtime_architecture.md | 데이터·TS·classic-script·빌드 아키텍처 감사 | B |
| 007_quality_gates.md | 접근성/반응형/성능/시각 QA 기준 | B |
| 008_risks_and_rollback.md | 대규모 이미지·데이터·배포 리스크/롤백 | B |
| 009_research_synthesis.md | 조사 결론과 제품 결정 ledger | B |
| 010_design_direction.md | Design Read + 다이얼 + 사이트 자체 디자인 방향 | B |
| 011_frontend_standards.md | 구현 표준: 브레이크포인트/a11y/anti-slop/성능 | B |
| 020_phase1_site_integrity.md | Phase 1 diff-level: 깨진 부분 수리 + 디자인 보강 | B |
| 030_phase2_guide_image_regen.md | Phase 2 diff-level: guide 이미지 ima2 재생성 | B |
| 040_phase3_new_isms.md | Phase 3 diff-level: 신규 ISM 추가 (ai-slop 포함) | B |
| 050_phase4_visual_effects.md | Phase 4 diff-level: 비주얼 이펙트 카테고리 확장 | B |
| 060_phase5_style_export.md | Phase 5 diff-level: 스타일→코드 내보내기 + 스니펫 | B |
| 070_phase6_finder_prompts.md | Phase 6 diff-level: 스타일 파인더 + AI 프롬프트 팩 | B |
| 080_phase7_final_qa_deploy.md | Phase 7 diff-level: 최종 QA + push + 배포 확인 | B |

세부 구현 문서가 필요하면 해당 decade 안에서 확장한다 (예: 041_image_prompt_manifest.md).

## Work-Phase 맵 (dependency-ordered, PHASE-SPLIT-01)

| WP | decade | 내용 | 의존성 |
|----|--------|------|--------|
| wp0 | 000-019 | 설계 패스: 이 문서 세트 전체 작성 | — |
| wp1 | 020 | 사이트 integrity 수리 (기반: 이후 모든 UI 작업의 전제) | wp0 |
| wp2 | 030 | guide 이미지 재생성 (독립 에셋 트랙) | wp0 |
| wp3 | 040 | 신규 ISM 추가 (데이터 스키마 확장 전제 없음, 기존 스키마 사용) | wp1 (nav/카운트 표기 영향) |
| wp4 | 050 | 비주얼 이펙트 카테고리 확장 (effects.json 스키마/렌더러 확장). 신규 effect의 guide.png/webp 생성은 wp4가 소유 (wp2는 기존 46장만) | wp1, wp2(스타일 스펙 재사용) |
| wp5 | 060 | 스타일→코드 내보내기 + 스니펫 (dev-guides/palette 데이터 소비) | wp1, wp3 |
| wp6 | 070 | 스타일 파인더 + 프롬프트 팩 (keyword/prompts 데이터 소비) | wp3, wp5 |
| wp7 | 080 | 최종 QA + SoT 동기화 + push + Pages 배포 확인 | 전부 |

한 work-phase = 한 PABCD 사이클. 중간 발견 유닛은 goalplan `workPhases[]`에 append (LOOP-UNIT-CHAIN-01).

## 스코프 경계

- IN: 이 레포의 HTML/CSS/TS/JSON/이미지/문서, ima2 이미지 생성, WebP 썸네일, git push, Pages 배포 확인.
- OUT: 백엔드/서버, 로그인/유료화, 별도 reference/backlog 공개 페이지(AGENTS 금지), 다른 레포 수정.

## 불변 조건 (AGENTS.md 승계)

- non-module script, `src/*.ts` → `assets/js/*.js` 커밋, 신규 파일 500줄 이하.
- 기존 대형 파일(`src/app.ts` 1342줄, `style.css` 992줄)은 더 키우지 않는다: wp5/wp6의
  export/finder 로직은 신규 파일(`src/app-export.ts`, `src/finder.ts` 등)로 분리한다.
- effects.json `demo.type` == effect `id` == demos registry 항목.
- guide 원본 PNG + WebP preview 쌍 유지, `npm run images:thumbs` + `npm run verify`.
- nav 축은 실제 사이트 기준 6축: Isms / Effects / FAQ / GitHub(star) / Lang / Count.
  현재 faq.html에는 Lang 토글과 Count가 없어 축이 깨져 있다(감사 확인:
  faq.html:112-120). wp1이 FAQ nav를 축에 맞추고, AGENTS/structure의 낡은
  "index+effects 두 페이지" 서술은 wp1 SoT 동기화에서 수정한다.
- 헤더 카운트(`43 isms`, `46 candidates`)는 정적 HTML이다. ISM/effect 수를 바꾸는
  wp3와 wp4는 각자 카운트 표기와 AGENTS/README/structure의 숫자 서술 갱신을 소유한다.
- 커밋/푸시는 이번 턴에서 사용자가 명시 요청함 (승인됨).

## 커밋/롤백 정책 (배포가 곧 프로덕션)

- work-phase마다 D 종료 시 원자 커밋 1개(+필요시 서브 커밋)를 만든다. push는 wp7의
  QA 통과 후에만 한다 (그 전까지 로컬 커밋만 존재).
- 롤백 단위 = phase 커밋. 문제 발견 시 `git revert <phase-commit>` 후 재작업.
- push 후 Pages 배포 실패 시: `gh run list/view`로 로그 확인 → 수정 커밋 → 재push.
  워크플로 자체 결함이면 마지막 성공 커밋으로 revert push가 안전 경로.

## 조건부 경로 활성화 시나리오 (C-ACTIVATION-GROUNDING-01)

| 조건 | 활성 시나리오 | 관측 증거 |
|------|---------------|-----------|
| ima2 서버 다운 (wp2/wp3/wp4) | 각 배치 전 `ima2 ping` 프리플라이트. 실패 시 `ima2 serve` 기동 후 재핑. 그래도 실패면 해당 phase BLOCKED 보고 | ping 출력 |
| ima2 생성물 불량 | `view_image` 육안 검사에서 불합격 → 프롬프트 수정 후 해당 파일만 재생성 (최대 2회, 이후 잔여 리스크로 기록) | 재생성 파일 + 검사 노트 |
| `npm run verify` 실패 | 실패 delta만 수리 후 재실행. 2연속 동일 실패 시 root-cause 모드 | 명령 출력 |
| Pages 배포 실패 (wp7) | `gh run view --log-failed` → 수정 → 재push. 워크플로 결함이면 revert push | gh 출력 |
| WebP 썸네일 누락 | `npm run images:thumbs` 재실행 → 존재 검증 스크립트로 확인 | ls/스크립트 출력 |

## HOTL 리소스 바운드

- 도구: 로컬 셸/브라우저/ima2 로컬 서버/git/gh, sol(gpt-5.6-sol) 서브에이전트 병렬 파견.
- 쓰기 범위: 이 레포 + `.codexclaw/` + `/tmp`. 예산: 이 세션. 벽시계: 사용자 중단 전까지.

## 수용 기준 (골플랜 criteria 미러)

- c1 문서 세트 완성(diff-level) / c2 build+verify / c3 데스크탑·모바일 무에러 렌더 /
  c4 guide 재생성 / c5 신규 ISM / c6 알못 지원 기능 / c7 push+배포 success.
- c6 구체화(감사 반영): (a) ISM 모달에서 모든 ism에 대해 CSS 변수/Tailwind/JSON 복사
  패널이 렌더되고 클립보드 복사가 동작, (b) effects 모달에서 신규 비주얼 이펙트 전원이
  전용 데모 + 코드 스니펫 복사를 제공, (c) 스타일 파인더가 3문항 응답으로 1개 이상의
  ISM을 추천하고 해당 모달로 연결, (d) ISM 모달에 AI 프롬프트 팩 복사 블록 렌더.
  각각 브라우저 렌더 스크린샷 + 동작 확인으로 검증.

## 감사 잔여 노트 (2026-07-15 A-gate, GO-WITH-FIXES 7건 폴드백)

- 모바일 index 칩 겹침: 정적 CSS만으로는 재현이 불명확하나 390px 라이브 렌더
  스크린샷(/tmp/audit_index_390.png)에서 겹침 확인됨. wp1 P에서 라이브 재현 후
  근본 원인(고정 헤더 높이 vs wrap) 진단을 선행한다. 재현 불가 시 defect 아님으로
  기록하고 스킵.
- 000 배경 서술의 리서치 인용은 문서 001~003이 이 사이클 B에서 착지해야 감사
  가능해진다. B 종료 기준에 001~003 착지를 포함한다.
