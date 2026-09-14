# WI-03 Evidence

**Status:** COMPLETED  
**Verification label:** SELF_VERIFIED

- Goal: add the canonical deterministic Project-to-RuntimeItem compiler and schema.
- Changed files: `src/runtime/types.ts`, `src/runtime/schema.ts`, `src/runtime/compiler.ts`, `tests/runtime/canonicalRuntime.test.ts`, WI-03 contract/evidence.
- Tests added: fixed fixture compiles repeatably, leaves Project unchanged, preserves template identity/layout/time/motion/provenance, and passes Zod schema.
- Commands: runtime + project/scene/packaging regression = 6 files / 42 tests passed; `pnpm lint` exit 0; `git diff --check` exit 0.
- Acceptance: RuntimeItem exposes renderer-ready template identity and retains `spring-in`/`scale-fade-out` rather than converting either to a legacy visual alias.
- Known limitation: consumers still read the old SceneFrame/Project path; WI-04 and WI-05 perform the controlled migration.
- Regression risk: compiler is currently an additive pure function; no existing UI/export code path changed.
- Rollback: revert only RuntimeItem files, test, and WI-03 records.

