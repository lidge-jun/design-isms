# Phase 2 execution contract: composable values and text streams

Previous D: wp1 delivered shared pure queries/recipes in PR #11 (0210f0d);18 core tests and full verify/stage passed; independent review PASS. PR #10 and #11 are now ready after exact-head hosted checks. This phase executes020 with the owner-requested Lisp/Unix refinement below. This document supersedes the earlier proposed simultaneous composition+brief envelope.

## Decision dispositions

D9 accepted: separate compose values from Markdown conversion. D10 accepted: common IO-free registry, first-class operation metadata, thin MCP/NDJSON transports. No new interpreter, framework or runtime dependency. Metadata-only scope is precise: CLI --help/actions and MCP tools/list do not initialize/read catalog data; arbitrary execute_code may obtain the server snapshot, but guest actions alone do not create/validate the catalog.

## Core delta (main)

MODIFY src/design-contracts.ts: bump canonical CONTRACT_VERSION to design-catalog/2. MODIFY src/design-recipes.ts: Composition adds readonly lang:Lang; compose writes it after validation; formatBrief defaults to composition.lang and rejects an explicit mismatched language. Rebuild matching assets/js outputs. Extend scripts/design-core.test.mjs with English implicit-language formatting, mismatched-language rejection and composition JSON roundtrip. Existing source inputs/recipes remain unchanged; version hash changes by the intentional contract version.

Field chain: lang originates in validated ComposeOptions, is written to Composition, crosses JSON/MCP/NDJSON unchanged, is validated by design.brief, and determines formatted headings and UI text. Browser chooser continues passing its current language. Old compositions/cursors cannot be combined with the new snapshot version.

## Operation registry (runtime worker)

NEW scripts/mcp/operations.mjs exports OPERATION_SPECS (serializable data) and closure-free createOperationRegistry(getData,specs,options). Factory returns invoke(op,args), find(query), describe(name), and private-continuation access getSearchContext(value). It uses only arguments and locally declared helpers; source compilation in guest must not reference module imports or inject host closures. Each spec has name, summary, inputSchema, example:{code,maxBytes?} (an executable execute_code argument object), requiresData. Runtime validation delegates to the shared core where it owns semantic checks.

- design.search(args={}): immutable SearchPage; metadata stores an immutable copy of call-time query/filter/cursor, never caller objects. Default6/max30 items.
- design.get(args): current core version/ref/view/data envelope.
- design.recipes(args={}): {version,items}; with {id}: {version,recipe} including alternatives.
- design.compose(args): canonical Composition ONLY, including lang.
- design.brief({composition}): {version,recipeId,lang,text}. Refuse stale version with STALE_COMPOSITION. Require every recipe slot exactly once; recompose from the supplied references/lang. Compare canonical values ignoring object-key order but preserving arrays; reject extra/missing/tampered fields with INVALID_COMPOSITION. Format the recomposed object, never caller-authored provenance.
- actions.find(query?:string): compact spec summaries; actions.describe(name:string): one full spec. Their Invocation.args are strings, matching the JS helper calls; the other operations use objects.

Operation cap100 per Code Mode call; CLI creates an invocation boundary per input line. No filesystem, network, shell or arbitrary path arguments. Registry functions/data are read-only and errors have stable codes.

## Runtime/transport handshake

Runtime worker owns NEW scripts/mcp/execution.mjs and execution-worker.mjs as well as operations.mjs.

execution.mjs exports async executeCode(code,{timeoutMs,maxBytes,signal}) -> serialized JSON string, and async searchPrefix(searchContext,count) -> SearchPage for transport-only fitting. Lazily import/cache the Node loader only during execution, so server/list and CLI/help need no catalog files. Payload contains fixed core source strings, snapshot JSON, metadata JSON and factory source. Worker creates all wrappers/console/serializer and parses/freezes data inside guest realm. Core namespace bindings and operation counters remain private to bootstrap closures. No host function/object is injected. Worker env is empty and execArgv is empty; use a bounded V8 heap and document that it is not an OS memory/security sandbox.

Serialized runtime envelope: {ok:true,result:JSON,logs:string[],logsTruncated?:true,searchContext?:{version,args}} or {ok:false,error:{code,message},logs:[]}. Only a direct original immutable search result carries continuation metadata. Result copying/serialization happens under the worker deadline; reject cyclic/non-JSON values rather than silently coerce them. Bound serialized transfer before posting to parent (maximum256KiB), independently of final wire limits. Parent only receives serialized strings. Deadlines/cancellation terminate workers and release listeners/timers; later calls recover. Async never-settling values must remain supervised until timeout, not silently disappear.

Transport worker owns NEW scripts/mcp/server.mjs, protocol.mjs, response-budget.mjs and scripts/design-query.mjs.

response-budget.mjs exports async toolResponse(id,envelope,maxBytes,refitSearch), returning the final JSON-RPC response object. Strip private searchContext from public content. Count JSON.stringify(reply)+newline UTF-8 bytes, including nested-string escaping and request ID. Drop bounded diagnostic logs first with an explicit flag. Refit only branded direct search pages through searchPrefix using frozen call-time args; preserve version, total and truthful cursor. No item fits -> RESPONSE_TOO_LARGE. Other oversized values -> RESPONSE_TOO_LARGE, never clipped code. Error replies also fit. Export small shared serialization/limits helpers as needed within these named files.

server.mjs handles JSON-RPC framing/lifecycle and calls executeCode. One tool execute_code with description<=2000 UTF-8 bytes; args code (<=32768 bytes), maxBytes (default8192,1024..65536), timeoutMs(default3000,50..10000). Cap4 in-flight calls, reject duplicate active IDs. IDs: safe integers or <=64 UTF-8 byte strings. Input frame cap131072 bytes. Initialization supports known versions2024-11-05/2025-03-26/2025-06-18; unknown requested versions negotiate the newest supported one. tools/list metadata works before catalog initialization but after protocol initialization. Ping remains responsive, notifications have no reply, cancelled calls are terminated, EOF drains/terminates owned work. Stdout contains protocol only; diagnostics use stderr. No auto-registration or HTTP listener.

## NDJSON CLI

scripts/design-query.mjs reads one {op:string,args?:unknown} per line and writes the successful operation VALUE itself as one JSON line. Errors are {error:{code,message}} lines. Any failed line makes final exit nonzero while subsequent valid lines still execute. Input cap65536 bytes per line; discard an oversized line through its newline, then recover. Output cap65536 bytes including newline; complete result or explicit size error, no shrinking. No banners, elapsed time or duplicate envelope on stdout. --help returns registry metadata JSON without loading catalog files. Honor stdout backpressure. No arbitrary JS execution in this CLI.

Pipe examples:

    printf '%s\n' '{"op":"design.compose","args":{"recipeId":"settings-workspace","lang":"en"}}' | node scripts/design-query.mjs | jq -c '{op:"design.brief",args:{composition:.}}' | node scripts/design-query.mjs

Code Mode example:

    const composition = design.compose({recipeId:'settings-workspace',lang:'en'});
    return design.brief({composition}).text;

## Main integration and verification

Main owns core lang/version delta, generated outputs, package scripts (mcp,design:query,test:mcp), docs/PLUGIN.md + README/structure/AGENTS + skill routing, and NEW scripts/mcp/protocol.test.mjs, server.test.mjs, cli.test.mjs (each<500lines; a shared test-client.mjs may own child-process framing). Runtime/transport workers have disjoint files and no git/build commands. Lock the exports above before dispatch.

Acceptance uses actual child-process stdio and NDJSON, not mocked transports: lifecycle/tool inventory; description bytes; search/get/code/recipes/compose/brief; JSON roundtrip, key-reordered canonical composition, stale/tampered/missing/duplicate slots; English formatting; malformed/oversized/split-UTF8 lines followed by valid recovery; unknown op/args; exact escaped Korean wire budgets at1024/2048/8192/65536; direct-search no-loss continuation and mutated input args; nested/projected oversize errors; bounded logs; cyclic/function/getter result refusal or supervised failure; sync/async loops, never-settling promise, cancellation, subsequent-call recovery; operation/concurrency caps; Node global/module refusal; EOF teardown; metadata-only startup without catalog files; CLI/MCP semantic equality and pipe replay. Security checks prove these scenarios only, not hostile-code isolation.

Existing full verify/stage must pass and operational scripts must stay out of.pages. Preserve current source notices. Publish the ordinary MCP PR against codex/design-recipe-core, linked to issues#5/#6. All layers integrate toward dev; no merge/deploy.

Design consultation: same master-plan consultant proposed D9/D10 and reflected the concrete021 contract as ALIGNED, with no new blockers. Native role routing remains the previously documented inherited-transport limitation.

## Independent A disposition and locked handoff

Independent A returned PASS (no blockers). Clarification folded before dispatch: getData is synchronous and returns exactly `{catalog,recipes,snapshot,recipeList}` as returned by the Node adapter; guest builds equivalent in-realm values lazily. Factory options are `{maxOperations?:number}` only (positive integer, default100); never caller-configurable through public data operations. CLI creates a registry per line and retains the lazy loaded data separately. Metadata paths never call getData.

Additional reproduced boundary refinement in the main-owned recipe module: a custom constructor-name getter is read by recipe record validation. Replace the direct function.name read with own descriptor checks and test zero getter calls; keep the same error contract. Recipe IDs should share the documented128-character bound. This is a bounded validation correction alongside the lang/version delta, not new architecture.

Integration clarification: all discovery examples are executable Code Mode argument objects, including a self-contained compose->brief example. There are no invalid $value placeholders. The NDJSON Invocation shape remains {op,args}. This metadata presentation change has no operation-signature effect and is covered by executing every example.
