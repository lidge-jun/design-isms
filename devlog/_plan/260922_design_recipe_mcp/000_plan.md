# Design recipes and compact MCP delivery

The catalog already holds useful visual references and implementation material, but selecting a coherent screen requires hopping between six catalogs. This series adds authored screen recipes and a shared read-only query core, exposes it through one compact MCP tool, and brings the same recipes into the existing index page.

## Goal and loop specification

- Archetype: satisfy-spec, docs-only roadmap followed by three dependency-ordered implementation cycles.
- Trigger: owner's 2026-09-22 request to research StyleGallery, Taste Skill and its creator's browser; credit usable sources; publish issues and implementation PRs; inherited subagents authorized.
- Goal: coherent page briefs and a working compact local MCP, delivered in reviewable ordinary PRs.
- Non-goals: merge/deploy/release, framework migration, new hosted service, native GitHub stacks, image generation/replacement, copied third-party browser code, universal accessibility certification.
- Verifier: docs semantic/source review and diff checks in wp0; build, catalog tests, full verify and stage in wp1; real stdio integration/timeout/byte-boundary tests in wp2; real desktop/mobile browser actions, screenshots and full verify in wp3.
- Stop: every accepted issue has a published PR and its own observed checks; all phase criteria met. PR publication is not merging or site deployment.
- Durable record: this numbered unit and native session-bound goalplan. Evidence stays in this unit or ignored qa-artifacts; no private machine information in PR bodies.
- Outcomes: DONE with evidence; NEEDS_HUMAN for missing authority; unresolved checks remain open, never reported passed. Host blocked semantics control blocked status.
- Escalation: unexpected existing user work, unclear upstream identity, or a requirement for privileged installs/paid actions. Read-only investigation continues independently.
- Resources: this repository/worktree and temporary source checkouts; repository GitHub issue/PR access; inherited agents, at most three active independent packets at a time. No user token/time budget was specified. Existing lockfile dependency restoration is necessary project setup, not installation of a new tool or dependency; no package versions change.

## Current signals and source map

- Native checkout has unpublished finder repair 98f7565; it is preserved. Work uses an isolated worktree based on origin/main 28d6611.
- 49 ISMs / 94 effects / 18 FAQ entries; six catalogs total 233 entries. Approved image bytes and ledgers stay unchanged.
- src/finder.ts mixes ranking with DOM ownership; src/app-export.ts owns palette inference. Their semantics are not changed in this series.
- assets/data/*.json remains canonical. src/*.ts emits classic scripts into assets/js/*.js. scripts/verify-generated.mjs checks exact source/build parity.
- CatalogShell remains the existing catalog modal owner. AppRuntime and AppDialogA11y remain runtime/accessibility owners.
- scripts/stage-pages.mjs allowlists seven HTML pages and assets only. Node MCP/CLI stays outside assets.
- Baseline npm run verify passed, including 106 quality-contract tests, image hashes and navigation. The first attempt lacked tsc; npm ci --ignore-scripts restored existing lockfile dependencies and the retry passed.
- cxc map is unavailable in the installed plugin, so the structure doc and bounded source reads supplied the module map.

## Delivery map

| Phase | Branch / ordinary PR base | Contract | Detailed plan |
| --- | --- | --- | --- |
| wp0 | codex/design-foundations / dev | researched attribution, issue map, audited roadmap only | 001_sources.md and 003_issues.md |
| wp1 | codex/design-recipe-core / codex/design-foundations | shared query core and three valid recipes | 010_catalog_recipes.md |
| wp2 | codex/design-codemode-mcp / codex/design-recipe-core | one executable tool, bounded read operations | 020_codemode_mcp.md |
| wp3 | codex/design-recipe-experience / codex/design-codemode-mcp | visible recipe workflow, finder repair, browser QA | 030_recipe_experience.md |

These are sequential ordinary PRs with manual base dependencies, not parallel branch lanes or native stacks. Main alone changes branches and publishes. Each PR has its own exact-head CI evidence. No merge or branch deletion is authorized.

## Delegation and design consultation

V1 spawn_agent with fork_context:true is exposed. Native agent_type is not exposed; the user explicitly requested inherited subagents. The inherited design consultant supplies proposal/reflection evidence under that requested transport; native architect-role routing is unavailable and is not claimed verified. Reviewer uses a separate inherited context. This is a documented transport limitation, not a claim that prompt labels enforce roles.

- Design consultant: Dalton, handle recorded only in private session evidence; proposal D1-D8 summarized in 002_decisions.md.
- Taste and browser researchers: read-only scoped source packets; findings checked in primary files.
- Foundation implementation scopes: pure core vs authored recipes/tests; MCP scopes: transport/budget vs VM worker; UI scopes: controller vs CSS/HTML, with main integration.
- Same consultant reflects on this concrete roadmap before independent A audit.

## Verification boundary

New code test commands do not exist at planning time and are marked planned until their phase implements and runs them. Existing npm run verify ran on the actual source target and passed; it does not yet observe new MCP/recipe files. Each implementation phase adds its relevant test command to verify. Browser screenshot production alone is insufficient: main opens and observes each delivery image.

## Out of scope

No new catalog counts, no image changes, no eighth page, no public backlog/reference page, no upstream branding or demo data copying, no global tool/skill installation. The creator's confirmed browser candidate is TasteCode (Apache-2.0), not an MIT browser; only research observations are retained.

## wp0 documentation delta

NEW this numbered roadmap/research/decision/issue unit. MODIFY README.md: append a concise source-credit table and link docs/ATTRIBUTION.md; correct legacy 46-candidate/46-demo bullets to 94 total with 46 interface patterns. NEW docs/ATTRIBUTION.md: pinned source URLs/revisions, exact adoption scopes, StyleGallery CC BY documentation credit and change notice, full applicable MIT notices for Taste Skill/aside-codemode/StyleGallery code. TasteCode remains research-only here, not advertised as an MIT dependency. No source/generated/runtime change in this phase.

Reflection revision 2 folds all six consultant findings: recipe discovery, shared view projection, ten-source snapshot identity, truthful trimmed-page cursors, in-realm-only guest bindings, and the app-language extraction. D8-specific reflection was ALIGNED; the whole-roadmap reflection requested these changes and received overall ALIGNED after revision 2. The three remaining prose clarifications (six catalog arrays vs ten total inputs, browser fetch scope, helper wording) were folded before A.

## Owner steering: catalog additions allowed

The owner subsequently authorized adding catalog entries freely when useful. The 49/94/18 figures are the verified baseline, not a permanent scope prohibition under this new instruction. Any new catalog entries require a documented P-phase amendment, source/guide provenance, generated assets where required, count-marker owner updates and the corresponding verifier changes. No entries are added merely to increase the number of cards. Existing immutable baseline evidence is still preserved. This authorization does not require unnecessary additions or weaken any validation criterion.

## wp0 conclusion and next direction

The docs-only roadmap is implemented and independently reviewed. Issues #2–#9 and [PR #10](https://github.com/lidge-jun/design-isms/pull/10) are published. Source/license comparison, staged diff checks and sot:check (13 markers, 49/94/18) passed. Hosted PR run 35709477981 at c20faf5 executed verify and pages:stage successfully; later documentation-only follow-up heads need their own current-head check before PR readiness. No application/image changes or deployment occurred.

Next direction: wp1 consumes 010_catalog_recipes.md to implement the shared core and three authored recipes. Existing Finder math stays unchanged. The upstream browser identity is not generalized beyond the confirmed TasteCode research candidate. No hypothesis about automatic page composition or hostile-code isolation is represented as proven.

## Owner steering: dev integration target

The owner directed development to dev after PR #10 was opened. No remote dev branch existed, so dev was created at the unchanged origin/main baseline 28d6611. PR #10 now targets dev; subsequent ordinary PRs keep their manual dependency bases, with dev as the integration root. No main update or deployment is part of this change.

## Owner steering: images and data-oriented tools

The owner explicitly permits ima2 image generation when useful (inspect ima2 --help and ping before use). Approved existing image bytes remain unchanged unless a separately recorded replacement is justified. The owner also requests Lisp/Unix philosophy in MCP: small composable read primitives, first-class operation metadata/data, transparent composition, and pipe-friendly text boundaries. wp2 will provide an NDJSON CLI over the same operation registry; this adds no general-purpose language/runtime or new dependency. The exact wp2 amendment is re-audited at its P boundary; wp1 core interfaces are unchanged.

## wp1 conclusion and next direction

The shared pure catalog/recipe core, Node adapter, canonical source metadata and three authored recipes are implemented and independently reviewed. Eighteen persistent tests include384 bilingual combinations and complete pagination; generated parity reports29 matching outputs. Review-found accessor defects were reproduced and repaired without weakened assertions. Existing catalog/image/navigation contracts remain intact. Detailed evidence is in011_phase1_progress.md.

Continue with020_codemode_mcp.md. At wp2 P, apply the owner's data-oriented Lisp/Unix refinement to a small common operation registry and NDJSON CLI. The selected recipe is an inspectable data value; no automatic page generator or hostile-code sandbox is claimed.

## wp2 conclusion and next direction

The read-only Code Mode MCP and NDJSON CLI are implemented over one operation registry. Compose values and brief rendering are separate, versioned language-preserving operations. The1053-byte tool description stays below the2000-byte contract. Real process tests and independent probes verified complete wire budgets, continuation, metadata-only operation, cancellation/timeout/EOF recovery and CLI pipelines. Evidence and exact limits are in022_phase2_verification.md; Worker/VM remains explicitly trusted-agent containment.

Continue with030_recipe_experience.md: integrate the existing recipe data into the Atlas index, preserve Finder ownership and language controls, and verify the actual interface at desktop/mobile widths. Use the same contract version2 and selected-value semantics; do not duplicate the node operation registry in the browser UI.
