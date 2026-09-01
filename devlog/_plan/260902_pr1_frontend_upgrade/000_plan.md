# 000 — PR #1 수용 + cxc-dev-frontend 기준 프런트엔드 업그레이드 + 배포

unit: `devlog/_plan/260902_pr1_frontend_upgrade/`
session: 01a05db6-4aa4-7190-80db-a06354f0001c
goalplan slug: `pr-1-epicsagas-feat-expose-design-data-as-ai-age`
work class: C3 (다중 표면 변경 + 공개 배포, 데이터 스키마 무변경)

## 목적

외부 기여 PR #1(플러그인 매니페스트 + 스킬 2종)을 검증해 머지하고, 그 위에서 7개 공개
페이지를 `cxc-dev-frontend` 기준(접근성 베이스라인 §7, 반응형 §responsive-viewport,
타이포그래피 래핑, anti-slop 렌더 tell, 성능 가드레일)에 맞춰 수리한 뒤 GitHub Pages로
배포한다.

## 제약

- 카운트 불변 조건 49 ISMs / 94 effects / 18 FAQ는 변경하지 않는다.
- `assets/data/*.json` 스키마와 이미지 자산(331 PNG/WebP 쌍)은 건드리지 않는다.
- `src/*.ts` 수정 시 `npm run build` 후 `assets/js/*.js` 산출물을 함께 커밋한다.
- `npm run verify`는 파일을 생성하지 않는다. verify 전에 build를 돌린다.
- 500줄 파일 상한과 `npm run verify:lines`의 legacy ceiling을 넘기지 않는다.
- 푸시는 사용자가 승인한 배포 범위(main → Pages) 안에서만 한다.

## 의존성 정렬 work-phase 맵 (PHASE-SPLIT-01)

빌드 순서는 "기반 → 코어 → 통합 → 경화" 순이다. 효과/난이도 버킷이 아니다.

| wp | 문서 | 산출물 | 선행 |
|----|------|--------|------|
| wp1 | 000, 001, 002, 003 | 이 로드맵 자체(diff-level) + 3라운드 감사 기록 | — |
| wp2 | 010 | PR #1 머지 + 문서 동기화 (기반: 트리 확정) | wp1 |
| wp3 | 020 | 접근성 베이스라인 — 대비 토큰, 포커스, 시맨틱, 접근명, reduced-motion | wp2 |
| wp4 | 030 | 타이포그래피 래핑 (`text-wrap` 도입) | wp3 |
| wp5 | 040 | anti-slop 렌더 tell + 성능 가드레일 + `.search-input` 단독 정리 | wp4 |
| wp6 | 050 | 최종 브라우저 QA + 배포 실측 (통합 검증) | wp5 |

### 쓰기 소유권 (중복 편집 방지, A라운드 blocker 4)

| 대상 | 단독 소유 phase |
|------|-----------------|
| `.search-input` 폭·전이·포커스 | wp5 |
| 7개 HTML의 아이콘 글리프 → SVG | wp5 |
| 7개 HTML의 `aria-label`·시맨틱 속성 | wp3 |
| `theme-atlas.css` 색 토큰 | wp3 |
| `text-wrap` 선언 | wp4 |

wp3과 wp5는 같은 7개 HTML을 건드리지만 편집 속성이 분리된다(속성 vs 자식 노드).
각 phase의 P에서 stale check로 실제 줄 위치를 재확인한다.

wp2가 먼저인 이유: PR #1이 `README.md`를 수정하고 새 디렉터리를 추가하므로, 트리가
확정되기 전에 프런트엔드를 고치면 머지 충돌과 이중 검증이 발생한다.
wp3이 wp4보다 먼저인 이유: 포커스/시맨틱 구조가 바뀌면 레이아웃 측정 기준이 흔들린다.

## 검증기 (PLAN-VERIFIER-REAL-01)

각 명령을 실제로 실행해 확인했다. 세션 시작 시점 baseline은 전부 통과 상태였다.

| 명령 | exit | 이 유닛의 변경 대상을 읽는가 |
|------|------|------------------------------|
| `npm run verify` | 0 | 예 — typecheck(`src/*.ts`), verify:nav(7개 HTML), verify:content(페이지 + `assets/css` 전체의 `url()` 해석), verify:lines(`assets/css` 포함 83개 파일) |
| `npm run verify:nav` | 0 | 예 — 7개 HTML의 축 순서/aria-current/드롭다운 계약/skip link (여는 태그만 매치) |
| `npm run pages:stage` | 0 | 예 — 배포 트리 허용목록. 플러그인 파일 유입 여부를 여기서 증명 |
| `npm run sot:check` | 0 | 예 — README/AGENTS/HTML의 `data-sot:*` 마커 |
| `npm run build` | 0 | 예 — `src/*.ts` → `assets/js/*.js` |
| aside 브라우저 QA | — | 예 — 렌더 의미론 관찰. 아래 범위 설명 참조 |

**CSS 게이트의 정확한 범위** — 1판의 "verify는 CSS를 읽지 않는다"는 거짓이었다
(A라운드 blocker 2). `verify-content.mjs:79`가 `assets/css` 전체를 읽어 `url()`을
해석하고 `verify-line-limits.mjs:30`이 줄 수를 센다. 정적 게이트가 검사하지 **않는**
것은 대비비, 포커스 가시성, 줄바꿈 결과, 반응형 레이아웃, 전이 속성 같은 **렌더
의미론**이다. wp3~wp5의 수용 근거가 브라우저 관찰인 이유는 CSS가 게이트 밖이어서가
아니라 게이트가 다른 질문에 답하기 때문이다(C-RENDER-GROUNDING-01).

`verify:nav`는 `verify-nav.mjs:76`에서 `<button[^>]*>` 여는 태그만 매치하므로 버튼
**내부** 글리프를 SVG로 바꿔도 깨지지 않는다. 실제 위험은 `nav.css:50`의
`font-size: 0.75em`이 SVG에는 무의미해져 캐럿 크기가 달라지는 것이다.

`src/app.ts`는 1049줄이고 `verify-line-limits.mjs:12`의 상한이 1050이다. 이 유닛에서
`app.ts`는 **순증 1줄 이내**로만 수정한다.

## 우회 경로 (PLAN-BYPASS-NAMED-01)

| 항목 | 값 |
|------|-----|
| tier | E2 (CI 스크립트 게이트) |
| 실행 표면 | `.github/workflows/deploy.yml` (npm run verify → pages:stage) |
| 알려진 우회 | 로컬 `--no-verify` 커밋, workflow_dispatch 수동 배포, 렌더 의미론(대비·포커스·줄바꿈·전이)은 어떤 게이트도 검사하지 않음 |
| 잔여 위험 | 시각 회귀는 자동 게이트가 없음 — 사람/브라우저 관찰에 의존 |
| 최종 강제 계층 | none (조기 경고만 존재) |

## 종료 조건

DONE = PR #1 머지 + wp2~wp6 완료 + Actions 성공 + 라이브 URL 실측.
BLOCKED = GitHub 권한/CI 외부 요인. NEEDS_HUMAN = 마켓플레이스 이름/저장소 분리 결정.
