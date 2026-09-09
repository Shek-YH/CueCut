# WI-012 Verifier Evidence｜Settings Add Project Folder UI

Verdict: `PASS`

Acceptance: `NOT ACCEPTED` — this is an R90 verification result only; the orchestrator owns acceptance.

## Execution identity

- Verifier role: R90 Independent Verifier
- Work item: WI-012 — Settings Add Project Folder UI
- Target: `F:\\CCPJ\\CueCut3\\AI-Project-Ledger-Dashboard`
- This spawn agent id, used as verifier `executionRef`: `01a0839a-b01c-7093-9940-270c7e11a445` (the current `CODEX_THREAD_ID` and `docs/work-items/WI-012.json.review.executionRef`)
- Owner executionRef: `01a08389-6249-7d33-9df4-14e415442539`
- Owner and verifier executionRefs are different: yes
- Verification date: 2026-09-08

## Independent review scope

Read and checked:

- `docs/context/WI-012_CONTEXT.md`, `docs/context/WI-012_IMPLEMENTATION_PLAN.md`
- `docs/work-items/WI-012.json`
- owner evidence/handoff: `docs/evidence/WI-012.md`, `docs/handoffs/WI-012.md`
- WI-011 verifier PASS: `docs/evidence/WI-011-VERIFIER.md`, `docs/handoffs/WI-011-VERIFIER.md`
- PRD §§25–27: `docs/source/AI_Project_Ledger_Dashboard_V1_PRD.md`
- `web/App.tsx`, `web/data.ts`, `web/types.ts`
- all `tests/ui/**`, `tests/e2e/dashboard.spec.ts`, `tests/e2e/playwright.config.ts`
- WI-011 project API coverage in `tests/api/projects.test.ts`

No production or test source was changed by this verifier. Only this evidence file and the matching verifier handoff were written.

## Requirement checks

| Check | Result | Evidence |
| --- | --- | --- |
| Accessible project-root input | PASS | `web/App.tsx:340-374` renders the `Project root folder` label with `htmlFor="project-root"`, a text input with `id="project-root"`, and `aria-describedby="project-root-help"`; the help text explains local-directory validation/init/migration. `tests/ui/dashboard.test.ts:410-457` and the real E2E path locate it by its accessible role/name. |
| POST contract and request body | PASS | `web/data.ts:37-57` sends `POST /api/projects` with `Accept`, `Content-Type`, and exactly `JSON.stringify({ rootPath })`; the typed result is restricted to `initialized`, `migrated`, and `existing`. `tests/ui/data.test.ts:11-45` asserts the exact method, headers, and body. |
| 201 initialized/existing/legacy feedback | PASS | `web/App.tsx:61-65` maps all three WI-011 kinds to distinct feedback: `Existing ledger registered`, `Legacy Markdown migrated`, and `Empty ledger initialized`; `web/App.tsx:374` renders the result as an accessible status and includes warning/legacy-file counts. WI-011 API coverage in `tests/api/projects.test.ts:139-247` passed the real `201` existing, migrated, and initialized cases; the prior independent WI-011 verifier is `PASS`. |
| Project-list refresh and snapshot switch | PASS | `DashboardApp.handleAddProject` at `web/App.tsx:453-460` awaits the add result, reloads `GET /api/projects`, sets the returned stable `project.projectId`, and enables the remote lifecycle. The effect at `web/App.tsx:463-489` loads the new aggregate snapshot and reconnects its SSE stream. `tests/ui/dashboard.test.ts:410-457` asserts list refresh, new-project snapshot loading, and rendered project state. |
| Invalid/error feedback | PASS | Empty input is rejected before the request at `web/App.tsx:351-357`; non-2xx or non-success JSON is normalized to the backend `error` at `web/data.ts:48-57`; Settings renders it as `role="alert"` at `web/App.tsx:367-374`. `tests/ui/data.test.ts:47-62` and `tests/ui/dashboard.test.ts:459-468` passed the stable invalid-root error path. |
| No task-state writes / browser file boundary | PASS | The browser source contains no filesystem calls and no `tasks.json` write path. Settings only submits a root path and preserves the read-only notice; no status/progress/role/session mutation control is present (`web/App.tsx:374`, `tests/ui/dashboard.test.ts:387-408,459-468`). The only other browser POST is the pre-existing validated artifact-open action with `{ path }` in `web/data.ts:75-99`. |
| Project registration refresh does not leave an SSE listener | PASS | `subscribeToProject` adds `ledger:snapshot` and `error` listeners and its cleanup removes both and calls `source.close()` (`web/data.ts:103-139`). `DashboardApp` invokes `unsubscribe()` in the effect cleanup (`web/App.tsx:463-489`); `tests/ui/data.test.ts:83-120` verifies close after unsubscribe. After the fresh E2E run, ports 3100 and 4173 had no LISTEN entries. |
| Real bounded E2E | PASS | `tests/e2e/playwright.config.ts:17-26` starts real `pnpm dev:all` with isolated `APPDATA`; `tests/e2e/dashboard.spec.ts:67-102` creates a temporary empty directory outside the repo, does not mock project API routes, asserts POST `201`/`kind=initialized`, waits for list refresh and snapshot GET, and removes the fixture in `finally`. Fresh result: 2/2 Chromium tests passed. |

## Fresh independent verification commands

All commands were run from the target directory on 2026-09-08.

| Command | Exit code | Fresh result |
| --- | ---: | --- |
| `pnpm test --run tests/ui` | 0 | 2 test files / 13 tests passed |
| `pnpm test` | 0 | 21 test files / 79 tests passed |
| `pnpm lint` | 0 | TypeScript no-emit check passed |
| `pnpm build` | 0 | TypeScript build and Vite production build passed; 26 modules transformed |
| `pnpm test:e2e` | 0 | Real Vite + localhost Ledger server; 2/2 Chromium tests passed |

## Findings and disposition

No blocking finding. The implementation matches PRD §§25–27 and the WI-011 registration contract, keeps the browser task state read-only, refreshes/switches to the returned project, surfaces all three bootstrap kinds and invalid errors, and cleans the SSE lifecycle. R00 may record verifier verdict `PASS` with executionRef `01a0839a-b01c-7093-9940-270c7e11a445`. This document does not assign `ACCEPTED`.
