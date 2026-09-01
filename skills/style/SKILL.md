---
name: style
description: >-
  Query and recommend design isms (styles). Use when the user asks about design
  styles, movements, or their concrete build tokens — e.g. "minimalism site",
  "brutalism color palette", "art deco font pairing", "which design style fits
  my project", "ism", "design movement", "color palette for X", "font pairing
  for X", "grid system", "layout guide", or the Korean equivalents (미니멀리즘,
  브루탈리즘, 디자인 사조, 컬러 팔레트 추천, 폰트 페어링, 레이아웃 가이드).
  Reads 49 ism entries (palettes, keywords, example sites, history) and their
  per-ism dev guides (grid/columns/gutter/typography/fontPairing/motion easing
  and duration) straight from assets/data/ JSON, returning ready-to-use tokens.
---

# style — design isms

Query the visual and technical knowledge of 49 design isms. The same dataset that
renders the site is the source of truth — read the JSON directly, never copy it.

## Data location

All paths are relative to the plugin root (`${CLAUDE_PLUGIN_ROOT}/assets/data/`).

- `isms.json` — array of 49 isms. Fields: `id`, `name`, `nameKr`, `tagline`,
  `description`, `descriptionEn`, `history`, `keywords[]`, `palette[]` (hex),
  `examples[]` ({name,url}, usually 10), `images[]`, `prompts[]`.
- `dev-guides.json` — object keyed by ism id (49 entries, 1:1 with isms.json):
  - `layout`: `grid`, `columns`, `gutter`, `margins`, `spacing`, `symmetry`, `geometry`
  - `typography`: `fontPairing`, `sizeHierarchy`, `lineHeight`, `letterSpacing`, `weightStrategy`
  - `color`: `usage`, `bgFg`, `contrast`
  - `motion`: `easing`, `duration`, `hover`, `scroll`, `transition`
  - `dos[]`, `donts[]`, `implementation` (object: `summary`, `components`, `build`, `checks`)
- Companion catalogs: `color.json` (25 role-based palettes), `typography.json`
  (20 font pairings), `layout.json` (25 layout patterns), `motion.json` (20 motion
  recipes). Not keyed by ism id, but offer them when the user wants concrete patterns.

## Intent → Action

| User intent | Read | Return |
|-------------|------|--------|
| "what is X" / "tell me about X ism" (match id, name, nameKr) | `isms.json` entry | tagline + description + history + palette[] + keywords[] + examples[] |
| "X color palette" | `isms.json[id].palette` + `dev-guides.json[id].color` | hex values + `usage`/`bgFg`/`contrast` role assignment |
| "X font pairing" | `dev-guides.json[id].typography` (+ `typography.json`) | `fontPairing` + `sizeHierarchy` + `lineHeight`/`letterSpacing`/`weightStrategy` |
| "X grid / layout numbers" | `dev-guides.json[id].layout` | `grid`/`columns`/`gutter`/`margins`/`spacing`/`symmetry`/`geometry` |
| "X motion" | `dev-guides.json[id].motion` | `easing`/`duration`/`hover`/`scroll`/`transition` |
| "recommend a style for my project" (keywords, mood) | whole `isms.json` → match `keywords[]` + `tagline` | 3–5 candidates: id + nameKr + tagline + why it matches |
| "compare A vs B" | both entries side by side | palette / typography / layout / motion diff |
| "full build guide for X" | whole `dev-guides.json[id]` | layout + typography + color + motion + `dos`/`donts` + `implementation` |

## Matching rules

- Ids are lowercase kebab-case (`minimalism`, `brutalism`, `art-deco`). Match
  `nameKr` for Korean queries and `name` for English ones, then use the real `id`.
- Loading all 49 at once is fine. For recommendations weight `keywords[]` and
  `tagline` first; `description` and `history` are secondary signals.

## Output guidance

- Give hex values inline with their role (background / body / accent), no code fence.
- Present font pairings as real CSS `font-family` values.
- Give grid and spacing as drop-in CSS values (`24px`, `5vw`, `repeat(12, 1fr)`).
- Always cite the source (`isms.json[id]` / `dev-guides.json[id]`) in the response.
- Reply in the user's language; keep field names, hex values, and CSS verbatim.
