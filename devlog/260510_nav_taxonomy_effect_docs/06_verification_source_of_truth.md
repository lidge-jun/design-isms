---
created: 2026-05-10
status: implemented
tags: [verification, source-of-truth, docs]
---

# Phase 6 — Verification and Source-of-Truth Sync

## Goal

구현 후 “페이지는 바뀌었는데 README/AGENTS/structure가 다른 말을 하는” 상태를 막는다. 또한 async image generation과 long-form docs 추가 후에도 GitHub Pages에서 가볍게 로드되는지 확인한다.

## Required Source-of-Truth Updates

| File | Must Reflect |
| --- | --- |
| `README.md` | user-facing feature summary, new pages/data/image flow |
| `AGENTS.md` | implementation invariants for nav, docs, image generation, WebP |
| `structure/README.md` | runtime pages, data files, source/build mapping |
| `devlog/260510_nav_taxonomy_effect_docs/*` | plan, audit, verification evidence |

## Verification Commands

Core:

```bash
npm run images:thumbs
npm run verify
git diff --check
```

Data integrity:

```bash
node -e "const fs=require('fs'); const effects=JSON.parse(fs.readFileSync('assets/data/effects.json','utf8')); const docs=JSON.parse(fs.readFileSync('assets/data/effects-docs.json','utf8')); const missing=effects.filter(e=>!docs[e.id]).map(e=>e.id); console.log({effects:effects.length, docs:Object.keys(docs).length, missing}); process.exit(missing.length?1:0);"
```

Image integrity:

```bash
node -e "const fs=require('fs'); /* verify all image manifest source and webp files exist */"
```

Stale-doc search:

```bash
rg -n "미구현|계획 완료|12개|assets/images/effects/thumbs|demo\\.image|imageAlt|status: planning" README.md AGENTS.md structure/README.md devlog assets/data src -S
```

Note: after implementation, this folder should not contain `status: planning`.

## Browser Verification

Use local static server:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Desktop checks:

- Open `http://127.0.0.1:4173/index.html`
- Open `http://127.0.0.1:4173/effects.html`
- Header links exist and active states are correct.
- ISMS count is still 35 plus approved additions.
- Effects count remains 46 unless deliberately changed.
- Effects modal opens and docs sections render.
- Console entries are empty.

Mobile checks:

- Resize to 390x844.
- `document.documentElement.scrollWidth <= window.innerWidth`.
- Header/nav remains reachable.
- Modal content does not overflow horizontally.

Runtime image checks:

- Card/modal previews load `.webp`.
- Lightbox opens `.png`.
- Missing images do not silently pass.

## GitHub Pages Post-Deploy Checks

Only after user explicitly requests commit/push:

```bash
gh run list --repo lidge-jun/design-isms --limit 3
gh run watch <run-id> --repo lidge-jun/design-isms --exit-status
curl -L -I https://lidge-jun.github.io/design-isms/effects.html
curl -L -I https://lidge-jun.github.io/design-isms/assets/data/effects-docs.json
```

If references page is added:

```bash
curl -L -I https://lidge-jun.github.io/design-isms/references.html
```

Current local implementation adds `references.html`, `assets/data/effects-docs.json`, `assets/data/references.json`, `assets/data/research-prompts.json`, 32 PNG originals, and matching WebP previews. Remote deploy checks are intentionally deferred until the user explicitly requests commit/push in the same turn.

## Completion Criteria

- All planned docs exist.
- Runtime source and generated JS are in sync.
- All new image originals have WebP previews.
- Data/docs joins have zero missing keys.
- Desktop/mobile browser checks pass.
- README/AGENTS/structure/devlog agree on the feature.
- No commit/push unless explicitly requested in same turn.

## Local Verification Snapshot

Static/data checks completed:

- `npm run images:thumbs`
- `npm run verify`
- `git diff --check`
- effects/docs join: 46 effects, 46 docs, 0 missing
- references/image manifest: 16 references, 32 image jobs, 0 missing PNG/WebP files

Browser checks completed through `cli-jaw browser` against `http://127.0.0.1:4173/`:

- `index.html`: 35 cards, active `Isms`, 6 nav controls, WebP card previews, no horizontal overflow at 390px, no console errors
- `effects.html`: 46 cards, 46 unique demo classes, `EffectsDocs` loaded, modal docs rendered, guide image loads WebP after lazy-scroll, no horizontal overflow at 390px, no console errors
- `references.html`: 16 cards, filters for `ISM Candidate` and `Official Reference`, search reduces to the expected result, active `References`, WebP card previews, 0 missing images, no horizontal overflow at 390px, no console errors

One transient verification issue occurred: the local `cli-jaw browser` CDP session and Python static server had stopped, producing `connect ECONNREFUSED 127.0.0.1:9251`. Both verification-only processes were restarted and the checks above passed.

## Known Risk

The current `src/effects.ts` is close to the 500-line file limit. Effects docs rendering may require a helper split. Because the app uses non-module scripts, the helper split must follow the existing namespace pattern used by `EffectsDemos`.
