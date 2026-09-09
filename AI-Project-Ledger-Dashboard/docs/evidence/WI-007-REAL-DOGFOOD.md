# WI-007 Real Self-Dogfood Evidence

**Operator:** R00 Project Orchestrator  
**Evidence class:** Real local E2E  
**Project:** `ai-project-ledger-dashboard-v1`

## Bounded harness

R00 started `pnpm dev:all` in a child `cmd.exe` with `LEDGER_PROJECT_ROOT` set to this project and isolated ports `127.0.0.1:4211` (Vite) and `127.0.0.1:3211` (Ledger API). The harness polled the API, launched local Playwright Chromium, opened the real page, and cleaned the exact process tree; no project files were uploaded and no secret file was read.

## Real path result

1. `GET /api/projects` returned the self project with stable `projectId=ai-project-ledger-dashboard-v1`.
2. Chromium loaded `http://127.0.0.1:4211/?projectId=ai-project-ledger-dashboard-v1` and read the real `.ai-ledger` snapshot.
3. The test entered Tasks and observed real `T-004` as `IN_PROGRESS`.
4. Using temp-file write + rename, it changed `T-004` to `COMPLETED`, progress `100`, and non-null `completedAt`; it updated project/runtime timestamps and appended a `TASK_STATUS_CHANGED` event.
5. The same real page observed `COMPLETED` in **214.13ms**, under the PRD 1,000ms limit.
6. The harness wrote malformed `tasks.json`; the page displayed `Showing last known good snapshot`, proving LKG/error behavior.
7. It restored the valid file and observed the task again: `LKG_RECOVERY=PASS`.

## Output

```text
SELF_PROJECT_ID=ai-project-ledger-dashboard-v1
DOGFOOD_REFRESH_MS=214.13
LKG_WARNING_VISIBLE=true
LKG_RECOVERY=PASS
DOGFOOD_E2E=PASS
```

Cleanup: `NO_DOGFOOD_LISTENERS` on ports 4211/3211; no `*.dogfood.tmp` remained.

This is R00 execution evidence; R90 independently verified it in `docs/evidence/WI-007-VERIFIER.md`, and WI-007 is accepted in the machine ledger.
