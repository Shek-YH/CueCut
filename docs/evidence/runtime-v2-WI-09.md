# WI-09 Evidence

**Status:** COMPLETED  
**Verification label:** SELF_VERIFIED

- Goal: validate local KeyClaim/Evidence grounding without any additional AI call.
- Changed files: `src/director/grounding.ts`, `src/packaging-ir/schema.ts`, `tests/director/grounding.test.ts`, WI-09 contract/evidence.
- Tests added: valid evidence/numbers accepted; fabricated numbers, placeholders, and unknown source IDs are fatal; low visualValue drops; adjacent duplicate warns.
- Commands: `pnpm exec vitest --run tests/director/grounding.test.ts` exit 0, 1 file / 3 tests passed; `pnpm lint` was run in the subsequent WI-09 regression.
- Acceptance: validator returns accepted/dropped/fatal/warnings deterministically and never retries the Director.
- Known limitation: main packaging flow does not yet call the validator; WI-16 owns that gate.
- Regression risk: optional IR fields are additive and do not change legacy parsing.
- Rollback: revert WI-09 files and records only.
