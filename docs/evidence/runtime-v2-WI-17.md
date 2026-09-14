# WI-17 Evidence

**Status:** COMPLETED  
**Verification label:** SELF_VERIFIED

- Goal: add observable Runtime V2 visual contracts.
- Changed files: `tests/visual-contracts/runtime-v2.test.tsx`, related WI-05/WI-04/WI-15 tests.
- Tests added: Workspace effect card and Effect Lab preview share the same structural signature; five fixed SceneItem structures remain distinct.
- Commands: visual-contract/motion/asset/Canvas regression = 5 files / 24 tests passed; `pnpm lint` exit 0; `git diff --check` exit 0.
- Acceptance: output signatures, transforms, and asset DOM are asserted rather than only element visibility.
- Known limitation: real Chromium Golden E2E and screenshot/manual fidelity remain WI-18/final acceptance.
- Regression risk: fixture-based structural contract is synthetic by design and does not claim real-media acceptance.
- Rollback: revert WI-17 tests and records only.

