# Architecture｜AI Project Ledger Dashboard V1

```text
Project Folder
  └─ .ai-ledger/*.json + events.jsonl
       ↓ allowlisted reader + Zod validation
Ledger Store (lastKnownGood)
       ↓ aggregate Snapshot
Node HTTP API + SSE ← chokidar debounce (100–250ms)
       ↓
React Dashboard (read-only task state)
```

## Boundaries

- `packages/ledger-schema`: machine contracts and pure progress/phase/summary functions, reusable by future Agent Board.
- `server/ledger`: secure reader, LKG and snapshot aggregation.
- `server/watcher`: `.ai-ledger`-only chokidar and SSE publish.
- `server/migration`: conservative Markdown migration and skeleton init.
- `server/registry`: Dashboard-owned project list; never deletes project folders or ledgers.
- `web`: presentation only; fetches aggregate Snapshot.

V1 uses Node's built-in HTTP server instead of a heavier framework; this keeps localhost binding, SSE and path handling explicit.
