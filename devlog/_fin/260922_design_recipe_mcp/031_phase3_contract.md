# Phase 3: visible recipe selection within the Atlas

Previous D: PR12 delivers the compact MCP and Unix queries;25 transport+19 core tests, fullverify/stage and independent C audit passed. This phase turns the same catalog/recipe values into a usable index-page workflow. It follows030; the source contract is now design-catalog/2 with Composition.lang.

## Concrete presentation

Retain current Atlas colors/type/ruled specimen geometry and existing WebP images. Design variance4,motion2,densityD4. This is a repeated-use reference tool, not a marketing landing page. No new bitmap is needed: every selected style already has approved previews. Image generation is authorized if a real gap appears, not required as decoration.

Add a section after catalog-entry, before filters, with native details#recipe-workbench.recipe-workbench. Its summary contains a bilingual title, short purpose and text action; initial closed state keeps the catalog visible and performs no10-file fetch. Opening is the user's single entry action. Nested section body has dataset.state=idle/loading/ready/error. Loading is plain status with stable height, error includes retry, and the main catalog remains usable.

When loaded: fieldset with three native radio choices on the left; selected-detail on the right. Mobile uses one column. Detail contains title/summary, real selected-style first WebP preview with reserved aspectratio, six compact slot rows (label,role,selecteditem,allowed alternative select,source link), primary Copy brief button, live status and collapsible constraints/checks/source links. A selection only accepts authored alternatives. It is design guidance, never product verification. Native select controls earn their place because they express the allowed substitutions; no arbitrary sliders.

## File ownership and explicit DOM contract

UI logic worker writes src/recipe-data.ts, src/recipe-view.ts, src/recipe-chooser.ts only. Each is<500lines, namespace/no imports/classic scripts. Core uses frozen values.

- RecipeData.load({signal?}):Promise<{snapshot:DesignCatalog.Snapshot,recipes:readonly DesignRecipes.Recipe[]}>. Fetch exact DesignCatalog.SOURCE_FILES (ten files), preserve ArrayBuffer bytes and compute each SHA256 plus sorted-path aggregate via crypto.subtle with exactly Node's algorithm and CONTRACT_VERSION. Parse validated source payload; then create/parse. No public caller-controlled URL/path. Caller caches one successful/pending load; rejected load is cleared for retry. No partial or guessed version. Abort dispose/retry requests, do not log expected failure as console error.
- RecipeView exports a render function used by chooser and safe helpers; use textContent or deliberate escaping, never interpolate unvalidated URLs. All source links must be HTTPS. Domain links map fixedpages+encodedID; only ISM link click delegates openIsm.
- RecipeChooser.mount({root:HTMLElement,getLang:()=>Lang,openIsm:(id,trigger)=>void}) returns {setLang(lang),dispose()}. root is the static details#recipe-workbench. Use delegated events; only first open startsload. Maintain selected recipe, per-recipe slot selections, nested details open states and manual-copy value. Lifecycle generation invalidates stale async completions. Dispose aborts fetch and removeslisteners; call before remount, not pagehide. Language changes preserve selection and focusedcontrol by data-focus key. No global public mutation facade.
- Stable classes for CSS/QA: .recipe-summary, .recipe-summary-copy, .recipe-summary-title, .recipe-summary-text, .recipe-summary-action; .recipe-body; .recipe-layout; .recipe-options; .recipe-option; .recipe-option-title; .recipe-option-summary; .recipe-detail; .recipe-detail-heading; .recipe-title; .recipe-description; .recipe-preview; .recipe-preview img; .recipe-slots; .recipe-slot; .recipe-slot-label; .recipe-slot-role; .recipe-slot-name; .recipe-slot-select; .recipe-source-link; .recipe-actions; .recipe-copy; .recipe-status; .recipe-more; .recipe-guidance; .recipe-error; .recipe-retry; .recipe-manual-copy; .recipe-manual-copy textarea.
- Stable attributes: root data-state; radio name=recipe-choice value=recipeId; select data-slot=slotId; source links data-domain/id; action buttons data-action=copy/retry; focusable rerender targets data-focus=stablekey; nested details data-detail=guidance; status role=status aria-live=polite. No fixed duplicateIDs.

Style/HTML worker writes assets/css/recipe-chooser.css and index.html only AFTER main integrates Finderrepair. Reuse classes above, Atlas CSS variables and fonts. Native summary/radio/select visuals remain clear with44px touch height, visiblefocus, semantic headings, short balanced Korean copy. Desktop selection/detail grid minmax columns; <=1024 tighten; <=640 stack;320nooverflow. Hide or replace no essential content. Source links/references wrap safely. Color-only role differentiation forbidden. Use no gradients/newfonts/emojiglyphs/decorativeicons. Open/closed summary action must accurately describe state.

index.html staticmount: `<details class="recipe-workbench" id="recipe-workbench" data-state="idle"><summary class="recipe-summary"><span class="recipe-summary-copy"><span class="recipe-summary-title">화면에 맞는 조합 찾기</span><span class="recipe-summary-text">제품 소개, 읽기, 설정 화면에 쓸 재료를 골라보세요.</span></span><span class="recipe-summary-action" aria-hidden="true">열기</span></summary><div class="recipe-body"></div></details>` inside a labelled section or with aria-label localizedbycontroller. Native details supplies expandedstate. Include no-JS note if needed.

Script order beforeapp.js: design-contracts,catalog,search,views,recipes;recipe-data,recipe-view,recipe-chooser;app-language. Existing app-dialog/runtime/finder/material ordering unchanged. New stylesheet aftertheme/nav; use cacheversion20260922-recipes fornew/changed URLs.

Main owns src/app-language.ts (NEW), app.ts integration, scripts/qa-recipes.mjs (NEW), tests/verification/docs/package/generatedoutputs. Beforeworkerswrite, main cherry-picks98f7565 preservingoriginalauthor into thisbranch; originalnativecheckout staysunchanged. This includes alreadyexistingFinderCSSrepair/indexhints and itsoriginaldevlog. Main inspects payloadforprivatepaths beforepublication.

AppLanguage.render({lang,searchPlaceholder,toggleLabel,footerTitle,footerGenerator}) migrates existing language DOMupdates. Also localize existing Findertrigger/title/close and catalog-entrycopy/linklabel so newworkflowdoesn'tcreatepartiallocale. Main app wrapperstillowns translations/currentLang/storage. app.ts mountsrecipecallbackafterISMload, disposespriorcontroller, callssetLangaftertoggle. Do not grow app.ts beyond1050.

## Clipboard and async boundaries

Copy formats currentcanonicalcomposition using DesignRecipes.formatBrief; await navigator.clipboard.writeText, thenannounceconfirmedcopied. If absent/rejected, render labelled readonlytextarea withfullbrief and select/focusit for manualcopy. Neverclaimcopiedonfailure. Selectionorlanguagechange invalidates oldcopycompletion; no stale confirmation. Whilecopyingdisablecopy or trackgeneration. Imageonerror shows labelled unavailable state, not brokenimg or fallbackPNG flood.

## Verification

Main test script exports default async(ctx) for installedagbrowse and creates/closes a dedicatedtab. No newdriver. It sets exact viewportvia page.setViewportSize; routesonlylocalfixturedatafornegativecases; waitsfor ready/selectors/fonts/visibleimages withboundedrecordedconditions; capturesobservedscreenshots. Covers1440/1024/768/390/320widths,KO/EN,longtext,200%textscale,reducedmotion,all3recipes/alternative,copyconfirmed+clipboarddenial,fetchfailure+retry,languageandfocuspreservation,existingISMmodalopen/close/focusreturn,Finder3answers/ranking/Escape,Effectsbothviewports94cards94demotypes. Base happyflowszeroconsoleerrors/overflow; expectedinjectedfailureseparatelyclassified.

ComparebrowsercomputedversiontoNode snapshotversion. ScreenshotmetaPNGsignature/nonempty/dimensions checked; main viewseachviewport anddualindependentreviewersassessvisual/functionalandCJK. Outputs liveinignoredqa-artifacts duringiteration; selectedcleanPNG/screenshotsplusnumberedreceipt trackedwithnopersonalpaths. Fullbuild->verify->stage andcurrentheadhostedchecks beforePRready. Sourceboundreceiptlastafteredits. Closeowntab/serverafterfinalQA, preserveuserbrowserstate.

## D11–D15 dispositions

D11 ACCEPT: initially closed disclosure, zero additional requests until open, no repeat on close/reopen. D12 ACCEPT WITH OWNERSHIP CLARIFICATION: RecipeData.load({signal?}) performs one request per exact path and retains no module-global snapshot cache; RecipeChooser caches its single promise/success and clears failure. This makes dispose/abort ownership explicit and avoids retaining rawbytes/JSON/validatedsnapshot simultaneously. Existing app independently fetches ISM/guides; no network deduplication against those differently versioned requests is claimed.

D13 ACCEPT: three files IO/controller/view, all<500lines; view never fetches/composes. D14 AMEND: keep the exact root IDs/classes/attributes already specified in this031 document (`recipe-workbench`, `.recipe-body`, `data-slot`, `data-domain/id`, `data-action`, `data-detail`, `data-focus`) so CSS/controller/QA share one vocabulary; no parallel alternate identifiers. Option values are domain/id and controller validates against authored alternatives. D15 ACCEPT: restore focus only if it was inside this component, never steal focus from languagebutton; preserve nested details and per-recipe alternatives. Intercept only unmodified primary ISM clicks so open-in-new-tab still works. Selected image file/id are validated before constructing fixedpreviewpath.

Additional acceptance: record zero new recipe-path requests while closed; exactlyonefetchperpathonfirstopen and noadditionalfetchonreopen; Node/browser SHA agreement; retryafterinjectedfailure. Use clipboard copygeneration guard and clear/refresh manualcopytext whenselection/lang changes.

Same consultant reflection of concrete031 returned ALIGNED: D11-D15 cache/abort ownership, DOM contract, exacthash, language/focus selection and error/race tests are consistent.

Independent A PASS includes mandatory Finder transition repair/QA: Finder result currently callsopenModal withoutclosingnative dialog. App-ownedwrappermustcloseFinderbeforeISMoverlayandusevisiblefinder-triggerasreturnfocus. Cmustopennativeresult, verifyFinderclosedandISMkeyboardusable, Escapeandconfirmvisibletriggerfocus. Sourceverified;browserimpactnotyetclaimed. This fitsissue8.

## QA runtime adjustment (observed capability)

Installed agbrowse0.2.1 starts Chrome but has no script command; its documentation advertised a newer capability. The local development CLI also fails to load because archiver is not installed. Do not install/replace either tool. The existing global agbrowse package already contains playwright-core. scripts/qa-recipes.mjs will support direct Node execution with DESIGN_QA_RUNTIME pointing to that installed package.json (resolved outside the repo), and connect to the already-running loopbackCDP. This is the same existing browser runtime with an explicit dependency path, not a new driver. Keep an exportedscenariofunction for future script-mode use. Create/close a dedicatedcontext and tab; no user's pages or sessions are driven. Tests still use source-grounded selectors and exactviewports.

## Render-grounded adjustment

First real browser run passed behavior checks at1440/1024/768/390/320, including data-hash parity and Finder modal handoff. Main read desktopEN and390/320KO captures: selected-name text duplicated each native select, narrow5rem labels wrapped unnecessarily, and mobile radio descriptions repeated the selected detail. Remove redundant selected-name nodes, widen desktoplabelcolumn, move copyaction next to selecteddescription, and hide radio optiondescriptions onmobile while keeping selectedrecipe description. No information needed to apply the selected recipe is removed. QA capture now measures actualstickyheaderheight before positioning, instead of clipping the summary with an85px assumedheader. Additional tests cover stale clipboard completion and brokenpreview fallback.

## C-discovered modal regression correction

Repeated realbrowserQA exposed rapidclosebeforeopen'srequestAnimationFrame. A deterministicreproductionreturned restored:false,active:modal-close,closed:true. AppDialogA11y nowexecutesinitialfocusonlywhenitslayerisstilltopandtargetconnected. Addscripts/app-dialog.test.mjs totheexistingverify pipeline: explicitqueuedframesproveclose-beforeframe,newerlayeranddetachedtargetbehavior. ThebrowserQAalsoopen/closesinthesameframeandchecksaftertheframe;thisisnotfixedbyretryorsleep. Updateapp-dialogscriptcacheversioninindex. Scopefitsissue8'sfocuscontract.
