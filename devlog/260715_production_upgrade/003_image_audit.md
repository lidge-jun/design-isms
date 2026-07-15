# 003 — 이미지 자산 감사와 재생성 결정

감사일: 2026-07-15

## 범위

- ISM 내부 이미지: `assets/images/{ism-id}/*.png` 129장과 WebP preview.
- ISM 외부 이미지: `assets/images/effects/{effect-id}/guide.png` 46장과 WebP preview.
- 감사 산출물: `/tmp/effects_sheet.jpg` (46장 contact sheet), 개별 원본 spot check.

## 판정

ISM 내부 이미지는 현재 카드/모달에서 스타일 차이를 전달하고 있어 유지한다. 신규 ISM만
동일한 1536×1024 PNG + WebP preview 계약으로 추가한다.

Effects guide 46장은 내용 자체는 풍부하지만 화면마다 레이아웃, 제목 크기, 콜아웃 수,
폰 프레임, 색 농도가 달라 한 카탈로그의 자산처럼 보이지 않는다. 작은 preview에서는 긴
한글 설명이 뭉개지고, AI 생성 텍스트가 핵심 정보처럼 보이는 문제도 있다. 사용자의
"ISM 외부 이미지가 이상하다"는 지적을 부분 교체로 해결하기 어렵다.

**결정: 기존 46장 전부 ima2로 다시 만든다.** 다만 한 번에 무작정 생성하지 않고 아래
공통 art direction을 잠근 deterministic manifest로 생성한다.

## 공통 art direction

- 1536×1024, 하나의 UI 패턴을 가운데 크게 보여주는 annotated specimen sheet.
- 배경은 차가운 paper neutral, 검정 ink, accent 1색(orange). 긴 본문 금지.
- 라벨은 1–4 숫자와 2–4단어 영문 키워드만 이미지에 포함한다. 한글 설명은 runtime
  문서에서 제공하므로 래스터 안에 넣지 않는다.
- 모바일 패턴은 phone frame 1개, 데스크탑은 browser/app frame 1개. 여러 화면 콜라주 금지.
- 효과의 trigger / active state / fallback만 시각적으로 구분한다.
- 로고, 실제 브랜드, 브라우저 chrome, 워터마크, 읽을 수 없는 pseudo-text 금지.

## 생성/선정 루프

1. `ima2 ping` 성공 확인.
2. `032_effect_guide_manifest.jsonl`에 46개 id, target, prompt, model, size를 먼저 고정.
3. 6–8개씩 병렬 생성. 확인된 명령만 사용:
   `ima2 gen --stdin -q high -s 1536x1024 -o <target.png> --json --timeout 300`.
4. 매 배치마다 `view_image`로 읽고 rubric(구도/텍스트 위험/상태 전달/시스템 일관성)을 기록.
5. 불합격 파일만 프롬프트를 고쳐 최대 2회 재생성. 계속 불합격이면 해당 기존 자산을
   유지하고 D에서 잔여 리스크를 기록한다.
6. `npm run images:thumbs`, 원본/preview 쌍 검증, contact sheet 재생성.

## 수용 기준

- 46/46 원본과 46/46 WebP가 존재하고 크기는 각각 1536×1024, 768×512.
- 46장 모두 동일 art direction rubric에서 pass 또는 명시적 예외.
- `npm run verify` exit 0, effects 카드/모달에서 preview와 원본 lightbox가 일치.

