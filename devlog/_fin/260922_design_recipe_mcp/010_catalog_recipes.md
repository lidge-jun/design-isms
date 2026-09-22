# Phase 1: shared catalog and recipe contracts

Depends on wp0 roadmap. Goal: one pure, tested core usable by both browser and Node. No rendered UI/MCP transport in this phase.

## File delta

| Action | Path | Change |
| --- | --- | --- |
| NEW | src/design-contracts.ts | DesignCatalog namespace types: Domain = isms/effects/color/typography/layout/motion; Ref = {domain,id}; Summary = {ref,name,nameKr,summary,kind?}; Snapshot with version, catalog arrays and lookup |
| NEW | src/design-catalog.ts | validate and index supplied catalog payload, deterministic search, typed ref resolution and summary projection; no DOM or load-time IO |
| NEW | src/design-recipes.ts | recipe parsing, allowed-selection checking, composition and brief formatting |
| NEW | assets/data/recipes.json | versioned three-recipe source; refs/roles/constraints only, own bilingual labels and attribution |
| NEW | scripts/design-core-loader.mjs | load explicit generated core allowlist with node:vm, read the ten fixed repository JSON paths, compute complete snapshot SHA, expose Node API |
| NEW | scripts/design-core.test.mjs | node:test core acceptance and invalid-input fixtures using real catalog snapshot |
| MODIFY | package.json | add test:design-core and include it in verify; existing build stays tsc -p tsconfig.json |
| GENERATE | assets/js/design-{contracts,catalog,recipes}.js | npm run build, committed classic scripts |
| MODIFY | README.md, structure/README.md, AGENTS.md | document shipped core/recipe SoT and unchanged catalog counts |

## Complete interface and data contract

`DesignCatalog.create(source: SourceSnapshot)` returns a validated snapshot. source.catalogs contains six existing arrays; source.version is the adapter-supplied ten-file content hash. source also carries recipes, guides, effectDocs and effectSnippets. Reject duplicate IDs, invalid/missing base fields, unsafe IDs and unknown domains. The core keeps a private index or immutable copies, never mutates inputs.

`DesignCatalog.search(snapshot,{query,domains?,limit?,cursor?})` returns `{version,total,items,nextCursor,complete}`. Defaults: query empty lists entries, limit 6, max 30. Normalize Unicode and case, resolve exact IDs/names/aliases first, token-match keywords/tagline/summary/alsoCalled/bestFor next. Stable tie order domain/id. Exclude kind=anti-pattern from discovery. Empty and no-match results are truthful. Cursor binds normalized query/filters/offset/version; malformed/stale cursors fail.

`DesignCatalog.resolve(snapshot,{domain,id})` returns one read-only entry or stable unknown-reference error for internal composition. Public DesignCatalog.get(snapshot,{domain,id,view?}) returns the version/ref/view/data envelope specified below. Explicit get allows ai-slop diagnosis. No file path or arbitrary object member access.

Recipe shape: `{version:1,recipes:[{id,title:{ko,en},summary:{ko,en},slots:[{id,label:{ko,en},role:'essential'|'helper'|'substitutable',default:{domain,id},alternatives:[Ref]}],constraints:[{ko,en}],checks:[{ko,en}],sources:[{url,license,note}]}]}`. Select defaults from existing IDs, with at least style/layout/color/typography/effect/motion where justified. Not every recipe needs every domain. Content is authored, references immutable existing data.

`DesignRecipes.parse(raw,snapshot)` validates every default and alternative; rejects ai-slop, unknown fields/roles, duplicate slot IDs and cross-domain alternatives. `compose(snapshot,recipes,{recipeId,selections?,lang?})` validates replacements against the slot's allowlist and returns `{version,recipeId,title,slots:[{id,role,ref,item}],constraints,checks,sources}`. Evidence is design guidance, not runtime-tested implementation. `formatBrief(composition,lang)` returns plain Markdown with refs, constraints, checks and source URLs, no claims of verified product behavior.

Whole field chain: JSON recipe creation -> JSON transport unchanged -> parse at browser/Node load -> compose + chooser + MCP get/compose -> formatBrief. Source arrays are read by both adapters; no derivative catalog data files.

## Build order and ownership

Core worker owns design-contracts.ts/design-catalog.ts. Recipe worker owns design-recipes.ts/recipes.json. Main owns loader, tests, package/docs and build. Same checkout; no worker git operations. New script loader is justified by existing verify-finder VM convention but loads pure core only. Existing Finder and DesignExport remain unchanged.

## Verification and activation

Planned command `node --test scripts/design-core.test.mjs` becomes runnable here. Assert real 233 snapshot count, KO/EN/alias search, deterministic tie ordering, cursor continuation and stale rejection, duplicate refs, invalid domain/id, three valid compositions, forbidden alternative and anti-pattern selection, full source fields preserved, brief links, no DOM globals. Compare Node loader output with generated core VM receiving same data. Existing verify:finder protects legacy recommendations. Run build -> verify -> pages:stage and inspect no scripts/mcp/docs leaked into .pages. Expected negative cases are explicit test assertions, not merely error logs.

Publish ordinary PR against codex/design-foundations, with I2/I3 references and exact-head CI proof. No merge/deploy.

## Binding contract clarification (reflection revision 2)

- `SourceSnapshot = {contractVersion:string,version:string,catalogs:CatalogPayload,recipes:unknown,guides:unknown,effectDocs:unknown,effectSnippets:unknown}`. Ten source files: the six catalogs, recipes.json, dev-guides.json, effects-docs.json, effects-snippets.json. Adapters calculate `SHA256(JSON.stringify([contractVersion, ...sortedPairs]))`, where sortedPairs are `[repositoryRelativePath,SHA256(exactFileBytes)]` sorted by path. Node uses node:crypto; browser uses crypto.subtle with the same UTF-8 encoding. Changing only a recipe or snippet changes version. Pure core takes the validated snapshot/version and performs no hashing IO.
- `design.recipes()` returns `{version,items:RecipeSummary[]}`; `design.recipes({id})` returns `{version,recipe:Recipe}` including allowed alternatives. It is an internal operation, not another public MCP tool.
- `design.compose({recipeId,selections?:Record<string,Ref>,lang?:'ko'|'en'})` returns `{version,composition,brief}`. Unknown slots, duplicate recipe/slot IDs, invalid lang and anti-pattern refs fail. Helper is a supporting role, not an optional/null selection; every declared slot is populated. Missing selections use defaults.
- Shared core view projection: `design.get({domain,id,view?:'summary'|'guide'|'code'|'full'}) -> {version,ref,view,data}`. Default summary uses ISM tagline/description or other domain summary. Guide is dev-guides[id] for ISMs, effects-docs[id] for Effects, relevant implementation fields for other domains; not image-guide prompts. Code returns full effects-snippets.snippets[id] or Layout/Motion snippet. Other code views return VIEW_UNAVAILABLE. Full returns the original catalog entry only.
- Search page is `{version,total,items,nextCursor:string|null,complete}`. Auto-shrink ONLY a directly returned, unmodified original search page; mark it privately in a WeakMap in guest wrappers, never trust a user-shaped object. Nested/projected results receive normal RESPONSE_TOO_LARGE. After sending n items from offset o, cursor advances to o+n, bound to normalized query/filter/version; complete only at the end. Zero fitting items means RESPONSE_TOO_LARGE, not a repeating cursor. Preserve immutable source search page and recompute continuation from trusted metadata.
- Worker input transports coreSources, snapshotJson, registryJson, wrapperSource, code, responseContextJson. No structured-clone object/functions are injected into VM: pass strings, parse/freeze inside guest; wrappers, console and serializer are guest-native. Registry contains serializable metadata/operation IDs. Worker returns only serialized strings; deadline covers getters/toJSON and serialization. Host validates/byte-budgets its final JSON-RPC envelope. VM remains trusted-agent containment, never claimed as a hostile-code sandbox.
- `AppLanguage.render({lang,searchPlaceholder,toggleLabel,footerTitle,footerGenerator}):void` owns DOM work only. RecipeChooser.mount returns setLang/dispose. Main mounts after ISM data readiness, passes openModal callback, updates language and disposes before remount. No MutationObserver or assumed hashchange handler; do not dispose on pagehide without bfcache restoration.

The core tests and MCP tests must cover recipe discovery, all view availability branches, snapshot changes from each served source class, page shrinking followed by lossless continuation, nested-result rejection, and cross-realm constructor/prototype refusal without injecting host functions. Existing app.ts remains <=1050 lines through the declared language-owner extraction.

## Authored default references

| Recipe | Style | Layout | Color | Typography | Effect | Motion |
| --- | --- | --- | --- | --- | --- | --- |
| product-landing | minimalism | layout-hero-centered | saas-trust-blue | outfit-pretendard-product | sticky-cta-bar | motion-fade |
| editorial-reading | editorial-typography | layout-grid-magazine | media-editorial | noto-serif-sans-kr-readable | scroll-reveal | motion-scroll-reveal |
| settings-workspace | minimalism | layout-form-settings | tailwind-slate-blue | outfit-pretendard-product | toast | motion-expand-collapse |

Each cell uses the corresponding domain (isms/layout/color/typography/effects/motion). Layout and typography are essential, style/color are substitutable, effects/motion are supporting helpers. Alternatives are explicit, same-domain references selected from current data; no automatic mood-only replacement. Landing alternatives: bauhaus, layout-hero-full-media, minimalism-neutral, noto-serif-sans-kr-readable, copy-confirmation, motion-ease-in-out. Editorial alternatives: minimalism, layout-content-timeline, minimalism-neutral, gowun-batang-pretendard-calm, tooltip, motion-fade. Settings alternatives: bauhaus, layout-form-multi-step, github-primer-light, noto-serif-sans-kr-readable, inline-validation, motion-fade. No alternative is a claim that both complete compositions have been runtime-verified.
