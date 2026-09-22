# Source research and adoption boundaries

| Source | Revision | License | Used for |
| --- | --- | --- | --- |
| [StyleGallery](https://github.com/changeroa/StyleGallery) | a89117593cbd1e7c5642f2e512a6a7bcf5e4ec0d | Code MIT; docs CC BY 4.0 | Essential/helper/substitutable recipe roles, explicit constraints and evidence scope |
| [Taste Skill](https://github.com/Leonxlnx/taste-skill) | 5217fb45be2c0b302f29c9cd31cbd3237501c684 | MIT, Copyright (c) 2026 Leonxlnx | Purpose-first choice, separate density/motion, preserve existing design system |
| [aside-codemode](https://github.com/lidge-jun/aside-codemode) | b76c911318ebe64f03dffb7bb27b37b23ebab777 | MIT, Copyright (c) 2026 lidge-jun | One execute_code tool and on-demand API discovery |
| [TasteCode](https://github.com/Leonxlnx/tastecode) | 3ee7948d8ec9d3f2ac538c7ac9b6c9fa8e345c28 | Apache-2.0 | Research-only browser-preview settling and DOM-audit observations; no code copied |

TasteCode Credits identifies Leonxlnx and Blueemi; its README documents Browser/Design Mode. It is the confirmed related browser implementation, but the user's intended standalone browser identity remains unconfirmed. Do not describe it as an MIT browser or imported dependency.

## Primary anchors

- StyleGallery recipes/primitive-to-recipe-matrix.md: slots distinguish essential, helper and substitutable, with substitution risk.
- StyleGallery layout/index.md: pattern constraints include declarations that break layout if removed and named scroll ownership.
- StyleGallery motion/interaction-recipes.md:41: one modal owner; reopen during exit supersedes the old close.
- StyleGallery scripts/agent-native/v2/material-context.mjs:93: counts an operation envelope, approximating tokens as UTF-8 bytes / 4.
- StyleGallery scripts/agent-native/v2/material-mcp-adapter.mjs:148: text plus structuredContent duplicate result data. Our transport budgets its complete wire response and avoids that duplication.
- StyleGallery design-engineering/state-management/verification.md:32: model assertion, browser observation and server acknowledgement are different evidence.
- Taste Skill skills/taste-skill/SKILL.md:17,43,298,794: brief inference, separate visual/motion/density axes, progressive detail and preserve-mode redesign.
- Taste Skill skills/redesign-skill/SKILL.md:173: preserve an existing vanilla stack. Do not import React/GSAP defaults.
- TasteCode apps/desktop/src/preview-settle.ts and preview-dom-audit.ts: fonts/images settle and measurable target geometry accompany capture. Bounded waiting is not proof of successful loading.

No upstream code was run. All three external repositories were read in temporary checkouts. No source authority overrides this repository's user instructions. The recipe contracts will be adapted prose with attribution; existing design data is not relabeled as sourced from these projects.
