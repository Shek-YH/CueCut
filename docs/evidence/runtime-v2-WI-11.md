# WI-11 Evidence

**Status:** COMPLETED  
**Verification label:** SELF_VERIFIED

- Goal: create a synthetic-first VisualAssetRequest schema and deterministic candidate planner.
- Changed files: `src/visual-assets/schema.ts`, `src/visual-assets/styles.ts`, `src/visual-assets/nativeEligibility.ts`, `src/visual-assets/planner.ts`, `tests/visual-assets/planner.test.ts`.
- Tests added: native arrow/number rejection, robot acceptance, duplicate robot merge, subtitle provenance retention, deterministic budget, six-style inventory.
- Commands: `pnpm exec vitest --run tests/visual-assets/planner.test.ts` exit 0, 1 file / 3 tests passed; `pnpm lint` exit 0; `git diff --check` exit 0.
- Acceptance: planner is local-only, stable, and does not perform provider/network work.
- Known limitation: atlas planning/splitting is WI-12; provider integration is WI-13.
- Regression risk: invalid or native requests are intentionally ignored rather than silently converted to unrelated assets.
- Rollback: revert WI-11 files and records only.

