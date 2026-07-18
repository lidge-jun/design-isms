# 001 — Artifact Provenance and Adoption Boundary

## Verified source

- ChatGPT conversation: `https://chatgpt.com/c/6a58e12e-c480-83e8-ad71-e2e7a1b4270e`
- code-extract result: complete, conversation ID matched, seven ZIPs recovered.
- all seven: `unzip -tq` pass.
- final reconciled ZIP: `design-isms-guideline-reconciled-v1.1.0.zip`, 7,479,954 bytes,
  SHA-256 `4804d139ff5b255627e693ea4cd3dc211bfcc26075865de8e88c2fc4a1f19e28`.
- delivery bundle: SHA-256 `deb3f5c6ed846f698320fb89be23f77b5f1467cffd9a44ee5274937a16fa32ba`.
- user input `Archive.zip`: SHA-256 `1973aa16c30b4f2fa292f14bae4c325ea4d92daefec5ac675f950d4235f124a2`.

The seven-artifact hash/size/identifier table and extraction command are preserved verbatim in
`devlog/260715_production_upgrade/009_2_gpt_pro_artifact_provenance.md`.

## Decision

Reject direct extraction into the repo: the package is a standalone scaffold and replaces 211
real image pairs with SVG placeholders. Adapt release validators/staging and runtime state ideas
to current owners. Keep `Archive.zip` untouched. No ZIP file is a source of truth.

