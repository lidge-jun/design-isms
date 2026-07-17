# 080 — Release Integrity and Public Pages Staging

## Loop specification

- Archetype: repair and hardening
- Trigger: Phases 020–070 and the completion-pass runtime residual phase are implemented, but
  the release surface still lacks parity, content/asset/hygiene, and public-artifact gates.
- Goal: make `npm run verify` prove the committed static runtime and make GitHub Pages upload
  an allowlisted `.pages/` tree instead of the repository root.
- Non-goals: no visual redesign, catalog replacement, image generation, Playwright/Python
  dependency, commit, push, workflow dispatch, or deployment.
- Verifier: focused script activation checks, `npm run verify`, `npm run pages:stage`,
  `git diff --check`, and inspection of `.pages/manifest.json`.
- Stop: all new gates pass with current 49/64/18/422 contracts and `.pages/` contains no source,
  devlog, tests, dependencies, or VCS metadata.
- Memory: this document, `009_2_gpt_pro_artifact_provenance.md`, goalplan ledger.
- Escalation: two identical validator failures enter root-cause mode; a dependency need or a
  proposed weakening of current invariants is `NEEDS_HUMAN`.
- HOTL bounds: local repo and `/tmp` writes only; existing npm dependencies only; one PABCD
  cycle; no remote state change.

## Stale-check findings

The old 080 plan incorrectly said the current deploy workflow lacked Node/npm verification.
The live workflow already uses Node 20, `npm ci`, and `npm run verify`; its real gap is
`upload-pages-artifact path: '.'`. GPT's overlay correctly identifies the missing hardening
class, but its runtime rewrites, SVG placeholders, and Python Playwright harness are rejected.

Current release gaps:

```text
.github/workflows/ci.yml                 absent
scripts/sync-sot.mjs                     absent
scripts/verify-content.mjs               absent
scripts/verify-assets.mjs                absent
scripts/verify-generated.mjs             absent
scripts/verify-line-limits.mjs           absent
scripts/stage-pages.mjs                  absent
scripts/serve-static.mjs                 absent
effects.html OG/Twitter count            stale at 46
.github/workflows/deploy.yml upload path  repository root
```

## Scope boundary

IN: release scripts, package scripts, count markers/metadata, ignored stage output, CI workflow,
and Pages staging path. OUT: browser test framework, runtime feature code, image content,
catalog JSON replacement, generated prompt registry, vendored TypeScript, `dist/`, deployment.
This phase depends on `100_phase9_ui_residuals.md`; the new content gate therefore starts from a
tree where inline `onerror` and `generating...` have already been removed.

## Diff-level path manifest

| Marker | Exact path | Before → after |
| --- | --- | --- |
| MODIFY | `.gitignore` | only `node_modules`, `.tmp`, `.DS_Store` → also ignore `.pages/`, QA captures, coverage, swap/backup files |
| NEW | `scripts/sync-sot.mjs` | no bounded count checker → derive 49/64/18 from JSON; require exactly one non-nested start/end pair per marker, reject malformed layouts before mutation, and make atomic `--write` changes only inside `data-sot-*` regions while proving outside-region hashes unchanged |
| NEW | `scripts/verify-content.mjs` | validators are separate → `--root <fixture-root>` capable cross-file checks for FAQ parity, metadata counts, local references, forbidden placeholder prose/inline handlers |
| NEW | `scripts/verify-assets.mjs` | effect audit only → `--root <fixture-root>` capable check of all 147 ISM and 64 Effect PNG/WebP pairs, dimensions, exact source/preview hashes against the 211-row provenance manifest, safe paths, and scoped orphan scan; never use mtimes as freshness evidence |
| MODIFY | `scripts/generate-thumbnails.mjs` | mtime freshness only → compare current PNG/preview hashes with the manifest, regenerate when source or preview hash drifts, and atomically rewrite the complete sorted manifest after success |
| NEW | `assets/data/image-pairs-manifest.json` | no all-pair provenance → sorted 211 records with relative PNG/WebP paths, source SHA-256, preview SHA-256, dimensions, manifest schema, and future thumbnail contract; it does not falsely claim which historical encoder produced an existing preview |
| NEW | `scripts/verify-generated.mjs` | no committed-output parity → accept `--root <fixture-root>`, compile every fixture `src/*.ts` with the installed compiler to OS temp, byte-compare expected `assets/js/*.js`, always clean temp |
| NEW | `scripts/verify-line-limits.mjs` | limits are prose/partial script checks → governed path table: all `src/*.ts`, `scripts/*.mjs`, `assets/css/*.css` <=500 except explicit existing owners `src/app.ts` 1050, `src/effects.ts` 450, `assets/css/style.css` 1000; tracked hygiene |
| NEW | `scripts/stage-pages.mjs` | Pages receives entire repo → accept `--root <source-root> --out <stage-dir>`; before deletion reject output equal/ancestor/descendant intersection with allowlisted source and every symlinked component; then recreate stage, copy public allowlist, skip ignored `.DS_Store`, reject symlinks/other unsafe dotfiles and names, write deterministic hashes to `manifest.json` |
| NEW | `scripts/serve-static.mjs` | no local HTTP harness → loopback-bound GET/HEAD-only server that validates the raw request target before URL normalization, safely decodes and enforces canonical containment, returns MIME/404/405/400, emits `Allow: GET, HEAD`, omits HEAD bodies, and closes gracefully |
| MODIFY | `package.json` | seven existing verify scripts → add `sot:check`, `sot:sync`, four release validators, `pages:stage`, `serve`; `verify:generated` runs before all other non-emitting checks and `verify` no longer runs emitting `build` |
| MODIFY | `package-lock.json` | package metadata only if npm updates it; dependency graph must remain byte-equivalent |
| MODIFY | `index.html`, `effects.html`, `faq.html` | unmarked count text and stale 46 metadata → bounded SoT markers and current 49/64/18 metadata only |
| MODIFY | `src/app.ts`, `assets/js/app.js` | `Guide coming soon` placeholder fallback → explicit unavailable-state copy; rebuild committed browser output before parity checks |
| MODIFY | `README.md`, `AGENTS.md`, `structure/README.md` | current runtime docs → add release owners, `.pages/` boundary, and commands; no generated-output claims before proof |
| NEW | `.github/workflows/ci.yml` | no PR gate → Node 20, `npm ci`, `npm run verify`, `npm run pages:stage`; least-privilege contents read |
| MODIFY | `.github/workflows/deploy.yml` | verify then upload `.` → verify, stage, upload `.pages`; retain trigger, environment, permissions, deploy step |

No `playwright.config.ts`, `tests/site.spec.ts`, `requirements-dev.txt`, Python harness,
`asset-mode.json`, SVG placeholders, or replacement runtime files are created.

## Script contracts

### Source-of-truth

Markers are explicit and bounded. Each named marker must have exactly one start and one end,
in order, with no duplicate, nesting, overlap, or unbalanced token. Validate every target before
any write. `--write` builds all outputs in memory, proves the before/after text outside marked
spans is byte-identical, writes sibling temporary files, then atomically renames them. A transient
transaction journal records `prepared` versus `committed`: startup completely rolls back the
former and only cleans up backups for the latter, so termination during backup cleanup cannot mix
old and new files. Any ordinary error leaves every target untouched. `--write` may edit only marked count/metadata values in the three
HTML files and bounded count blocks added to README/AGENTS/structure. Dated devlogs are immutable.
The check derives values from `isms.json`, `effects.json`, and flattened FAQ items; it never
contains 49/64/18 as replacement constants. Fixtures cover duplicate, nested, reversed,
unbalanced, and stale-but-valid markers plus outside-span before/after hashes.

### Content

Reuse the existing focused validators rather than duplicating their full schemas. Add only
cross-owner assertions: 18 FAQ items, current metadata/counts, all local runtime references
resolve, classic-script order remains valid, no authored inline `on*=` handlers, no
`javascript:`, and no `generating...`, `coming soon`, `TODO`, `TBD`, or lorem in shipped UI/data.
Phase 100 removed the inline image fallback and `generating...`; this phase also replaces the
one residual `Guide coming soon` fallback before enabling the new content gate.

### Assets

Derive expected files from `isms[].images[]` and `effects[].guide.file`. Verify PNG
1536×1024, WebP 768×512, parseability, non-animation, lowercase safe paths, and duplicate
original hashes. For freshness, require exactly one sorted manifest record per expected pair and
match both current PNG and WebP SHA-256 plus dimensions; reject missing/extra/duplicate records.
Independently resize the PNG to 768×512 and compare decoded sRGB pixels to the WebP; mean absolute
error must be ≤18, so a self-edited manifest cannot bless an unrelated preview while historical
encoder differences remain valid.
The thumbnail generator uses the same source-hash mapping to decide regeneration and atomically
rewrites the manifest only after all outputs succeed. Record the manifest-tool version and the
production 768×512 cover/centre, WebP quality 72, effort 6, smartSubsample contract for future
regeneration, but do not attribute a current tool version to historical preview bytes or demand
byte identity across different historical encoder versions. Do not inspect
mtimes. Orphan detection is scoped to the 49 ISM directories,
`assets/images/effects`, and matching thumb mirrors; shared icons are not raster orphans.
After the audited initial migration, a missing manifest is a hard failure; an explicit
`--bootstrap-manifest` is one-time only and refuses to overwrite an existing manifest.

### Generated output

Use the installed TypeScript binary and the selected root's real `tsconfig.json`, overriding only
`outDir`. `npm run verify` begins with `typecheck` then `verify:generated` and never emits files;
`npm run build` remains the explicit authoring command developers run before verification.
Compare the complete basename set and bytes. Missing source output, extra committed generated
output, or stale bytes fail. Temporary output lives under OS temp, not the worktree.

### Public stage

Allowlist: three HTML files, `favicon.svg`, optional `robots.txt`/`sitemap.xml`/`CNAME`, and
`assets/{css,data,icons,images,js}`. Before removing output, resolve existing path components and
reject output equal to root, ancestral to root, inside any allowlisted source, or reached through
a symlinked output/parent component. Inside the repository, only the canonical `.pages` path is
allowed; filesystem `dev+ino` identity catches case-insensitive aliases before deletion. Optional
public files are copied only when they are regular non-symlink files. Add `.nojekyll` and a sorted manifest containing path,
bytes, SHA-256. Assert exactly 3 HTML, 211 PNG, 211 WebP, and no forbidden top-level source.

## Conditional-path activation matrix

| Path | Trigger | Observable proof |
| --- | --- | --- |
| stale JS | copy minimum source/config/generated fixture to `/tmp`, alter only fixture JS, run `verify-generated --root` | exact stale fixture path, nonzero; live worktree hashes unchanged |
| stale metadata | copy minimum HTML/data fixture to `/tmp`, set fixture metadata to `46`, run `verify-content --root` | exact marker error, no live rewrite |
| missing/corrupt/stale asset | copy manifest plus one malformed/missing pair or alter a fixture source/preview hash, run `verify-assets --root` | exact data owner/path/hash record; live assets unchanged |
| unsafe stage entry | temporary source fixture with symlink and `.evil` dotfile; output fixtures for `out=root`, `out=assets`, symlink output, and symlink parent | rejection before any deletion/manifest; ignored `.DS_Store` is never copied |
| traversal/unsupported method | probe raw `..`, `%2e%2e`, `%252e%252e`, `%2f`, `%5c`, malformed encoding, HEAD, and POST | traversal 404, malformed 400, GET/HEAD 200, HEAD body empty, POST 405 with `Allow: GET, HEAD` |
| line ceiling | fixture adds a 501-line governed file and separately exercises explicit legacy exceptions | governed file fails by exact path; app/effects/style pass only at their declared ceilings |
| workflow staging | parse workflow after edit | upload path is `.pages` and staging precedes upload |

No activation test alters a live source/generated/asset file. Every destructive case uses a
minimum copied fixture under OS temp and the explicit `--root`/`--out` seam; before/after hashes
of the user's effects files prove the live worktree stayed unchanged.

## Acceptance criteria

```text
npm run verify
  -> non-emitting typecheck/generated parity plus nav/isms/effects/snippets/finder/content/assets/lines all exit 0
npm run pages:stage
  -> 3 HTML, 211 PNG, 211 WebP, 0 forbidden, manifest written
git diff --check
  -> exit 0
```

`find .pages` must show no `.git`, `.github`, `src`, `scripts`, `tests`, `docs`, `devlog`,
`node_modules`, package files, TypeScript config, `.codexclaw`, or user archives. The workflow
is not run and no deploy success is claimed in this work-phase.

## Implementation evidence — 2026-07-17

Implemented against the existing static tree without adopting the GPT scaffold. `npm run verify`
is now non-emitting and checks 12 TypeScript/browser-JS pairs before the existing catalog gates.
The asset manifest contains 211 sorted PNG/WebP records and the thumbnail pipeline reported
`0 generated, 211 fresh, 211 manifested` during the migration-preserving run.

Fresh positive checks:

```text
npm run verify
  -> exit 0; 49 ISMs, 64 effects, 18 FAQ answers, 12 generated outputs
npm run pages:stage
  -> 3 HTML, 211 PNG, 211 WebP, 0 forbidden; 464 files + manifest
.pages/manifest.json audit
  -> sorted=true, hashes=true, forbidden=[]
git diff --check
  -> exit 0
```

Activated negative paths in OS-temp fixtures:

```text
stale generated app.js       -> exit 1, exact stale assets/js/app.js; live effects hashes unchanged
stale SoT count              -> exit 1, effects.html:effects-nav-count
malformed duplicate marker  -> exit 1; all six target hashes unchanged
valid SoT sync               -> write/check exit 0; outside-marker hashes unchanged
preview hash drift           -> exit 1, exact ai-slop dashboard.webp preview hash drift
501-line governed file       -> exit 1, exact src/too-long.ts 501 > 500
out=root / out=assets        -> rejected before deletion
out=src                      -> rejected; repository-internal output is limited to exact `.pages`
symlink output parent        -> rejected before deletion
assets/css/.evil             -> rejected; live ignored .DS_Store files were not staged
case alias ASSETS            -> rejected by dev+ino identity; source sentinel preserved
optional robots.txt symlink  -> rejected before copy
unrelated red/blue pair      -> manifest hashes matched but pixel relation forced regeneration
interrupted SoT sidecars     -> startup rollback restored originals and removed transaction files
exact 500 / 501 lines        -> 500 passed; 501 failed by exact governed path
GET / and HEAD /             -> 200; HEAD body 0 bytes
POST /                       -> 405, Allow: GET, HEAD
raw/encoded/double traversal -> 404; encoded separators/backslash 404; malformed encoding 400
```

No commit, push, workflow dispatch, upload, or deployment was performed.
