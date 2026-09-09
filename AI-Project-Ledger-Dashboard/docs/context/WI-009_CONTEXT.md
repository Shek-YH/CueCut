# Context Packet｜WI-009

**Role:** R02 Backend Artifact Action  
**Work Item:** `WI-009` — secure Open Parent Folder action  
**Golden Path:** GP-04; narrow support slice for WI-005.

Implement the localhost-only backend action behind the Artifacts page's Open Parent Folder control. Accept a registered projectId and relative artifact path, resolve through the existing project-root containment helper, reject `..`, absolute paths and unknown projects, and on Windows launch `explorer.exe /select,<resolved path>` (or return an explicit platform-unavailable result in non-Windows tests). Do not expose arbitrary file reads, delete/modify project files, or touch task state. TDD first. Allowed: `server/api/**`, `server/security/**`, `tests/api/**`, `tests/security/**`, this WI docs. Do not change web/schema/ledger/watcher/migration files or secrets. Return READY_FOR_REVIEW/BLOCKED, never VERIFIED/ACCEPTED.
