# WI-005 Independent Verifier Evidence

Verdict: `NEEDS_CHANGES`

Acceptance: `NOT ACCEPTED` — this is an R90 verification result, not an acceptance decision.

## Execution identity

- Verifier role: R90 Independent Verifier
- This spawn's agent id, used as verifier `executionRef`: `01a082c5-fb56-7380-9b53-8b4e2eaf2c01`
- Owner: R03 Dashboard UX / React
- Owner executionRef: `01a082ad-19ea-7ca3-89da-a55d3926e529`
- Owner and verifier executionRefs are different: yes

## Scope checked

Read and independently checked:

- `docs/context/WI-005_CONTEXT.md`
- `docs/work-items/WI-005.json`
- `docs/evidence/WI-005.md`
- `docs/handoffs/WI-005.md`
- all files under `web/**`
- all files under `tests/ui/**` and `tests/e2e/**`
- `server/api/index.ts`
- `packages/ledger-schema/src/index.ts`
- PRD §17–25 and §38–40 in `docs/source/AI_Project_Ledger_Dashboard_V1_PRD.md`

The verifier did not read or write `.ai-ledger/tasks.json`, and made no implementation, server, schema, fixture, or test-source changes.

## Fresh command evidence

All commands were run independently from `F:\CCPJ\CueCut3\AI-Project-Ledger-Dashboard` on 2026-09-08:

| Command | Exit code | Result |
| --- | ---: | --- |
| `pnpm test --run tests/ui` | 0 | 2 files / 6 tests passed |
| `pnpm test` | 0 | 18 files / 52 tests passed |
| `pnpm lint` | 0 | TypeScript check passed |
| `pnpm build` | 0 | TypeScript build and Vite production build passed |
| `pnpm test:e2e` | 1 | 1 browser test failed; Chromium launched successfully |

The E2E failure is at `tests/e2e/dashboard.spec.ts:42`: `getByText("56%")` resolves to three visible elements (completion value, phase progress, and recently-active progress), so Playwright strict mode aborts before the Tasks assertions. This is not the stale “Chromium missing” condition reported in the owner evidence.

## UI and contract checks

| Check | Result | Evidence |
| --- | --- | --- |
| Seven pages | PASS | Live Dashboard navigation exposed and rendered `Overview`, `Tasks`, `Blockers`, `Activity`, `Roles`, `Artifacts`, and `Settings`. |
| Aggregate snapshot + SSE | NEEDS_CHANGES | `web/data.ts:19-24` uses the aggregate snapshot endpoint and `:41-70` subscribes to `ledger:snapshot`; live network showed one SSE connection and the UI status `Updated from ledger stream`. The same dev load showed two snapshot request entries (one pending/aborted, one 200), caused by the `StrictMode` mount path in `web/main.tsx:5-7` / `web/App.tsx:321-342`; this is not an exact one-request observation. No direct `.ai-ledger` data request appeared. |
| Tasks tree, phase groups, filters, search | PASS | Live Tasks rendered 10 leaf tasks and nested child cards under phase headings; status, role, priority, and search controls were exercised. UI tests cover the same filter/search behavior. |
| BLOCKED vs WAITING_USER split | PASS | `tests/ui/dashboard.test.ts` passed the separate-region assertions; live Blockers also exposed two distinct `role="region"` sections (both empty for the current project). |
| Status text, icon, aria, fixed color, 4px bar | PASS | Live DOM inspection found visible status text, `aria-label="Status icon: ..."`, fixed status-token colors, and computed `.task-status-bar` width `4px`; the UI test also asserts BLOCKED token `#ef4444`. Progress fills use the same status token. |
| Read-only task state | PASS | Tasks displayed `Read-only`; Settings displayed `Task state is read-only`; accessibility inspection exposed only navigation/filter/details controls plus the allowed registry/watcher controls, with no task status/progress mutation control. |
| Artifact path UI | NEEDS_CHANGES | Live Artifacts rendered validated relative paths plus `Copy Path` and `Open Parent Folder`. However `web/App.tsx:294` binds `Open Parent Folder` to `onClick={() => undefined}`, so the required action is non-functional. |

## Blocking findings

1. **E2E suite is red.** Fix the ambiguous `56%` locator in `tests/e2e/dashboard.spec.ts:42` by scoping it to the completion card or using a semantic assertion, then rerun the exact `pnpm test:e2e` command.
2. **The live Vite development load does not make an exact one-snapshot request.** Make the dashboard effect idempotent under React StrictMode, or otherwise ensure the acceptance environment observes a single aggregate snapshot request while retaining the SSE subscription; rerun the network check.
3. **`Open Parent Folder` is a no-op.** Wire it to the approved local-backend action or expose a real callback and verify it, while preserving the read-only task-state boundary and project-root path validation.

## Final disposition

The UI unit suite, full suite, lint, build, seven-page navigation, read-only boundary, status semantics, task tree/filter/search, blocker split, and SSE delivery checks are otherwise evidenced. The required E2E command failure and the two independent UI contract gaps prevent a `PASS`. R90 changed only `docs/evidence/WI-005-VERIFIER.md` and `docs/handoffs/WI-005-VERIFIER.md`; R00 should record this verifier executionRef and `NEEDS_CHANGES`, without marking WI-005 `ACCEPTED`.
