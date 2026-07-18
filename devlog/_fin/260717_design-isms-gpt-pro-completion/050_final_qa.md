# 050 — Final Verification and Closeout

Normative detailed contract: `devlog/260715_production_upgrade/110_phase10_final_qa.md`.

## Diff and evidence

- NEW `devlog/260715_production_upgrade/111_final_verification.md` and persisted C4 screenshots
  under `devlog/260715_production_upgrade/qa/` for index/effects/faq at 1440 and 390 plus error
  state where needed.
- MODIFY general SoT docs only for facts proven by final checks; update goalplan/ledger evidence.
- NO production feature, dependency, commit, push, workflow dispatch, deploy.

## Verification

Run `npm ci`, full verify, image audit, Pages stage, diff check; inspect stage manifest; serve
`.pages` and prove GET/HEAD 200, POST 405, missing/traversal 404, then teardown. Browser matrix:
three pages × 1440/1180/1024/860/640/390, ready counts, six nav axes, image dimensions,
scrollWidth, console/page/request failures. Drive Index Finder/dialog/lightbox/copy, Effects
filters/seven families/state/docs/lightbox/copy, FAQ keyboard/locale/source, and forced
error→retry recovery. Read screenshots with `view_image`.

The normative plan defines executable Node-owned static/browser/server/preservation receipts. The
static producer owns npm ci/verify/image-audit/stage/diff and binds results to a governed-tree
fingerprint. Browser QA
uses an isolated `BROWSER_AGENT_HOME`, native CDP device metrics (including asserted 390px),
event-driven nonzero console/page/network diagnostics, `.pages`-only fault injection, six happy
and three error screenshots. Preservation compares a dirty-file hash map plus HEAD/upstream/
Archive/remote and optional GitHub run/deployment receipts.

Execute start preservation → static → isolated local browser → server → final preservation →
aggregate in that order. The npm names containing `local` are intentionally excluded from CI:
they depend on agbrowse/profile state or checkout-only preservation inputs.

## Acceptance

All commands exit 0; the aggregate `verify:local-final` validates 18 rows, nine screenshots, dynamic
server probes/teardown, preservation equality and static checks; six widths have no error or horizontal overflow; screenshots are observed;
49/64/18 and 211 pairs remain; no placeholders/dependencies/remote actions; effects modal lock
fix remains. Populate every goalplan evidence field, C→D with fresh output/exit 0, D→IDLE, then
complete the host goal.
