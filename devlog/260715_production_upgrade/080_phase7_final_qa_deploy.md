# 080 — Final QA, Source-of-Truth Sync, and GitHub Pages Deploy

## Outcome

Turn all phase checks into one release gate, verify the three production pages at 1440px and 390px, stage only public files, synchronize counts/features, commit and push the reviewed branch, and prove that the Pages run for the merged commit succeeded.

```text
49 ISMs · 49 ISM guides · 64 effects · 64 effect docs · 64 snippets
147 ISM PNG + 147 ISM WebP · 64 effect PNG + 64 effect WebP
18 FAQ answers · 3 public pages · 6 navigation axes per page
```

## Dependencies

- **Requires:** 010, 011, and every implementation phase 020–070.
- **Final phase:** any failure returns to the owning phase; no post-deploy count patch is acceptable.

GitHub Pages custom workflows should configure Pages, upload a dedicated artifact, and deploy that artifact; stop uploading the whole repository root. [Source: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages]

Playwright’s web-server configuration supplies the local static site, and assertions should auto-wait rather than use arbitrary sleeps. [Source: https://playwright.dev/docs/test-webserver] [Source: https://playwright.dev/docs/test-assertions]

## Release preflight

The local loop workspace is authoritative. Do not fetch/rebase over accumulated phase commits
or user changes. Verify branch/state and the observed deployment baseline:

```bash
git status --short
test -n "$(git branch --show-current)"
git log --oneline --decorate --max-count=8
npm ci
```

Required: named `codex/` branch (create it before the first phase commit if detached), complete
image tree, and reviewed local changes. The current deploy workflow has checkout/configure/
upload/deploy only; this phase adds Node 20, `npm ci`, verify, browser QA, and staging.

## File operations

| Marker | Exact paths | Purpose |
|---|---|---|
| **MODIFY** | `.gitignore` | Extend the Phase 030 file: dependencies, `.pages`, browser reports, caches, and OS metadata. |
| **NEW** | `.github/workflows/ci.yml` | Pull-request verify + Chromium gate. |
| **NEW** | `scripts/sync-sot.mjs` | Marked `--write` / `--check` count synchronization. |
| **NEW** | `scripts/verify-content.mjs`, `scripts/verify-assets.mjs` | Final cross-data/count/reference and image-pair verification. |
| **NEW** | `scripts/verify-generated.mjs`, `scripts/verify-line-limits.mjs` | Committed JS parity and repository constraints. |
| **NEW** | `scripts/stage-pages.mjs`, `scripts/serve-static.mjs` | Allowlisted Pages artifact and local test server. |
| **NEW** | `playwright.config.ts`, `tests/site.spec.ts` | Desktop/mobile release tests. |
| **MODIFY** | `.github/workflows/deploy.yml` | Verify, browser-test, stage `.pages`, upload, deploy. |
| **MODIFY** | `package.json`, `package-lock.json` | Final scripts and exact Playwright dependency. |
| **MODIFY** | `index.html`, `effects.html`, `faq.html` | Final counts, metadata, cache version, and SoT markers. |
| **MODIFY** | `README.md`, `AGENTS.md`, `structure/README.md` | Final 49/64/18 features, invariants, and tree. |
| **MODIFY** | `scripts/verify-nav.mjs`, `scripts/audit-effect-guides.mjs`, `scripts/verify-isms.mjs`, `scripts/verify-effects.mjs`, `scripts/verify-snippets.mjs`, `scripts/verify-finder.mjs` | Reuse/export checks; remove contradictory count constants. |
| **DELETE** | `.DS_Store`, `assets/.DS_Store`, `devlog/.DS_Store` | Remove tracked macOS metadata. |
| **DELETE** | audit-identified orphan/rejected assets only | Keep every data-referenced accepted pair. |

## 1. Source-of-truth markers

Mark intentionally hardcoded public values:

```html
<meta name="description" data-sot="ism-count" content="49개 디자인 ism의 ...">
<span class="header-count" data-nav-axis="count" data-sot-count="isms">49 isms</span>
<p data-sot-count="effects">64 patterns ...</p>
```

Markdown uses bounded regions:

```md
<!-- sot:counts:start -->
49 design ISMs · 64 effects · 18 FAQ answers
<!-- sot:counts:end -->
```

`scripts/sync-sot.mjs` reads JSON and supports:

```bash
node scripts/sync-sot.mjs --write
node scripts/sync-sot.mjs --check
```

It may edit only marked regions in `index.html`, `effects.html`, `faq.html`, `README.md`, `AGENTS.md`, and `structure/README.md`; no broad prose replacement. Labels are DERIVED from JSON lengths (`{isms.length} isms`, `{effects.length} effects`, `{faq items} answers`) so the synchronizer survives catalog growth; `49/64/18` are this phase's acceptance expectations, not constants embedded in the script. Clearly dated devlog baselines may retain old values.

## 2. Final content verifier

`scripts/verify-content.mjs` calls/reuses phase validators and prints:

```text
content ok: 49 isms, 49 guides, 64 effects, 64 effect docs, 64 snippets, 18 faq answers
```

It must enforce:

1. every JSON file parses; IDs/keys are unique;
2. ISM IDs equal guide IDs and contain the six planned additions;
3. effect IDs equal docs, snippets, and demo-type IDs; every `id === demo.type`;
4. only `ai-slop` is an anti-pattern and Finder never boosts/returns it positively;
5. FAQ has 3 categories, 18 unique bilingual items, sources, and none of Phase 020’s stale headings/unsupported metrics;
6. each public page has canonical/description/OG/Twitter/favicons and one current nav item;
7. every local `href`, `src`, data URL, icon, guide, and thumbnail resolves in the staged site;
8. no production `http:` URL except explicit loopback test/docs examples;
9. no `javascript:` URL, authored inline `on*=` handler, or snippet execution surface;
10. no `TODO`, `TBD`, `lorem ipsum`, `generating...`, or “guide coming soon” in shipped data/UI;
11. `sync-sot --check` passes; cache/data versions use one release convention;
12. README/AGENTS/structure describe shipped behavior, not the roadmap.

Do not fetch third-party example sites in CI; validate HTTPS syntax/uniqueness automatically and retain Phase 040’s dated manual review.

## 3. Final asset verifier

`scripts/verify-assets.mjs` prints:

```text
assets ok: 147 ism png, 147 ism webp, 64 effect png, 64 effect webp, 0 invalid, 0 stale, 0 orphan
```

Rules: derive expectations from all 49 `images[]` and all 64 `guide.file` values; originals are PNG `1536×1024`; previews are WebP `768×512` and fresh; reject missing/extra/orphan/zero-byte/corrupt/duplicate-hash originals **within the scoped catalog roots only** — orphan detection scans exactly `assets/images/{ism-id}/`, `assets/images/effects/`, and their `assets/images/thumbs/` mirrors, with an explicit allowlist for shared non-catalog rasters (verify the actual allowlist against the tree at implementation time; anything outside the scoped roots is ignored, not failed); catalog previews use WebP and lightboxes use originals; filenames stay lowercase and inside expected roots; print aggregate bytes and ten largest files. Fail closed when `assets/images` is missing.

## 4. Generated JS parity

`scripts/verify-generated.mjs` creates `.tmp/verify-js`, compiles with the repository's actual `tsconfig.json` (overriding only `outDir`, never module/target/strict flags — reconstructing a config would emit different output), byte-compares its JS set with `assets/js`, reports missing/stale files, and removes temp output in `finally`.

```text
generated js ok: N source files, N committed browser files, 0 stale
```

Do not use Git staging state or compare minified output.

## 5. Line limits and hygiene

`scripts/verify-line-limits.mjs` enforces:

- `src/app.ts <= 1050` lines (the Phase 040 extraction target; the final gate must not permit regression against it);
- every file introduced by this roadmap is below 500 physical lines;
- compact `finder-config.json` and `effects-snippets.json` are below 500 lines;
- no `.DS_Store`, swap/backup files, accidental executables, committed dependency/caches, `.pages`, `.tmp`, Playwright reports, or test results.

`.gitignore`:

```gitignore
node_modules/
.pages/
.tmp/
playwright-report/
test-results/
coverage/
dist/
build/
.next/
.turbo/
.venv/
venv/
__pycache__/
.pytest_cache/
.DS_Store
*.swp
*.tmp
```

## 6. Final package scripts

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "images:thumbs": "node scripts/generate-thumbnails.mjs",
    "sot:sync": "node scripts/sync-sot.mjs --write",
    "sot:check": "node scripts/sync-sot.mjs --check",
    "verify:generated": "node scripts/verify-generated.mjs",
    "verify:nav": "node scripts/verify-nav.mjs",
    "verify:content": "node scripts/verify-content.mjs",
    "verify:assets": "node scripts/verify-assets.mjs",
    "verify:snippets": "node scripts/verify-snippets.mjs",
    "verify:finder": "node scripts/verify-finder.mjs",
    "verify:lines": "node scripts/verify-line-limits.mjs",
    "verify": "npm run typecheck && npm run build && npm run verify:generated && npm run verify:nav && npm run verify:content && npm run verify:assets && npm run verify:snippets && npm run verify:finder && npm run verify:lines",
    "serve": "node scripts/serve-static.mjs --root . --port 4173",
    "qa:e2e": "playwright test",
    "pages:stage": "node scripts/stage-pages.mjs",
    "qa:release": "npm run verify && npm run qa:e2e && npm run pages:stage"
  }
}
```

Install/lock the actual current test dependency instead of inventing a version:

```bash
npm install --save-dev --save-exact @playwright/test
npx playwright install chromium
```

## 7. Static server

`scripts/serve-static.mjs` parses `--root/--port`, binds `127.0.0.1`, maps `/` to `index.html`, rejects traversal/directory listing, serves correct MIME types for HTML/CSS/JS/JSON/SVG/PNG/WebP, supports `HEAD`, sends `Cache-Control: no-store`, returns clear 404/405, and closes on SIGINT/SIGTERM.

Expected ready line:

```text
static server ready: http://127.0.0.1:4173 (root=.)
```

## 8. Playwright configuration

```ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'line',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'desktop-1440', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    { name: 'tablet-1024', use: { browserName: 'chromium', viewport: { width: 1024, height: 900 } } },
    { name: 'mobile-boundary-640', use: { browserName: 'chromium', viewport: { width: 640, height: 900 } } },
    { name: 'mobile-390', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }
  ],
  // BASE_URL set (production smoke) → no local server; otherwise serve the repo root.
  webServer: process.env.BASE_URL ? undefined : {
    command: 'node scripts/serve-static.mjs --root . --port 4173',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: !process.env.CI
  }
});
```

Chromium is the required release gate; do not claim unrun cross-browser coverage.

## 9. Browser test matrix

`tests/site.spec.ts` covers all four configured viewports:

```text
/index.html, /effects.html, /faq.html × 1440 / 1024 / 640 / 390
```

Every matrix case attaches console/pageerror/same-origin request-failure listeners before navigation; waits on page-specific readiness; checks title/main/header/footer; checks exact six-axis nav order and one current item; checks `49 isms` / `64 effects` / `18 answers`; verifies `scrollWidth <= innerWidth`; verifies visible images have nonzero natural dimensions and first controls show visible focus; and finishes with zero collected errors.

### Index tests

- 49 cards; card modal dialog/focus trap/Escape/focus return;
- CSS/Tailwind/JSON export, copied JSON parses, stable light/dark token output;
- three representative Finder combinations produce three unique non-`ai-slop` IDs;
- Finder-result modal returns focus;
- AI Slop shows anti-pattern label and De-slop Audit Prompt;
- prompt/copy dispatches success, plus a rejected clipboard test shows manual-copy fallback.

### Effects tests

- 64 cards; family/device/search filters update result count;
- one effect from each of seven families has docs, guide, HTML/CSS and copy;
- pointer effect is static on mobile/coarse pointer;
- view-transition effect succeeds or falls back without error;
- reduced-motion emulation leaves final content visible and pauses ambient loops.

### FAQ tests

- 18 questions; first toggles `aria-expanded`/visibility;
- ArrowDown/Home/End work;
- locale switch preserves expanded ID and changes text;
- source links have safe external attributes.

## 10. Stage only public Pages files

`scripts/stage-pages.mjs` deletes/recreates `.pages` and copies only:

```text
index.html, effects.html, faq.html, favicon.svg
assets/css/**, assets/data/**, assets/js/**, assets/images/**
CNAME and robots.txt only if present; create .nojekyll if absent
```

Reject symlinks/traversal, `.DS_Store`, temp/rejected variants, and dotfiles except `.nojekyll`. Preserve paths/case; validate references against `.pages`; assert no `src`, `scripts`, `tests`, `docs`, `devlog`, `.git`, `node_modules`, manifests, TS config, reports, or caches.

Expected summary defines raster images separately from shared SVG icons:

```text
pages stage ok: 3 html, N css, N js, N json, 422 raster images, 4 shared svg icons, 0 forbidden
```

`422 = 147 + 147 + 64 + 64`; favicon is reported separately.

## 11. GitHub Actions

### **NEW** `.github/workflows/ci.yml`

```yaml
name: Verify
on:
  pull_request:
    branches: [main]
permissions:
  contents: read
concurrency:
  group: verify-${{ github.ref }}
  cancel-in-progress: true
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20.x, cache: npm }
      - run: npm ci
      - run: npm run verify
      - run: npx playwright install --with-deps chromium
      - run: npm run qa:e2e
```

### **MODIFY** `.github/workflows/deploy.yml`

Retain Pages permissions/environment/main trigger and extend the actual current steps (which
do not yet set up Node or run verify):

```diff
  - uses: actions/checkout@v4
+ - uses: actions/setup-node@v4
+   with: { node-version: 20.x, cache: npm }
+ - run: npm ci
+ - run: npm run verify
+ - run: npx playwright install --with-deps chromium
+ - run: npm run qa:e2e
+ - run: npm run pages:stage
 - uses: actions/configure-pages@v5
 - uses: actions/upload-pages-artifact@v3
   with:
-    path: '.'
+    path: '.pages'
 - id: deployment
   uses: actions/deploy-pages@v4
```

Feature branches run PR CI; Pages deploy remains `main`/manual only.

## 12. Final documentation sync

`README.md` must show current badges/status, Live/Effects/FAQ/Repo links, Finder/export/prompt/snippet/anti-pattern features, authored/generated workflow, image totals, release commands, and honest Chromium 1440/390 scope. Do not claim a license unless a root license exists or deployment success before it occurs.

`AGENTS.md` freezes non-module load order, TS→committed-JS rule, line limits, six nav axes, 49/64/18 invariants, `id === demo.type`, image pairs/dimensions, anti-pattern recommendation exclusion, verification, generated-file rule, and Pages allowlist.

`structure/README.md` shows source versus generated JS, data owners, 49×3 ISM assets, 64×1 effect guides, export/Finder files, validators/tests/workflows, and `.pages` as ignored temporary output.

## 13. Local release sequence

```bash
npm ci
npm run sot:sync
npm run images:thumbs -- --force
npm run build
npm run verify
npx playwright install chromium
npm run qa:e2e
npm run pages:stage
git diff --check
git status --short
```

Expected: build exit 0; verify prints all final summaries; all four Playwright projects (desktop-1440, tablet-1024, mobile-boundary-640, mobile-390) pass; staging reports expected public files/0 forbidden; no whitespace error or ignored output staged.

Inspect before commit:

```bash
git diff --stat
git diff -- README.md AGENTS.md structure/README.md
git status --short | grep -E '(node_modules|\.pages|\.tmp|test-results|playwright-report)' && exit 1 || true
```

## 14. Commit, push, merge, and deploy proof

Keep the phase commits from `00_plan.md` or equivalent focused commits. Final commit/push:

```bash
git add index.html effects.html faq.html assets src scripts tests package.json \
  package-lock.json README.md AGENTS.md structure .github .gitignore devlog/260715_production_upgrade
git status --short
git commit -m "test: add production QA and sync documentation"
git push -u origin HEAD
```

When project policy uses PRs:

```bash
gh pr create --fill --base main --head "$(git branch --show-current)"
gh pr checks --watch
gh pr merge --squash --delete-branch
MERGE_SHA="$(gh api repos/lidge-jun/design-isms/commits/main --jq .sha)"
```

Watch the deploy run for **that SHA**, not merely the latest green run:

```bash
for attempt in {1..20}; do
  RUN_ID="$(gh run list --workflow deploy.yml --branch main --limit 30 \
    --json databaseId,headSha,event,createdAt --jq --arg sha "$MERGE_SHA" \
    '.[] | select(.headSha == $sha) | .databaseId' | head -1)"
  test -n "$RUN_ID" && break
  sleep 3
done
test -n "$RUN_ID"
gh run watch "$RUN_ID" --exit-status
gh run view "$RUN_ID" --json headSha,conclusion,url --jq .
```

Expected: `headSha == MERGE_SHA`, `conclusion == success`.

Verify live responses:

```bash
for path in '' 'effects.html' 'faq.html'; do
  curl --fail --silent --show-error --location \
    "https://lidge-jun.github.io/design-isms/$path" >/dev/null
done
```

Run the defined production smoke project (no local webServer when BASE_URL is supplied):

```bash
BASE_URL=https://lidge-jun.github.io/design-isms/ npm run qa:e2e -- --grep @smoke
```

Confirm 49/64/18 and one new asset per feature return 200.

## 15. Failure and rollback policy

- Static/data failure: fix the owning phase; never bypass a verifier.
- Image failure: restore/regenerate/re-review the pair; never delete JSON to pass counts.
- 390px overflow, console error, or broken focus: release blocker.
- Deploy failure: inspect configure/upload/deploy steps; do not push unrelated retrigger commits.
- Live mismatch after green deploy: inspect staged artifact/cache version; revert the offending phase or merge.
- Emergency rollback commands (requires the same explicit push authority already granted):
  `git revert <merge-sha>`, `git push origin main`, capture `ROLLBACK_SHA=$(git rev-parse HEAD)`,
  locate/watch the deploy run for that exact SHA with the bounded loop above, then rerun the
  live curl and `@smoke` checks. Never force-push `main`.
- Record failed run URL, root cause, fix SHA, and successful run in the PR/release record.

## Acceptance criteria

Phase 080 completes only when build/verify pass; Playwright passes 1440/1024/640/390 for all
pages with zero console errors/overflow; `.pages` is allowlisted; README/AGENTS/structure agree;
only reviewed paths are staged; exact merge SHA has a successful Pages run; and live smoke
proves index/effects/FAQ with 49/64/18. Do not claim completion before live verification.
