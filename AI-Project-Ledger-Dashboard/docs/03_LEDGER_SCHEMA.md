# Ledger Schema｜AI Project Ledger Dashboard V1

Machine files are seven independent JSON/JSONL artifacts joined by stable `projectId`:

`project.json` → identity/phases; `tasks.json` → task tree/status/progress; `roles.json` → owners; `sessions.json` → execution metadata; `artifacts.json` → relative outputs; `events.jsonl` → append-only activity; `runtime.json` → writer heartbeat.

## Invariants

- `projectId` is bound to canonical Project Folder; Session ID is never a project key.
- Machine status is exactly `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `WAITING_USER`, `WAITING_REVIEW`, `COMPLETED`, `PAUSED`.
- `COMPLETED` requires progress 100 and completedAt; `BLOCKED` requires blockedReason; `WAITING_USER` requires waitingUserReason.
- Parent progress uses children first; leaf progress is 0–100 and is never guessed by the Dashboard.
- No password, API key, token, cookie, secret or credential content is stored.

Runtime validation is a separate Zod module and invalid updates retain the previous good snapshot.
