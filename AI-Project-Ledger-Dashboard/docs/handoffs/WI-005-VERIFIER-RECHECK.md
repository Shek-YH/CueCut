# WI-005 Verifier Recheck Handoff

Verdict: `NEEDS_CHANGES`

Acceptance: `NOT ACCEPTED` — this is an R90 verification handoff, not an acceptance decision.

## Execution identity

- Verifier role: R90 Independent Verifier
- This spawn agent id, used as verifier `executionRef`: `b34d34f7-cfcb-4750-b10b-fe23e619eb03`
- Owner fix executionRef: `01a082d1-d2f3-7090-b10a-61ebff861725`
- Owner and verifier executionRefs are different: yes

## Independent verification summary

- `pnpm test --run tests/ui`: 2 files / 6 tests passed.
- `pnpm test`: 18 files / 52 tests passed.
- `pnpm lint`: passed.
- `pnpm build`: passed.
- `pnpm test:e2e`: 1/1 passed with Chromium running.
- The former strict-mode `56%` selector is fixed: the live check found one `progressbar` named `Project completion` with `aria-valuenow=56`.
- Live navigation rendered all seven pages. Tasks tree/filter/search, separate `BLOCKED` and `WAITING_USER` regions, status text/icon/aria/colors, 4px status bar, read-only task state and the artifact path controls were checked against the PRD and current source/tests.
- Live route interception found one SSE connection but two aggregate snapshot requests during the `StrictMode` effect mount.
- `Open Parent Folder` remains a no-op in `web/App.tsx:301`.

## Required changes before re-review

1. Eliminate or otherwise prove away the duplicate aggregate snapshot request under `StrictMode`, while retaining `ledger:snapshot` SSE updates and the aggregate endpoint.
2. Wire `Open Parent Folder` to an approved local-backend/callback action with project-root validation, and add a focused interaction check.

R90 changed only the two verifier recheck documents named above and did not write `.ai-ledger/tasks.json`, implementation files, or test source. R00 should record `NEEDS_CHANGES` and verifier executionRef `b34d34f7-cfcb-4750-b10b-fe23e619eb03`; do not mark WI-005 `ACCEPTED`.
