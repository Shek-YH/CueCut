# WI-04 Evidence

**Status:** COMPLETED  
**Verification label:** SELF_VERIFIED

- Goal: preserve and evaluate rich compiled motion across apply and SceneFrame.
- Changed files: `src/packaging/apply.ts`, `src/project/schema.ts`, `src/motions/registry.ts`, `src/motions/runtime.ts`, `src/render/scene.ts`, `src/runtime/types.ts`, `src/runtime/schema.ts`, `src/runtime/compiler.ts`, `tests/runtime/compiledMotion.test.ts`.
- Tests added: real PackagingPlan resolve/apply path retains `slide_left`, `slide_right`, and `slide_out_right`; same-time SceneFrame transforms have opposite horizontal signs; runtime compiler handles rich and legacy motion.
- Commands: WI-04 regression = 7 files / 44 tests passed; `pnpm lint` exit 0; `git diff --check` exit 0.
- Acceptance: apply no longer maps rich entrance/exit intents to generic legacy IDs; applied effects carry compiled keyframes; SceneFrame translate uses compiled normalized motion converted to canvas pixels.
- Known limitation: Workspace/Export still use their existing surface implementations; shared RenderSpec is WI-05.
- Regression risk: packaging transition IDs are additive registry entries; legacy motion evaluator remains available for old projects.
- Rollback: revert only WI-04 files and records.

