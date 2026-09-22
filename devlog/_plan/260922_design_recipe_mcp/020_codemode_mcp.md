# Phase 2: compact read-only Code Mode MCP

Depends on wp1 shared core. C4 scope is guest execution/input/output; main records honest trusted-agent boundary. Goal: callable local stdio MCP with one small tool.

## File delta

| Action | Path | Change |
| --- | --- | --- |
| NEW | scripts/mcp/server.mjs | executable stdio process; framing, initialize/ping/list/call/cancel; per-request controller |
| NEW | scripts/mcp/protocol.mjs | JSON-RPC validation and response shapes, version policy, bounded IDs/input frames |
| NEW | scripts/mcp/operations.mjs | single registry for actions.find/describe and design.search/get/compose signatures/validation/dispatch |
| NEW | scripts/mcp/execution-worker.mjs | isolated per-call guest VM containing trusted generated core, frozen data and in-realm wrappers; serialization stays under deadline |
| NEW | scripts/mcp/execution.mjs | worker lifetime, deadline/cancellation, concurrent-call cap, worker error translation |
| NEW | scripts/mcp/response-budget.mjs | exact UTF-8 serialized wire budget, whole-result fitting, explicit budget errors |
| NEW | scripts/mcp/protocol.test.mjs, scripts/mcp/server.test.mjs | independent stdio-client tests and execution/byte-boundary contracts |
| MODIFY | package.json | mcp script and test:mcp, included in verify; no dependencies |
| MODIFY | docs/PLUGIN.md, README.md, structure/README.md, AGENTS.md | install command/config, example calls, byte budgets and execution trust model |
| MODIFY | skills/style/SKILL.md, skills/effect/SKILL.md | prefer MCP when attached; retain filesystem fallback and original field accuracy |

Node operational code stays outside public assets. No auto-registration into user clients or global install. Command: `node /absolute/checkout/scripts/mcp/server.mjs`.

## Public and internal contract

One tool: `execute_code({code,maxBytes?,timeoutMs?})`. Description <=2000 UTF-8 bytes. maxBytes defaults 8192, range 1024..65536; timeout defaults 3000ms, range 50..10000; code max 32768 UTF-8 bytes. Maximum 4 simultaneous calls and 100 operation invocations per call. Tool result has only one text body (no duplicated structuredContent), plus isError when needed.

Guest is an async function body with `return`; injected names are `design`, `actions`, and bounded console. `design.search` matches phase1 input/output, `design.get({domain,id,view?})` supports summary/guide/code/full with guide/code loaded from fixed canonical files; `design.compose({recipeId,selections?,lang?})` returns phase1 composition and brief. `actions.find(query)` returns names and short summaries; `actions.describe(name)` returns one signature/schema/example. Unknown operation/args/IDs are clear errors. No process/require/import/fetch/timers/file/network functions are exposed. In-realm wrappers avoid leaking host function constructors.

Snapshot is read once from fixed paths and content-versioned across six catalog files, recipes.json, dev-guides.json, effects-docs.json and effects-snippets.json (every served content source); source changes require server restart. Worker receives data, core source text and allowlisted registry definition. No client source roots or URLs. Nested code/args validation remains boundary-owned.

MCP initialization supports explicit known protocol versions (2024-11-05, 2025-03-26, 2025-06-18), chooses supported fallback for unknown requested version, advertises tools only. Require initialization for tool calls; handle ping/initialized/cancelled notifications, unknown tools, parse/invalid request errors. IDs are string <=64 bytes or safe integer. Reject oversized/unterminated input frames; do not let one request kill processing of the next valid frame. stdout is JSON-RPC only; diagnostics on stderr. EOF cancels workers and releases process.

Response envelope budget includes JSON-RPC wrapper, request ID, nested JSON string escaping and newline. Successful search shrinking removes whole items, adjusts nextCursor/complete, and marks truncated. Any oversized non-search result returns a small error and suggests narrower view/larger allowed budget; never truncate code. Error responses are bounded too. Invalid maxBytes gets a default-bounded error.

Trust: node:vm/Worker is not a hostile-code security sandbox. This local tool executes trusted-agent JS with accident containment. No claim of executing arbitrary attacker code safely. Deadline terminates synchronous loops, async loops and hostile toJSON; operation cap catches repeated catalog calls; later requests still work.

## Delegation and verification

Transport worker: server/protocol/response-budget. Runtime worker: execution/execution-worker/operations. Main owns tests/docs/package and integrates shared contracts before running processes. Workers do not touch the core or branch state.

Planned `node --test scripts/mcp/*.test.mjs` uses an independent child-process stdio client. Test initialize/list exactly one tool; description byte bound; actual Korean search/get/code/compose; count compatibility; unknown method/tool/args; invalid JSON then recovery; oversized input; Unicode and escaped text at budgets; complete code or explicit size error; stale cursor; cancellation; sync and async infinite loops; throwing getters/toJSON; operation cap; missing Node globals; concurrent calls; EOF teardown. This is executable evidence of tested containment, not security certification.

Build then full verify/stage; prove operational scripts absent from .pages. Publish ordinary PR against codex/design-recipe-core linked I4/I5, with executed per-head CI.

## Binding contract clarification (reflection revision 2)

- `SourceSnapshot = {contractVersion:string,version:string,catalogs:CatalogPayload,recipes:unknown,guides:unknown,effectDocs:unknown,effectSnippets:unknown}`. Ten source files: the six catalogs, recipes.json, dev-guides.json, effects-docs.json, effects-snippets.json. Adapters calculate `SHA256(JSON.stringify([contractVersion, ...sortedPairs]))`, where sortedPairs are `[repositoryRelativePath,SHA256(exactFileBytes)]` sorted by path. Node uses node:crypto; browser uses crypto.subtle with the same UTF-8 encoding. Changing only a recipe or snippet changes version. Pure core takes the validated snapshot/version and performs no hashing IO.
- `design.recipes()` returns `{version,items:RecipeSummary[]}`; `design.recipes({id})` returns `{version,recipe:Recipe}` including allowed alternatives. It is an internal operation, not another public MCP tool.
- `design.compose({recipeId,selections?:Record<string,Ref>,lang?:'ko'|'en'})` returns `{version,composition,brief}`. Unknown slots, duplicate recipe/slot IDs, invalid lang and anti-pattern refs fail. Helper is a supporting role, not an optional/null selection; every declared slot is populated. Missing selections use defaults.
- Shared core view projection: `design.get({domain,id,view?:'summary'|'guide'|'code'|'full'}) -> {version,ref,view,data}`. Default summary uses ISM tagline/description or other domain summary. Guide is dev-guides[id] for ISMs, effects-docs[id] for Effects, relevant implementation fields for other domains; not image-guide prompts. Code returns full effects-snippets.snippets[id] or Layout/Motion snippet. Other code views return VIEW_UNAVAILABLE. Full returns the original catalog entry only.
- Search page is `{version,total,items,nextCursor:string|null,complete}`. Auto-shrink ONLY a directly returned, unmodified original search page; mark it privately in a WeakMap in guest wrappers, never trust a user-shaped object. Nested/projected results receive normal RESPONSE_TOO_LARGE. After sending n items from offset o, cursor advances to o+n, bound to normalized query/filter/version; complete only at the end. Zero fitting items means RESPONSE_TOO_LARGE, not a repeating cursor. Preserve immutable source search page and recompute continuation from trusted metadata.
- Worker input transports coreSources, snapshotJson, registryJson, wrapperSource, code, responseContextJson. No structured-clone object/functions are injected into VM: pass strings, parse/freeze inside guest; wrappers, console and serializer are guest-native. Registry contains serializable metadata/operation IDs. Worker returns only serialized strings; deadline covers getters/toJSON and serialization. Host validates/byte-budgets its final JSON-RPC envelope. VM remains trusted-agent containment, never claimed as a hostile-code sandbox.
- `AppLanguage.render({lang,searchPlaceholder,toggleLabel,footerTitle,footerGenerator}):void` owns DOM work only. RecipeChooser.mount returns setLang/dispose. Main mounts after ISM data readiness, passes openModal callback, updates language and disposes before remount. No MutationObserver or assumed hashchange handler; do not dispose on pagehide without bfcache restoration.

The core tests and MCP tests must cover recipe discovery, all view availability branches, snapshot changes from each served source class, page shrinking followed by lossless continuation, nested-result rejection, and cross-realm constructor/prototype refusal without injecting host functions. Existing app.ts remains <=1050 lines through the declared language-owner extraction.
