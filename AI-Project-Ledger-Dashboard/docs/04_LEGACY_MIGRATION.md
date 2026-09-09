# Legacy Markdown Migration

Migration is additive and conservative: it creates `.ai-ledger`, never deletes, moves or rewrites Markdown. `[x]` maps to COMPLETED, `[ ]` maps to NOT_STARTED, and only explicit phrases map to IN_PROGRESS/BLOCKED/WAITING_USER. Ambiguous text is left as NOT_STARTED with `migrationConfidence=LOW` and a warning. Existing `.ai-ledger` always wins over migration.
