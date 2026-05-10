---
created: 2026-05-10
status: implemented
tags: [grok, ima2, prompts, manifest]
---

# Grok Research and ima2 Prompt Manifest

These prompts are the confirmed input text for the next design-isms research and image-generation pass.

## Global Grok Prompt Rules

- Return strict JSON, not prose.
- Prefer official or primary sources.
- Exclude Dribbble, Behance, Pinterest, and wiki-only evidence.
- Include source URLs with every historical or usage claim.
- Keep visual-style candidates inside the ISMS catalog; do not publish a separate reference page.

## Per-Target Prompts

### Editorial Typography

Grok:
```text
Research Editorial Typography for the design-isms catalog. Kind: ISM Candidate. Find primary or high-quality sources before using summaries. Return JSON with: definition, short history, visual traits, web UI interpretation, 5 keywords, add_or_reference decision, risks, and 6-10 real source URLs. Avoid Dribbble, Behance, Pinterest, and wiki-only evidence.
```

ima2:
```text
Use case: ui-mockup. Asset type: single production website or app screen mockup. Primary request: Editorial Typography. Context: 큰 제목, 본문 리듬, 여백, 컬럼 구조로 콘텐츠의 목소리를 만드는 타이포그래피 중심 스타일. Render one finished production website or app screen, full-bleed as if captured from the product itself. Do not make a style guide, canvas board, moodboard, poster sheet, or multiple labeled variants. Show the style through real navigation, content sections, cards, controls, product/data surfaces, and responsive UI structure. No explanatory side labels, no outside annotations, no browser chrome, no real logos, no people, no watermark.
```

### Variable Typography

Grok:
```text
Research Variable Typography for the design-isms catalog. Kind: ISM Candidate. Find primary or high-quality sources before using summaries. Return JSON with: definition, short history, visual traits, web UI interpretation, 5 keywords, add_or_reference decision, risks, and 6-10 real source URLs. Avoid Dribbble, Behance, Pinterest, and wiki-only evidence.
```

ima2:
```text
Use case: ui-mockup. Asset type: single production website or app screen mockup. Primary request: Variable Typography. Context: variable font 축과 responsive type scale을 활용해 화면 크기와 상태에 따라 글자의 표정이 변하는 웹 타이포그래피. Render one finished production website or app screen, full-bleed as if captured from the product itself. Do not make a style guide, canvas board, moodboard, poster sheet, or multiple labeled variants. Show the style through real navigation, content sections, cards, controls, product/data surfaces, and responsive UI structure. No explanatory side labels, no outside annotations, no browser chrome, no real logos, no people, no watermark.
```

### Monospace / Terminal UI

Grok:
```text
Research Monospace / Terminal UI for the design-isms catalog. Kind: ISM Candidate. Find primary or high-quality sources before using summaries. Return JSON with: definition, short history, visual traits, web UI interpretation, 5 keywords, add_or_reference decision, risks, and 6-10 real source URLs. Avoid Dribbble, Behance, Pinterest, and wiki-only evidence.
```

ima2:
```text
Use case: ui-mockup. Asset type: single production website or app screen mockup. Primary request: Monospace / Terminal UI. Context: 개발자 도구, AI 콘솔, 로그 뷰어처럼 고정폭 글꼴과 명령형 인터페이스 감각을 전면에 둔 디지털 스타일. Render one finished production website or app screen, full-bleed as if captured from the product itself. Do not make a style guide, canvas board, moodboard, poster sheet, or multiple labeled variants. Show the style through real navigation, content sections, cards, controls, product/data surfaces, and responsive UI structure. No explanatory side labels, no outside annotations, no browser chrome, no real logos, no people, no watermark.
```

### Pixel Art UI

Grok:
```text
Research Pixel Art UI for the design-isms catalog. Kind: ISM Candidate. Find primary or high-quality sources before using summaries. Return JSON with: definition, short history, visual traits, web UI interpretation, 5 keywords, add_or_reference decision, risks, and 6-10 real source URLs. Avoid Dribbble, Behance, Pinterest, and wiki-only evidence.
```

ima2:
```text
Use case: ui-mockup. Asset type: single production website or app screen mockup. Primary request: Pixel Art UI. Context: 8비트/16비트 픽셀 그래픽, 계단식 테두리, 제한된 팔레트로 게임과 레트로 디지털 감각을 전면에 두는 웹 UI 스타일. Render one finished production website or app screen, full-bleed as if captured from the product itself. Do not make a style guide, canvas board, moodboard, poster sheet, or multiple labeled variants. Show the style through real navigation, content sections, cards, controls, product/data surfaces, and responsive UI structure. No explanatory side labels, no outside annotations, no browser chrome, no real logos, no people, no watermark.
```

### De Stijl

Grok:
```text
Research De Stijl for the design-isms catalog. Kind: ISM Candidate. Find primary or high-quality sources before using summaries. Return JSON with: definition, short history, visual traits, web UI interpretation, 5 keywords, add_or_reference decision, risks, and 6-10 real source URLs. Avoid Dribbble, Behance, Pinterest, and wiki-only evidence.
```

ima2:
```text
Use case: ui-mockup. Asset type: single production website or app screen mockup. Primary request: De Stijl. Context: 수직/수평 격자, 원색 블록, 기하학적 축약으로 화면 구조를 강하게 드러내는 스타일. Render one finished production website or app screen, full-bleed as if captured from the product itself. Do not make a style guide, canvas board, moodboard, poster sheet, or multiple labeled variants. Show the style through real navigation, content sections, cards, controls, product/data surfaces, and responsive UI structure. No explanatory side labels, no outside annotations, no browser chrome, no real logos, no people, no watermark.
```

### Constructivism

Grok:
```text
Research Constructivism for the design-isms catalog. Kind: ISM Candidate. Find primary or high-quality sources before using summaries. Return JSON with: definition, short history, visual traits, web UI interpretation, 5 keywords, add_or_reference decision, risks, and 6-10 real source URLs. Avoid Dribbble, Behance, Pinterest, and wiki-only evidence.
```

ima2:
```text
Use case: ui-mockup. Asset type: single production website or app screen mockup. Primary request: Constructivism. Context: 대각선 구도, 강한 대비, 선언적 타이포그래피로 캠페인/에디토리얼 화면에 긴장을 주는 그래픽 언어. Render one finished production website or app screen, full-bleed as if captured from the product itself. Do not make a style guide, canvas board, moodboard, poster sheet, or multiple labeled variants. Show the style through real navigation, content sections, cards, controls, product/data surfaces, and responsive UI structure. No explanatory side labels, no outside annotations, no browser chrome, no real logos, no people, no watermark.
```

### Isometric 3D UI

Grok:
```text
Research Isometric 3D UI for the design-isms catalog. Kind: ISM Candidate. Find primary or high-quality sources before using summaries. Return JSON with: definition, short history, visual traits, web UI interpretation, 5 keywords, add_or_reference decision, risks, and 6-10 real source URLs. Avoid Dribbble, Behance, Pinterest, and wiki-only evidence.
```

ima2:
```text
Use case: ui-mockup. Asset type: single production website or app screen mockup. Primary request: Isometric 3D UI. Context: 등각 투시, 블록형 공간, 제품/데이터 오브젝트를 깊이감 있게 배치해 복잡한 시스템을 시각적으로 설명하는 UI 스타일. Render one finished production website or app screen, full-bleed as if captured from the product itself. Do not make a style guide, canvas board, moodboard, poster sheet, or multiple labeled variants. Show the style through real navigation, content sections, cards, controls, product/data surfaces, and responsive UI structure. No explanatory side labels, no outside annotations, no browser chrome, no real logos, no people, no watermark.
```

### Pop Art

Grok:
```text
Research Pop Art for the design-isms catalog. Kind: ISM Candidate. Find primary or high-quality sources before using summaries. Return JSON with: definition, short history, visual traits, web UI interpretation, 5 keywords, add_or_reference decision, risks, and 6-10 real source URLs. Avoid Dribbble, Behance, Pinterest, and wiki-only evidence.
```

ima2:
```text
Use case: ui-mockup. Asset type: single production website or app screen mockup. Primary request: Pop Art. Context: 상업 이미지, 만화적 색면, 하프톤과 강한 대비로 제품/프로모션 화면에 에너지를 주는 스타일. Render one finished production website or app screen, full-bleed as if captured from the product itself. Do not make a style guide, canvas board, moodboard, poster sheet, or multiple labeled variants. Show the style through real navigation, content sections, cards, controls, product/data surfaces, and responsive UI structure. No explanatory side labels, no outside annotations, no browser chrome, no real logos, no people, no watermark.
```

## ima2 Job Count

- Total jobs: 24
- ISM candidate jobs: 24
- Reference overview jobs: 0

See `image_jobs.jsonl` for target paths and WebP output paths.
