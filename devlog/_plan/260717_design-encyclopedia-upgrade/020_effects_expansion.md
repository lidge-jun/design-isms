# 020 — Effects 비주얼 이펙트 확장

의존: 015 공유 셸 완성 후

## 목적

비주얼 이펙트 6개 family를 각 3개 → 8개로 확장(+30개, 총 94개).
Interface Pattern 46개는 건드리지 않음.

## 파일 변경 맵

| 구분 | 경로 | 내용 |
| --- | --- | --- |
| MODIFY | `assets/data/effects.json` | +30 엔트리(아래 확정 목록) |
| MODIFY | `assets/data/effects-docs.json` | +30 문서 엔트리 |
| MODIFY | `assets/data/effects-snippets.json` | +30 스니펫(HTML/CSS±JS, 12KiB 제한) |
| MODIFY | `src/effects-demos.ts` | registry +30 id, 각자 전용 render 케이스 |
| MODIFY | `assets/js/effects-demos.js` | tsc 산출물(커밋 대상) |
| NEW | `assets/css/effects-demos-expansion.css` | 신규 30개 demo 스타일(500줄 제한, 초과 시 family별 분할) |
| MODIFY | `effects.html` | 신규 demo CSS 로드 |
| NEW | `assets/images/effects/{id}/guide.png` ×30 | ima2 생성(1536x1024) |
| NEW | `assets/images/thumbs/effects/{id}/guide.webp` ×30 | `npm run images:thumbs` |
| MODIFY | `scripts/verify-effects.mjs` | `EXPECTED_EFFECTS` 64→94, `NEW_IDS`에 30개 추가 |
| MODIFY | `scripts/verify-snippets.mjs` | `EXPECTED_EFFECTS` 갱신, JS_REQUIRED 재분류 |
| MODIFY | `scripts/image-quality-lib.mjs` | 211 고정 inventory를 legacy 슬롯 집합(id 스냅샷)으로 전환 — 신규 30개는 immutable baseline 비대상 allowlist (010 Canonical Registry) |
| MODIFY | `scripts/verify-image-quality.mjs` | manifest 211행 고정 → legacy 211 + 신규 30 구분 검증. baseline runtime 비교(현행 113/125행 부근)도 기존 64 Effects id 집합만 immutable subset으로 비교하고, 신규 30개는 별도 additive 계약(경로/해시/치수/쌍 존재)으로 완전 검증. 또한 126-146행의 audit CSV/JSONL append 검증을 분리: baseline 이후 행 = (승인된 legacy 교체 행) + (신규 카탈로그 추가 행 — `kind=catalog-addition` 마커로 구분)이 되도록 두 append 클래스를 각각 계수 |
| MODIFY | `assets/data/image-pairs-manifest.json` | +30쌍(thumbs 파이프라인이 원자 갱신) |
| MODIFY | AGENTS.md/README/structure sot 마커 | `npm run sot:sync`로 64→94 반영 |
| MODIFY | `devlog/_fin/260715_production_upgrade/031_effect_guide_audit.csv`, `032_effect_guide_manifest.jsonl` | 신규 guide 감사/provenance 행(010에서 이전된 경로 기준) |

## IN / OUT

- IN: 위 파일 변경 맵 전부 — 6 family +30 이펙트의 데이터/문서/스니펫/demo/이미지/검증 계약.
- OUT: Interface Pattern 46개, 기존 18개 비주얼 이펙트 수정, 신규 카탈로그 페이지, nav 변경.

## 확정 목록 (family별 +5)

- **Scroll & Parallax**: `sticky-section-reveal`, `scroll-snap-carousel`, `scroll-zoom-hero`,
  `parallax-depth-cards`, `scroll-linked-progress-sections`
- **Text Motion**: `typewriter-caret`, `word-rotate-swap`, `gradient-text-sweep`,
  `glitch-text-flicker`, `marquee-text-loop`
- **Hero & Background**: `svg-wave-divider`, `gradient-morph-blob`, `dot-grid-pulse`,
  `floating-particles-field`, `video-scrim-hero`
- **Cursor & Pointer**: `spotlight-follow`, `hover-ripple-feedback`, `pointer-glow-border`,
  `drag-affordance-cursor`, `lens-zoom-hover`
- **View Transition**: `flip-card-reveal`, `accordion-morph-expand`, `list-reorder-flip`,
  `page-turn-transition`, `hero-expand-navigation`
- **Micro-interaction**: `toggle-switch-morph`, `confetti-success-burst`, `shake-validation-error`,
  `progress-ring-completion`, `long-press-context-reveal`

각 id는 기존 64개 id와 충돌하지 않음을 B 시작 시 재검증한다.

## 각 이펙트당 필요 산출물

- `effects.json` 엔트리
  (필수 필드: id/name/nameKr/family/category/priority/summary/alsoCalled/bestFor/avoidWhen/
  implementation/accessibility/performance/demo{type=id,label}/guide{file,alt,prompt})
- `effects-docs.json` 문서 엔트리
  (background/history/useWhen/examples — 기존 한국어 톤 유지)
- `src/effects-demos.ts` registry 등록 + CSS demo
  (12개 seed 애니메이션 재사용 금지 — 전용 keyframe/구성)
- `assets/images/effects/{id}/guide.png` (1536×1024)
  (ima2: `ima2 ping` 선행 → `ima2 gen --stdin -q high -s 1536x1024 -o <target> --json --timeout 300`,
  기존 guide prompt 패턴("instructional UI reference plate", 3-panel 구성)을 따름, 병렬 배치)
- `assets/images/thumbs/effects/{id}/guide.webp`
- snippets (HTML/CSS/JS)

## 감사 기록

- `031_effect_guide_audit.csv`에 30행, `032_effect_guide_manifest.jsonl`에 프롬프트/명령/해시 행
- `npm run images:audit` 통과
- `npm run verify:image-quality`가 신규 슬롯을 다루는 방식 확인: baseline은 immutable이므로
  신규 이미지가 감사 대상 211개 밖에서 실패를 유발하면 검증기 확장(허용 목록)도 이 사이클 범위

## 완료 기준

- 총 Effects 94개, `npm run verify` 통과(EXPECTED 94, sot 마커 동기화)
- 모든 새 이펙트에 작동하는 CSS demo + guide 이미지
  (활성화 시나리오: 브라우저에서 신규 30 카드 각 demo 동작을 스크린샷 표본으로 관찰,
  prefers-reduced-motion 활성 시 demo 정지 확인)
- 데스크탑/모바일 브라우저 QA 통과
  (1440/390 두 뷰포트에서 카드 94개, horizontal overflow 없음, console error 없음)
