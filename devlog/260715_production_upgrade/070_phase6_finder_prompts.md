# 070 — Style Finder and Per-ISM AI Prompt Pack

## Outcome

Add a deterministic three-question Style Finder for novices and a copyable prompt pack to every ISM modal. The tool recommends three defensible starting directions from the existing catalog; it does not call an AI service, profile the visitor, or pretend that a quiz replaces design judgment.

```text
Questions:       3
Answer options:  6 project × 6 mood × 4 brightness
Combinations:    144
Positive results per run: 3
Eligible styles: 48 style entries
Excluded positive result: ai-slop (anti-pattern)
Prompt packs:    49
```

Counts remain **49 ISMs / 64 effects**.

## Dependencies

- **Requires:** Phase 040’s six new entries, `kind` field, complete guides, and 49-card catalog.
- **Requires:** Phase 060’s `DesignExport.registerIsmTab`, token derivation, and clipboard handling.
- **Blocks:** Phase 080 end-to-end quiz, prompt, URL/layout, and copy checks.

## File operations

| Marker | Exact path | Purpose |
|---|---|---|
| **NEW** | `src/finder.ts` | Classic `DesignFinder` namespace: config parsing, scoring, form rendering, results, prompt tab; under 500 lines. |
| **NEW** | `assets/js/finder.js` | Committed TypeScript output. |
| **NEW** | `assets/css/finder.css` | Atlas-style quiz/results layout; under 420 lines. |
| **NEW** | `assets/data/finder-config.json` | Bilingual questions, keyword/boost/conflict mapping, and fixed scoring version. |
| **NEW** | `scripts/verify-finder.mjs` | Validates config IDs and executes all 144 combinations against the compiled scorer. |
| **MODIFY** | `index.html` | Add Finder section/mount; load finder CSS and script before `app.js`. |
| **MODIFY** | `src/app.ts` | Pass ISMs, guide map, locale, and modal callback to `DesignFinder`; keep business logic extracted. |
| **MODIFY** | `src/app-export.ts` | Expose palette classification and accept registered prompt tab; no Finder UI logic. |
| **MODIFY** | `assets/css/export.css` | Style fourth Prompt Pack tab and prompt metadata note. |
| **MODIFY** | `assets/data/faq.json` | Add/update one answer explaining Finder limits and human review, without changing the 18-answer count. |
| **MODIFY** | `package.json` | Add `verify:finder`; append to `verify`. |
| **MODIFY** | `README.md` | Document quiz inputs, deterministic ranking, no remote inference, and prompt packs. |
| **MODIFY** | `AGENTS.md` | Freeze scoring rules and anti-pattern exclusion. |
| **MODIFY** | `structure/README.md` | Add Finder source/data/generated paths. |
| **DELETE** | none | This phase adds a feature without removing a public route or dataset. |

## 1. Place the Finder in `index.html`

Insert it after the shared header and before the catalog filter bar:

```html
<main id="main-content">
  <section class="style-finder" id="style-finder" aria-labelledby="style-finder-title">
    <header class="style-finder-header">
      <p class="atlas-kicker">Decision aid · 03 questions</p>
      <h1 id="style-finder-title">Find a visual direction</h1>
      <p>Choose the job, the feeling, and the light level. We will explain three starting points.</p>
    </header>
    <div id="style-finder-mount" aria-busy="true"></div>
  </section>
  <!-- existing filter/catalog follows -->
</main>
```

Do not create a new route. The catalog remains immediately reachable below the section, and an anchor link `#catalog` bypasses the Finder.
Phase 020 already wraps the existing filter/grid in `<main id="main-content">`; this phase
inserts the Finder as its first section and adds `id="catalog"` to the existing filter/grid
destination rather than nesting a second `<main>`.

Load order:

```diff
 <link rel="stylesheet" href="./assets/css/export.css?...">
+<link rel="stylesheet" href="./assets/css/finder.css?...">
@@
 <script src="./assets/js/app-export.js?..."></script>
+<script src="./assets/js/finder.js?..."></script>
 <script src="./assets/js/app.js?..."></script>
```

## 2. Exact questions and option IDs

Use native fieldsets/radios. The IDs are data/API contracts and do not change during copyediting.

| Question ID | Korean / English legend | Exact options |
|---|---|---|
| `project` | 무엇을 디자인하나요? / What are you designing? | `portfolio`, `editorial`, `commerce`, `saas`, `event`, `community` |
| `mood` | 어떤 인상을 원하나요? / What should it feel like? | `calm`, `bold`, `playful`, `luxury`, `technical`, `organic` |
| `brightness` | 화면의 빛과 대비는? / What light level fits? | `light`, `dark`, `high-contrast`, `mixed` |

Bilingual display labels:

```text
portfolio      Portfolio / 포트폴리오
editorial      Editorial / 에디토리얼
commerce       Commerce / 커머스
saas           SaaS / SaaS 제품
event          Event / 이벤트·캠페인
community      Community / 커뮤니티

calm           Calm / 차분한
bold           Bold / 강렬한
playful        Playful / 유쾌한
luxury         Luxury / 고급스러운
technical      Technical / 기술적인
organic        Organic / 자연스러운

light          Light / 밝은
dark           Dark / 어두운
high-contrast  High contrast / 고대비
mixed          Mixed / 혼합
```


Each radio label includes one plain-language hint, for example `SaaS — dashboards, tools, and workflows`. Do not use unexplained aesthetic jargon as the only option text.

## 3. Finder configuration schema

`assets/data/finder-config.json`:

```json
{
  "version": "1.0.0",
  "questions": [
    {
      "id": "project",
      "legend": { "ko": "무엇을 디자인하나요?", "en": "What are you designing?" },
      "options": [
        {
          "id": "portfolio",
          "label": { "ko": "포트폴리오", "en": "Portfolio" },
          "hint": { "ko": "...", "en": "..." },
          "keywords": ["portfolio", "editorial", "typography", "identity"],
          "guideTerms": ["portfolio", "gallery", "case-study", "포트폴리오"],
          "boostIds": ["editorial-typography", "human-crafted-web", "brutalism", "generative-identity"],
          "conflictIds": []
        }
      ]
    }
  ]
}
```

Every option has `keywords`, `guideTerms`, `boostIds`, and `conflictIds`; empty arrays are explicit. All IDs must exist in `isms.json` and no `boostIds` array may include `ai-slop`.

## 4. Fixed boost matrix

The JSON must encode this initial mapping exactly; later editorial changes require a config version bump and test snapshot update.

| Option | `boostIds` |
|---|---|
| `portfolio` | `editorial-typography`, `human-crafted-web`, `brutalism`, `generative-identity` |
| `editorial` | `swiss-style`, `editorial-typography`, `variable-typography`, `technical-blueprint` |
| `commerce` | `minimalism`, `art-deco`, `human-crafted-web`, `bento-grid` |
| `saas` | `minimalism`, `material-design`, `bento-grid`, `technical-blueprint` |
| `event` | `constructivism`, `kinetic-typography`, `pop-art`, `generative-identity` |
| `community` | `indie-web`, `neo-brutalism`, `human-crafted-web`, `kawaii` |
| `calm` | `minimalism`, `japandi`, `organic-design`, `refractive-glass-ui` |
| `bold` | `brutalism`, `neo-brutalism`, `constructivism`, `maximalism` |
| `playful` | `memphis-design`, `kawaii`, `dopamine-design`, `pop-art` |
| `luxury` | `art-deco`, `minimalism`, `glassmorphism`, `refractive-glass-ui` |
| `technical` | `monospace-terminal-ui`, `technical-blueprint`, `spatial-ui`, `isometric-3d-ui` |
| `organic` | `organic-design`, `solarpunk`, `cottagecore`, `human-crafted-web` |
| `light` | `minimalism`, `swiss-style`, `japandi`, `human-crafted-web`, `technical-blueprint` |
| `dark` | `dark-mode`, `cyberpunk`, `vaporwave`, `spatial-ui` |
| `high-contrast` | `brutalism`, `neo-brutalism`, `de-stijl`, `constructivism` |
| `mixed` | `generative-identity`, `bento-grid`, `refractive-glass-ui`, `gradient-aurora` |

Initial conflict mapping is intentionally small:

```text
light         conflicts: dark-mode, cyberpunk
dark          conflicts: japandi
high-contrast conflicts: neumorphism
mixed         conflicts: none
```

Project/mood options default to no hard conflict. The Finder should be suggestive, not a rigid compatibility engine.

## 5. Exact scoring algorithm

Export a pure deterministic function for testing:

```ts
DesignFinder.score(
  isms: readonly FinderIsm[],
  guides: GuideMap,
  config: FinderConfig,
  answers: { project: string; mood: string; brightness: string }
): RankedResult[]
```

For each eligible `kind !== 'anti-pattern'` ISM:

```text
+6 for each selected option whose boostIds contains the ISM id
+3 for each unique selected-option keyword exactly matching an ISM keyword
+1 for each unique guideTerm found as a normalized whole term in guide text, max +3 total
+3 when derived palette brightness matches the selected brightness profile
-5 for each selected option whose conflictIds contains the ISM id
```

Rules that remove ambiguity:

- combine the three selected options, then deduplicate `keywords` and `guideTerms` before scoring;
- keyword match is case-insensitive exact normalized token match, not arbitrary substring match;
- guide search includes layout, typography, color, motion, dos, donts, and implementation fields;
- guide-term score is capped at 3 per ISM so verbose guides do not dominate;
- palette classification uses `DesignExport.classifyPalette`, based on semantic background luminance and contrast:
  - `light`: background luminance >= 0.70;
  - `dark`: background luminance <= 0.20;
  - `high-contrast`: foreground/background ratio >= 7 and not already selected as mixed;
  - `mixed`: neither dominant-light nor dominant-dark, or both very light and very dark palette endpoints with a chromatic accent;
- if more than one brightness label applies, explicit priority is `high-contrast`, `mixed`, `dark`, `light`;
- no randomization, current-time seed, visitor history, or remote model call;
- sort by total score descending, then explicit-boost count, keyword-match count, and original `isms.json` index ascending;
- return exactly three unique results when at least three style entries exist;
- keep zero/negative scores in the fallback pool rather than returning fewer than three, but mark a low-confidence result in the explanation;
- never return `ai-slop` positively even if configuration is malformed.

## 6. Explain every recommendation

Each result renders:

```text
01 — Technical Blueprint
Fit: SaaS + Technical + Light
Why: direct match for SaaS and Technical; matched “diagram” and “monospace”;
     palette class matches Light.
Watch: annotation density can overwhelm small screens.
[Open full reference]
```

Reason generation uses only recorded score components; do not generate generic prose unrelated to matches. It must include:

- selected option labels;
- up to two strongest direct/keyword reasons;
- one `donts` or implementation check as the “Watch” caution;
- a confidence label:
  - `Strong starting point` when score >= 18;
  - `Worth comparing` when 10–17;
  - `Exploratory match` below 10.

These labels are ranking explanations, not statistical probabilities.

The result button calls the app-provided `openModal(id, trigger)` callback so focus restoration works exactly like opening a catalog card.

## 7. Form behavior and state

- render all three fieldsets at once; no animated wizard is needed for three questions;
- each option uses a native radio input with a minimum 44px visual row while retaining visible focus;
- submit button stays disabled until one value per fieldset is chosen;
- pressing Enter while inside a radio group submits only after all three groups are valid;
- results container uses `aria-live="polite"` and announces one summary, not all result prose repeatedly;
- a Reset button clears radios, results, session state, and returns focus to the first radio
  input (not the non-focusable legend);
- store answers in `sessionStorage['design-isms-finder-v1']`; no long-term local profile;
- invalid/stale stored IDs are discarded;
- locale switching rerenders labels/reasons without changing selected IDs or ranking;
- config fetch failure renders a retry `<button>` and leaves the catalog usable;
- dispatch `design-finder-results` with selected IDs for Phase 080 tests.

## 8. Application bridge

After `app.ts` validates ISMs, start the cached guide request. Finder shows a local loading
state for guide-enhanced scoring but can fall back to ISM keyword/palette scoring if guide
fetch fails, with a visible "guide signals unavailable" note:

```ts
DesignFinder.mount({
  root: getRequired<HTMLElement>('style-finder-mount'),
  isms: allIsms,
  guides,
  getLang: () => currentLang,
  openModal: (id, trigger) => openIsmModalById(id, trigger)
});
```

`openIsmModalById(id, trigger)` uses the Phase 020 `AppDialogA11y` bridge, so trigger focus is
restored. Finder must not query private card markup or synthesize a click.

On locale change, call `finderController.setLang(currentLang)` rather than destroying/rebinding the whole form.

## 9. AI Prompt Pack tab

At load, `src/finder.ts` registers:

```ts
DesignExport.registerIsmTab({
  id: 'prompt',
  label: { ko: 'AI Prompt Pack', en: 'AI Prompt Pack' },
  render: ({ ism, guide, tokens, lang }) => buildPromptPack(...)
});
```

The prompt is deterministic text with these sections:

```text
PROJECT
Design a [PROJECT TYPE] interface for [AUDIENCE] and [PRIMARY TASK].

STYLE DIRECTION
Use {ISM name}: {description}. Apply it as a coherent system, not surface decoration.

PALETTE
Background ..., foreground ..., accent ...; preserve readable contrast.

TYPOGRAPHY
{fontPairing}; {sizeHierarchy}; {lineHeight}; {letterSpacing}.

LAYOUT
{grid}; {columns}; {gutter}; {spacing}; {geometry}.

MOTION
{duration}; {easing}; {hover}; honor reduced motion.

MUST INCLUDE
Three concise bullets derived from dos + implementation checks.

AVOID
Three concise bullets derived from donts and style-specific risks.

OUTPUT CONSTRAINTS
One finished production screen, real navigation/content/controls/states,
responsive structure, no moodboard, no browser chrome, no real logos,
no artist imitation, no watermark, no fake performance claims, no unreadable filler text.

ACCESSIBILITY
Visible focus, keyboard-operable controls, semantic HTML, sufficient contrast,
non-color state cues, and a static/reduced-motion equivalent.
```

- bracketed project/audience/task fields are visibly marked as placeholders;
- palette and guide values come from the active ISM, not a generic prompt;
- maximum copied prompt length target: 3,500 characters;
- do not insert example-site brand names or ask a model to imitate a living artist;
- include a note that output still requires content, accessibility, legal, and usability review;
- prompt rendering uses text nodes and the shared copy function.

### AI Slop special case

For `kind === 'anti-pattern'`, the tab title is **De-slop Audit Prompt** and begins:

```text
Audit and redesign the supplied interface to remove AI-slop symptoms. Preserve
its product goal and content, but replace generic generated decoration with a
clear hierarchy, one visual system, purposeful assets, consistent spacing,
verifiable claims, and human-reviewed copy.
```

It lists the entry’s diagnosed symptoms under AVOID. It must not instruct the model to generate a polished “AI Slop style.”

## 10. Styling

`assets/css/finder.css`:

- uses an atlas index rail and fieldset rules rather than three floating pill-card groups;
- desktop: question labels occupy a 3-column rail and options occupy 9 columns;
- <=1024px: stack legend above options;
- <=640px: one option per row; no horizontal chip scroller required;
- result cards use numbered specimen rows with thumbnail, rationale, caution, and action;
- result thumbnails use existing WebP files and fixed dimensions to avoid layout shift;
- selected radio is shown by native check plus rule/background; not color alone;
- no confetti, gradient glow, AI sparkle icon, or loading shimmer;
- reduced motion removes result entrance sequencing;
- print hides the form but includes selected answers and three results.

## 11. Validator and tests

`scripts/verify-finder.mjs` must:

1. parse the current ISM set, require matching guide keys, and config; final wp6 expectation
   is 49 but the validator derives the count rather than embedding it in reusable logic;
2. assert exactly three question IDs and exact option sets;
3. validate every boost/conflict ID and ban `ai-slop` from boosts;
4. load/evaluate the compiled pure scorer in a Node `vm` with minimal safe stubs, or import an extracted pure generated helper without converting browser scripts to modules;
5. execute all `6 × 6 × 4 = 144` combinations twice;
6. assert each run returns exactly three unique valid style IDs, identical across repeated runs;
7. assert no result ID is `ai-slop`;
8. assert every result has a nonempty score breakdown/reason source;
9. build all 49 prompt packs and assert required section headings and length limits;
10. assert `finder.ts`, `finder.css`, and `finder-config.json` stay below 500 lines.

Expected output:

```text
finder ok: 3 questions, 16 options, 144 combinations, 432 deterministic results, 49 prompt packs
```

`package.json`:

```diff
+"verify:finder": "node scripts/verify-finder.mjs",
 "verify": "npm run typecheck && npm run build && npm run verify:nav && npm run verify:isms && npm run verify:effects && npm run verify:snippets && npm run verify:finder"
```

## Acceptance criteria

Run:

```bash
npm ci
npm run verify
```

Expected tail includes the exact Finder summary above.

Browser acceptance at 1440, 1024, 640, and 390 widths:

- all three fieldsets and every option are readable and keyboard operable;
- submit is gated by native form validity;
- each of several answer combinations returns three distinct results with traceable reasons;
- repeat/reload within the tab yields the same ordering;
- AI Slop never appears in positive results but is available in a separate “Avoid generic output” diagnostic link;
- opening a result launches the correct ISM modal and returns focus to that result button on close;
- changing locale retains answers/results and updates labels;
- Reset clears state and focus predictably;
- every ISM modal has a Prompt Pack tab; AI Slop has De-slop Audit Prompt;
- prompt copy works through the shared success/failure behavior;
- no network request is made beyond static JSON/images; no prompt or answer is sent to a provider;
- zero console errors and zero horizontal overflow.

Manual novice test: give the tool to a reviewer unfamiliar with design-style names. They must be able to complete it, explain why the first result was chosen, identify one caution, and copy a usable prompt without being told what “ISM” means.

## Completion handoff

Stage reviewed Finder TS/CSS/config, generated JS, index integration, prompt-tab registration,
validator, FAQ/docs updates, and build output. The user authorized phase commits. Phase 080
verifies all 144 combinations in Node and representative interactions in Chromium.
