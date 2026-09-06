# wp1 — Liquid Glass material and guide

## Loop specification
C3 spec-satisfaction repair. Consumes wp0 research/design lock. Goal: find Liquid Glass by name and understand/operate its material semantics in the existing ISM modal. Non-goals: change catalog counts, reproduce proprietary optics, redesign shell. Stop: scoped gates and actual mobile/desktop interaction pass. Resource/scope/escalation rules: 000_plan.md.

## Exact change map
- MODIFY assets/data/isms.json only glassmorphism and refractive-glass-ui textual guidance/sources/examples as supported by 002 research; retain ids, palette, images and prompt provenance until wp3. Display name becomes Liquid Glass; Korean name includes 리퀴드 글래스. Explain Apple 27 refinements only if primary evidence is opened. Keep ten real examples; source documentation stays sources, never presented as product references.
- MODIFY assets/data/dev-guides.json glassmorphism and refractive-glass-ui values; unchanged schema. Replace transition all/filter, parallax recommendation, and all-glass widgets with transform/opacity feedback, opaque content, functional chrome, solid unsupported/high-contrast/transparency fallbacks and real contrast checks. Concrete build steps include fixed geometry and <=2 small blurred surfaces as local guidance, not Apple normative specification.
- NEW src/app-materials.ts, classic namespace AppMaterials. Export mount(root: HTMLElement, ismId: string, lang: 'ko'|'en'): void. Return immediately except refractive-glass-ui. Insert an accessible specimen after .modal-dev-guide. Native buttons switch three visible specimen scenes with aria-pressed; a checkbox toggles solid material, and a status paragraph explains selected state. Event listeners are attached only to the new subtree so modal replacement discards them. Use local arrays for demo scene UI text only, not catalog guide data. CSS-based optics approximation labelled honestly; sources linked to Apple material guidance and Aside observations.
- MODIFY src/app.ts openModal: after content is populated and export mounted, call AppMaterials.mount(content, ism.id, currentLang). Keep file <=1050 lines by compact call, no embedded guide payload.
- NEW assets/css/app-materials.css: scoped .material-lab selectors. Canvas is solid editorial content with deliberate simple geometric test field; toolbar alone gets backdrop-filter. Stable toolbar geometry, native >=44px targets, visible focus, no text clipping at 320px. A checked solid option, prefers-contrast:more, forced-colors and prefers-reduced-transparency collapse material to opaque. @supports guards blur, solid is base. Reduced motion removes transforms/transitions; no perpetual loops.
- MODIFY index.html: load app-materials.css after existing page CSS and app-materials.js before app.js; update affected cache query versions. MODIFY src/app.ts data/guide cache version when content changes.
- GENERATE assets/js/app-materials.js and assets/js/app.js with npm run build.
- MODIFY README.md and structure/README.md with material specimen and namespace owner; AGENTS.md with scoped lifecycle rule. No schema/plugin field changes.

## Before / after contract
Before: static generic refractive guide, no material interaction.
After: same #refractive-glass-ui resolves Liquid Glass; guide explains modern material semantics, live three-state content selector and solid-material comparison demonstrate them.

## Verification
Baseline npm run verify passed (000). npm run build then npm run verify checks TS/generated parity and unchanged catalog counts/schema. Inspect desktop 1440, tablet 768/1024, mobile 390/320. Activate each scene and assert underlying content + aria-pressed change. Toggle solid and observe computed backdrop-filter none. Emulate reduced motion and contrast/forced colors to trigger fallback; test @supports fallback by inspecting base solid CSS and runtime override if browser cannot emulate unsupported features. Escape closes modal and restores focus. Unrelated minimalism modal has no material specimen. No console/page errors or horizontal overflow. UI text and sources get manual review; static verification is not their oracle.

## Delegation
Worker writes new module/CSS, src/app.ts and index.html only. Main owns data/docs and generated build. Read-only reviewer audits complete unit. Reclaim after two distinct packet failures; no mid-B new worker scope.

## wp1 P stale check and worker split (2026-09-06)
Production git diff is empty after wp0. Original owner signatures unchanged. Add a second worker for 011 exact script scope, disjoint from material worker. Main owns actual data, ledger row and policy tip after validator contract is returned. Policy skeleton contains no actual approved changes until reviewed content is pinned. Sources continue read-only research. No broad build while workers mutate; main builds once integrated.
