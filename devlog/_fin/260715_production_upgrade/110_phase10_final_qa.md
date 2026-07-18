# 110 — Final Static, Browser, and Preservation QA

## Loop specification

- Archetype: verification and closeout
- Trigger: 080, 090, and 100 have each closed their own PABCD cycle.
- Goal: prove the final checkout satisfies release, image, runtime, responsive, and preservation
  criteria with fresh evidence; repair only defects whose owner is already in scope.
- Non-goals: commit, push, deploy, new feature, framework, or scope expansion.
- Verifier: clean static gates, staged artifact inspection, managed local server, six-width
  browser matrix, screenshots read back, console/network checks, final git diff/status.
- Stop: one clean observation after the last change and all goalplan criteria carry evidence.
- Bounds: local server and enabled browser runtime only; no external writes.

## Preconditions

- 080 `npm run verify` and `.pages` stage pass.
- 090 audit covers 211 images and any replacements have provenance.
- 100 forced failure/retry and keyboard activation checks pass.
- User-owned effects modal changes remain present in source, generated JS, and CSS.

## Evidence outputs

| Marker | Exact path | Purpose |
| --- | --- | --- |
| NEW | `devlog/260715_production_upgrade/111_final_verification.md` | commands, exit codes, counts, browser matrix, known limits, no-deploy statement |
| NEW | `devlog/260715_production_upgrade/qa/final-index-{1440,390}.png` | final index visual proof |
| NEW | `devlog/260715_production_upgrade/qa/final-effects-{1440,390}.png` | final Effects visual proof |
| NEW | `devlog/260715_production_upgrade/qa/final-faq-{1440,390}.png` | final FAQ visual proof |
| NEW conditional | `devlog/260715_production_upgrade/qa/final-*-error-390.png` | forced error/retry state evidence when not already persisted in Phase 100 |
| NEW | `devlog/260715_production_upgrade/112_final_browser_receipt.json` | exact 18-row width/page matrix, event-driven console/page/network diagnostics, interaction and screenshot hashes |
| NEW | `devlog/260715_production_upgrade/113_final_server_receipt.json` | dynamic-port server PID/root/readiness/probe/teardown evidence |
| NEW | `devlog/260715_production_upgrade/114_final_preservation_{start,final}.json` | dirty-worktree allowlist map, HEAD/upstream/archive/remote receipts before and after QA |
| NEW | `devlog/260715_production_upgrade/115_final_static_receipt.json` | final-tree fingerprint plus npm ci/verify/image audit/stage/diff command exits and output hashes |
| NEW | `scripts/run-final-browser-qa.mjs`, `scripts/run-final-server-qa.mjs` | executable nonzero browser and server gates without Playwright |
| NEW | `scripts/run-final-static-qa.mjs`, `scripts/final-preservation.mjs`, `scripts/verify-final-qa.mjs` | tree-bound static receipt, preservation capture, and aggregate C→D gate |
| MODIFY | `README.md`, `AGENTS.md`, `structure/README.md` | only final factual SoT corrections discovered by verification |
| MODIFY | `.codexclaw/goalplans/design-isms-gpt-pro-zip-main-diff-020-070-phase/goalplan.json` and its sibling `ledger.jsonl` | captured evidence, work-phase/criterion completion, terminal outcome |

QA images are persisted because this is a C4 release surface. No `.pages/`, browser profile,
temporary contact sheet, or server log is committed as a production artifact.

## Static sequence

Run only the owned receipt producers in this exact order; do not start a manual fixed-port server:

```text
node scripts/final-preservation.mjs start
node scripts/run-final-static-qa.mjs
node scripts/run-final-browser-qa.mjs
node scripts/run-final-server-qa.mjs
node scripts/final-preservation.mjs final
node scripts/verify-final-qa.mjs
```

The browser, preservation, and aggregate npm aliases are deliberately named
`qa:local:browser`, `qa:local:preserve:*`, and `verify:local-final`: they require local
agbrowse/profile or checkout evidence and are not CI workflow inputs. `qa:static` and
`qa:server` remain portable receipt producers.

The static producer invokes `npm ci`, `npm run verify`, `npm run images:audit`,
`npm run pages:stage`, and `git diff --check`, fails on any nonzero exit, then writes 115 with each
command/exit/output SHA, staged counts and a deterministic governed-tree fingerprint.

## Browser matrix

Pages: `/index.html`, `/effects.html`, `/faq.html`.
Widths: `1440`, `1180`, `1024`, `860`, `640`, `390`; use a stable height suitable for each.

For every page/width:

- wait for page-specific ready content (49 cards, 64 cards, or 18 questions);
- assert `document.documentElement.scrollWidth <= window.innerWidth`;
- inspect console errors, page errors, and same-origin failed requests;
- verify six navigation axes and one current item;
- verify visible raster images have nonzero natural dimensions;
- capture 1440 and 390 final screenshots and read them back with `view_image`.

Critical flows:

- Index: search/empty/reset, Style Finder three answers/results, card dialog, nested image,
  Escape order, focus return, related ISM, prompt/code copy fallback.
- Effects: family/device/search/empty/reset, one item per seven families, state control, docs,
  guide lightbox, snippet copy, reduced motion.
- FAQ: expand/collapse, ArrowUp/Down/Home/End, locale change with stable expanded item, sources.
- Error: force each page's primary JSON request to fail, observe alert/Retry, restore response,
  retry to successful ready state.

### Executable browser contract

`scripts/run-final-browser-qa.mjs` owns a dynamic-port `.pages` server and starts agbrowse with
`BROWSER_AGENT_HOME=$PWD/.tmp/final-browser-home` on CDP 9333, isolated from authenticated 9222.
Its native CDP client enables Runtime/Log/Page/Network before navigation and applies
`Emulation.setDeviceMetricsOverride` before every matrix row. It asserts `innerWidth` equals exactly
1440/1180/1024/860/640/390, then waits for load, exact 49/64/18 readiness, and a 500ms quiet window.

Every row fails nonzero on page exceptions, error console/log events, request failures, same-origin
HTTP status >=400, wrong nav/count/width, broken visible images, or overflow. The runner records all
18 structured rows, enforces representative Index/Effects/FAQ interactions plus CDP reduced motion,
and performs three `.pages` fault→alert→Retry flows with restoration in `finally`. The fuller critical
flow transcript from the same isolated browser session is recorded in 111. The runner captures six
happy and three 390px error screenshots with SHA/dimensions. Its outer `try/finally` stops and waits
for both owned server and isolated browser, proves HTTP/CDP ports closed, and records teardown
booleans in 112. Receipt 112 also binds the observed `.pages/manifest.json` SHA and governed-tree
SHA to receipt 115, so browser evidence cannot predate the final staged tree.

## Preservation and release boundary

Final diff review must confirm:

- `src/effects.ts` and `assets/js/effects.js` still have no duplicate `body.modal-open` calls;
- `assets/css/effects.css` still delegates scroll locking to `AppDialogA11y`;
- 49 ISMs, 64 Effects, 18 FAQ, 211 PNG, and 211 WebP remain;
- no SVG placeholder tree from GPT was adopted;
- no Playwright/Python dependency was added;
- `Archive.zip` was not modified or deleted;
- no commit, push, workflow dispatch, or deployment occurred.

`scripts/final-preservation.mjs start` records HEAD/upstream/reflog, Archive SHA, remote refs,
read-only GitHub Actions/Pages IDs when available, and SHA-256 for every dirty tracked/untracked file
outside `.tmp`, `.pages`, and the explicit 111–115/QA/goalplan allowlist. `final` recomputes it; only
allowlisted evidence may differ. When GitHub receipts are unavailable, the claim is narrowed to
“this agent did not invoke remote actions,” not global non-occurrence.

`scripts/run-final-server-qa.mjs` spawns the repository server on port 0, verifies its reported PID,
loopback port and real `.pages` root, then asserts GET 200, HEAD 200 with empty body, POST 405 with
exact `Allow: GET, HEAD`, missing 404, encoded traversal 404, and malformed encoding 400. It
terminates/waits the owned PID and proves the port closed before writing 113.

`scripts/verify-final-qa.mjs` is the sole C→D command. It validates 18 browser rows, the exact five-array
diagnostic and per-flow schemas, zero diagnostics,
nine screenshot hashes/dimensions, browser/server teardown, 113 probes, 114 preservation equality,
and all five exit-zero commands in 115. It recomputes the current governed tree, staged manifest,
HEAD/upstream/reflog, Archive SHA, remote refs, and dirty-file map, and enforces start→static→browser→
server→final chronology. C→D records this command, exit 0, output, receipt path/hash; D then records
the transition to IDLE. Free-form capturedEvidence alone cannot close the goal.

## Conditional repair policy

A failed gate returns to its owner: release script/workflow → 080, image/provenance → 090,
runtime/interaction → 100. The repair is performed as an appended task in this cycle only when
it is a small direct defect in already-approved scope; architecture or dependency divergence
returns to P and amends the goalplan. After any repair, rerun the affected gate and then the
entire final sequence.

## Completion criteria

- Fresh `npm run verify` output and exit code 0.
- Fresh image audit and stage output with exit code 0.
- Six-width matrix has zero console/page errors and zero horizontal overflow.
- Persisted screenshots have been visually inspected, not merely generated.
- Final status documents known limits honestly and says deployment was not performed.
- Goalplan validates only after all capturedEvidence fields are populated; C→D carries fresh
  `checkOutput` and `exitCode: 0`; D closes to IDLE before host goal completion.
