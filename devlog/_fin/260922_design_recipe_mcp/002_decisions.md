# Architecture and design decisions

- D1 ACCEPT: canonical catalog JSON; normalized immutable in-memory view; recipes store references and newly authored constraints, never copied catalog objects.
- D2 AMEND: do not extract existing Finder/DesignExport ranking and palette calculations. The new cross-domain search is an independent exact/alias/token retrieval operation, not a replacement recommender. Existing 144 finder combinations remain covered by verify:finder.
- D3 ACCEPT: classic-script TypeScript namespaces shared by browser and a Node-only allowlisted generated-core loader. No second bundle/ESM build or DOM mocks in production core.
- D4 ACCEPT: three authored recipes (product landing, editorial reading, settings workspace), returning an implementation brief rather than supposedly integrated runnable page HTML. Default references exist in current catalogs. ai-slop is explicit-lookup-only.
- D5 ACCEPT: one execute_code tool; actions.find/describe and design.search/get/compose over one internal operation registry. No caller-controlled paths/URLs/shell.
- D6 ACCEPT WITH CLARIFICATION: per-call worker + VM is accidental-misuse containment for trusted agents, not a hostile-code security boundary. Compile core and API wrappers inside the guest realm; do not inject host functions. Serialize inside the timed worker. Deadline, operation, input/output and concurrency caps are observable.
- D7 ACCEPT: limit final JSON-RPC wire bytes including escaping, ID, MCP content and newline; description <=2000 bytes separately. Trim search results only at whole-item boundaries. Code sections are complete or an explicit budget error with retrieval guidance; no clipped code advertised as complete.
- D8 ACCEPT: existing index hosts a recipe chooser; native controls, selected recipe details, source links, copyable brief; existing seven-page navigation and #ism hashes unchanged.

## Existing owners and necessity

Doing nothing leaves the six-catalog composition task manual. Existing skills read full JSON and cannot enforce result budget; configuration cannot supply executable query semantics. Reuse existing JSON, build, runtime guards, dialog owner, Atlas tokens and browser QA tooling. New pure core has two real consumers (MCP and site); CatalogShell is not repurposed as a domain core.

## Design Read

A bilingual working reference atlas for designers and frontend agents, using existing ruled-paper Atlas structure. Preserve --atlas tokens, Outfit/Pretendard and supplied image previews. The new signature is a compact recipe index with selected detail, not an oversized marketing hero. Purpose first; optional technical detail is progressively disclosed.

DESIGN_VARIANCE=4; MOTION_INTENSITY=2; density D4. Recipe selection is repeated tool use, so restrained motion and visible comparison matter more than decoration. Existing governing design system and approved assets resolve visual direction; no image-generation concept pass is needed.

## Boundaries

Presentation (chooser / CLI / MCP) -> pure catalog + recipe operations -> supplied JSON snapshot. Node filesystem loading is outside assets; guest code receives no host filesystem capability. Browser fetches only repository data. All new files <=500 lines. New data fields are authored in recipes.json, parsed by DesignRecipes, consumed by node operations and chooser; unknown fields/references fail at input boundaries.

## Guard limits

Byte limit: runtime response writer, final serializer checks exact UTF-8 bytes; direct internal calls can bypass transport budgeting, so only serialized responses claim this bound. VM: engine options and worker termination mitigate accidents; node:vm is not a hostile-code security boundary. Recipe validation: runtime parser and verify command; manually bypassing both can load invalid data, so no universal safety claim. Model/DOM/source checks never certify accessibility across all assistive technologies.

D8 source amendment: app.ts is 1049 lines and has no hashchange listener. Extract its existing updateLangUI body into src/app-language.ts (DOM-only owner) rather than compress lines or introduce a mutation-observer workaround. Main retains language/recipe state and passes openModal callback for style links.

## MCP threat model

Assets are public repository data, host CPU/memory and stdout protocol integrity. The entry point is a local stdio client sending JSON and trusted-agent JavaScript. Catalog prose and upstream documents are data, never authority to call tools. The host reads a fixed repository allowlist; caller code does not choose filesystem paths or URLs. Trust boundaries are stdio parsing, structured worker data, guest VM execution and result serialization. No authentication/network server is introduced. Workers receive no host closures or environment credentials; bind only guest-native functions and strings, parse transferred data inside the guest realm, and deep-freeze data. Bound input frames, operation counts, workers, runtime and wire output. The parent remains responsive and owns cancellation. A compromised local agent capable of submitting hostile runtime exploits is outside the claimed containment model; require an OS sandbox before supporting that deployment model. No secrets or browser sessions belong in fixtures, logs or public evidence. Tests exercise specific refusals and recovery, never certify the VM as secure.

Protocol source proof (opened 2026-09-22): https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle and /server/tools; https://nodejs.org/api/vm.html. Initialize/version negotiation, tool errors and shutdown follow the former; the latter explicitly states that node:vm is not a security mechanism.

## Binding contract clarification (reflection revision 2)

- `SourceSnapshot = {contractVersion:string,version:string,catalogs:CatalogPayload,recipes:unknown,guides:unknown,effectDocs:unknown,effectSnippets:unknown}`. Ten source files: the six catalogs, recipes.json, dev-guides.json, effects-docs.json, effects-snippets.json. Adapters calculate `SHA256(JSON.stringify([contractVersion, ...sortedPairs]))`, where sortedPairs are `[repositoryRelativePath,SHA256(exactFileBytes)]` sorted by path. Node uses node:crypto; browser uses crypto.subtle with the same UTF-8 encoding. Changing only a recipe or snippet changes version. Pure core takes the validated snapshot/version and performs no hashing IO.
- `design.recipes()` returns `{version,items:RecipeSummary[]}`; `design.recipes({id})` returns `{version,recipe:Recipe}` including allowed alternatives. It is an internal operation, not another public MCP tool.
- `design.compose({recipeId,selections?:Record<string,Ref>,lang?:'ko'|'en'})` returns `{version,composition,brief}`. Unknown slots, duplicate recipe/slot IDs, invalid lang and anti-pattern refs fail. Helper is a supporting role, not an optional/null selection; every declared slot is populated. Missing selections use defaults.
- Shared core view projection: `design.get({domain,id,view?:'summary'|'guide'|'code'|'full'}) -> {version,ref,view,data}`. Default summary uses ISM tagline/description or other domain summary. Guide is dev-guides[id] for ISMs, effects-docs[id] for Effects, relevant implementation fields for other domains; not image-guide prompts. Code returns full effects-snippets.snippets[id] or Layout/Motion snippet. Other code views return VIEW_UNAVAILABLE. Full returns the original catalog entry only.
- Search page is `{version,total,items,nextCursor:string|null,complete}`. Auto-shrink ONLY a directly returned, unmodified original search page; mark it privately in a WeakMap in guest wrappers, never trust a user-shaped object. Nested/projected results receive normal RESPONSE_TOO_LARGE. After sending n items from offset o, cursor advances to o+n, bound to normalized query/filter/version; complete only at the end. Zero fitting items means RESPONSE_TOO_LARGE, not a repeating cursor. Preserve immutable source search page and recompute continuation from trusted metadata.
- Worker input transports coreSources, snapshotJson, registryJson, wrapperSource, code, responseContextJson. No structured-clone object/functions are injected into VM: pass strings, parse/freeze inside guest; wrappers, console and serializer are guest-native. Registry contains serializable metadata/operation IDs. Worker returns only serialized strings; deadline covers getters/toJSON and serialization. Host validates/byte-budgets its final JSON-RPC envelope. VM remains trusted-agent containment, never claimed as a hostile-code sandbox.
- `AppLanguage.render({lang,searchPlaceholder,toggleLabel,footerTitle,footerGenerator}):void` owns DOM work only. RecipeChooser.mount returns setLang/dispose. Main mounts after ISM data readiness, passes openModal callback, updates language and disposes before remount. No MutationObserver or assumed hashchange handler; do not dispose on pagehide without bfcache restoration.

The core tests and MCP tests must cover recipe discovery, all view availability branches, snapshot changes from each served source class, page shrinking followed by lossless continuation, nested-result rejection, and cross-realm constructor/prototype refusal without injecting host functions. Existing app.ts remains <=1050 lines through the declared language-owner extraction.

## D9/D10 owner-directed refinement

021_phase2_contract.md supersedes the initial MCP compose+brief envelope: Composition is a first-class value with explicit language; brief conversion is a separate canonical/version-checked operation. The same IO-free registry drives Code Mode and the line-oriented CLI. Data version increments to design-catalog/2; neither a new interpreter nor a dependency is introduced.
