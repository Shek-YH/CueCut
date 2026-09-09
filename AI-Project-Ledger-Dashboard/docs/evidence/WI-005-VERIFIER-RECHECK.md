# WI-005 Verifier Recheck Evidence

Verdict: `NEEDS_CHANGES`

Acceptance: `NOT ACCEPTED` — this is an R90 verification result, not an acceptance decision.

## Execution identity

- Verifier role: R90 Independent Verifier
- This spawn agent id, used as verifier `executionRef`: `b34d34f7-cfcb-4750-b10b-fe23e619eb03`
- Owner: R03 Dashboard UX / React
- Owner fix executionRef: `01a082d1-d2f3-7090-b10a-61ebff861725`
- Owner and verifier executionRefs are different: yes

## Scope checked

Read and independently checked:

- `docs/context/WI-005_CONTEXT.md`
- `docs/work-items/WI-005.json`
- `docs/evidence/WI-005.md`
- `docs/handoffs/WI-005.md`
- prior R90 result: `docs/evidence/WI-005-VERIFIER.md` and `docs/handoffs/WI-005-VERIFIER.md`
- all files under `web/**`
- all files under `tests/ui/**` and `tests/e2e/**`
- PRD §17–25, §30 and §38–45 in `docs/source/AI_Project_Ledger_Dashboard_V1_PRD.md`
- aggregate snapshot/SSE server contract in `server/api/index.ts` and `server/api/sse.ts`

The verifier did not read or write `.ai-ledger/tasks.json`, and made no implementation or test-source changes.

## Fresh command evidence

All commands were run independently from `F:\CCPJ\CueCut3\AI-Project-Ledger-Dashboard` on 2026-09-08 after the owner fix:

| Command | Exit code | Result |
| --- | ---: | --- |
| `pnpm test --run tests/ui` | 0 | 2 files / 6 tests passed |
| `pnpm test` | 0 | 18 files / 52 tests passed |
| `pnpm lint` | 0 | TypeScript check passed |
| `pnpm build` | 0 | TypeScript build and Vite production build passed |
| `pnpm test:e2e` | 0 | 1 browser test passed; Chromium launched successfully |

## Recheck results

| Check | Result | Evidence |
| --- | --- | --- |
| Unique Overview progress locator | PASS | `web/App.tsx:193-197` exposes one `role="progressbar"` named `Project completion` with `aria-valuenow`; `tests/ui/dashboard.test.ts:302-304` and `tests/e2e/dashboard.spec.ts:42-45` pass. The live check observed `role=progressbar`, `aria-label=Project completion`, `aria-valuenow=56`. |
| Seven pages | PASS | Live local Vite check switched and rendered `Overview`, `Tasks`, `Blockers`, `Activity`, `Roles`, `Artifacts`, and `Settings`. `NAV_ITEMS` is the same seven-item list at `web/App.tsx:20,50`. |
| Tasks tree, phase grouping, filters and search | PASS | `web/App.tsx:164-179,245-267` retains nested tree filtering by status, role, priority and search; the focused UI test passed. |
| BLOCKED / WAITING_USER split | PASS | `web/App.tsx:270-280` renders separate labeled regions; the focused UI test passed the no-cross-contamination assertions. |
| Status text, icon, aria and colors | PASS | `STATUS_META` defines all seven status tokens at `web/App.tsx:32-40`; `StatusBadge` renders visible text plus an icon with a status-specific accessible label at `web/App.tsx:74-83`; task progress fill uses the same token at `web/App.tsx:86-96`. |
| 4px task status bar | PASS | `web/styles.css:88` sets `.task-status-bar` width to `4px`; `web/App.tsx:117-119` applies the status token color. |
| Read-only task state | PASS | No task-state mutation control or task-state write path appears in `web/**`; only the allowed project registry/watcher controls are exposed in `web/App.tsx:304-305`. Exact `READ-ONLY` UI is covered by `tests/e2e/dashboard.spec.ts:48`. |
| Aggregate snapshot and SSE | NEEDS_CHANGES | `web/data.ts:20-32` uses the aggregate snapshot endpoint and `web/data.ts:37-73` subscribes to `ledger:snapshot` and structured `error` frames. The live route-intercepted mount observed one SSE request but **two** snapshot requests because `web/main.tsx:6` uses `StrictMode` while `web/App.tsx:328-349` starts the fetch in an unguarded effect. This prior verifier finding remains unresolved. |
| Artifact UI | NEEDS_CHANGES | `web/App.tsx:299-301` renders validated relative paths, type grouping and `Copy Path`, but `Open Parent Folder` is still bound to `onClick={() => undefined}`. The required PRD action is present visually but non-functional. |

## Required changes before re-review

1. Make the aggregate snapshot load idempotent under the current `StrictMode` mount path, or otherwise prove the acceptance environment makes exactly one aggregate snapshot request while retaining the SSE subscription. Add or run a regression that observes the full app mount, not only the isolated `fetchProjectSnapshot` helper.
2. Implement `Open Parent Folder` through the approved local-backend/callback path, preserving current-project-root validation and the V1 read-only task-state boundary. Add a focused interaction assertion for the action.

## Final disposition

The strict-mode `56%` ambiguity is resolved: the unique semantic progressbar and `aria-valuenow` assertions pass. Seven-page navigation, tree/filter/search, Blockers split, status semantics, 4px bar, read-only boundary, UI tests, full tests, lint, build and E2E also pass. The remaining duplicate snapshot request and non-functional `Open Parent Folder` action prevent a `PASS`.

R90 changed only `docs/evidence/WI-005-VERIFIER-RECHECK.md` and `docs/handoffs/WI-005-VERIFIER-RECHECK.md`. R00 should record verifier executionRef `b34d34f7-cfcb-4750-b10b-fe23e619eb03` and verdict `NEEDS_CHANGES`; this document does not assign `ACCEPTED`.
