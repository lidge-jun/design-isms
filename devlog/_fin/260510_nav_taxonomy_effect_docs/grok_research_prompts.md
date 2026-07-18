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

## Phase 3 — Six Current ISMs (2026-07-15)

### AI Slop

- id: `ai-slop`
- kind: `anti-pattern`
- image prompts:
  - `.tmp/ism-prompts/ai-slop__landing.txt`
  - `.tmp/ism-prompts/ai-slop__saas.txt`
  - `.tmp/ism-prompts/ai-slop__dashboard.txt`

#### landing.png

```text
A generic AI-generated startup landing page for a vague productivity SaaS: centered hero with purple-to-cyan gradient, oversized bold headline making an inflated claim, three identical rounded feature cards with mismatched generic 3D icons, glassmorphic panels floating without purpose, random sparkle decorations, inconsistent button styles and spacing, muddy neutral footer. The screen is an instructional anti-pattern specimen. Make the failure modes specific and readable, not merely ugly: conflicting visual languages, generic purple gradient hero, unrelated 3D icons, inflated claims, inconsistent spacing, and decorative glass cards without hierarchy. Keep text legible so a novice can diagnose the problems. Do not imitate an identifiable product or artist. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```

#### saas.png

```text
A generic AI-generated SaaS marketing page: gradient blob background, equal-width pricing cards with emoji-like icons, testimonial cards with obviously synthetic names, conflicting corner radii, three different shades of purple accent, decorative chart that plots nothing meaningful, inconsistent typography mixing three font families. The screen is an instructional anti-pattern specimen. Make the failure modes specific and readable, not merely ugly: conflicting visual languages, generic purple gradient hero, unrelated 3D icons, inflated claims, inconsistent spacing, and decorative glass cards without hierarchy. Keep text legible so a novice can diagnose the problems. Do not imitate an identifiable product or artist. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```

#### dashboard.png

```text
A generic AI-generated analytics dashboard: dark theme with neon purple-cyan gradient charts that lack axis labels, KPI cards with random icons and fake precision numbers, glass cards over a gradient background reducing contrast, inconsistent paddings, decorative world map with meaningless glowing dots. The screen is an instructional anti-pattern specimen. Make the failure modes specific and readable, not merely ugly: conflicting visual languages, generic purple gradient hero, unrelated 3D icons, inflated claims, inconsistent spacing, and decorative glass cards without hierarchy. Keep text legible so a novice can diagnose the problems. Do not imitate an identifiable product or artist. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```

### Refractive Glass UI

- id: `refractive-glass-ui`
- kind: `style`
- image prompts:
  - `.tmp/ism-prompts/refractive-glass-ui__landing.txt`
  - `.tmp/ism-prompts/refractive-glass-ui__mobile-app.txt`
  - `.tmp/ism-prompts/refractive-glass-ui__dashboard.txt`

#### landing.png

```text
A premium consumer audio product landing page in a refractive liquid-glass design language: a floating translucent navigation pill that visibly bends and magnifies the imagery behind it with specular edge highlights, layered frosted panels with light refraction at the edges, clear/ice neutral palette with one spectral highlight, dark readable ink text on light surfaces, product photo as the stage. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```

#### mobile-app.png

```text
A mobile music player app screen in a refractive liquid-glass design language: translucent playback controls that refract the album art behind them, layered glass sheets with soft specular rims and depth blur, floating tab bar with light-bending edges, clear/ice neutrals with a single spectral accent, crisp readable typography over the material. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```

#### dashboard.png

```text
A weather and home-control dashboard in a refractive liquid-glass design language: translucent widget tiles refracting a soft photographic background, legible dark ink data over frosted layers, specular highlights along panel edges, one spectral gradient accent used sparingly, clear visual hierarchy despite the translucency. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```

### Spatial UI

- id: `spatial-ui`
- kind: `style`
- image prompts:
  - `.tmp/ism-prompts/spatial-ui__landing.txt`
  - `.tmp/ism-prompts/spatial-ui__dashboard.txt`
  - `.tmp/ism-prompts/spatial-ui__portfolio.txt`

#### landing.png

```text
A landing page for a spatial-computing workspace product where the interface itself demonstrates spatial UI: floating translucent app windows arranged at different depths in a softly lit room, nearer panels occluding farther ones with realistic shadows, depth-of-field cues, an anchored control bar in the foreground, deep neutral space palette with one orange action signal. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```

#### dashboard.png

```text
A spatial task dashboard as seen inside a headset: multiple translucent panels anchored at different distances around the viewer, clear occlusion between layers, a near control ornament with eye-target highlights, spatially separated columns for tasks, calendar, and metrics, deep neutral environment with one distance-cue color and one action accent. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```

#### portfolio.png

```text
A designer portfolio site organized as navigable depth layers: project cards floating on separate z-planes receding into a dim studio space, front layer sharp and interactive, rear layers dimmed and blurred by distance, spatial breadcrumb showing current depth, deep neutral palette with a single warm action signal. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```

### Human-crafted Web

- id: `human-crafted-web`
- kind: `style`
- image prompts:
  - `.tmp/ism-prompts/human-crafted-web__landing.txt`
  - `.tmp/ism-prompts/human-crafted-web__shop.txt`
  - `.tmp/ism-prompts/human-crafted-web__portfolio.txt`

#### landing.png

```text
A landing page for an independent print studio that celebrates handmade quality: scanned paper texture background, hand-drawn arrows and underlines, letterpress-style imperfect typography mixed with a readable body font, taped-on photographs of real work, visible process notes in the margin, warm paper and ink palette with one imperfect spot color. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```

#### shop.png

```text
An online shop page for handmade ceramics with a human-crafted web aesthetic: product photos on textured paper cards with hand-written price labels, slightly irregular grid, ink-stamped category marks, marginalia doodles, a hand-drawn cart icon, warm paper tones, one imperfect red-orange spot color, readable product structure. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```

#### portfolio.png

```text
A personal portfolio site with visible maker process: collaged sketchbook pages, taped photos, hand-annotated screenshots of past work, typewriter-style captions with corrections, a hand-drawn navigation ribbon, warm paper and ink palette, one imperfect spot color, personality without sacrificing readability. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```

### Generative Identity

- id: `generative-identity`
- kind: `style`
- image prompts:
  - `.tmp/ism-prompts/generative-identity__agency.txt`
  - `.tmp/ism-prompts/generative-identity__pricing.txt`
  - `.tmp/ism-prompts/generative-identity__portfolio.txt`

#### agency.png

```text
A brand agency website whose identity is visibly rule-based: a modular logo mark shown in several algorithmic variations across the header and project cards, each variation clearly derived from the same geometric rule with different parameters, consistent grid and typography anchoring the variation, stable ink palette plus a generated color range strip. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```

#### pricing.png

```text
A SaaS pricing page for a generative brand platform: three pricing tiers whose card backgrounds each show a parameter variation of the same generative pattern, a visible slider or parameter readout suggesting the rule, consistent typography and spacing while the pattern varies, stable brand anchors with controlled variable color range. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```

#### portfolio.png

```text
A creative-coding studio portfolio where every project thumbnail is a variation of one generative system: same underlying rule rendered with different data inputs, a small caption showing the parameters used, coherent grid and stable typography, brand anchors constant while the generated marks vary. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```

### Technical Blueprint

- id: `technical-blueprint`
- kind: `style`
- image prompts:
  - `.tmp/ism-prompts/technical-blueprint__landing.txt`
  - `.tmp/ism-prompts/technical-blueprint__blog.txt`
  - `.tmp/ism-prompts/technical-blueprint__dashboard.txt`

#### landing.png

```text
A hardware product landing page in a technical blueprint aesthetic: annotated exploded view of the product with dimension lines and measurement callouts, monospaced annotation labels, thin schematic rules on pale technical paper, numbered part references connected by leader lines, one orange status cue, engineering precision as the visual identity. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```

#### blog.png

```text
An engineering blog article page in a technical blueprint aesthetic: schematic diagrams embedded in the article with measured dimension lines, monospaced figure captions and margin annotations, a table of contents drawn like a technical index, pale technical paper background with thin ink rules and one orange highlight for the current section. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```

#### dashboard.png

```text
An operations dashboard in a technical blueprint aesthetic: system architecture diagram with live status annotations, measured gauges with dimension-style tick labels, monospaced data readouts, thin schematic connectors between service nodes, pale technical paper background, ink rules, one orange status cue for alerts. Render one finished production website or app screen, full-bleed as if captured from the product. Do not make a moodboard, poster sheet, style guide, comparison board, or multiple labeled variants. Show real navigation, content, controls, states, and responsive layout. No real logos, browser chrome, people, watermark, meaningless microcopy, or decorative labels outside the product UI. 1536x1024 landscape, crisp legible UI text.
```
