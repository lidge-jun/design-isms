# 030 — Existing Effects Guide Image Audit and Regeneration

## Outcome

Audit all **46 existing** effect guide originals, regenerate the full set with `ima2` /
GPT Image 2 at `1536×1024` under one locked art direction, and rebuild matching WebP
previews. This phase improves evidence quality without adding effects or changing counts.

```text
Effects before: 46
Effects after:  46
Expected pairs: 46 PNG originals + 46 WebP previews
```

## Dependencies

- **Requires:** `011_frontend_standards.md`.
- **Uses from 020:** locked atlas color/annotation language and image presentation.
- **Blocks:** 040 image tooling reuse, 050 new guide creation, and 080 asset verification.

## Mandatory preflight: restore the complete asset tree

The GPT Pro transport ZIP intentionally omitted images, but the local workspace already has
the complete asset tree. Do not fetch/rebase or restore over it. Verify locally:

```bash
test -f assets/images/effects/bottom-sheet/guide.png
test -f assets/images/thumbs/effects/bottom-sheet/guide.webp
ima2 ping
```

Expected: all commands exit 0. If assets are missing, stop without synthesizing placeholders.
If ima2 ping fails, run `ima2 serve`, re-ping, then mark BLOCKED if it still fails.

[Source: https://github.com/lidge-jun/design-isms]

## File operations

| Marker | Exact path | Purpose |
|---|---|---|
| **NEW** | `scripts/audit-effect-guides.mjs` | Machine audit of IDs, formats, dimensions, previews, hashes, and staleness. |
| **NEW** | `scripts/build-effect-guide-contact-sheet.mjs` | Produces a local review sheet outside the committed site artifact. |
| **NEW** | `devlog/260715_production_upgrade/031_effect_guide_audit.csv` | Human-reviewed decision record for all 46 IDs. |
| **NEW** | `devlog/260715_production_upgrade/032_effect_guide_manifest.jsonl` | Deterministic prompt/model/output provenance for all 46 regenerated guides. |
| **NEW** | `.gitignore` | Create the root ignore file (`.tmp/`, `node_modules/`, local image review outputs); Phase 080 extends this same file. |
| **MODIFY** | `scripts/generate-thumbnails.mjs` | Replace external `cwebp` process with deterministic `sharp` pipeline. |
| **MODIFY** | `package.json` | Add `sharp`, `images:audit`, and `images:contact-sheet` scripts. |
| **MODIFY** | `package-lock.json` | Lock the image codec dependency. |
| **MODIFY** | `assets/data/effects.json` | Change only guide `prompt`/`alt` fields whose visual concept is corrected. |
| **MODIFY** | `assets/images/effects/{effect-id}/guide.png` | Regenerate all 46 under the locked art direction; keep prior file only after two failed passes and document exception. |
| **MODIFY** | `assets/images/thumbs/effects/{effect-id}/guide.webp` | Rebuild from the accepted PNG, never from prior WebP. |
| **MODIFY** | `README.md` | Document audit and deterministic thumbnail workflow. |
| **MODIFY** | `AGENTS.md` | Require an audit row and provenance row for regenerated guides. |
| **MODIFY** | `structure/README.md` | Add audit scripts/devlog paths. |
| **DELETE** | dependency on system `cwebp` | No shell binary is required after this phase. |
| **DELETE** | rejected regenerated files | Failed trials remain outside the repository, not as numbered variants. |

The contact sheet itself is a disposable review artifact and must be written to `.tmp/effects-guide-contact-sheet.webp`, which is ignored and not committed.

## Canonical 46-ID audit set

The audit derives this set from `assets/data/effects.json`; the list below is a review checksum, not a second source of truth.

```text
bottom-sheet, full-screen-mobile-modal, drawer-navigation, sticky-cta-bar,
scroll-reveal, staggered-cards, press-scale, swipe-action, skeleton-loading,
toast, segmented-control, image-lightbox, sticky-tab-bar, pull-to-refresh,
floating-action-button, mobile-stepper-form, mobile-empty-state,
inline-validation, mega-menu, command-palette, split-pane,
resizable-sidebar, data-table, master-detail, kanban-board, breadcrumb,
context-menu, tooltip, popover, modal-dialog, toast-stack, inline-edit,
drag-reorder, virtual-list, sticky-table-header, dashboard-kpi-cards,
filter-sidebar, pagination, desktop-wizard, tabs, accordion, carousel,
date-picker, file-dropzone, progress-stepper, notification-center
```

No Phase 050 ID is allowed in the Phase 030 audit baseline.

## 1. Machine audit specification

`scripts/audit-effect-guides.mjs` must:

1. parse `assets/data/effects.json` and reject duplicate IDs;
2. assert `effects.length === 46` in this phase;
3. assert `effect.demo.type === effect.id` before touching images;
4. locate one original at `assets/images/effects/{id}/{effect.guide.file}`;
5. locate one preview at `assets/images/thumbs/effects/{id}/guide.webp`;
6. inspect image metadata using `sharp`;
7. require PNG original, `1536×1024`, sRGB-compatible three/four-channel output, and no animation;
8. require WebP preview, `768×512`, and no animation;
9. verify preview modification time is not older than the original;
10. calculate SHA-256 for both files and reject duplicate original hashes across different IDs;
11. reject orphan effect guide directories not present in JSON;
12. emit JSON on `--json` and a one-line summary by default.

Representative result type:

```js
{
  id: 'bottom-sheet',
  original: { path, width: 1536, height: 1024, format: 'png', sha256 },
  preview: { path, width: 768, height: 512, format: 'webp', sha256, sourceSha256 },
  machineStatus: 'pass'
}
```

Exit non-zero on any missing, wrong-size, stale, duplicate, corrupt, or orphan file.

## 2. Deterministic thumbnail pipeline

Replace the current `spawnSync('cwebp', ...)` implementation with `sharp`.

```diff
-import { spawnSync } from 'node:child_process';
+import sharp from 'sharp';
@@
-const width = process.env.THUMB_WIDTH || '768';
-const quality = process.env.THUMB_QUALITY || '58';
+const width = Number(process.env.THUMB_WIDTH ?? 768);
+const quality = Number(process.env.THUMB_QUALITY ?? 72);
@@
-const result = spawnSync('cwebp', [...]);
-if (result.status !== 0) throw new Error(...);
+await sharp(sourcePath, { failOn: 'error' })
+  .resize({ width, height: 512, fit: 'cover', position: 'centre' })
+  .webp({ quality, effort: 6, smartSubsample: true })
+  .toFile(tempPath);
+renameSync(tempPath, outputPath);
```

Implementation requirements:

- use `for...of` with `await` or a bounded concurrency pool of at most four;
- sort source paths so logs are deterministic;
- perform atomic temp-file rename;
- preserve the mirrored directory structure;
- skip a preview only when the manifest source SHA matches the current PNG and output
  metadata matches `768×512` WebP;
- accept `--force` to rebuild every preview;
- accept `--scope effects` so Phase 030 does not unnecessarily recompress 129 ISM previews;
- never upscale a source smaller than the required original dimensions; fail instead;
- print generated/skipped/total and accumulated encoded bytes.

`package.json` diff:

```diff
 "scripts": {
   "images:thumbs": "node scripts/generate-thumbnails.mjs",
+  "images:audit": "node scripts/audit-effect-guides.mjs",
+  "images:contact-sheet": "node scripts/build-effect-guide-contact-sheet.mjs"
 },
 "devDependencies": {
+  "sharp": "<exact version resolved by npm install --save-dev --save-exact>",
   "typescript": "^6.0.3"
 }
```

Pin the actual installed `sharp` version in `package.json` and `package-lock.json`; do not invent a version in advance.

## 3. Build a human-review contact sheet

`scripts/build-effect-guide-contact-sheet.mjs` consumes the 46 accepted originals and writes a **local-only** sheet with:

- 4 columns × 12 rows (last row partially filled);
- each guide letterboxed, never cropped;
- effect index, ID, and category beneath each frame;
- 320px-wide frames, neutral background, no brand treatment;
- output path `.tmp/effects-guide-contact-sheet.webp`;
- no source image mutation.

The script must fail if the machine audit fails first. It may use a system font for labels; the sheet is for review and is not shipped.

## 4. Human quality rubric

Create one CSV row per effect with these exact columns:

```csv
id,machine_status,effect_fidelity,information_hierarchy,text_integrity,composition,distinctiveness,accessibility,decision,notes,reviewer,reviewed_on
```

Use integer scores `0`, `1`, or `2`:

| Dimension | 0 — fail | 1 — repairable/ambiguous | 2 — pass |
|---|---|---|---|
| Effect fidelity | Wrong pattern or key state absent | Pattern visible but state/action unclear | Trigger, transition/state, and result are clear |
| Information hierarchy | No visual reading order | Dense or competing callouts | Main UI and annotations scan immediately |
| Text integrity | Gibberish, broken glyphs, false labels | Minor low-value text artifact | All visible text intentional and legible |
| Composition | Cropped, distorted, unsafe edges | Functional but awkward | Balanced at full and thumbnail size |
| Distinctiveness | Reuses another guide’s composition | Generic but identifiable | Specific to this effect and use case |
| Accessibility | Conveys state by color alone or unreadable contrast | One weak cue | Labels/arrows/state cues work without color alone |

Decision rules:

```text
baseline-fail = any score is 0 OR total < 9/12
baseline-pass = no zero AND total >= 9/12
```

The baseline score is evidence for why the old set was replaced, not a skip decision. Every
row receives a final `accepted|exception` decision after regeneration. Two reviewers are
preferred for borderline rows; disagreement is written in notes.

## 5. Regeneration prompt contract

Use the existing `effect.guide.prompt` as source material, then normalize all 46 prompts to this structure:

```text
Create one instructional UI reference plate for {effect name}, 1536×1024 landscape.
Show: {trigger/context}; {intermediate state}; {resulting state}.
Use a single realistic product scenario, clean Korean/English-neutral microcopy,
clear numbered annotations, arrows that do not cover controls, and high-contrast labels.
Visual frame: off-white technical paper, black rules, restrained orange signal,
single orange signal marks. No browser chrome unless the pattern requires it.
No logos, no copied brand UI, no watermark, no decorative 3D icons,
no fake paragraphs, no unreadable tiny text, no excessive gradients.
The UI effect—not the poster styling—must be the dominant evidence.
```

Run each generation with the repository-confirmed command:

```bash
ima2 gen --stdin -q high -s 1536x1024 \
  -o assets/images/effects/{effect-id}/guide.png \
  --json --timeout 300 < .tmp/prompts/{effect-id}.txt
```

Record the exact executed command and provider response status in the JSONL manifest.

Each `032_effect_guide_manifest.jsonl` object:

```json
{
  "id": "example-id",
  "sourcePromptSha256": "...",
  "finalPrompt": "...",
  "model": "gpt-image-2",
  "size": "1536x1024",
  "quality": "high",
  "outputSha256": "...",
  "generatedOn": "YYYY-MM-DD",
  "decision": "accepted",
  "notes": "..."
}
```

Do not commit API keys, provider response blobs, rejected images, or absolute user paths.

## 6. Content/image alignment

When a regenerated guide changes the depicted state or scenario, update only these fields in `assets/data/effects.json`:

```diff
 "guide": {
   "file": "guide.png",
-  "alt": "old ambiguous description",
-  "prompt": "old generation prompt"
+  "alt": "specific description of the accepted guide’s UI, state, and annotation",
+  "prompt": "the normalized accepted prompt, without secrets or provider metadata"
 }
```

Alt text rules:

- describe the effect/state, not colors or “an image of”;
- do not duplicate nearby modal prose word for word;
- omit decorative annotation styling unless it communicates meaning;
- target roughly 80–180 Korean characters or equivalent English detail.

## 7. Regenerate previews

After all accepted PNG changes:

```bash
npm run images:thumbs -- --scope effects
npm run images:audit
```

Expected:

```text
thumbnails ok: N generated, 46-N fresh, 46 total
assets ok: 46 effect png, 46 effect webp, 0 invalid, 0 stale, 0 orphan
```

`N` equals the number of changed/rebuilt previews; a forced run may report 46 generated.

## Acceptance criteria

### Automated

```bash
npm ci
npm run images:audit
npm run images:contact-sheet
npm run verify
```

Must pass all of the following:

- 46 JSON IDs, 46 original directories, 46 PNG originals, 46 WebP previews;
- every original exactly `1536×1024` PNG;
- every preview exactly `768×512` WebP; freshness is proven by source/output SHA256 in
  `032_effect_guide_manifest.jsonl`, not file mtime (Git does not preserve mtime);
- no identical original hashes across IDs;
- `effect.id === effect.demo.type` for all 46;
- contact sheet generated locally from audited sources;
- TypeScript build output unchanged except where data copy required it.

### Human review

```bash
python3 - <<'PY'
import csv
rows=list(csv.DictReader(open('devlog/260715_production_upgrade/031_effect_guide_audit.csv', encoding='utf-8')))
assert len(rows)==46
assert len({r['id'] for r in rows})==46
assert all(r['decision'] in {'accepted','exception'} for r in rows)
assert all(r['reviewer'] and r['reviewed_on'] for r in rows)
print('human guide review ok:', len([r for r in rows if r['decision']=='accepted']), 'accepted')
PY
```

Before final commit, all rows must end at accepted quality. Preserve an initial decision in `notes` for regenerated rows, for example `initial=regenerate; accepted after pass 2`.

### Visual spot checks

Inspect the full image and the 768px preview for at least:

- one overlay (`bottom-sheet`),
- one motion pattern (`scroll-reveal`),
- one data pattern (`data-table`),
- one complex desktop pattern (`kanban-board`),
- one small feedback pattern (`toast`),
- every regenerated image.

No guide may contain trademarked logos, provider watermarks, fake browser controls presented as functional instructions, or unreadable/generated nonsense.

## Completion handoff

Stage only the audit ledger, accepted originals, matching previews, prompt/alt corrections,
pipeline changes, and docs. The user authorized phase commits for this loop. Phase 050 reuses
the scripts but owns the 18 new guide rows/assets and never rewrites the historical 46-row audit.
