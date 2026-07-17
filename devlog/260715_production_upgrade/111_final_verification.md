# 111 — Final verification receipt

Date: 2026-07-17 (Asia/Seoul)  
Scope: Phase 10 local release-candidate verification only. No commit, push, workflow dispatch, or deployment was performed.

## Result

PASS. The final checkout passed the fresh static chain, staged-server contract, exact 18-row browser matrix, critical interaction checks, forced failure/retry recovery, screenshot readback, and preservation checks described below. The only visual evidence issue found was premature loading-overlay capture in an earlier QA run; the runner was changed to wait for overlay DOM removal and all nine screenshots were regenerated and visually inspected.

## Static and artifact gates

`npm run qa:static` ran the following commands in order and stopped on nonzero exit. Full output hashes are in `115_final_static_receipt.json`.

| Gate | Exit | Result |
| --- | ---: | --- |
| `npm ci` | 0 | 7 packages installed; 0 vulnerabilities |
| `npm run verify` | 0 | generated JS, nav, 49 ISMs, 64 Effects, snippets, finder, content, assets, image quality, and line limits passed |
| `npm run images:audit` | 0 | 64 effect pairs manifest-bound; 0 invalid; 0 orphan |
| `npm run pages:stage` | 0 | 3 HTML, 211 PNG, 211 WebP, 0 forbidden; 464 staged files plus manifest |
| `git diff --check` | 0 | no whitespace errors |

The authoritative governed-tree and staged-manifest SHA-256 values are recorded in `115_final_static_receipt.json`; browser and server receipts must carry the same tree binding and the browser receipt must carry the same manifest binding. `verify:local-final` recomputes both from the current checkout.

## Managed server contract

`npm run qa:server` uses `.pages` from a loopback-only, dynamic-port process owned by the runner. Seven probes must pass: GET 200, HEAD 200 with a zero-byte body, POST 405 with `Allow: GET, HEAD`, missing path 404, two encoded traversal/slash paths 404, and malformed percent encoding 400. The dynamic PID/port, exit status, forced-termination flag, and port-closed proof are recorded in `113_final_server_receipt.json`.

## Browser matrix

`npm run qa:local:browser` used an isolated `BROWSER_AGENT_HOME` and CDP port 9333. It did not attach to or reset the authenticated 9222 profile. To contain the observed short-lived headless Chrome instability, the runner used 24 owned sessions (one per matrix row plus critical/error flows), requiring each transition to close 9333 before continuing. Each row waited for exact page readiness, complete loading-overlay removal, and a 500ms diagnostic-event-free quiet window before observation.

| Width | Index | Effects | FAQ | Nav/current | Overflow | Broken visible images | Diagnostics |
| ---: | ---: | ---: | ---: | --- | ---: | ---: | --- |
| 1440 | 49 | 64 | 18 | 6 / 1 | 0 | 0 | 0 |
| 1180 | 49 | 64 | 18 | 6 / 1 | 0 | 0 | 0 |
| 1024 | 49 | 64 | 18 | 6 / 1 | 0 | 0 | 0 |
| 860 | 49 | 64 | 18 | 6 / 1 | 0 | 0 | 0 |
| 640 | 49 | 64 | 18 | 6 / 1 | 0 | 0 | 0 |
| 390 | 49 | 64 | 18 | 6 / 1 | 0 | 0 | 0 |

Diagnostics combines CDP page exceptions, error console calls, error log entries, failed requests, and same-origin HTTP responses at or above 400. All five arrays were empty in all 18 rows. The runner then stopped its browser and server, verified both ports closed, and persisted `112_final_browser_receipt.json`.

## Critical interaction evidence

The exact browser session and the executable representative flow covered these behaviors:

- Index: no-result search and reset; Style Finder opened, accepted three answers, and rendered results; Minimalism dialog opened; its 768×512 WebP preview opened a 1536×1024 PNG lightbox; Escape closed lightbox before dialog and returned focus to the card; five related ISMs rendered; prompt content and CSS copy live-region feedback were present.
- Effects: family filtering produced 46 Interface Pattern items and 3 items for each of the other six families; search empty/reset returned 0/64; Bottom Sheet dialog had eight documentation blocks and two references; its WebP guide opened the 1536×1024 PNG; HTML copy feedback and state toggle worked. CDP reduced-motion emulation matched `reduce`; 64 cards remained legible with zero overflow and the active transitions used the repository's 0.01ms reduced-duration rule.
- FAQ: first answer expanded with sources, ArrowDown moved to the next question, End/Home moved to last/first, and switching to English preserved the expanded item while translating the question.
- Failure/retry: each staged primary JSON file was temporarily moved inside a `try/finally`; Index, Effects, and FAQ each displayed a visible `role=alert` with retry at 390px, the file was restored, and retry recovered exact counts 49/64/18. A first manual ref match omitted the English `Try again` spelling for Index/FAQ; this was a harness selector issue, not an application failure, and the corrected match plus executable runner recovered both pages.

## Screenshot readback

All nine PNGs are 900px high, have the exact recorded viewport width, and must match the paths, dimensions, and SHA-256 values in `112_final_browser_receipt.json`. The normal Index/Effects/FAQ desktop/mobile captures and all three 390px alert/retry captures are read back visually after the final run; no hash is duplicated here so this narrative cannot become stale independently of the executable receipt.

## Preservation and boundaries

The start receipt recorded:

- HEAD and upstream: `769fa78b3fd602d695bae1f47bffb7554a525211`
- reflog head: the same commit, `fix: equal 3-column grid, refined finder trigger button`
- `Archive.zip`: `1973aa16c30b4f2fa292f14bae4c325ea4d92daefec5ac675f950d4235f124a2`
- the complete dirty checkout file map and aggregate SHA-256

Final preservation must reproduce those values, remote refs, and the dirty-file map. The existing Effects modal ownership remains intact: no `modal-open` token occurs in `src/effects.ts`, `assets/js/effects.js`, or `assets/css/effects.css`. No SVG placeholder tree exists under `assets/images`, and `package.json` contains only TypeScript and Sharp development dependencies—no Playwright or Python runtime was added.

## Known limits

- This is local release-candidate evidence for the staged `.pages` tree; deployment was intentionally not performed.
- Remote-state equality is checked from available GitHub run/deployment identifiers during the bounded QA window. It does not claim that no unrelated actor could mutate remote state outside that window.
- The exhaustive interaction transcript is human-readable here; the executable receipt enforces the matrix, representative interaction assertions, three fault/retry recoveries, screenshot hashes, and owned-process teardown.
