# 080 — Final QA & Deploy

의존: 모든 콘텐츠 Phase 완료 후

## 파일 변경 맵

| 구분 | 경로 | 내용 |
| --- | --- | --- |
| MODIFY | `scripts/run-final-static-qa.mjs`, `run-final-server-qa.mjs`, `run-final-browser-qa.mjs` | pages 배열에 신규 4페이지 포함 |
| MODIFY | `scripts/verify-final-qa.mjs` | 최종 계약 수치 갱신: Effects 64→94, pages 3→7, stage entry/manifest 211→331쌍, browser rows 18→42(7페이지×6너비), 스크린샷 9→21(7페이지×3상태), server probes 7페이지+에셋, flow 집합에 4개 신규 페이지의 검색/필터/모달/크로스링크 시나리오 추가 |
| MODIFY | `scripts/final-preservation.mjs` | receipt 경로/계약을 확장된 카탈로그 기준으로 갱신 |
| MODIFY | `README.md`, `AGENTS.md`, `structure/README.md` | 최종 카운트/구조 동기화(`npm run sot:sync`) |
| MODIFY | `devlog/_plan/260717_design-encyclopedia-upgrade/` → `devlog/_fin/260717_design-encyclopedia-upgrade/`로 이동 | 유닛 아카이브(이번 유닛의 QA receipt는 이 유닛 폴더에 기록, 010에서 분리한 writable evidence root) |

## 최종 계약 수치 (010 Canonical Registry에서 유도)

| 항목 | 값 |
| --- | --- |
| ISMs | 49 (불변) |
| Effects | 94 |
| Color Systems | 25 |
| Typography Pairings | 20 |
| Layout Patterns | 25 |
| Motion Presets | 20 |
| 공개 페이지 | 7 (index/effects/faq/color/typography/layout/motion) |
| image-pairs-manifest | 331쌍 (211 legacy + 30 effects + 25 color + 20 typo + 25 layout + 20 motion) |

## IN / OUT

- IN: QA 스크립트 7페이지/331쌍 계약 갱신, 전체 verify, 브라우저 QA, 문서 동기화, 유닛 아카이브.
- OUT: 새 기능/콘텐츠 추가, git push(사용자 승인 필요), 라이브 배포.

## 검증 범위

- 전체 `npm run verify` (모든 카탈로그 포함)
- 브라우저 QA: 7페이지 × 6 너비 (1440/1180/1024/860/640/390)
- 각 페이지 카드 수, nav 축, console error, horizontal overflow 체크
- 모달/라이트박스/검색/필터/키보드 네비게이션 동작
- 크로스링크 동작 검증
- 이미지 감사 (PNG/WebP 쌍, provenance)
- `.pages` 스테이징(`npm run pages:stage`) — 배포(push)는 사용자 명시 승인 후에만
- preservation receipt (HEAD/upstream/archive 변경 없음)

## 완료 기준

- 모든 QA receipt 통과
- 유닛 아카이브 후 `DESIGN_ISMS_EVIDENCE_ROOT=devlog/_fin/260717_design-encyclopedia-upgrade/qa` 환경변수로 소스 변경 없이 static→browser→server→preservation receipt를 전부 새로 생성한 뒤 `npm run verify:local-final` 통과(governed-tree SHA 일치 유지, 아카이브 후 gate 재현성 증명)
- 로컬 serve에서 전체 카탈로그 접근 가능(스크린샷 증거)
- 배포는 push 승인 시 GitHub Actions로 진행하고 smoke test — 승인 전이면 D 요약에 배포 대기 상태 명시
