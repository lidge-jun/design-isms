---
created: 2026-05-10
status: implemented
tags: [audit, risks, open-questions]
---

# Audit — Navigation, Taxonomy, Effects Docs Expansion

## Plan Status

The plan moved from planning to implementation. Runtime files, data, generated images, WebP previews, and source-of-truth docs were updated in this phase.

## Strong Decisions

- Use WebP preview first for all new runtime image surfaces.
- Keep PNG originals for lightbox/source preservation.
- Run ima2 generation as a full async batch after a deterministic manifest exists.
- Do not overload `effects.json` with long prose; use `effects-docs.json`.
- Keep design-system references separate from ISMS unless they become true visual style entries.
- Update README, AGENTS, structure, and devlog together after implementation.

## Main Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| New nav overflows mobile header | poor UX | verify 390px layout before completion |
| Too many ISM additions dilute quality | weak catalog | start with 8 high-signal additions |
| Design systems treated as visual isms | conceptual confusion | keep them as source links in effects docs only |
| Effects docs make modal too long | reduced scanability | collapsible long sections or grouped hierarchy |
| `src/effects.ts` exceeds 500 lines | violates project rule | split docs helper with namespace pattern |
| Image generation outputs inconsistent files | broken assets | use manifest and count checks |
| WebP missing for some images | heavier runtime or broken preview | `npm run images:thumbs` and file existence checks |
| Research sources are too weak | inaccurate history | prioritize official docs and primary references |

## Resolved Questions

1. Public `References` page was removed after user correction.
2. The first ISM expansion remains an 8-item backlog, not automatic promotion into `isms.json`.
3. Effects docs reuse the existing 46 guide image flow and add prose sections in the modal.
4. Long-form effects docs render as structured modal sections after the core card data.
5. Design-system references received generated neutral overview images.

## Pre-Build Checklist

- [x] User correction resolved that `references.html` should not be public runtime.
- [x] First ISM addition batch is backlog only; no `isms.json` promotion.
- [x] Effects docs use text sections and existing guide images instead of new group diagrams.
- [x] Candidate image manifest is written.
- [x] Research prompt list is complete enough for the first batch.
- [x] File split decision implemented with `src/effects-docs.ts` and `src/references.ts`.

## Employee Review Targets

If Jaw employees are available:

- Frontend: audit nav IA, mobile header risk, modal docs density.
- Docs: audit ISM taxonomy, effects docs schema, source references.

If employee dispatch fails, report the exact failure and proceed only with user approval for local verification.
