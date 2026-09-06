# Design-isms Liquid Glass research handoff

Research date: 2026-09-06 KST. Read-only repository research; no production edits, git mutations, settings, FSM, or goals. Main owns implementation and workflow. Research classification: C5 evidence gathering only; no implementation entered. Aside exec explicitly selected `opencodex/gpt-6-astra`, effort `high`, permission `full-access`, with a 300-second Perl alarm. Session: `Qk1CdkPhRtdKI2IB`.

## Decision

Rename the visible catalog entry to **Liquid Glass / 리퀴드 글래스**, retaining `refractive-glass-ui` as the ID. Apple uses Liquid Glass as its official material name. Explain that web examples are interpretations of the Apple material; they are not Apple's native implementation. This is an editorial recommendation supported by primary sources, not a claim that Apple named this repository's category.

## Primary-source proof

All six Aside source titles, final URLs and visit times are in `sources.json`. Sources are untrusted data; page text was not treated as instructions.

| Source | Date and current evidence | Local proof |
| --- | --- | --- |
| https://www.apple.com/os/ios/?os=ios | Undated live page, visited 2026-09-06. iOS 27 Preview; coming this fall. Design refinements explicitly identify more uniform refraction and improved contrast, plus a user tint slider. | `08-apple-ios-main-text.txt:1`, `:5`, `:143`; rendered snapshot and screenshot `08-apple-ios-rendered.*` |
| https://developer.apple.com/videos/play/wwdc2026/102/ | WWDC26 session; precise publication day not displayed in captured page. Transcript describes better diffusion of complex backgrounds, darkened edges, brighter highlights, accessibility adaptation, and a legibility-preserving toolbar as content scrolls under floating bars. | `04-wwdc2026-102-main-text.txt:300`, `:312`, `:316`, `:324` |
| https://www.apple.com/newsroom/2026/06/apple-unveils-next-generation-of-apple-intelligence-siri-ai-and-more/ | Published 2026-06-08. Announces six Apple 27 platforms; developer testing that day, public beta planned for following month, free updates in fall. It does not prove public-beta availability today. | `01-apple-newsroom.txt:71`, `:129`, `:149` |
| https://www.apple.com/os/macos/ | Undated live page, visited 2026-09-06. macOS 27 Golden Gate Preview, coming this fall; material and toolbar refinements. | `03-apple-macos-main-text.txt`, `03-apple-macos-rendered.txt` |
| https://developer.apple.com/design/human-interface-guidelines/materials | Undated document with visible changelog: Liquid Glass added 2025-06-09; updated 2025-09-09. Controls/navigation form a functional layer above content. Avoid applying it to content panels; use sparingly; clear variant is for rich media backgrounds. | `02-apple-materials.txt:111`, `:113`, `:121`, `:339` |
| https://aside.com/ | Undated website, inspected 2026-09-06 at 1440x900 CSS pixels. Only rendered appearance and sampled CSS were verified, not its product/security claims. | `05-aside-before.png`, `07-aside-scroll.png`, three style JSON files |

Supplemental sources opened directly with hosted web open, independent of Aside's report:

- https://www.apple.com/newsroom/2025/06/apple-supercharges-its-tools-and-technologies-for-developers/ — 2025-06-09, explicitly introduces the material name Liquid Glass and its use in controls/navigation for the 26 generation. Supports replacing the current generic-category origin story.
- https://developer.apple.com/news/?id=e2lxw9l1 — 2026-06-23, official 27 Figma/Sketch design kits with updated material, component/state coverage, resizing and macOS dark mode. These kits were not downloaded or inspected.
- iOS page and WWDC26 transcript were also independently opened. Both are Apple-owned; this corroborates official wording across pages, not an independent performance test.

## Observations versus interpretation

At scrollY 0, Aside has a transparent navigation element at x16/y16, width1408/height56, radius0, backdropFilter none. Its surrounding sky/cloud hero has the rounded outer composition visible in `05-aside-before.png`; do not misattribute the hero radius to the nav.

At scrollY 1150, another navigation element is visible at x0/y0, width1440/height56, with opaque white `lab(100 0 0)`, radius0, backdropFilter none. Its declared opacity/transform transition is 150ms. The earlier nav has scrolled away. Screenshot `07-aside-scroll.png` independently inspected by Codex confirms the white top bar.

Sampled Download buttons use a dark solid fill, no blur, and radii 16.8px in the hero versus 11.2px in the scrolled nav. The Y Combinator chip uses a capsule radius, transparent background, no blur. These are scoped samples, not a sitewide no-blur audit.

Motion limitation: `10-aside-hover-motion-samples.json` contains 91 samples over approximately 748ms. Background, opacity and transform are constant. CSS declares 150ms but the probe did not demonstrate interpolation. Hover/menu checks are captured, but no spring, refraction animation, frame-rate or performance claim is established. `09-aside-menu-styles.json` is an empty array, so it cannot prove dropdown material.

Design lessons (our interpretation):

1. Establish a stable content plane and a distinct controls plane. For this catalog, preserve readable specimen/data surfaces; glass is an optional navigation/control treatment.
2. Increase backing opacity where busy content passes beneath controls. Aside demonstrates a usable solid alternative; Apple describes adaptive diffusion and scroll-edge treatment.
3. Use edge shading and restrained highlights to separate controls; avoid making body text depend on blur or refraction for contrast.
4. Keep feedback local and optional. A default scroll parallax or animated filter is not established by these sources. Static/opaque alternatives must preserve the action and information.
5. Do not present local CSS recipes, numeric radii, 150ms timing, or a particular spring curve as Apple's official tokens.

## Proposed exact repository changes (not applied)

Repository root: `/Users/jun/Developer/new/701_design-isms`.

1. `assets/data/isms.json:4467` — preserve `id: refractive-glass-ui` and `kind: style`. At :4469/:4470 set `name: Liquid Glass` and `nameKr: 리퀴드 글래스`. No new catalog entry or ID migration.
2. `assets/data/isms.json:4472` — replace Korean description with: `Liquid Glass는 Apple이 2025년 소개한 동적 재료로, 굴절·반사광과 배경색 적응을 이용해 내비게이션과 제어를 콘텐츠 위의 별도 계층으로 구분한다. 2026년 공개한 27 세대 개선은 균일한 굴절과 대비, 복잡한 배경 위의 가독성에 초점을 둔다. 웹에서는 이 원칙을 해석하되 본문과 데이터는 안정된 표면에 두고, 투명도와 움직임을 줄인 대안을 제공한다.`
3. `assets/data/isms.json:4473` — align English description: `Liquid Glass is Apple's dynamic material, introduced in 2025, that uses refraction, highlights, and adaptation to surrounding content to distinguish navigation and controls from the content beneath them. The 27-generation refinements previewed in 2026 emphasize more uniform refraction, improved contrast, and readability over complex backgrounds. Web interpretations should preserve a stable content surface and provide reduced-transparency and reduced-motion alternatives.`
4. `assets/data/isms.json:4544` — replace the generic classification history with the 2025-06-09 introduction and 2026-06-08 refinement chronology. Explicitly call 27 a preview as observed on 2026-09-06; do not claim general release. Distinguish Apple native material from inspired web techniques.
5. `assets/data/isms.json:4568` — add primary HIG, iOS27, WWDC26 and 2025 announcement references to `sources`; at :4582 update `reviewedOn` to `2026-09-06` only when Main applies the evidence-backed content changes.
6. `assets/data/isms.json:4491` — existing `Apple Liquid Glass` example points to developer documentation. Recommend replacing that example URL with the official consumer page `https://www.apple.com/os/ios/?os=ios` and keeping the developer page under `sources`. This preserves the existing example count while distinguishing product example from technical source.
7. `assets/data/dev-guides.json:2642` — retain the keyed owner. In :2664 motion block replace default parallax/filter animation with local control feedback and stable scrolling; identify any numeric duration as a web recipe, not an Apple spec. At :2683 replace content-card/data-widget examples with navigation, media controls and adaptive control surfaces. In :2690–2698 require solid fallback, reduced transparency/contrast preferences where supported, reduced motion, and worst-background contrast validation. Do not require background sampling or visible distortion as a universal success condition.
8. `assets/data/isms.json:4545` — existing prompts are generation provenance. Do not rewrite them as if already-used images were generated from revised prompts. Any future dashboard/content-plane image correction is a separately audited regeneration through the existing image-quality ledger, manifest and thumbnails. No image edits are proposed for this docs-only lane.

Potential shell follow-up only if Main chooses it: `assets/css/theme-atlas.css:8` owns current Atlas tokens; `assets/css/nav.css:57` owns the solid dropdown. Current Atlas styling is established design, so this research does not justify a blanket glass repaint. No new HTML/TS/CSS owner is needed merely to rename this data-driven entry.

## Verification and risks

Completed: opened original official pages; verified Aside files exist; read source text; parsed style/sample JSON; independently viewed before/after screenshots; read only the relevant repository data, CSS ownership and package scripts. No build, tests, image generation, staging, git mutations, FSM/goals or production writes executed.

Main's future checks: `npm run verify:isms`, `npm run verify:content`, `npm run verify:catalog`, `npm run sot:check`; then required project `npm run verify`. Run `npm run build` first only if TS changes. Commands are proposed, not reported as passing. Browser acceptance: old `#refractive-glass-ui` opens the renamed item; Korean/English card, dialog, search and exported content agree; ID count stays 49; source links work; image assets and manifest stay unchanged for rename-only work. Check 640/1024/1440 layouts and keyboard/reduced-motion behavior if the shell or demo changes.

Risks: rename alone would leave the generic history and content-widget guidance inconsistent. Native Apple rendering is not equivalent to CSS blur. A reference page is not proof of runtime performance, accessibility compliance or user preference support. Dates are per source, and beta/release status is limited to current official pages; no device installation or public-beta endpoint was tested. Evidence screenshots are analysis-only assets. Some initial screenshot files have `.png` names while Aside reported JPEG bytes; inspect MIME before downstream tooling, and do not ship them as product assets.

Memory use: consulted `/Users/jun/.codex/memories/MEMORY.md:7551–7554` for exact-path/evidence planning conventions only; all cited repository facts were re-read. Relevant Aside briefings/topic search and kim_wiki index/QUESTIONS search returned no design-specific hits. No memory content was updated.
