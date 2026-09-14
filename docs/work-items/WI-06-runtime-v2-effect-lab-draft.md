# WI-06｜Effect Lab Runtime Draft Preview

**Status:** COMPLETED  
**Goal:** 让 Effect Lab 的 Draft motion 编辑不会错误复用旧 compiled motion，同时保留本地 clone/apply/cancel 事务语义。

## Contract

- **Why now:** WI-04 增加了 `motion.compiled`；直接修改 Draft Enter/Exit 后若不清缓存，Preview 仍显示旧方向。
- **Dependencies:** WI-05 completed。
- **Primary files:** `src/runtime/draft.ts`、`src/app/App.tsx`、`tests/runtime/draft.test.ts`。
- **Allowed scope:** Draft motion/duration mutation helper and Lab wiring；保留现有 preview controls and ProjectStore transaction。
- **Non-goals:** 不改 Workspace/Export renderer、不新增 AI call、不把 Draft 自动写回 Project。
- **Invariants:** clone remains isolated; only Apply creates undo transaction; Cancel does not mutate Project; changed motion invalidates compiled cache.
- **Implementation steps:** draft cache-invalidation failing test → pure helper → Enter/duration wiring → Lab/store regression。
- **Tests/commands:** `tests/runtime/draft.test.ts` plus Effect Lab/Store/Canvas/App regression and `pnpm lint`。
- **User-visible acceptance:** 修改 Draft motion 后 Preview 立即依据新 motion，Apply/Cancel 行为不变。
- **Failure handling:** reset restores a fresh store clone; no provider/network retry involved。
- **Rollback:** revert WI-06 helper/wiring/test/contract/evidence/ledger entries only。

