# wp1 — Editorial revision contract

## Goal and scope
Permit exactly reviewed glass editorial updates while retaining the immutable legacy image/runtime comparison. This is part of wp1's data foundation, not a separate implementation work phase. Do not rebaseline 093-098.

## Changes
NEW scripts/editorial-revisions.mjs exports a pure validator/replayer used by MODIFY scripts/verify-image-quality.mjs before the existing accepted-prompt substitution and full runtime equality. NEW scripts/editorial-revision-policy.json pins ID-specific allowed fields and exact ordered revision IDs plus final revision hash. NEW devlog/_fin/260715_production_upgrade/099_editorial_revisions.jsonl records reviewed changes. NEW scripts/editorial-revisions.test.mjs tests adversarial mutations.

Revision fields: schemaVersion, revisionId, parentRevisionSha256, baselineRunId, baselineAggregateSha256, baselineRuntimeSha256, reason, evidenceRefs, reviewedBy, reviewedAt, changes, revisionSha256. Each change has catalog, id, field, before:{present,value?}, beforeSha256, after:{present,value}, afterSha256. Hash stableJson UTF-8, exclude revisionSha256 from its own digest. Only isms, glassmorphism/refractive-glass-ui and exact policy-listed editorial fields. No deletion, JSON pointers, deep merge or wildcards. No id/kind/keywords/palette/images/prompts/effects changes. Missing differs from null. Reject unknown keys, duplicates, no-ops, changed baselines, invalid chain/order/tip, or payload hash mismatch.

Main authors actual content and ledger after independent review; worker owns validator/policy schema and tests, then main pins concrete allowed fields and digest. Replay uses recorded after values on a cloned baseline, never current live values. Existing final whole-object comparison catches all outside changes. Primary source refs must support claims, and user authorization is this catalog upgrade request. Ledger metadata is provenance, not independent authorization.

## Evidence chain
Creation: main writes revision JSONL from reviewed old/new fields. Serialization: stableJson hashes and strict JSON records. Deserialization: editorial-revisions validator. Consumer: verify-image-quality's baseline memory copy only. Public data remains existing isms schema, plugin field lists unchanged.

## Verification and bypass statement
Existing npm run verify passes on baseline. New node --test scripts/editorial-revisions.test.mjs must cover allowed replay and absent ledger, other IDs, images/prompts, forged before/after, duplicate, reordered/deleted rows, missing/null, effects drift, and coexistence with accepted image prompts. Integration npm run verify retains full equality. Tier E7 local script; explicit policy edit is known bypass and requires reviewer inspection; no claim of tamper-proof security, final enforcement layer none outside repository review.
