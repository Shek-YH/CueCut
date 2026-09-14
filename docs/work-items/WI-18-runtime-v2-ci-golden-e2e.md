# WI-18｜CI / Final Golden E2E

**Status:** IN_PROGRESS  
**Goal:** 建立 lint/unit/build/browser E2E 的基础回归门，并运行 synthetic Golden flow；不把 Provider 真实 key 放进 CI。

## Contract

- **Why now:** Runtime V2 已有局部 evidence，需要稳定的最终回归入口。
- **Dependencies:** WI-17 completed。
- **Primary files:** `.github/workflows/ci.yml`、`tests/e2e/`、WI-18 evidence。
- **Allowed scope:** CI commands and synthetic/local E2E verification; no screenshot baseline overwrite。
- **Non-goals:** 不自动发布、不上传私有媒体、不调用收费 Provider、不宣称 real-provider complete。
- **Invariants:** CI uses synthetic fixtures; one-call contract remains asserted; user dirty artifacts preserved。
- **Implementation steps:** CI workflow → local Golden E2E → inspect browser output/failures → record honest status。
- **Tests/commands:** `pnpm lint`, controlled Vitest, `pnpm build`, `pnpm test:e2e` or targeted synthetic E2E。
- **User-visible acceptance:** repository has a reproducible verification gate and synthetic import/generate/Lab/export path evidence。
- **Failure handling:** screenshot side effects are restored only for files proven clean before this run; real provider remains WAITING_USER。
- **Rollback:** revert CI, targeted test updates, WI-18 contract/evidence, and ledger records only。

