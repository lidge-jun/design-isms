# Phase 1 revalidation

Previous D: the docs-only roadmap and accurate attribution are delivered in PR #10; next direction is the shared catalog and three recipe core, preserving Finder math.

At wp1 P, production sources remain unchanged from the audited origin/main baseline. The source/license and D1-D8 design decisions still apply. Revalidated 010 against current package/build and canonical JSON. The same master-plan proposal/reflection remains applicable; no new architecture decision is introduced.

Implementation split: catalog worker owns src/design-contracts.ts, src/design-catalog.ts and, if required to keep each file below 500 lines, src/design-search.ts/src/design-views.ts. Recipe worker owns src/design-recipes.ts and assets/data/recipes.json. Main owns scripts/design-core-loader.mjs, tests, docs, package scripts and generated build. Exact allowed auxiliary files are now recorded before dispatch; the loader allowlist must include only these pure generated files.

New optional fields and stricter raw-data checks must tolerate real existing catalog differences (ISM summary uses tagline/description; other domains use summary). Core projection preserves complete source snippets and metadata; no prompts are fabricated. Future tests named in the plan are implemented and run in this phase, not retroactively claimed as existing checks.

The same design consultant re-read 010/011 at parent26afefc and returned ALIGNED: optional search/view file splits preserve D1-D8 and the public contract.

Independent wp1 A revalidation returned PASS, no API/data blockers. Owner's dev target amendment is resolved: remote dev created at28d6611, PR10 retargeted, foundation f576377 records it, and this unpublished child fast-forwarded to that parent.

Worker handoff types: DesignCatalog exports Domain, Ref, Entry, Summary, SourceSnapshot and Snapshot; functions create/resolve/get/search/summarize and stable coded errors. Snapshot includes version, contractVersion, catalogs and the four auxiliary raw payloads; recipes own parse/compose/formatBrief. Compose slots carry compact summaries plus stable refs; full guide/code views stay separate so default tool output remains bounded.

## B integration evidence

Core and recipe workers delivered the declared pure namespaces and data; main added the shared Node loader, independent node:test contracts and verify integration. First 14 runtime contracts passed. Edge expansion caught a real sparse-domain-array boundary error (TypeError without a code); Array.from now validates holes as undefined and rejects them with INVALID_ARGUMENT. A separate English check was corrected to compare against authored host-side JSON rather than a cross-realm Array prototype.

Cursor text was simplified from four-character-per-code-unit hex to a canonical JSON tuple with dc1 prefix, preserving exact query/filter/version/offset checks while reducing output overhead. This is data-oriented text, not an authentication token. New tests cover every independently enumerated source-version input, accessor refusal, unsafe recipe source URLs and English discovery.

## Independent C review and repair

Initial C review reproduced a Medium boundary issue: inherited query getters and indexed domains getters could run. Main added both regressions and observed the inherited case fail before the fix. Boundary.record now validates prototype descriptors and detaches own data into frozen null-prototype records; catalog clones use null prototypes; domain arrays are inspected by descriptors before values are read.

Re-review returned PASS with no findings. Fresh core suite:18 passed,0 failed; generated parity:29 outputs match. Persistent tests include all384 bilingual recipe alternatives, three Node/browser-realm compositions, changing page sizes, exact error codes and zero getter invocations. No original assertion or source-quality threshold was weakened.

Measured compact search (empty query,limit3):1351 UTF-8 JSON bytes, cursor154 bytes; prior hex cursor produced1783/604 bytes. Ten canonical source files total1369811 bytes. No compression ratio or latency claim is inferred beyond these exact observations.

## Final ownership review

DesignCatalog now owns CONTRACT_VERSION, DOMAINS and SOURCE_FILES once. Node reads their primitive metadata from the allowlisted generated contracts file in a fresh VM; the future browser adapter will use those same constants. Independent comparison confirmed the previous and current snapshot hashes are identical, with29 generated outputs matching and18 core tests passing. Final review verdict: PASS, no findings.

## C evidence matrix

| Surface | Activation | Observed evidence |
| --- | --- | --- |
| Input boundary | malformed fields, sparse arrays, own/inherited/indexed getters | coded refusal and zero getter calls; regression observed red then green |
| Search | KO/EN/alias/NFKC, empty matches, variable-size continuation | expected bottom-sheet identity,232 unique references, truthful completion |
| Versions | independently enumerate/mutate all10 source files | each changes snapshot identity; stale cursors rejected |
| Views | all domains and unavailable code views | complete authored code/guidance, exact VIEW_UNAVAILABLE |
| Recipes |384 bilingual allowed combinations, disallowed/prototype/source inputs | exact selected refs, all constraints/checks retained, invalid selection rejected |
| Runtime parity | pure generated core in separate realms | three compositions and search match; no DOM globals |
| Static deploy | pages:stage |7 HTML,331 PNG/WebP pairs,0 forbidden,751 files+manifest |

Full verify also retains the existing106 quality-contract tests, image hashes, Finder144-combination oracle and seven-page navigation. This phase mounts no new UI, so rendered workflow proof belongs to wp3. No dependency versions, original data entries, images or their ledgers changed.

Next: wp2 implements the small operation registry, Code Mode transport and the owner-requested NDJSON CLI over this core. Its P must incorporate the Lisp/Unix refinement and avoid returning duplicate composition+brief payloads that exceed the default response budget (measured compositions5280–6049B, briefs3451–4114B).
