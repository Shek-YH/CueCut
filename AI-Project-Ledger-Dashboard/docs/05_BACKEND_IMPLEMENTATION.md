# Backend Implementation Notes

The backend will expose `/api/projects`, project snapshot/events endpoints and `/api/stream?projectId=...`. It reads only the `.ai-ledger` allowlist, aggregates one snapshot, keeps a per-project LKG on invalid JSON and emits SSE after debounced file changes. All default binds are `127.0.0.1`; project paths and artifact paths are resolved and contained before use.
