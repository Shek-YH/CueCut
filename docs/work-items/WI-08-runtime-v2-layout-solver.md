# WI-08｜Layout Solver V2

**Status:** COMPLETED  
**Goal:** 将模板尺寸、preferred zone、edge inset、空间 blocked rect 与 recent placement penalty 接入 deterministic packaging layout。

## Contract

- **Why now:** 顺序 overlay 没有 recent history，且 resolver 仍固定尺寸，导致包装机械复用同一位置。
- **Dependencies:** WI-07 completed。
- **Primary files:** `src/packaging-layout/solver.ts`、`src/packaging/resolve.ts`、`src/effects/templateRegistry.ts`、layout/packaging tests。
- **Allowed scope:** score-based zone selection, recent/streak penalties, template size lookup, face rect wiring, locked override preservation。
- **Non-goals:** 不实现真实人脸检测、不随机配额、不改 UI 信息架构、不改 Director。
- **Invariants:** deterministic; edgeInsets respected; locked zone wins; semantic preferred zone remains weighted above arbitrary diversity。
- **Implementation steps:** sequential diversity failing test → score/penalty → resolver history/template metadata → compatibility assertion updates → regression。
- **Tests/commands:** packaging-layout/resolve/template/layout tests、`pnpm lint`、`git diff --check`。
- **User-visible acceptance:** 10 个无强约束顺序 item 至少 3 个 zone；不同模板不再统一几何；锁定位置不被 penalty 改写。
- **Failure handling:** no available safe candidate keeps deterministic best candidate; collision stage still performs drop/move repair。
- **Rollback:** revert WI-08 solver/resolver/test/contract/evidence/ledger records only。

