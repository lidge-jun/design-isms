# 010 — Docs-only Roadmap Lock

## Scope

NEW/MODIFY documentation only: this plan unit, `devlog/260715_production_upgrade/000_plan.md`,
`009_1_completion_baseline.md`, `009_2_gpt_pro_artifact_provenance.md`, and corrected detailed
contracts `080_phase7_final_qa_deploy.md`, `090_phase8_image_quality.md`,
`100_phase9_ui_residuals.md`, `110_phase10_final_qa.md`. No production code or asset mutation.

## Before → after

- missing conversation/source hash → exact session, conversation, code-extract, ZIP hashes;
- stale 080 Playwright/push/deploy plan → dependency-free local hardening contract after UI repair;
- undifferentiated completion request → dependency-ordered 020/030/040/050 cycles;
- image count proof only → explicit 211-slot visual audit and rubric-governed unlimited generation;
- happy-path QA → forced failure/retry and keyboard activation scenarios.

## Acceptance

All docs are numbered, dependency-ordered, below 500 lines, list exact paths and IN/OUT scope, name conditional
activation and observable proof, and pass `git diff --check`. Independent A reviewer must return
PASS or GO-WITH-FIXES with every blocker folded back before B. B remains docs-only.
