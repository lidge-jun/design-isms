---
created: 2026-05-10
status: implemented
tags: [isms, taxonomy, typography, references]
---

# Phase 3 — ISM Taxonomy and Reference Backlog

## Goal

현재 35개 ISMS에서 빠진 큰 축을 보완한다. 특히 typography, 널리 알려진 디자인 운동, 현대 product design system reference를 구분해서 추가한다.

## Current ISMS Count

Current data contains 35 entries:

```text
minimalism, bauhaus, flat-design, material-design, art-deco, swiss-style,
brutalism, skeuomorphism, dark-mode, retro-vintage, futurism, memphis-design,
cyberpunk, psychedelic, vaporwave, y2k, maximalism, steampunk, glassmorphism,
neumorphism, corporate-memphis, neo-brutalism, gradient-aurora, bento-grid,
kawaii, japandi, organic-design, kinetic-typography, frutiger-aero,
claymorphism, dopamine-design, anti-design, cottagecore, solarpunk, indie-web
```

## Taxonomy Problem

Some items are true visual movements, some are UI trends, and some are layout patterns. The next expansion should be explicit about category so the board remains useful.

Proposed high-level categories:

| Category | Meaning |
| --- | --- |
| `Movement` | historical design/art/graphic movement |
| `Typography` | type-led visual language |
| `Digital UI` | web/app-native visual trend |
| `Layout` | composition/grid pattern |
| `Cultural Aesthetic` | internet/subculture aesthetic |
| `Design System Reference` | official product/system design reference; may live outside ISMS |

## P0 Additions — Strong Fit for ISMS

| Candidate ID | Name | Category | Why Add |
| --- | --- | --- | --- |
| `editorial-typography` | Editorial Typography | Typography | type scale, headline hierarchy, magazine/web editorial layouts are a major missing axis |
| `variable-typography` | Variable Typography | Typography | modern responsive type expression; useful for web-specific design |
| `monospace-terminal-ui` | Monospace / Terminal UI | Typography/Digital UI | developer tools, AI tools, dashboards, command interfaces |
| `art-nouveau` | Art Nouveau | Movement | historically important, ornamental, organic linework |
| `de-stijl` | De Stijl | Movement | grid, primary colors, geometric reduction |
| `constructivism` | Constructivism | Movement | bold diagonal composition, red/black propaganda graphics |
| `mid-century-modern` | Mid-century Modern | Movement | common brand/web visual reference; warm geometric editorial feel |
| `pop-art` | Pop Art | Movement | bold commercial color, halftone, comic influence |

## P1 Additions — Good Fit, Needs Curation

| Candidate ID | Name | Category | Caveat |
| --- | --- | --- | --- |
| `op-art` | Op Art | Movement | can become eye-straining; needs accessibility warning |
| `grunge` | Grunge | Cultural Aesthetic | useful but overlaps with anti-design/retro |
| `japanese-graphic-design` | Japanese Graphic Design | Movement/Culture | broad label; must avoid flattening many traditions |
| `scandinavian-design` | Scandinavian Design | Movement | overlaps with minimalism/japandi |
| `international-typographic-style` | International Typographic Style | Typography/Movement | overlaps with Swiss Style; maybe use as alias instead |
| `liquid-glass` | Liquid Glass | Digital UI | current/unstable; should be researched before inclusion |

## Design System References — Prefer Separate Reference Catalog

These are important, but not always “isms”. Recommended as `references.json` or `references.html`, not necessarily `isms.json`.

| Reference | Type | Role in Site |
| --- | --- | --- |
| Apple Human Interface Guidelines | platform design guideline | reference card for platform-native UX |
| Material Design 3 | design system | reference card for Android/web component language |
| Microsoft Fluent 2 | design system | reference card for enterprise/product UI |
| IBM Carbon | design system | reference card for enterprise accessibility and data UI |
| Atlassian Design System | design system | reference card for collaboration/product UI |
| Shopify Polaris | commerce/admin design system | reference card for merchant/admin UI patterns |
| WAI-ARIA APG | accessibility pattern reference | effects docs validation source |
| MDN Web Docs | web platform reference | implementation and accessibility reference |

## Candidate Data Template

For each approved ISM:

```json
{
  "id": "editorial-typography",
  "name": "Editorial Typography",
  "nameKr": "에디토리얼 타이포그래피",
  "category": "Typography",
  "tagline": "Hierarchy, rhythm, and voice through type",
  "description": "한국어 2-3문장 설명",
  "history": "역사/맥락 2-3문장",
  "keywords": ["typography", "editorial", "hierarchy", "scale", "layout"],
  "palette": ["#...", "#...", "#...", "#..."],
  "examples": [{ "name": "...", "url": "..." }],
  "images": [
    { "file": "landing.png", "label": "Editorial Landing" },
    { "file": "shop.png", "label": "Commerce Layout" },
    { "file": "dashboard.png", "label": "Content Dashboard" }
  ],
  "prompts": []
}
```

## Research Method

For every candidate:

1. Confirm the term is widely used enough.
2. Separate historical movement from modern web interpretation.
3. Find 10 live site examples when adding to ISMS.
4. Avoid Dribbble, Behance, Pinterest, wiki-only examples.
5. Write prompts after visual traits are confirmed.
6. Generate images only after the candidate ID and image filenames are final.

## Add/Skip Decision Rules

Add to `isms.json` when:

- It has a distinct visual language.
- It can produce 3 different useful UI mockups.
- It has enough real web examples.
- It does not duplicate an existing ISM.

Put in `references.json` when:

- It is an official product/platform design system.
- It is primarily a component/pattern documentation source.
- It should be cited as a reference but not treated as a visual style.

Skip or postpone when:

- The label is too broad or culturally risky.
- The style is a temporary trend with unclear definition.
- It would be better represented as a keyword alias.

## Recommended First Batch

Start with 8 ISM additions and 8 reference cards:

ISM additions:

1. Editorial Typography
2. Variable Typography
3. Monospace / Terminal UI
4. Art Nouveau
5. De Stijl
6. Constructivism
7. Mid-century Modern
8. Pop Art

Reference cards:

1. Apple HIG
2. Material Design 3
3. Fluent 2
4. Carbon
5. Atlassian Design System
6. Shopify Polaris
7. WAI-ARIA APG
8. MDN Web Docs

This gives a meaningful expansion without turning the first implementation into a vague encyclopedia.
