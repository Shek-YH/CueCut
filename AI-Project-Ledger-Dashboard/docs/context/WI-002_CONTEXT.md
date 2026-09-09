# Context Packet｜WI-002

**Role:** R02 Backend Ledger Store. **WI:** WI-002. **GP:** GP-02/GP-03. Dependency WI-001.

Implement secure snapshot loading and Project Folder + stable projectId binding. Read only seven allowlisted `.ai-ledger` files; never read `.env`, credentials, token, cookie, password, ssh or secret files. Preserve lastKnownGoodSnapshot on malformed/schema-invalid input and expose an invalid warning. Aggregate summary/phase/task tree using WI-001 pure contract. Artifact paths must resolve under project root. Tests first; no watcher/SSE/UI/migration work.
