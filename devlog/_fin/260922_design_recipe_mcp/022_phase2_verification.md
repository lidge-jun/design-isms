# Phase 2 implementation and initial verification

Implemented the two worker scopes from021 plus main-owned composition language/version, independent stdio/CLI tests and docs. Operations are small inspectable value transformations; metadata examples are runnable rather than placeholders.

Initial 25-test MCP suite found one real launch bug: macOS /var/folders symlink input did not match the resolved module URL, so CLI silently exited0 without output. isMain now compares actual canonical paths; metadata-only temporary packaging test stays on the original symlink path. Re-run:25 tests passed. Core:19 passed.

Runtime probes cover sync/async stalls, never-settling promises, serialization/proxy traps, operation caps,4-call cancellation,EOF teardown, missing Node capabilities, JSON roundtrip/composition canonicality, split UTF8/oversized input recovery, Unicode/escaping byte bounds, executable discovery examples and metadata-only no-data packaging. They do not prove malicious JavaScript safe.

Server name/version derives from package metadata. EOF aborts active workers before waiting. The tool description is1053UTF-8 bytes. Node operational files remain outside Pages.

## Independent C audit

Separate review returned PASS, no High/Medium findings. Fresh25 MCP/CLI tests,19 core tests and29 generated-output matches passed. Independent probes paged all232 discoverable references through75 responses capped at2048 wire bytes using a64-control-character request ID, with no gaps/duplicates. Exactly100 operations succeeded before OPERATION_LIMIT. Private runtime names stayed unavailable; prototype modification was refused; argument getters ran zero times. Exception-proxy loops and synchronous-call cancellation recovered; EPIPE rejected both pending writes and writer close. The suggested exact OPERATION_LIMIT assertion was added.

## Driven surface matrix

Real CLI --help: exit0,3514 stdout bytes,0 stderr bytes. Empty stdin: exit0,0 bytes. Korean query: exit0,415 stdout bytes. Malformed JSON followed by action discovery: exit1, two valid JSON output lines,0 stderr bytes. English compose: exit0,5709 bytes; a separate process accepted that JSON and returned an English brief. An actual shell compose|jq|brief pipeline returned settings-workspace/en and3735 text bytes. Raw stdout/stderr/stdin/exit receipts are retained under ignored qa-artifacts/mcp-cli. Each subprocess was awaited to exit; no long-lived CLI resources remain.

Full npm run verify passed:19 core,25 transport and106 quality-contract tests; image/nav/Finder gates unchanged. Pages stage:7HTML,331PNG/331WebP,0forbidden. Description1053 bytes; complete tool definition1553 bytes. No MCP/CLI runtime files enter the Pages tree.

The pre-existing lockfile uses sharp0.35.3; npm audit reported a high libheif advisory (GHSA-rgj7-g3m4-5g8c). This series did not add or change dependencies and does not execute image generation for this phase. The observation is recorded, not silently fixed or counted as a clean audit.
