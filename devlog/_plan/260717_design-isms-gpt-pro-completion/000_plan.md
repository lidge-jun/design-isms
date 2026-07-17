# 000 — GPT Pro Completion Reconciliation Plan

## Objective and evidence

Recover the final GPT Pro artifacts from web-ai session `01KXNJZ0G94PQJME5DVFT7FMX7`,
adopt only changes that improve the live `769fa78` repository, preserve existing 020–070 work
and user-owned modal fixes, selectively improve weak imagery, and finish with static and browser
proof. Artifact evidence is in `001_artifact_provenance.md`; detailed repository contracts remain
in `devlog/260715_production_upgrade/`.

## Loop specification

- Archetype: verifier-defined repair, then judged image selection.
- Trigger: GPT completion ZIP arrived; live repo still lacks Phase 080 release gates and contains
  evidenced runtime residuals.
- Goal: release-safe, visually reviewed, recoverable, keyboard-usable final checkout.
- Non-goals: standalone scaffold replacement, SVG placeholder assets, new framework/dependency,
  catalog count changes, public backlog, commit, push, dispatch, deployment.
- Verifier: per-phase commands and activation scenarios in 020–050; final `npm run verify`,
  image audit, `.pages` inspection, six-width browser matrix.
- Stop: all goalplan criteria have captured evidence and final C→D closes to IDLE.
- Escalation: two identical failures enter RCA; dependency/risk expansion is `NEEDS_HUMAN`.
- Bounds: local repo and `/tmp`; existing npm tools, ima2, enabled browser; user-approved
  unlimited image generation with per-slot rubric-pass stop and bounded worker concurrency;
  no remote write.

## Work-phase map

| WP | Doc | Outcome | Depends on |
| --- | --- | --- | --- |
| `wp000-roadmap-lock` | `010_roadmap_lock.md` | docs-only provenance and audited roadmap | — |
| `wp100-ui-residuals` | `020_ui_residuals.md` | retry/error and semantic interaction repair | 010 |
| `wp080-release-hardening` | `030_release_hardening.md` | static release gates and public staging | 020 |
| `wp090-image-quality` | `040_image_quality.md` | 211-slot audit and targeted GPT Image 2 generation | 030 |
| `wp110-final-qa` | `050_final_qa.md` | full static/render/preservation evidence | 030, 040 |

One row equals one full PABCD cycle. The 010 docs-only D locks this map before implementation.

## Global invariants

- 49 ISMs, 64 Effects, 18 FAQ, 211 PNG originals, 211 WebP previews.
- `src/*.ts` is source; matching `assets/js/*.js` is committed browser output.
- Classic-script order and three-page six-axis navigation remain.
- `AppDialogA11y` remains the only modal scroll-lock owner.
- New files stay below 500 lines; `src/app.ts <= 1050`.
- No commit/push/deploy without a same-turn user request.

## Acceptance criteria map

Provenance → 001; UI/runtime and invariants → 020; release → 030; image provenance → 040;
full verify/browser/preservation → 050. The host goalplan is the status ledger; these docs are
the diff-level implementation source.
