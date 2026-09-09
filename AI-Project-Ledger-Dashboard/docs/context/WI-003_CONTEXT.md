# Context Packet｜WI-003

**Role:** R02 Backend Watcher/API/SSE. **WI:** WI-003. **GP:** GP-05/GP-06. Dependency WI-002.

Use chokidar only on `<projectRoot>/.ai-ledger/*.json` and `events.jsonl`, debounce 100–250ms, reload through the LKG store, and broadcast aggregate snapshot/error events over SSE. Implement atomic JSON writer as temp write then rename. HTTP server must bind 127.0.0.1 by default and expose projects, snapshot, events, stream routes. Tests first; do not build UI or migration.
