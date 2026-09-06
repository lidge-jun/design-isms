# Glass and motion upgrade

## Goal
Bring the existing catalog up to current primary-source Liquid Glass guidance, make motion recipes easier to understand and reuse, and replace weak reference images after inspection.

## Current signals
- 2026-09-06: clean main equals freshly fetched origin/main, b4d2174.
- Baseline npm run verify passed, including 49 ISMs, 94 effects, 20 motion presets, 331 image pairs and immutable image audit.
- Existing refractive-glass-ui is already the right identity; retain its hash/id and the 49 count.
- AppGuides owns guide content; AppDialogA11y owns focus; CatalogShell owns sister catalog lifecycle. Plain classic browser scripts are built from src.
- Current glass guide recommends filter animation and transparent data widgets; these need correction. The motion implementation and image audit are being independently inspected.

## Loop specification
C3, spec-satisfaction repair with visual candidate selection. Trigger: user requests upstream-based glass/motion/catalog upgrade. Verifier: build, verify, image audit, browser screenshots and activation checks; prose claims require source inspection. Stop: all four registered work phases have fresh evidence. Memory artifact: this unit and bound goalplan. Expected outcome DONE; external blockers recorded honestly while unrelated work continues.
No commit/push/deploy. Existing repo convention overrides skill commit defaults. Existing tools/accounts only, no new subscriptions; 12 image candidates maximum before reassessment; 300 seconds per ima2/Aside job; 90 minutes per implementation cycle. No host token budget. Parallel workers use Astra high with disjoint writes. After two distinct failed delegates main reclaims the slice; new delegation scope is amended at P.

## Dependency-ordered work phases
- wp0: docs-only research, current-state evidence, design direction and complete decade plans.
- wp1 / 010: material semantics and live Liquid Glass implementation guide.
- wp2 / 020: motion demonstrations and guidance on that established material/interaction foundation.
- wp3 / 030: selected raster references aligned to implemented behavior, provenance and integrated QA.

## Source map
assets/data/{isms,dev-guides,motion}.json -> src/{app-guides,app,motion,motion-demos}.ts -> assets/js/*.js.
assets/css/theme-atlas.css owns shell; scoped new material CSS and existing motion CSS own specimens.
README.md, AGENTS.md and structure/README.md will describe resulting capabilities.

## Verification baseline
npm run verify exited 0 (evidence/baseline-verify.log). Its chained scripts read the JSON catalogs, source/glob src/**/*.ts, generated JS, assets and quality ledgers. Prose/visual fidelity are not covered by this command. Serve command is npm run serve -- --root . --port 4180; default root is .pages, so --root is explicit. Browser work uses a newly created task tab. Current tool catalog has native Computer Use methods but no node_repl; requested node_repl-based Computer Use skill cannot bootstrap here. Use available browser tooling for exact viewport inspection and record this limitation unless capability becomes available.

## Out of scope
Publishing, dependency changes, global settings, unrelated catalogs, automatically synchronizing memory stores, and changing invariant counts. The intentionally bad ai-slop specimen stays instructional.
