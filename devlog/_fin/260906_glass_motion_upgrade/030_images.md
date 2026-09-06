# wp3 — Reference images aligned with implementation

## Loop specification
C3 bounded visual optimization with truth checks. Consumes wp1 glass guidance and wp2 real motion behavior. Goal: correct weak visual references, including numerical motion misinformation. Four targets, up to three candidates each, <=12 candidates total; 300s/job; each candidate inspected before acceptance. No unrelated imagery or ai-slop teaching specimen changes. Existing ima2 accounts only.

## Fixed target manifest
- assets/images/refractive-glass-ui/landing.png; key ism:refractive-glass-ui:0:landing.png. Replace oversized serif display and dense outlined control chips with product-led scene, restrained sans typography and one functional glass nav.
- assets/images/refractive-glass-ui/mobile-app.png; key ism:refractive-glass-ui:1:mobile-app.png. Single coherent landscape mobile music screen, one playback control cluster, stable content hierarchy.
- assets/images/motion/motion-spring/guide.png. Correct confusing bezier control point 1.56 versus actual small scale overshoot. Show .92 to 1 motion and distinguish progress curve from physical scale.
- assets/images/motion/motion-back/guide.png. Explain progress undershoot/overshoot separately from actual displacement in existing snippet; exact numeric anchors derive from current CSS before generation.
Corresponding assets/images/thumbs/... WebP paths and image-pairs-manifest.json must update together.

## Exact implementation changes
MODIFY scripts/finalize-image-quality.mjs to support explicit successor finalization while preserving previous 098 and final sheets under immutable history. Default still refuses different existing bytes. Explicit --supersede archives current receipt/sheets by receipt hash after validating old receipt internal hashes; new receipt records predecessor path/hash. NEW scripts/image-final-history.mjs validates safe contained history path, predecessor bytes and chain with no live-data substitution. MODIFY scripts/verify-image-quality.mjs invokes history validation before the unchanged current final-sheet rebuild/hash comparison. Current 093-097 remain byte-identical. Add focused node:test coverage for missing/tampered predecessor, path escape and unchanged/idempotent receipt behavior. No new image API or dependencies.

Use existing scripts/image-attempt.mjs prepare/run/review/applied for the two legacy ISM slots. Prepared command currently pins server3334/model oauth/gpt-5.6-sol. Probe it; if absent, introduce explicit validated per-attempt known current-local generation profile while preserving historical exact commands and model/quality/size/reasoning checks. Never silently route to another provider or alter global defaults. Model target remains oauth/gpt-5.6-sol/high.

For each target write long prompt in this unit evidence, record prepared target/candidate, generator JSON, exact effective prompt, SHA and review. Do not apply failed candidates. After candidate review, copy accepted PNG, update matching prompts[].prompt in isms.json (legacy) or guide.prompt in motion.json (catalog). Update 091 legacy row failed rubric/replacement reason/current hashes; mark applied only after actual preview hash exists. images:thumbs -- --scope isms and --scope motion update manifest via normal generator. Existing prior accepted attempts stay untouched. Regenerate current 098/final sheets with explicit successor path and inspect changed contact sheet.

Motion guide provenance: MODIFY only corresponding rows in devlog/_fin/260717_design-encyclopedia-upgrade/061_motion_guide_manifest.jsonl and 061_motion_guide_audit.csv; preserve former rows in a numbered replacement record in this unit. Keep exact 20-row runtime ledgers; new row binds prompt SHA, PNG/WebP SHA, command and reviewed acceptance.

MODIFY README.md/AGENTS.md/structure/README.md to describe successor finalization and current replacement set. Source declarations must not claim old images regenerated.

## Selection and stop rule
Compare actual scene coherence, legible UI, control/content hierarchy, absence of redundant controls, and guide numerical correctness. Accept only candidate better than inspected baseline and accurate to current implementation. If three candidates for a slot fail, preserve original, record concrete rejected evidence and append a focused follow-up P if a viable correction remains; do not call incorrect guide done. A bitmap cannot establish motion behavior; runtime interaction evidence from wp2 remains the motion oracle.

## Verification
Run ima2 ping before generation. npm run images:thumbs; npm run images:audit; npm run verify:catalog; node scripts/verify-image-quality.mjs --pre-final; finalize successor; npm run build; npm run verify; npm run pages:stage. Existing commands were found in package.json and baseline verify executed successfully; successor/test commands are newly implemented gates, not falsely pre-verified. Verify non-target raster hashes against recorded baseline and immutable 093-097. Inspect original/preview in actual desktop/mobile modal, PNG lightbox, and all seven page counts, navigation, no overflow/console errors. Preserve task-owned browser tab identity and stop only task-owned servers after final evidence.

## Delegation
Main owns candidate prompts/generation/selection/application. Pipeline worker owns finalization/history code and tests only, after wp3 B authorization. Main owns shared verify-image-quality integration if simultaneous scopes would collide. Reviewer independent from generation author.

Exact expected-old SHA, immutable storage and generation profile schema are in 031_image_successor.md; that contract supersedes the abbreviated path proposal above.

## Audit amendment
MODIFY assets/data/motion.json motion-back.summary alongside its guide: -0.6 and 1.6 are Bézier control-point y coordinates, not actual progress extrema or pixel displacement. Preserve easing, duration and CSS target translateX(24px); explain actual extrema derived from the curve. Review motion-spring.summary for the same ambiguity.

## wp3 P stale check and write scope
After wp2, full verify passes; the four raster targets and old final receipts are unchanged. motion-back and motion-spring easing/duration/snippets remain unchanged, so 005 numerical oracle still applies. verify-image-quality now includes wp1 editorial replay; pipeline worker must preserve that integration.
Pipeline worker scope: scripts/image-final-history.mjs, scripts/image-final-history.test.mjs, scripts/finalize-image-quality.mjs, scripts/image-generation-profiles.mjs, scripts/image-generation-profiles.test.mjs, scripts/image-attempt.mjs, scripts/verify-image-quality.mjs. Main owns actual attempts, image/provenance data, docs, package.json and build. No parallel writes to these script files. Main may independently generate the two motion candidates while pipeline implementation proceeds, since their existing catalog ledger is independent from legacy finalization.
MODIFY package.json: add verify:quality-contracts to run editorial/history/profile node:test files, and include it in npm run verify. This makes new safety regressions part of existing CI verification without changing deployment workflow or dependencies.
