# Phase 3: recipe-led atlas and interaction verification

Depends on wp1 core; delivered after wp2 so documented MCP and browser share the final composition contract. C3 visible UI work.

## File delta

| Action | Path | Change |
| --- | --- | --- |
| NEW | src/app-language.ts | own existing updateLangUI DOM work; preserve placeholders, lang attribute, toggle label and footer strings |
| NEW | src/recipe-chooser.ts | independently mounted recipe controller and async data state; use shared core/recipes |
| NEW | assets/css/recipe-chooser.css | Atlas layout, chooser/details/preview composition, responsive and reduced-motion states |
| MODIFY | index.html | mount recipe section after catalog-entry and before existing filters; load three core scripts plus app-language and chooser in explicit order, stylesheet after theme/nav |
| MODIFY | src/app.ts | extract existing updateLangUI body into AppLanguage.render with supplied translated labels; mount/dispose/language-sync recipe controller; preserve initial hash and ISM modal callbacks; keep app.ts <=1050 lines |
| MODIFY | assets/css/finder.css, index.html | carry existing authored finder styling repair from 98f7565 without altering native checkout; preserve credit/history when feasible |
| NEW | scripts/qa-recipes.mjs | agbrowse script-mode scenario exporting default(ctx), settles fonts/images, performs user interactions, emits measurements and screenshot paths |
| GENERATE | assets/js/app-language.js, assets/js/recipe-chooser.js, assets/js/app.js | npm run build outputs |
| MODIFY | README.md, structure/README.md, AGENTS.md | shipped recipe experience, QA command and source ownership |
| NEW | devlog unit evidence images and numbered verification report | observed desktop/mobile screenshots, measured checks, exact revision and limitations |

## UI contract and layout

Use existing Atlas token surface and typography. Recipe heading describes task: KO '어떤 화면을 만들고 있나요?' / EN 'What are you building?'. Three purpose choices use native radio controls in a fieldset; desktop is a compact left selection list and a wider selected-detail column. Mobile places a short selector before the detail. No eighth page, nav change, marketing hero, duplicated catalog grid or framework.

Render title, brief rationale, a bounded real existing WebP preview with reserved aspect ratio, selected style/layout/type/color refs, essential vs helper/substitutable roles, constraints and checks. Use existing link routes (index.html#id, effects.html#id, domain.html#id); clicking a style ref MUST prevent fragment-only navigation and delegate openIsm: existing app.ts only reads hash at startup and has no hashchange listener. 'Copy brief' is the primary action; technical constraints and source attribution live under details. Do not show implementation internals unless they help choose/apply a recipe.

`RecipeChooser.mount({root,getLang,openIsm})` returns `{setLang,dispose}`. Fetch recipes first, then the ten versioned JSON source files when user expands/selects workflow; coalesce one promise. Boundary errors show retry; leave original catalog usable. Avoid full raw snippets in initial render. Selection is local (no conflict with #ism hash); after language change retain selection and opened details. Native controls provide keyboard behavior. Live status announces copy success/failure; clipboard rejection offers selectable textarea/manual copy, not false success.

Use textContent or escaped strings for all data-derived markup. Validate every link from domain/id mapping, never source-provided javascript URLs. async run token prevents stale completion after dispose/retry; teardown removes listeners and invalidates pending UI effects; call dispose before remount, not on pagehide without a bfcache restoration strategy. AppLanguage.render receives only lang/searchPlaceholder/toggleLabel/footerTitle/footerGenerator, never app state or t(). Preserve existing AppRuntime storage/history and loading behavior.

## Finder integration

The isolated origin/main baseline lacks CSS for the already present finder trigger/dialog. Reuse reviewed unpublished repair 98f7565 while retaining original commit authorship where possible; do not rewrite/delete the original commit. Verify trigger geometry, actual dialog open, all three answer stages, ranked result, Escape/backdrop/close and restored focus. New recipe UI does not take over Finder or alter existing recommendation outputs.

## QA and activation

Use existing agbrowse, no new browser driver. Command planned: `agbrowse script scripts/qa-recipes.mjs --allow-script --trace-out qa-artifacts/recipes -- http://127.0.0.1:4187`. Script should produce deterministic viewport captures (1440x900, 390x844), await document.fonts.ready and visible images with recorded outcome, assert no horizontal overflow and no browser console errors, and record target geometry/image failures. No arbitrary sleep masquerades as readiness.

Exercise selection and copy, KO/EN switch, source navigation/hash modal, keyboard tab/radio selection, Finder open/result/close/focus return, reduced-motion, long labels, empty/failed recipes fetch then retry, and clipboard denial fallback. Use request interception only in QA to trigger errors, restoring route afterward. Inspect screenshots with image viewer, fix visible issues and repeat affected states.

Run build -> full verify -> pages:stage; browser QA also covers Effects desktop/mobile card count 94 and unique demo type 94, no overflow/errors. Publish per-PR current SHA and hosted checks, with screenshot evidence. This does not certify screen readers or real mobile hardware.

## SoT and completion

Update all current docs and source/generated parity together. Preserve approved image manifests and 49/94/18 markers. Link I6/I7/I8 to ordinary PR against codex/design-codemode-mcp. Keep the unit in _plan until all phases finish, then move once to _fin and update links; record no merge/deploy performed.

## Binding contract clarification (reflection revision 2)

- `SourceSnapshot = {contractVersion:string,version:string,catalogs:CatalogPayload,recipes:unknown,guides:unknown,effectDocs:unknown,effectSnippets:unknown}`. Ten source files: the six catalogs, recipes.json, dev-guides.json, effects-docs.json, effects-snippets.json. Adapters calculate `SHA256(JSON.stringify([contractVersion, ...sortedPairs]))`, where sortedPairs are `[repositoryRelativePath,SHA256(exactFileBytes)]` sorted by path. Node uses node:crypto; browser uses crypto.subtle with the same UTF-8 encoding. Changing only a recipe or snippet changes version. Pure core takes the validated snapshot/version and performs no hashing IO.
- `design.recipes()` returns `{version,items:RecipeSummary[]}`; `design.recipes({id})` returns `{version,recipe:Recipe}` including allowed alternatives. It is an internal operation, not another public MCP tool.
- `design.compose({recipeId,selections?:Record<string,Ref>,lang?:'ko'|'en'})` returns `{version,composition,brief}`. Unknown slots, duplicate recipe/slot IDs, invalid lang and anti-pattern refs fail. Helper is a supporting role, not an optional/null selection; every declared slot is populated. Missing selections use defaults.
- Shared core view projection: `design.get({domain,id,view?:'summary'|'guide'|'code'|'full'}) -> {version,ref,view,data}`. Default summary uses ISM tagline/description or other domain summary. Guide is dev-guides[id] for ISMs, effects-docs[id] for Effects, relevant implementation fields for other domains; not image-guide prompts. Code returns full effects-snippets.snippets[id] or Layout/Motion snippet. Other code views return VIEW_UNAVAILABLE. Full returns the original catalog entry only.
- Search page is `{version,total,items,nextCursor:string|null,complete}`. Auto-shrink ONLY a directly returned, unmodified original search page; mark it privately in a WeakMap in guest wrappers, never trust a user-shaped object. Nested/projected results receive normal RESPONSE_TOO_LARGE. After sending n items from offset o, cursor advances to o+n, bound to normalized query/filter/version; complete only at the end. Zero fitting items means RESPONSE_TOO_LARGE, not a repeating cursor. Preserve immutable source search page and recompute continuation from trusted metadata.
- Worker input transports coreSources, snapshotJson, registryJson, wrapperSource, code, responseContextJson. No structured-clone object/functions are injected into VM: pass strings, parse/freeze inside guest; wrappers, console and serializer are guest-native. Registry contains serializable metadata/operation IDs. Worker returns only serialized strings; deadline covers getters/toJSON and serialization. Host validates/byte-budgets its final JSON-RPC envelope. VM remains trusted-agent containment, never claimed as a hostile-code sandbox.
- `AppLanguage.render({lang,searchPlaceholder,toggleLabel,footerTitle,footerGenerator}):void` owns DOM work only. RecipeChooser.mount returns setLang/dispose. Main mounts after ISM data readiness, passes openModal callback, updates language and disposes before remount. No MutationObserver or assumed hashchange handler; do not dispose on pagehide without bfcache restoration.

The core tests and MCP tests must cover recipe discovery, all view availability branches, snapshot changes from each served source class, page shrinking followed by lossless continuation, nested-result rejection, and cross-realm constructor/prototype refusal without injecting host functions. Existing app.ts remains <=1050 lines through the declared language-owner extraction.
