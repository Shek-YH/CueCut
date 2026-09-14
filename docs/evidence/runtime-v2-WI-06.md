# WI-06 Evidence

**Status:** COMPLETED  
**Verification label:** SELF_VERIFIED

- Goal: keep Effect Lab Preview aligned with Draft motion edits when a prior compiled motion exists.
- Changed files: `src/runtime/draft.ts`, `src/app/App.tsx`, `tests/runtime/draft.test.ts`, WI-06 contract/evidence.
- Tests added: changing Draft Enter motion removes only the stale compiled cache and leaves the source Draft unchanged.
- Commands: Effect Lab/Store/Canvas/RenderSpec/App regression = 7 files / 50 tests passed; `pnpm lint` exit 0; `git diff --check` exit 0.
- Acceptance: Draft motion/duration controls now invalidate compiled data; existing clone/apply/cancel and no-AI-call UI remain intact.
- Known limitation: full visual parity and five-pack structural browser assertions remain in WI-17.
- Regression risk: Draft-only helper; canonical Project is touched only by existing Apply.
- Rollback: revert only WI-06 files and records.

