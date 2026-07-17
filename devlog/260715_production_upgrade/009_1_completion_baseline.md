# 009.1 — Completion Baseline Before GPT Pro ZIP Reconciliation

## Purpose

This is the live repository baseline for the completion pass requested on 2026-07-17.
It prevents the new GPT Pro artifact from being treated as source of truth before its
claims are reconciled with the checkout. The canonical implementation unit remains
`devlog/260715_production_upgrade/`.

## Source boundary

- Requested web-ai session: `01KXNJZ0G94PQJME5DVFT7FMX7`.
- The persisted session proves that GPT-5.6 Sol / Pro was selected. Its original saved
  `conversationUrl` lacked a conversation ID, so the first session-based extraction returned
  `code-extract.conversation-id-missing`.
- After the user completed login in the headed 9222 profile, the ChatGPT history entry
  `디자인 시스템 평가` resolved to conversation
  `6a58e12e-c480-83e8-ad71-e2e7a1b4270e`.
- URL-based `agbrowse web-ai code-extract --multi-zip` then recovered seven ZIP artifacts.
  All seven passed `unzip -tq`; the guideline-reconciled artifact matches the assistant's
  displayed SHA-256 `4804d139ff5b255627e693ea4cd3dc211bfcc26075865de8e88c2fc4a1f19e28`.
- Full extraction evidence and the adoption decision live in
  `009_2_gpt_pro_artifact_provenance.md`.
- `/Users/jun/Downloads/result(36).zip` and `/tmp/design-isms-plan-result.zip` are the
  older 2026-07-15 planning export. Both have SHA-256
  `7d3ac04fefbbe6c48276299d9753cef20319e174826a185600c01111eca3cb1a` and the same ten
  `00_plan.md` through `080_final_qa_sot_deploy.md` files. They are not substitutes for
  the requested new completion-audit ZIP.

## Current implementation state

Repository HEAD is `769fa78` on `main`. The production-upgrade implementation history
already contains the following completed slices:

| Commit | Implemented slice |
| --- | --- |
| `0594feb` | Phase 020 atlas shell, six-axis navigation, FAQ data/rendering, dialog a11y |
| `088fadb` | Phase 030 46-guide regeneration, sharp thumbnails, audit/provenance |
| `92a2595` | Phase 040 six ISMs, 49 total, dev-guides SoT, anti-pattern isolation |
| `1a70a94` | Phase 050 18 visual effects, 64 total, filters/interactions/validators |
| `56d00ed` | Phase 060 style-to-code export and 64 effect snippets |
| `841c9e6` | Phase 070 deterministic style finder and prompt packs |
| `0109359`, `769fa78` | Finder dialog and final three-column trigger/grid refinements |

Fresh read-only verification on this baseline:

```text
npm run typecheck        -> exit 0
npm run verify:nav       -> 3 pages, 6 axes, consistent order
npm run verify:isms      -> 49 entries, 49 guides, 147 PNG, 147 WebP, 1 anti-pattern
npm run verify:effects   -> 64 entries, 64 docs, 64 PNG, 64 WebP, 7 families
npm run verify:snippets  -> 64 IDs, 0 unsafe, 0 unscoped
npm run verify:finder    -> 144 combinations, 432 deterministic results, 49 prompt packs
```

Current line-count pressure relevant to later plans:

| File | Lines | Constraint |
| --- | ---: | --- |
| `src/app.ts` | 1,047 | `verify:isms` ceiling 1,050 |
| `src/app-export.ts` | 470 | Existing file; avoid further growth without extraction |
| `src/effects.ts` | 410 | Under the repository's 500-line new-file discipline |
| `assets/css/effects-demos-candidates.css` | 437 | Near the 500-line ceiling |
| `assets/css/effects-demos-patterns.css` | 454 | Near the 500-line ceiling |

## User and parallel-work protection

The worktree is not clean. These user-owned changes implement the effects-modal flicker
repair and must remain intact:

| Path | Existing delta |
| --- | --- |
| `src/effects.ts` | Removes duplicate `body.modal-open` add/remove calls |
| `assets/js/effects.js` | Matching generated-browser delta |
| `assets/css/effects.css` | Removes duplicate `body.modal-open { overflow: hidden; }` |

The shared `AppDialogA11y` scroll lock remains the single owner. This completion pass
must not revert or reimplement that change.

## Confirmed Phase 080 gap

Phase 080 has not landed as an implementation commit. The current checkout has only
`.github/workflows/deploy.yml`; it already runs Node 20, `npm ci`, and `npm run verify`,
but uploads the repository root directly. The following paths named by the existing 080
plan are absent:

```text
.github/workflows/ci.yml
scripts/sync-sot.mjs
scripts/verify-content.mjs
scripts/verify-assets.mjs
scripts/verify-generated.mjs
scripts/verify-line-limits.mjs
scripts/stage-pages.mjs
scripts/serve-static.mjs
playwright.config.ts
tests/site.spec.ts
```

The current task does not pre-authorize a dependency/framework addition, and repository
policy routes ad-hoc browser QA through the enabled browser surfaces. The Phase 080 plan
must therefore be stale-checked after the GPT ZIP is available; no Playwright dependency
will be added merely because the older plan named it.

## Roadmap reconciliation rules

1. Treat Phases 020–070 as implemented baselines, not blank work. Each later cycle first
   checks whether the new ZIP identifies a concrete residual; otherwise the slice closes
   as verified `NOOP` rather than being rebuilt.
2. Keep Phase 080 as the dependency-ordered final hardening slice, but amend its exact path
   manifest after the new ZIP audit is available.
3. Add a numbered subdocument such as `081_*` only when the new ZIP contains a distinct,
   independently verifiable completion slice that does not fit the corrected 080 contract.
4. Generate images only for an evidenced visual-asset gap. Existing 49×3 ISM images and 64
   effect guide pairs already pass their count/pair validators.
5. Preserve 49 ISMs / 64 effects, classic-script order, `src/*.ts` → `assets/js/*.js`, and
   all AGENTS invariants unless a separately audited plan explicitly changes them.

## P-phase exit condition

The retrieval requirements are now satisfied. This docs-only P may advance to A after the
corrected 080/090/100/110 decade documents receive an independent audit and any High or
Critical blockers are folded back into the roadmap.
