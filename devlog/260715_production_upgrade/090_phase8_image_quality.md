# 090 — Image Quality Audit and Targeted GPT Image 2 Regeneration

## Loop specification

- Archetype: inspect, select, and repair
- Trigger: all 211 raster pairs exist, but count/dimension gates do not prove visual quality.
- Goal: inspect every current preview, identify evidence-backed weak assets, and replace only
  approved targets with reviewed GPT Image 2 originals and synchronized WebP/provenance.
- Non-goals: blanket regeneration, SVG placeholders, catalog count change, new ISM/Effect,
  public backlog, invented rights claims.
- Verifier: machine asset audit, contact sheets read with `view_image`, per-target before/after
  hashes, final rendered cards/modals, `npm run images:audit`, `npm run verify`.
- Stop: every selected target has an accepted original/preview pair and provenance; all other
  assets remain hash-identical. If no asset fails visual review, close as evidence-backed NOOP.
- Bounds: the user explicitly permits unlimited `ima2` generations. There is no global image
  count cap; every audit-failed slot may be regenerated. Each slot stops at the first rubric-pass
  candidate, with re-analysis before another attempt, 300 seconds per call, and bounded parallel
  workers so inspection/provenance never lags behind generation.

## Baseline

The checkout has 147 ISM PNG + 147 ISM WebP and 64 Effect PNG + 64 Effect WebP. Effect guides
already have `031_effect_guide_audit.csv`, `032_effect_guide_manifest.jsonl`, and a dedicated
machine audit. The missing proof is a current whole-catalog visual read, especially the older
ISM boards. GPT's 211 SVG placeholder pack is rejected because it would regress real imagery.

## Diff-level path manifest

| Marker | Exact path | Before → after |
| --- | --- | --- |
| NEW | `scripts/build-ism-contact-sheet.mjs` | no whole-ISM review surface → exactly three 7×7 sheets, one per slot index, each with all 49 canonical ISM keys exactly once; `--out`, cell-map sidecars, and hard failure for missing/duplicate/extra/blank cells |
| MODIFY | `scripts/build-effect-guide-contact-sheet.mjs` | stale 46/6-column surface → exact 8×8 sheet for all 64 canonical Effect keys, `--out`, sidecar map, and hard failure for a missing preview |
| MODIFY | `scripts/audit-effect-guides.mjs` | mtime freshness → exact source/preview hash and independent pixel-relation evidence from `assets/data/image-pairs-manifest.json`; clean checkout timestamps are irrelevant |
| NEW | `scripts/verify-image-quality.mjs` | no completion gate → derive 211-key inventory; rebuild four sheets in OS temp; compare sheet SHA/cell maps, CSV schema/key set, 422 baseline files, 211 baseline pair rows, non-target hashes, accepted attempts/prompts, shard state machines, and Effect 031/032 parity |
| NEW conditional | `scripts/apply-image-candidates.mjs` | manual copy risk → require accepted reviewed attempt, candidate SHA/dimensions, regular contained paths and exact target; create PNG/WebP/manifest/data prompt in temp and journal atomic install/rollback; append applied ledger state after commit |
| NEW | `scripts/finalize-image-quality.mjs` | no final receipt owner → after every replace row is terminal+applied and no attempt is open, rebuild final four sheets/maps in OS temp and create-exclusive+fsync 098 bound to run ID and baseline aggregate SHA |
| NEW | `devlog/260715_production_upgrade/091_image_quality_audit.csv` | no visual decision ledger → exact 24-column schema/key set with sheet/cell, baseline/current pair hashes, all 8 rubric verdicts, decision and reason |
| NEW | `devlog/260715_production_upgrade/092_image_generation_attempts/index.json` + `shard-NNN.jsonl` | no attempt state → immutable prepared/result/review rows, maximum 300 rows per deterministic shard, unlimited shard count |
| NEW | `devlog/260715_production_upgrade/093_image_baseline_assets.jsonl` | no before-state receipt → create-exclusive run-bound sorted 422 unique raster paths and SHA-256 |
| NEW | `devlog/260715_production_upgrade/094_image_baseline_pairs.json` | no pair baseline → create-exclusive exact pre-generation 211-row image-pair manifest snapshot |
| NEW | `devlog/260715_production_upgrade/095_image_baseline_sheet_receipts.json` + `095_image_sheets/baseline/*` | no sheet proof → preserve exactly four audited baseline sheet bytes/file SHA/image-region pixel SHA/map; immutable and included in baseline aggregate |
| NEW | `devlog/260715_production_upgrade/096_image_baseline_runtime.json` | no semantic before-state → compact full baseline of prompt-owning ISM/Effect JSON for allowlisted field diff verification |
| NEW | `devlog/260715_production_upgrade/097_effect_ledger_baseline/` | no ledger before-state → exact create-exclusive copies and SHA of 031/032; final files must retain byte-identical prefix and only accepted Effect append rows |
| NEW | `devlog/260715_production_upgrade/098_image_final_sheet_receipts.json` | no post-apply sheet proof → separate final four-sheet image-region pixel/map receipts; create-exclusive after apply, references run ID and baseline aggregate SHA, excluded from baseline aggregate |
| NEW | `scripts/capture-image-baseline.mjs` | no write-once boundary → `--run-id` create-exclusive capture of 093–097; existing receipts are reusable only when run ID and aggregate baseline SHA match exactly |
| MODIFY | `package.json` | no whole-image audit gate → add `images:contact-sheets`, `verify:image-quality`, and include the verifier in non-emitting `npm run verify` |
| MODIFY conditional | `assets/images/{ism-id}/{file}.png` | only audit-failed, approved target → reviewed 1536×1024 GPT Image 2 original |
| MODIFY conditional | `assets/images/thumbs/{ism-id}/{file}.webp` | old preview → 768×512 preview generated by repository pipeline |
| MODIFY conditional | `assets/images/effects/{effect-id}/guide.png` and thumb | only if a current guide independently fails; append existing 031/032 ledgers |

Every CSV/JSON/JSONL file remains below 500 lines. Large semantic baselines use compact JSON;
attempt shards rotate at 300 lines and the index permits unlimited shards. No runtime schema changes are required, but each accepted revised
prompt conditionally updates the matching existing `isms[].prompts[]` or `effects[].guide.prompt`.

### Canonical inventory and audit schema

Canonical key format is `ism:{id}:{slot}:{file}` for 147 ISM rows and
`effect:{id}:guide:{file}` for 64 Effect rows. Sheets are exactly `ism-slot-0`, `ism-slot-1`,
`ism-slot-2` (49 cells each, 7×7) and `effects-guide` (64 cells, 8×8). No padding or blank cell is
permitted. Every map row records sheet ID, zero-based cell, key, source/preview paths and hashes;
the baseline receipt records committed sheet file SHA, image-cell-region decoded-pixel SHA and map SHA. Baseline
sheet bytes are immutable evidence of what `view_image` reviewed. After apply, a separate final
receipt records current decoded-pixel/map SHA; the verifier regenerates final sheets in OS temp and
compares image-region pixels/maps rather than encoder bytes. Sheet dimensions, cell geometry,
nearest-neighbor resize, metadata stripping, Sharp and libvips versions are recorded. Label rows
are excluded from pixel SHA (avoiding host-font raster differences); exact label text/order lives
in the canonical map SHA. This prevents stale/skipped surfaces without cross-version byte identity.

`091_image_quality_audit.csv` has exactly 24 fixed columns:

```text
run_id,key,catalog,id,slot,file,source_path,preview_path,sheet_id,cell_index,
baseline_source_sha256,baseline_preview_sha256,
anatomy,text,feasible_state,style_identity,composition,contrast,forbidden_content,provenance,
decision,reason,current_source_sha256,current_preview_sha256
```

`run_id` must equal the create-exclusive baseline run. Rubric fields are only `pass|fail`;
decision is only `keep|replace`. A keep row requires all
eight passes and current hashes equal baseline. A replace row requires at least one baseline
failure, a reason, one accepted attempt, current hashes equal that attempt, and runtime prompt SHA
equal the accepted prompt SHA.

## Deterministic workflow

1. Run `ima2 ping`. A failed ping permits `ima2 serve` and one recheck; a second failure is
   BLOCKED for generation but not for the audit.
2. Run `capture-image-baseline.mjs --run-id <id>` once. It uses create-exclusive writes for sorted
   422-file, 211-pair, full runtime prompt-owner, Effect-ledger, and four baseline-sheet receipts,
   fsyncs files/directories, and writes an aggregate baseline SHA. If anything exists, it refuses
   replacement unless run ID and aggregate SHA match exactly. The aggregate includes immutable
   093–097 only; 098 final receipt is separate and later references the aggregate. Every state row embeds both.
3. Read every sheet with `view_image`; record every canonical key in the fixed 24-column CSV.
4. Select every failure using this deterministic order across all eight fields: anatomy, text,
   feasible state, style identity, composition, contrast, forbidden content, then provenance.
   Ties sort by catalog order and slot index. Unlimited generation capacity changes quantity,
   not the acceptance bar.
5. Allocate a globally unique `img-NNNNNN` attempt ID from the run-bound index. Candidate paths are immutable:
   `.tmp/image-candidates/{catalog}/{id}/{file-stem}/img-NNNNNN/candidate.png`.
   Before launch append+fsync a `prepared` row containing attempt ID, prior failure analysis,
   exact revised prompt and negative constraints, prompt SHA, exact command, candidate/target,
   baseline hash and timestamp. At most one target attempt may lack a terminal review.
   A single coordinator owns a create-exclusive ledger lock; global ID allocation, target-open
   check, shard capacity/rotation, prepared append+fsync and index atomic update occur in that one
   serial critical section. On every startup it validates stale lock PID/host/run ownership, safely
   reclaims only a dead owner, then scans all shards as the authoritative log to reconstruct max
   global ID, open targets, terminal states and shard capacity. `index.json` is a derived atomic
   cache, never the source for ID reuse. A row fsynced before an index crash is therefore discovered
   and the next ID is still max+1. Two generation workers start only after prepared rows are durable.
6. Generate candidates outside production targets:

```text
ima2 gen --stdin -q high -s 1536x1024 \
  -o .tmp/image-candidates/{catalog}/{id}/{file-stem}/img-NNNNNN/candidate.png \
  --json --timeout 300
```

7. Append a `result` row with exit/output/candidate SHA, then inspect every candidate with
   `view_image` and append+fsync a terminal `review` row. Accept only when it fixes the defect and
   preserves the named style/pattern. A failed candidate requires a recorded defect analysis and
   revised prompt before the next attempt; repeat until pass, provider block, or a documented
   impossibility makes the slot `NEEDS_HUMAN`.
8. Run `apply-image-candidates.mjs --attempt img-NNNNNN`. It refuses unaccepted/unreviewed attempts,
   symlink/non-regular/wrong-size/hash-mismatched candidates, out-of-inventory targets, prompt
   owner mismatch, non-production thumbnail settings, and concurrent/unreviewed target attempts.
   It checks stale-lock ownership first, recovers any transaction, then acquires a global
   create-exclusive apply lock. Before install it copies every target generation's original PNG,
   WebP, manifest, runtime data and Effect ledgers to durable transaction backup files and fsyncs
   bytes/directories. It creates new outputs in temp and records a transaction sidecar with
   `prepared|committed` plus before/after hashes. Every startup recovers a stale prepared state by
   idempotent rollback from durable backups and a committed state by roll-forward cleanup before
   clearing stale lock and accepting work. Per-file install state and before/after SHA are journaled.
9. The same coordinator serializes result/review appends and shard/index updates under the ledger
   lock, preventing interleaved JSONL or >300-row shards. Append final hashes and apply state. Effect changes append matching 031 decision and 032
   provenance rows in the transaction. Generation concurrency is fixed at 2; apply is serial.
   Final verification semantically diffs current ISM/Effect JSON against 096, allowing only prompts
   owned by accepted targets. Current 031/032 must begin with exact 097 bytes and may append only
   verifier-matched accepted Effect rows.
10. After all `replace` rows have one terminal accepted+applied attempt and no target is open, run
   `finalize-image-quality.mjs --run-id <id>`. It rebuilds all final sheets/maps in OS temp, verifies
   current audit/attempt/apply state, and create-exclusive writes+fsyncs 098 with run ID, baseline
   aggregate SHA and four final pixel/map receipts. Re-running only accepts byte-identical 098.
   Non-emitting `verify:image-quality` never creates or updates this receipt.

## Review rubric

Each asset receives pass/fail for anatomy, text, feasible UI state, style identity, unique
composition, contrast, forbidden content, and provenance. A visually attractive image that does
not represent its catalog ID fails. Generated text need not be content-complete, but prominent
labels cannot be gibberish. No image is accepted merely because generation succeeded.

## Activation scenarios

| Condition | Trigger | Proof |
| --- | --- | --- |
| provider unavailable | `ima2 ping` before generation | ping receipt and BLOCKED ledger after retry |
| candidate defect persists | first candidate fails the same rubric row | rejected hash + revised prompt + second review |
| preview stale | accepted PNG hash changes | thumbnail command reports generated target; pair manifest source/preview SHA and MAE relation update without mtime reliance |
| unintended blast radius | hash all 422 assets before and after | only accepted PNG and corresponding WebP hashes change |
| duplicate composition/hash | machine hash audit and sheet comparison | duplicate named; candidate rejected or repaired |

## Acceptance criteria

- `091_image_quality_audit.csv` covers 211 slots with no undecided row.
- Four immutable baseline sheets cover exactly `49+49+49+64` canonical keys with no
  blank/duplicate/missing cell and preserve the audited bytes. Separate final receipts regenerate
  and match current decoded pixels/maps for the same four sets.
- `finalize-image-quality` owns the one-time 098 write only after all replacement attempts are
  terminal+applied and no open attempt remains; verifier remains non-emitting.
- Every generation attempt has complete prepared/result/review states and an inspected immutable candidate.
- Accepted PNG is 1536×1024 and corresponding WebP is 768×512.
- Every accepted pair has updated source/preview hashes in `image-pairs-manifest.json` and passes
  the independent decoded-pixel relation gate.
- Non-target assets remain hash-identical.
- Baseline receipts prove the exact 422 path set and 211 pair rows; no unallowlisted add/delete/hash
  or pair-row change is accepted.
- Baselines are create-exclusive and all CSV, attempt, apply and final receipt states match the same
  run ID and aggregate baseline SHA; re-baselining after mutation is rejected.
- Full runtime prompt-owner semantics and Effect ledger bytes are baselined. Only accepted prompt
  fields and verifier-matched append rows may differ.
- Attempt shards are ≤300 lines; unlimited attempts scale by deterministic shard addition without
  violating the 500-line rule.
- Shards are authoritative: stale-lock recovery and startup reconciliation rebuild index/max ID/
  open targets, so a crash between row fsync and index rename cannot duplicate an attempt ID.
- Accepted prompt SHA matches runtime data. Accepted Effect targets have matching 031/032 decision,
  provenance, final PNG/WebP hashes and prompt SHA.
- `npm run images:audit`, `npm run verify:isms`, `npm run verify:effects`, and final
  `npm run verify` exit 0.
- Browser screenshots show accepted images in card and lightbox contexts without overflow.

## Completion result — 2026-07-17

- Immutable baseline run: `design-isms-20260717-02`, aggregate SHA-256
  `3bc029e1b0a2c0214a8d70594792a835b747326fb111d4ba0b9ef2ed3b8a90ba`.
- Reviewed inventory: 211/211 slots across three 7×7 ISM sheets and one 8×8 Effects sheet.
- Replaced only `ism:minimalism:0:landing.png` and `ism:indie-web:0:landing.png`; both failed
  the forbidden-content rubric because their baseline contained browser/window chrome.
- Accepted attempts: `img-000005` and `img-000006`, generated through ima2 with
  `oauth/gpt-5.6-sol`, `reasoning-effort=high`, image quality high, 1536×1024.
- Attempts `img-000001` through `img-000004` produced no candidate bytes and were explicitly
  rejected as server-contract failures before the compatible source server was selected.
- Final sheet aggregate SHA-256:
  `b2a03ff30001dd6e2a833450614003613aa81e86a86cb4c0e6adee8de7d27a7e`.
- Runtime image/data URLs and changed browser bundles carry `2026-07-17` release versions so
  previously cached PNG/WebP/data/JS cannot mask an approved replacement after deployment.
- The remaining 209 slots and both Effect provenance ledgers are byte-identical to baseline.
- Verification is clean-checkout safe: applied attempts remain proven by committed result/applied/source
  hashes when ignored `.tmp` candidate bytes are absent. Baseline sheets and 093–097 aggregate evidence
  are still mandatory, and finalization runs the complete pre-final gate before exclusive publication.
