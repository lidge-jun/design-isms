# 002 — 사이트 실측 감사 (2026-07-15)

측정 환경: 로컬 `python3 -m http.server 8901`, Chrome(브라우저 플러그인),
뷰포트 1440x900 / 390x844. 빌드: `npm run verify` 통과 (tsc exit 0).

## 페이지별 결과

| 페이지 | 1440 | 390 | 콘솔 에러 | overflow |
|--------|------|-----|----------|----------|
| index.html | 정상 | 헤더/필터 겹침 의심 | 0 | scrollW 1425/1440, 375/390 — 없음 |
| effects.html | 정상 (카드 46) | 정상 | 0 | 없음 |
| faq.html | 렌더 정상, 품질 이슈 있음 | 미측정 | 0 | 없음 |
| index#minimalism 모달 | 정상. split-view 가이드 패널(.modal-dev-guide 639px) 렌더 확인 | 미측정 | 0 | — |

증거: /tmp/audit_index_1440.png, /tmp/audit_effects_1440.png, /tmp/audit_faq_1440.png,
/tmp/audit_modal_1440.png, /tmp/audit_index_390.png, /tmp/audit_effects_390.png

## 발견 결함/품질 이슈

1. **[모바일 index] 헤더 칩·검색 인풋 겹침 (defect, wp1)** — 390px에서 `한/EN`
   토글과 `43 isms` 카운트 칩이 필터 바의 검색 인풋 위에 겹쳐 placeholder가 가려짐
   (/tmp/audit_index_390.png). 정적 CSS상 wrap 처리는 있으나(nav.css:47-51, 61-72
   520px 컬럼 스택) 라이브에서 겹침 발생 → wp1 P에서 근본 원인(고정 헤더 높이 vs
   wrap 상호작용) 재현·진단 선행.
2. **[FAQ] 이모지 UI 아이콘 (anti-slop 위반, wp1)** — faq.html:132 `⚡`, :162 `🔥`,
   :192 `🛠` cat-icon. FE-AI-TELL-01 1순위 슬롭 시그널. SVG 아이콘으로 교체.
3. **[FAQ] nav 축 불일치 (defect, wp1)** — faq.html:112-120 nav에 Lang 토글과
   Count가 없음. index/effects는 Isms/Effects/FAQ/GitHub/Lang/Count 6축.
4. **[FAQ] 표기 낡음 (wp1)** — "2024–2025 디자인 트렌드" 섹션 제목이 2026 시점과
   어긋남. 콘텐츠 시의성 재검토.
5. **[전역] 디자인 제네릭성 (wp1 보강)** — 베이지 배경 + 필 칩 + 등폭 카드 그리드.
   현재 anti-slop 기준(FE-CONVERGENCE-01)에서 "LLM 기본값" 텔에 가까움. 디자인
   레퍼런스 사이트라는 정체성에 비해 자체 디자인 시그니처 부재 → 010 Design Read에서
   방향 결정.

## 정상 확인 (falsification 실패 항목)

- 콘솔 에러 0 (전 페이지), horizontal overflow 없음 (1440/390).
- ISM 모달 split-view 가이드 패널 정상 렌더 (직전 커밋 7c172ef 기능).
- effects 카드 46개 + demo 애니메이션 렌더.
- WebP 썸네일 로딩 체계 동작.

## 데이터/코드 표면 (wp 플랜 참조용)

- isms.json 43항목, effects.json 46항목(demo.type==id 불일치 0), effects-docs.json
  46항목, dev-guides.json 43키(layout/typography/color/motion/dos/donts).
- src/app.ts 1342줄(더 키우지 말 것), style.css 992줄. effects.html 스크립트 로드
  순서: effects-demos.js → effects-docs.js → effects.js (non-module).
- 헤더 카운트 정적 하드코딩: index.html:45 `43 isms`, effects.html:49 `46 candidates`.
