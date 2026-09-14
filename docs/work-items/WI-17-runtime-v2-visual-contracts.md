# WI-17｜Visual Contract Tests

**Status:** COMPLETED  
**Goal:** 用可观测输出锁定结构差异、Workspace/Lab parity、motion/asset/video contract，防止内部测试绿但用户看到相同。

## Contract

- **Why now:** WI-05/WI-15 已建立共享 spec/asset 边界，需要 contract tests 防回归。
- **Dependencies:** WI-16 completed。
- **Primary files:** `tests/visual-contracts/runtime-v2.test.tsx` and existing focused contract suites。
- **Allowed scope:** render signature, fixed-time SceneFrame structures, UI preview metadata parity。
- **Non-goals:** 不做截图重写、不改 UI、不替代真实 Chromium E2E。
- **Invariants:** 5 structural signatures differ; Workspace/Lab same signature; tests observe output contracts。
- **Implementation steps:** visual contract test → fix fixture assertion → run combined contracts/regression。
- **Tests/commands:** visual-contracts/RenderSpec/compiledMotion/asset/Canvas tests、`pnpm lint`、`git diff --check`。
- **User-visible acceptance:** tests can detect effect structure and parity differences beyond visibility checks。
- **Failure handling:** contract failure blocks WI-18; no auto-update screenshots。
- **Rollback:** revert WI-17 tests/contract/evidence/ledger records only。

