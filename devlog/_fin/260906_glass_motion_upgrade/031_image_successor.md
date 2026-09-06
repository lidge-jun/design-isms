# wp3 — Exact final-receipt successor contract

## Before / after
Before: finalize-image-quality rejects any changed existing 098 and final sheets.
After: default rejection remains. Explicit `--supersede --expected-previous-sha <098 file SHA256>` publishes a new local receipt only after archival and complete validation. Same-result retry is no-op; stale expected hash fails.

## Storage and order
Archive previous receipt and exact referenced sheets in `devlog/_fin/260715_production_upgrade/098_image_final_history/<previous-receipt-sha>/receipt.json` and `sheets/*.webp`. Existing archive must match bytes. New sheets are immutable under `095_image_sheets/final-revisions/<new-aggregate-sha>/*.webp`. New receipt header adds `supersedes:{receiptSha256,aggregateSha256}`; paths derived only from strict SHA values. Legacy receipt keeps old `095_image_sheets/final` path.

Order: acquire existing finalize lock; check expected old SHA and original receipt/sheet integrity; run pre-final; generate candidate sheets; persist archive/new immutable sheets and fsync; recheck current 098 SHA; atomic rename new receipt; fsync parent. No gap requiring deletion of old receipt; a crash before rename leaves old current state valid. New candidate assets with stale receipt still correctly fail whole quality gate until successful finalization.

## Validation chain
image-final-history.mjs validates predecessor receipt hash, sheet bytes/maps, run/baseline identity, strict finite acyclic SHA chain and accepted attempt set continuity. No arbitrary paths or symlinks. The existing current 211-cell/4-sheet reconstruction and pixel/map/live hash gate remains. Non-target cells remain equivalent; only approved new attempts may change target cells. Old 093-097 and old final sheet bytes remain.

## Generation profiles
image-attempt.mjs prepare adds optional explicit `--profile current-local` accepted only as a known profile; old rows without profile validate exact historical argv with 127.0.0.1:3334. `current-local` validates exact localhost:3333 + oauth/gpt-5.6-sol + high +1536x1024 +300s argv. No arbitrary provider, arbitrary URL or global defaults. Profile field creation at prepare, JSONL serialization, validator deserialization, run uses recorded command, quality verifier checks exact profile-to-command mapping. A small shared scripts/image-generation-profiles.mjs owns both mappings; unknown profile rejects. Test historical and new profile commands, unknown profile and tampered server/model. Actual successful generation still required.

## Tests and boundary
node:test covers expected-old hash, archive mismatch/missing sheet, non-target cell mismatch, interrupted pre-publication artifact, valid successor and idempotence. E7 local reviewable evidence, not protection against deliberate policy-code edits; final enforcement layer none beyond repository review. User requested image replacement authorizes scoped local successors; no publish/deploy.
