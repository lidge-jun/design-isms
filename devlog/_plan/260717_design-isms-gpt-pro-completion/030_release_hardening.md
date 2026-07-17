# 030 — Release Integrity and Public Staging

Normative detailed contract: `devlog/260715_production_upgrade/080_phase7_final_qa_deploy.md`.

## Diff

- MODIFY `.gitignore`, `package.json`, optional package metadata, `index.html`, `effects.html`,
  `faq.html`, `src/app.ts` plus rebuilt `assets/js/app.js`, README/AGENTS/structure,
  `.github/workflows/deploy.yml`, `scripts/generate-thumbnails.mjs`.
- NEW `scripts/{sync-sot,verify-content,verify-assets,verify-generated,verify-line-limits,stage-pages,serve-static}.mjs`.
- NEW `assets/data/image-pairs-manifest.json` with 211 source/preview SHA-256 records.
- NEW `.github/workflows/ci.yml`.
- NO Playwright/Python requirements, runtime rewrites, placeholders, data replacement, deploy.

Before: deploy uploads `.`, Effects metadata says 46, the guide fallback still says
`Guide coming soon`, and no all-source parity/asset/stage gate.
After: bounded SoT markers, current metadata, non-emitting generated parity before other checks,
all 211 image pairs, line/hygiene checks, allowlisted `.pages/` with sorted SHA manifest, CI
static gate, deploy upload path `.pages`. This phase runs after 020 removes the content violations.

## Fixture seams and acceptance

Every validator accepts `--root <fixture-root>`; stage accepts `--root` and `--out`. Temp
fixtures trigger stale JS, stale metadata, missing asset, symlink/unsafe-dotfile rejection;
ignored `.DS_Store` metadata is skipped rather than copied; live hashes
never change. SoT markers have exact one-pair cardinality, are validated before atomic writes,
and preserve hashes outside marked spans. Asset freshness is proved by a 211-pair source/preview
SHA manifest plus an independent source-resize/preview sRGB MAE ≤18 check maintained by the
thumbnail generator, never mtimes or encoder-version byte assumptions. Stage validates `--out` before any
removal and rejects root/source intersections and symlinked path components. Local server proves
loopback-only GET/HEAD, raw/encoded/double-encoded/separator/backslash traversal 404, malformed
encoding 400, POST 405 with `Allow`, and HEAD without a body. `npm run verify` is non-emitting and
exits 0, `npm run pages:stage` reports 3 HTML/211 PNG/211 WebP/0 forbidden, and `git diff --check`
passes. Stage contains no source/dev/VCS path.
