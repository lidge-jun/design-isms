# 000 — Design Encyclopedia Upgrade

## 인터뷰 결과 요약

| 결정 사항 | 선택 |
| --- | --- |
| 확장 범위 | 새 페이지 포함, 작은 것→큰 것 순차 로드맵 |
| 작업 단위 | Phase별 HITL 확인 |
| 새 페이지 UX | Effects와 동일한 카드+모달+검색+필터 패턴 재사용 |
| 내비게이션 | "Catalog ▾" 드롭다운 그룹 |
| 카드 단위 | 실무 레시피 — Color=팔레트세트, Typography=폰트페어링, Layout=섹션패턴, Motion=전환레시피 |

## 현재 상태 (baseline)

| 축 | 수량 | 상태 |
| --- | ---: | --- |
| ISMs (디자인 사조) | 49 | 충분 |
| Interface Pattern | 46 | 충분 |
| Scroll & Parallax | 3 | 부족 → ~10 |
| Text Motion | 3 | 부족 → ~10 |
| Hero & Background | 3 | 부족 → ~10 |
| Cursor & Pointer | 3 | 부족 → ~8 |
| View Transition | 3 | 부족 → ~10 |
| Micro-interaction | 3 | 부족 → ~10 |
| Color Systems | 0 | 신규 → ~25 |
| Typography Pairings | 0 | 신규 → ~20 |
| Layout Patterns | 0 | 신규 → ~25 |
| Motion Presets | 0 | 신규 → ~20 |

> 2026-07-18 로드맵 잠금(001 사이클): Effects 확장은 family당 +5(총 94개)로 확정.
> 각 Phase doc(010~080)은 diff-level로 승격됨. PABCD 사이클 매핑:
> WP1=이 잠금, WP2=010, WP3=015, WP4=020, WP5=030, WP6=040, WP7=050, WP8=060, WP9=070, WP10=080.

## 로드맵 (의존성 순서)

```
010 Schema & Contract Design ──→ 015 Nav Dropdown & Shared Shell
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                  ▼
              020 Effects        030 Color          040 Typography
              Expansion          Systems            Pairings
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                  ▼
              050 Layout         060 Motion         070 Cross-Catalog
              Patterns           Presets            & ISM Integration
                                                        │
                                                        ▼
                                                   080 Final QA
```

- 실행은 **순차 DAG로 잠금**(2026-07-18 감사 라운드 3): 010 → 015 → 020 → 030 → 040 → 050 → 060 → 070 → 080.
- 병렬 여지는 개념적 독립성일 뿐, manifest 누적 계약(211→241→266→286→311→331)과 sot 마커가 순차 실행을 전제한다.
- 070은 030~060 전부 완료 후, 080은 모든 콘텐츠 완료 후.

## OPEN ASSUMPTIONS (Mind contradiction scan에서 도출)

1. 공유 셸이 모든 도메인에 충분한지는 015 구현 중 검증 필요
2. 에셋 전략(SVG vs PNG vs CSS demo)은 도메인마다 다를 수 있음 — 010에서 확정
3. 크로스링크 ID는 기존 ISM/Effects id 패턴(kebab-case) 확장
4. 이미지 총량 증가에 따른 repo 크기는 lazy loading + WebP 우선으로 대응
5. Effects 확장 시 Finder/snippets/audit 계약 업데이트 필수

## 범위 밖

- 기존 Interface Pattern 46개 수정
- 기존 ISM 49개 구조 변경
- 외부 디자인 시스템 연동 (Figma, Storybook)
- 사용자 계정 / 저장 기능
- 백엔드 서버
