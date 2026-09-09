# Context Packet｜WI-012

**Role:** R03 Dashboard UX / React. **Work Item:** WI-012. **Golden Path:** GP-01; depends on WI-011.

Add a real Settings flow for a local Project Folder: accessible input, POST `/api/projects`, show validation/migration/skeleton result, refresh project list/snapshot and switch to the registered project. Keep task state read-only; browser must not read project files or write tasks.json. TDD first. Allowed web, UI/E2E tests and WI docs; no server/schema/.ai-ledger/global Skill. Return READY_FOR_REVIEW/BLOCKED, never VERIFIED/ACCEPTED.
