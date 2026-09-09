# Context Packet｜WI-001

**Role:** R01 Ledger Architecture / Schema  
**Work Item:** `WI-001` Bootstrap and Ledger Schema. Current GP: GP-02/GP-03.

Read `docs/source/AI_Project_Ledger_Dashboard_V1_PRD.md` and `docs/source/LEDGER_RUNTIME_CONTRACT_v1.md`. Build an independent `packages/ledger-schema` contract for project/tasks/roles/sessions/artifacts/runtime/events and pure progress/phase/summary functions. Status enum is exactly NOT_STARTED, IN_PROGRESS, BLOCKED, WAITING_USER, WAITING_REVIEW, COMPLETED, PAUSED. Completed means progress 100 and completedAt; BLOCKED/WAITING_USER require reason; parent progress derives children. `projectId` binds project root; sessionId never substitutes it. No UI/server/Skill changes. TDD: failing tests first, then minimal code. Do not read secrets or mark VERIFIED/ACCEPTED.
