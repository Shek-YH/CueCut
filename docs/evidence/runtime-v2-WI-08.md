# WI-08 Evidence

**Status:** COMPLETED  
**Verification label:** SELF_VERIFIED

- Goal: make packaging layout deterministic, template-aware, spatially wired, and diverse across sequential overlays.
- Changed files: `src/packaging-layout/solver.ts`, `src/packaging/resolve.ts`, `src/effects/templateRegistry.ts`, packaging/layout tests, WI-08 contract/evidence.
- Tests added/updated: 10 sequential solver calls produce at least 3 zones; legacy fixed-size assertions now follow template geometry; locked zone remains exact; face rects join subject collision inputs.
- Commands: layout/packaging/template regression = 4 files / 19 tests passed; `pnpm lint` exit 0; `git diff --check` exit 0.
- Acceptance: score uses preferred-zone rank, recent count, same-zone streak, blocked rects, and edge insets; resolver uses template default dimensions and records recent placement.
- Known limitation: subject/face detection still reports unavailable when no detector supplies rects; P1 detection is not invented.
- Regression risk: intentional geometry change affects old fixed-size snapshots; updated tests document the new contract.
- Rollback: revert WI-08 files and records only.

