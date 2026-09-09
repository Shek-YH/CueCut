# WI-012 Settings Add Project Folder UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real, accessible Settings flow that posts a local project root to WI-011, renders the bootstrap result, refreshes the registered project list, and switches the dashboard to the new snapshot without exposing task-state writes.

**Architecture:** Keep the browser boundary in `web/data.ts`: one typed POST helper sends only `{ rootPath }` and normalizes stable API errors. `DashboardApp` owns the active project and refresh/snapshot lifecycle; `Settings` owns the short-lived form/result state and receives an injected project-add action for focused tests. The E2E test runs the actual Vite proxy plus localhost Ledger server against a temporary empty directory so initialization and registration are real.

**Tech Stack:** React 19, TypeScript, Vite, Vitest + Testing Library, Playwright, WI-011 localhost HTTP API.

---

### Task 1: Add the failing data/UI/E2E acceptance tests

**Files:**
- Modify: `tests/ui/data.test.ts`
- Modify: `tests/ui/dashboard.test.ts`
- Modify: `tests/e2e/dashboard.spec.ts`

- [x] **Step 1: Write the failing data test**

Add coverage for the exact `POST /api/projects` body and the stable backend error. Import the module namespace so the pre-change failure is an assertion that the new helper is missing, not a typo in the test import.

- [x] **Step 2: Write the failing Settings tests**

Add tests for the labeled root input, initialized/migrated/registered success feedback, project-list refresh and snapshot switch, backend error feedback, and the absence of task status/progress/role/session inputs or buttons.

- [x] **Step 3: Write the real bounded browser test**

Add a Playwright test that creates a temporary empty directory, uses the real `/api/projects` POST through the Vite proxy, waits for the real initialized/registered result and new project snapshot, and removes the temporary directory in `finally`. Do not intercept project API routes in this test.

- [x] **Step 4: Run RED**

Run `pnpm test --run tests/ui --reporter=verbose` and `pnpm test:e2e -- --grep "adds a real project folder"`.

Expected: the UI suite fails because Settings has no root input/result flow and the data helper is missing; the browser test fails because the real add flow is not wired. No production code is changed before these failures are observed.

### Task 2: Implement the minimal project-add client and Settings flow

**Files:**
- Modify: `web/data.ts`
- Modify: `web/App.tsx`
- Modify: `web/styles.css`

- [x] **Step 1: Implement the typed POST helper**

Add `AddProjectResult`, `ProjectAdder`, and `addProject(rootPath, signal?)`. Send `POST /api/projects` with `Accept`, `Content-Type`, and exactly `JSON.stringify({ rootPath })`; parse the WI-011 result and throw its generic `error` field for non-2xx responses.

- [x] **Step 2: Implement the accessible Settings form**

Render a `label`/`input#project-root` pair, submit-only root-path data, disabled submitting state, alert errors, and status feedback that distinguishes `existing`, `migrated`, and `initialized`. Render registered projects from refreshed API data. Keep the existing read-only notice and do not add controls for task status, progress, role, or session mutation.

- [x] **Step 3: Implement refresh and snapshot switching**

Have `DashboardApp` call the add helper, reload `GET /api/projects`, set the new project id, and let the existing aggregate snapshot/SSE lifecycle load the new project. Preserve StrictMode snapshot request sharing and initial-snapshot UI test behavior.

- [x] **Step 4: Add only the required Settings styles**

Reuse existing panel/button tokens and add compact form/result styles without changing unrelated dashboard styling.

### Task 3: Verify green behavior and hand off

**Files:**
- Modify: `tests/e2e/playwright.config.ts` only if needed to start the real Ledger API/proxy
- Create: `docs/handoffs/WI-012.md`
- Create: `docs/evidence/WI-012.md`

- [x] **Step 1: Run focused green tests**

Run `pnpm test --run tests/ui --reporter=verbose` and the real bounded Playwright add-project test. Confirm the POST body, result rendering, refresh/switch, error and read-only assertions.

- [x] **Step 2: Run all required gates**

Run `pnpm test:focused -- --reporter=dot`, `pnpm test`, `pnpm lint`, `pnpm build`, and `pnpm test:e2e` from the project root. Record fresh exit codes and test counts.

- [x] **Step 3: Check the scope guard**

Run `git status --short` and verify changed paths are limited to `web/**`, `tests/ui/**`, `tests/e2e/**`, package/Vite config only if changed, and the two WI-012 handoff/evidence documents. Do not modify server, schema, `.ai-ledger`, or global Skill files.

- [x] **Step 4: Write the handoff**

Record executionRef, the RED/GREEN and final command evidence, real browser fixture details, read-only boundary, remaining review scope, and status `READY_FOR_REVIEW`. Never write `VERIFIED` or `ACCEPTED`.
