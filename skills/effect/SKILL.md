---
name: effect
description: >-
  Find frontend UI effects and interaction patterns and return runnable code.
  Use when the user asks for a UI pattern or effect — e.g. "build a bottom
  sheet", "scroll reveal effect code", "mobile modal pattern", "sticky CTA bar",
  "hover card animation", "accessible drawer menu", "UI effect", "interaction
  pattern", "P0 mobile patterns", "reduced-motion support", or the Korean
  equivalents (바텀시트, 스크롤 리빌, 모달 패턴, 호버 카드, 드로어 메뉴, 접근성).
  Reads 94 effect entries (family/category/priority/summary/accessibility/
  performance), runnable HTML/CSS/JS snippets, and long-form background and
  usage docs straight from assets/data/ JSON. Narrows scope by P0/P1/P2/P3.
---

# effect — frontend UI patterns

Query 94 frontend UI effects and return runnable code. The same dataset that
renders the site is the source of truth — read the JSON directly, never copy it.

## Data location

All paths are relative to the plugin root (`${CLAUDE_PLUGIN_ROOT}/assets/data/`).

- `effects.json` — array of 94 effects. Fields: `id`, `name`, `nameKr`, `family`,
  `category` (`Mobile`/`Desktop`/`Shared`), `priority` (`P0`/`P1`/`P2`/`P3`),
  `summary`, `alsoCalled[]`, `bestFor[]`, `avoidWhen[]`, `implementation`,
  `accessibility`, `performance`, `demo`, `guide`.
- `effects-snippets.json` — object; reach snippets via `snippets[id]`. Fields:
  `html`, `css`, `js` (optional), `supports[]`, `reducedMotion`, `a11yNotes[]`,
  `sourceRefs`. All 94 ids map 1:1 to effects.json.
- `effects-docs.json` — object keyed by effect id: `background`, `history`,
  `useWhen`, `examples[]`, `anatomy`, `misuse`, `implementationNotes`, `researchRefs`.

## Intent → Action

| User intent | Read | Return |
|-------------|------|--------|
| "build X" / "X pattern" (match id, name, nameKr, alsoCalled) | `effects.json[id]` + `effects-snippets.json.snippets[id]` | summary + html + css + js (if present) + `supports[]` + `a11yNotes[]` + `reducedMotion` |
| "patterns worth using on mobile" / "P0 only" | `effects.json` filtered by `category`/`priority` | list of id + nameKr + summary |
| "when do I use X" / "background of X" | `effects-docs.json[id]` | `background` + `history` + `useWhen` + `misuse` |
| "I have this problem, what should I use" (keywords) | whole `effects.json` → match `summary`/`bestFor`/`alsoCalled` | candidates: id + nameKr + family + priority |
| "accessibility / performance check" | `effects.json[id].accessibility` + `.performance` + snippet `a11yNotes`/`reducedMotion` | checklist |
| "all scroll-related" / "group by family" | `effects.json` filtered by `family` | grouped list |
| "when not to use X" | `effects.json[id].avoidWhen` + docs `misuse` | caveats |

## Matching rules

- Ids are kebab-case (`bottom-sheet`, `scroll-reveal`, `sticky-cta`).
- When the user gives a Korean name (`nameKr`/`alsoCalled`) or a description,
  keyword-match `summary`/`bestFor`/`alsoCalled` to resolve the real `id`.
- For scoped asks ("P0 only", "mobile"), filter on `priority`/`category` first,
  then keyword-match. Recommend in P0 > P1 > P2 > P3 order.
- Loading all 94 is fine; parsing only the needed id is also fine.

## Output guidance

- Always fence code with its language (```html / ```css / ```js).
- Never drop `a11yNotes[]` and `reducedMotion` — accessibility is the core value
  of this dataset. Include the `prefers-reduced-motion` media query in the code.
- Ship `bestFor`/`avoidWhen` alongside the code so the user can judge fit.
- Always cite the source (`effects.json[id]` / `effects-snippets.json.snippets[id]`).
- Reply in the user's language; keep code, field names, and ids verbatim.
