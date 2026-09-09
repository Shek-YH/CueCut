# Final Acceptance｜AI Project Ledger Dashboard V1

**Status:** `ACCEPTED`  
**Gate:** G7 — Final Product / Release Acceptance  
**Project ID:** `ai-project-ledger-dashboard-v1`

## Verified before user acceptance

- WI-001 Schema/Progress: R90 PASS and ACCEPTED.
- WI-002 Ledger Store/LKG/Security: R90 PASS and ACCEPTED.
- WI-003 Watcher/Atomic/API/SSE: R90 PASS and ACCEPTED.
- WI-004 Legacy Migration/Registry: R90 recheck PASS and ACCEPTED.
- WI-005 Dashboard UI/Chromium: final R90 PASS and ACCEPTED.
- WI-006 Skill dual-write: R90 PASS and ACCEPTED.
- WI-009 Artifact open action: R90 PASS and ACCEPTED.
- WI-010 Recent activity 200: R90 PASS and ACCEPTED.
- WI-011 Dynamic Add Project API: R90 PASS and ACCEPTED.
- WI-012 Settings Add Project UI: R90 PASS and ACCEPTED.
- WI-007 QA/Security/Self Dogfood: R90 PASS and ACCEPTED.

## Core Golden Path result

`GP-01` Settings Add Project Folder → `GP-02` stable projectId/ledger → `GP-03` validated aggregate snapshot → `GP-04` seven-page read-only Dashboard → `GP-05` watcher/SSE update → `GP-06` malformed JSON LKG → `GP-07` additive Legacy Migration → `GP-08` self-project dogfood.

Real self-dogfood loaded the project's own `.ai-ledger`, changed `T-004` from `IN_PROGRESS` to `COMPLETED` using temp-file + rename, updated project/runtime/event records, observed the UI in **214.13ms**, displayed the LKG warning on malformed JSON, and recovered successfully.

## Run locally

```powershell
cd F:\CCPJ\CueCut3\AI-Project-Ledger-Dashboard
pnpm install
pnpm dev:all
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). The default dev server binds Vite to `127.0.0.1:4173` and the Ledger API to `127.0.0.1:3100`; no external service is used.

## Required user action

The user confirmed Product/Release Acceptance. The post-acceptance UI follow-up was completed with Chinese as the default dashboard language and an English toggle in the top bar. The local instance was manually verified in both languages; the toggle does not mutate ledger data or the read-only boundary.

The project is accepted for the V1 local release scope.
