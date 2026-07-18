# 009.2 — GPT Pro Artifact Provenance and Adoption Decision

## Source identity

- agbrowse web-ai session: `01KXNJZ0G94PQJME5DVFT7FMX7`
- requested/resolved model: GPT-5.6 Sol / Pro
- ChatGPT conversation: `6a58e12e-c480-83e8-ad71-e2e7a1b4270e`
- conversation URL: `https://chatgpt.com/c/6a58e12e-c480-83e8-ad71-e2e7a1b4270e`
- visible title: `디자인 시스템 평가`
- extraction root: `/tmp/design-isms-gpt-pro-6a58e12e-20260717131708`

The stored web-ai session never learned the final conversation URL, so session-only extraction
failed closed. The logged-in history supplied the exact conversation ID; URL-based extraction
then succeeded without sending a new prompt.

```text
agbrowse web-ai code-extract \
  --vendor chatgpt \
  --url https://chatgpt.com/c/6a58e12e-c480-83e8-ad71-e2e7a1b4270e \
  --multi-zip \
  --output-dir /tmp/design-isms-gpt-pro-6a58e12e-20260717131708 \
  --json

status=complete
conversationId=6a58e12e-c480-83e8-ad71-e2e7a1b4270e
artifacts=7
```

## Hash and integrity inventory

Every row passed `unzip -tq`. `unzip -l` additionally proved the named top-level package and
its internal inventory.

| Artifact | Bytes | SHA-256 | Distinguishing identifier |
| --- | ---: | --- | --- |
| `design-isms-production-scaffold-2026-07-16.zip` | 1,479,333 | `89efcab2adaa0f777af07f48f2683ed9233a0cc95c20e5f2893af63ec1b6bf30` | first standalone scaffold |
| `design-isms-guideline-reconciled-v1.1.0.zip` | 7,479,954 | `4804d139ff5b255627e693ea4cd3dc211bfcc26075865de8e88c2fc4a1f19e28` | `BUILD_RESULT.json`, `upstream-snapshot.json`, 211 SVG placeholders |
| `design-isms-production-reconciled-2026-07-17.zip` | 8,475,228 | `97b1b048e7a9d5686100ed55177bfce930d1e2e92aebcb1979f13f123f678b5a` | reconciled standalone production tree |
| `design-isms-phase080-overlay-2026-07-17.zip` | 120,352 | `5d4fa42fbfa0600dc1127e8fe46db6b0a2cf86eafa88e5b662fad7033e0d2d52` | 52-file overlay manifest and test receipt |
| `design-isms-pages-preview-2026-07-17.zip` | 7,087,306 | `905354eabb9e084c04a1a4759397cff80b472ebb07ebfeac8c32a5538d2822c0` | staged public preview |
| `design-isms-image-prompts-211-2026-07-17.zip` | 24,559 | `a3bcdcc5fae3df0b91b8b3549edfb43cc6007f33619d6456a7547ad15a876650` | JSONL/CSV prompt handoff |
| `design-isms-delivery-bundle-2026-07-17.zip` | 15,421,923 | `deb3f5c6ed846f698320fb89be23f77b5f1467cffd9a44ee5274937a16fa32ba` | four deliverable ZIPs plus checksum ledger |

The assistant displayed `4804d139…f19e28` next to the final guideline-reconciled response;
the recovered file matches exactly. This distinguishes it from the older plan-only ZIP
`7d3ac04f…3cb1a` and from the user-uploaded input archive.

## Input archive distinction

The worktree file `Archive.zip` is the uploaded input, not the GPT output:

```text
Archive.zip
bytes=13,495,647
created=2026-07-17T08:43:08+0900
sha256=1973aa16c30b4f2fa292f14bae4c325ea4d92daefec5ac675f950d4235f124a2
entries=811 including __MACOSX and node_modules
```

The ChatGPT answer independently names that same hash as `Archive(2).zip` and reports 354
clean non-directory inputs after stripping metadata/dependencies.

## Repo-reality reconciliation

The final ZIP openly states that it is a standalone scaffold. Its environment could not fetch
the repository's real `assets/` tree, so it replaced all 211 visual slots with deterministic
SVG placeholders. The local checkout already contains 211 PNG originals and 211 WebP previews,
all wired to the shipped 49 ISMs and 64 Effects. Replacing the checkout would therefore destroy
stronger production assets and current modular source owners.

| GPT proposal | Local reality | Decision |
| --- | --- | --- |
| Whole standalone scaffold | Phases 020–070 already landed in seven commits | Reject replacement |
| 211 SVG placeholders | 211 real PNG/WebP pairs exist | Reject placeholders |
| Generated replacement data | Current JSON is the repository SoT | Reject data replacement |
| Python Playwright QA | No dependency addition is authorized; native browser QA is available | Reject dependency |
| Phase 080 validators | Matching paths are absent and the current deploy uploads root | Adapt to current repo |
| Public allowlist staging | Current Pages workflow uploads `.` | Adopt with `.pages/` |
| Page-level retry/a11y hardening | Current index has an unhandled initial fetch and inline image `onerror` | Adapt in Phase 100 |
| 211 prompt export | Current prompts already live with ISM/effect records | Optional derived artifact; no new runtime SoT |

## Adoption boundary

No file from the ZIP is copied directly into production. The ZIP is evidence and a design input.
Each adopted idea is rewritten against current owners, file limits, data shapes, and verification
scripts in the amended 080/090/100/110 plans. `Archive.zip` remains user-owned and is not deleted.
