# Phase 3 rendered verification

Implementation uses the shared version2 core through browser RecipeData, safe RecipeView and instance-owned RecipeChooser. AppLanguage extracts DOM updates while app.ts remains1046lines. Original Finderrepair98f7565 was cherry-picked retaining authorship; app callback now closes the native Finder before opening the ISM overlay and uses the visible Finder trigger for returnfocus.

Main ran the real browser scenario using the existing installed agbrowse Playwright dependency over localCDP, not a newdriver. The first harness assertion incorrectly searched for an unescaped recipeID inside Markdown (hyphens areescaped); it was corrected to check the actual copied title. The implementation correctly copied. Subsequent full scenarios passed.

Observed checks: closedzerorecipefetch;firstopen10filesonce;reopennorefresh;Node/browserSHAequal;all3recipesandallowedstylealternative;KO/ENselection/details/focuspreserved;confirmedclipboardandmanualfallback;lateclipboardresultignored;recipeISMmodalEscape/focus;Finder3answers/results/nativeclose/overlay/visiblefocusreturn;1440/1024/768/390/320widths;reducedmotion;200%text;longKO;503retry;brokenWebPfallback;Effects94cards94demotypesdesktop/mobile. No unexpectedpage/consoleerrors or horizontaloverflow.

Render loop: firstcapturesrevealedduplicateitemnamesandnarrowlabels. Main removedredundantnamecolumn,movedprimarycopynearheading,andCSSworkercompactedmobilepurposechoices. Finalcaptures13includeviewport,complete320pxcomponent,EN,manualcopy,error,reducedmotion,textscaleandlongKO. Allcapturemetadataisrecordedinignoredqa-artifacts/recipes/report.json. Main inspecteddesktop,tablet,mobileimages;dualindependentreviewsfollow.

No physicalmobilehardware,screenreaderorfieldperformancecertificationisclaimed. Clipboardbranchesuseexplicitresolved/rejectedbrowserAPIfixtures;actualcopytextandstatusareobserved. Eachscenarioownsandclosesitsbrowsercontext/tab. Thelocalserverandbaselineagbrowsepage remainowneduntilfinalteardown.

## Review-found regressions and capture corrections

A rapid modal open/close could restore focus, then the queued opening frame moved focus back into the hidden modal. Main reproduced restored:false/active:modal-close/closed:true, added a still-current-layer guard and persistent three-case frame-scheduler tests; actual same-frame browser reproduction is now green.

Independent functional review found Finder overflow at390px/200% text: inner375px vs scroll432px. The inherited12.5rem column minimum grew beyond availablewidth. Bound the minimum by100%, allowfieldsetshrink andactionwrap, and add internalFindergeometry assertion/capture toQA. ExistingundefinedFindercolor aliases nowreferdirectlytoAtlasmuted/text-safeaccent/focus tokens;controltargets44px.

Visual review passed newopenUI/CJK but rejected a longcomponentcapture asartifactclipping. Replaced it with exact320px top/middle/bottomviewport captures and200%top/middle/bottom, addedcomputedtypographyrecords, andwaitedforinitialloadingoverlaydetachbeforeclosedcapture. This is a capturecorrection, not an excuse to count badpixels asproof. Stylepreviewcaptionnowexplicitlysaysstyle reference.

## Final result

Functional review: PASS after Finder reflow repair. Independent16-condition matrix (KO/EN ×4widths×2textsizes) passed;390px/200% innerwidth375 equals scrollwidth375. DeterministicRAFregressions3/3passed; removingtheguardinmemorymade3/3fail. Visual/CJK review: PASS after titlesreceivedfullmobilerows andguidancewordingwasmadeconcise. NoopenHigh/Mediumfindings.

Finalrealbrowserrunrecords17validviewportcaptures, nopageoverflow/clippedtext/unexpectedconsoleerrors. Body13–14px/lineheight1.55/trackingnormal, enlarged26–28px; newrecipecontrols>=44px. Captionidentifiesstyle reference; existingstock/generatedreferenceisnotrepresentedasanassembledrecipepreview. Finalminorstatuskeep-allchange wasre-renderedbythecompleteQA scenario andobservedbymain.

Fullverify:19core+3dialog+25MCPCLI+106qualitytests passed;33generatedscriptsmatch;Finder144combinationsandallimage/navchecksremainpassed. Stage:7HTML,331PNG/331WebP,0forbidden,756files+manifest. app.ts1046lines under1050.

Trackedcaptures: [desktop](evidence/recipes-1440-ko.png), [mobile](evidence/recipes-390-ko.png), [narrow controls](evidence/recipes-320-middle.png), [200% text](evidence/recipes-mobile-text-scale-bottom.png), [Finder200%](evidence/finder-mobile-text-scale.png). The [browserreport](evidence/033_browser_report.json) retains allmeasurements/DOMtext/checks;additionalcapturesremaininignoredqa-artifacts.

## Teardown

AllQAcontexts/tabsclosedintheharnessfinallyblock. Theonebaselineagbrowse tabwasclosedbyitsrecordedtargetID;agbrowsestopcompletedandstatusreportedrunning:false,tabs:0. Theownednode serve-static processreceivedSIGTERM,itsmanagedsessionexited0,andlsofshowedno4187listener. Originalnativecheckoutstillmainahead1withthepre-existingFindercommit; noreset/rewriteoccurred.
