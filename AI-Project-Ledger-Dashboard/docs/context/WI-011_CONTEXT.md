# Context Packet｜WI-011

**Role:** R04 Legacy Migration / Project Bootstrap. **Work Item:** WI-011. **Golden Path:** GP-01.

Extend the running localhost API so POST `/api/projects` accepts a local `rootPath`, validates the directory and stable projectId, performs existing conservative migration or empty skeleton initialization when needed, registers the project, and attaches a watcher dynamically. Do not delete/move Markdown or write task state beyond additive init/migration. TDD first. Allowed server/api, server/index, server/registry, server/migration only as needed, matching tests and WI docs; do not modify web/schema/ledger/watcher core or secrets. Return READY_FOR_REVIEW/BLOCKED, never VERIFIED/ACCEPTED.
