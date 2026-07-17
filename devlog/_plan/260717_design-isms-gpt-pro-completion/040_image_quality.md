# 040 — Image Audit and Targeted Generation

Normative detailed contract: `devlog/260715_production_upgrade/090_phase8_image_quality.md`.

## Diff

- NEW `scripts/build-ism-contact-sheet.mjs`, `scripts/capture-image-baseline.mjs`,
  `scripts/verify-image-quality.mjs`, `scripts/finalize-image-quality.mjs`, conditional
  `scripts/apply-image-candidate.mjs`, `091_image_quality_audit.csv`, sharded attempt ledgers,
  422-file/211-pair baselines, and four-sheet receipts.
- MODIFY effect contact-sheet count comment/output and effect machine audit freshness to use the
  211-pair manifest rather than mtimes.
- CONDITIONAL MODIFY only audit-failed accepted `assets/images/{id}/{file}.png` and matching
  thumbs; Effect replacements also append existing 031/032 ledgers.
- NO blanket generation, SVG fallback, count/schema change.

## Selection and activation

Audit all 211 canonical keys using exactly four immutable baseline sheets
(`3×49 ISM + 64 Effect`) and separate final pixel/map receipts, the SHA/dimension/pixel-relation
manifest gate, and machine checks. The create-exclusive baseline is bound to one run ID and SHA.
The verifier preserves baseline sheet bytes and rebuilds final sheets in OS temp for exact decoded
pixel/key/cell/source/hash comparison.
Deterministic failure order:
anatomy, text, feasible state, style identity, composition, contrast, forbidden content, provenance;
tie by catalog/slot. Every failed slot is eligible and image generation has no user-imposed
quantity cap. Each slot stops on its first rubric-pass candidate; every retry gets an immutable
attempt ID/path and requires a written failure analysis and revised prompt. Prepared provenance is
fsynced before spawn; result/review rows live in deterministic ≤300-line shards. Generate to
`.tmp`, inspect every candidate, and use a journaled apply script to install only accepted
PNG/WebP/pair-manifest/runtime-prompt generations. Ping/provider failure is recorded. Concurrency is 2.

## Acceptance

CSV has exactly 211 canonical rows and all 8 rubric fields; every candidate has
prompt/command/hash/review provenance; only accepted PNG/WebP hashes, runtime prompt owners,
pair-manifest rows, and required Effect ledgers change. Create-exclusive raster/pair/runtime-prompt/
Effect-ledger baselines prove every non-target path/hash/field/row unchanged. Dimensions remain 1536×1024 and 768×512; image audits,
ISM/Effect validators, full verify, and rendered card/lightbox checks pass.
