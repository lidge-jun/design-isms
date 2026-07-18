# 008 — 리스크, 마이그레이션, 롤백

| 리스크 | 예방 | 감지 | 롤백 |
|--------|------|------|------|
| 46장 ima2 배치 품질 불균일 | manifest+공통 art direction+소배치 | contact sheet+개별 view_image | 해당 id 이전 PNG/WebP 유지 |
| 이미지/JSON count drift | 데이터 기반 validator | verify:assets/isms/effects | phase 커밋 revert |
| classic script 순서 누락 | dependency-before-consumer 표 | 브라우저 namespace 오류/검증 | HTML script diff revert |
| app.ts/effects.ts 비대화 | namespace 추출 | line-limit gate | 기능 slice revert/재분리 |
| Finder 부정확 추천 | 고정 score/config+설명 | 144 조합 deterministic test | Finder mount만 비활성/phase revert |
| snippet 위험 코드 | textContent+lint 정책 | unsafe token validator | snippet data revert |
| 배포 green/live stale | exact SHA run+live smoke | count/asset HTTP 검사 | `git revert <phase-sha>` 후 rollback run 추적 |

## 커밋 정책

- 사용자 요청으로 이 루프의 commit/push는 승인됨.
- work-phase마다 검증된 경로만 명시적으로 stage. `git add -A` 금지.
- push는 wp7 최종 QA 뒤 branch→PR→main merge 또는 사용자가 지정한 안전한 경로로 수행.
- 기존 사용자/에이전트 변경을 정리·삭제·rebase하지 않는다.

## 중단 기준

- ima2 ping 복구 실패, GitHub 인증/Pages 외부 장애: BLOCKED 증거 기록.
- 동일 verifier 실패 2회: root-cause 모드. 3회: 다음 P에서 계획 변경.
- 디자인 판단은 DESIGN.md/010 방향으로 자율 결정하되 접근성/데이터 무결성 기준은 낮추지 않는다.

