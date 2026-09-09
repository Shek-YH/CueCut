# Context Packet｜WI-004

**Role:** R04 Legacy Migration / Project Bootstrap. **WI:** WI-004. **GP:** GP-01/GP-02/GP-07. Dependency WI-001.

Detect `.ai-ledger`, legacy files (`00_PROJECT_ENTRY.md`, `01_ROLES_AND_RESPONSIBILITIES.md`, `*TASK*`, `*TODO*`, `*IMPLEMENTATION_LOG*`, `*TEST_PLAN*`, `*FINAL_ACCEPTANCE*`), and initialize/migrate without deleting, moving or rewriting Markdown. Map `[x]` to COMPLETED, `[ ]` to NOT_STARTED, only explicit phrases to IN_PROGRESS/BLOCKED/WAITING_USER; unknowns retain warnings and LOW confidence. Project registry remove only changes Dashboard config. Tests first.
