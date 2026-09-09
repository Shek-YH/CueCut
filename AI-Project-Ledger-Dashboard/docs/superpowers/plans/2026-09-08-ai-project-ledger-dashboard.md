# AI Project Ledger Dashboard V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local, read-only project-state Dashboard backed by `.ai-ledger`, with safe migration, LKG recovery, watcher/SSE refresh, and self-dogfood.

**Architecture:** Keep a reusable Zod schema and pure ledger aggregation package separate from the Node HTTP server and React UI. The server owns filesystem reads, project registry, migration, watcher/debounce, atomic writes and SSE; the browser consumes aggregate snapshots and never writes task state. The project itself maintains a real `.ai-ledger` and is loaded as the first dogfood project.

**Tech Stack:** Node 20+, TypeScript, Node `http`, React, Vite, Zod, chokidar, Vitest, Playwright, CSS variables.

---

### Task 1: Bootstrap and machine ledger contract

**Files:** `package.json`, `tsconfig*.json`, `.gitignore`, `packages/ledger-schema/**`, `.ai-ledger/**`, `fixtures/**`.

- [ ] Write failing Zod/schema/progress/status tests for all seven machine files, parent progress, completed invariants and secret-free reasons.
- [ ] Run `pnpm test --run tests/schema tests/progress` and observe contract failures.
- [ ] Implement the smallest independent schema/aggregation modules and valid self `.ai-ledger` fixtures.
- [ ] Run focused tests, `pnpm lint`, and `pnpm build`; record evidence.

### Task 2: Ledger store, project identity, LKG and secure reads

**Files:** `server/ledger/**`, `server/security/**`, `server/registry/**`, `tests/ledger/**`.

- [ ] Write failing tests for projectId/root binding, file allowlist, LKG on invalid JSON, and artifact path traversal rejection.
- [ ] Implement secure snapshot loading and summary aggregation without reading `.env`, credentials, token, cookie or SSH files.
- [ ] Run focused integration tests and record valid/invalid snapshot evidence.

### Task 3: Watcher, atomic write, API and SSE

**Files:** `server/watcher/**`, `server/api/**`, `server/atomic.ts`, `tests/watcher/**`, `tests/api/**`.

- [ ] Write failing tests for debounce, `.ai-ledger`-only watch scope, localhost bind, snapshot/events endpoints and SSE event delivery.
- [ ] Implement chokidar watcher, 100–250ms debounce, atomic temp-write/rename and reconnect-safe SSE.
- [ ] Run integration tests and a real local browser refresh test; record elapsed time.

### Task 4: Legacy migration and project registry

**Files:** `server/migration/**`, `server/registry/**`, `fixtures/project-legacy-md/**`, `tests/migration/**`.

- [ ] Write failing tests for `[x]`, `[ ]`, limited Chinese status phrases, unknown status warnings and unchanged Markdown.
- [ ] Implement migration confidence/warnings and empty `.ai-ledger` skeleton initialization; never delete/move Markdown.
- [ ] Run migration and security tests.

### Task 5: React Dashboard pages

**Files:** `web/src/**`, `tests/ui/**`, `playwright.config.ts`.

- [ ] Write failing UI tests for navigation, task tree, filters/search, status color+text+icon, blockers split, activity, roles, artifacts and read-only state.
- [ ] Implement Overview, Tasks, Blockers, Activity, Roles, Artifacts and Settings using one aggregate snapshot.
- [ ] Run UI tests at desktop viewport and capture screenshots for Evidence.

### Task 6: Skill dual-write integration

**Files:** `C:/Users/Administrator/.codex/skills/ai-autonomous-project-ledger-skill/SKILL.md`, `docs/skill-integration/**`, `tests/skill/**`.

- [ ] Run a baseline pressure scenario against the current Skill and document what machine-ledger rule is missing.
- [ ] Patch the Skill with `.ai-ledger` initialization, atomic write order, schema/event/status rules, secret restrictions and Markdown+JSONL dual-write while preserving existing multi-agent gates.
- [ ] Run the same pressure scenario with the updated Skill and record compliance evidence.

### Task 7: QA, security, dogfood and final acceptance

**Files:** `tests/e2e/**`, `fixtures/project-large/**`, `docs/09_TEST_RESULTS.md`, `docs/10_SECURITY_REVIEW.md`, `docs/11_FINAL_ACCEPTANCE.md`.

- [ ] Run unit, integration, UI and Playwright suites; generate 1,000-task/10,000-event fixture and measure refresh/LKG behavior.
- [ ] Add the Dashboard's own folder to its registry, view its own `.ai-ledger`, modify a task externally and verify the UI refreshes within 1s.
- [ ] Have R90 independently verify all P0 items, then request the user's one final local Product/Release Acceptance.
