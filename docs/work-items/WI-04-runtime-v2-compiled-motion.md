# WI-04｜CompiledMotion End-to-End

**Status:** COMPLETED  
**Goal:** 将 Packaging MotionIntent 编译结果贯通到 Project、Canonical Runtime 与 SceneFrame，消除 apply 阶段的方向/类型降级。

## Contract

- **Why now:** 当前 `apply.ts` 将 rich motion 映射成 `soft-slide/pop/fly-left`，直接破坏用户可见方向。
- **Dependencies:** WI-03 completed。
- **Primary files:** `src/packaging/apply.ts`、`src/packaging-motion/compiler.ts` contract、`src/motions/registry.ts`、`src/motions/runtime.ts`、`src/render/scene.ts`、`src/runtime/*`、`src/project/schema.ts`。
- **Allowed scope:** preserve compiled motion on applied effects; evaluate compiled keyframes for SceneFrame; register packaging transition IDs; keep legacy fallback.
- **Non-goals:** 不实现 shared renderer、不改 Effect Lab UI、不新增 AI call、不扩展 P1 camera/easing。
- **Invariants:** `slide_left/right/top/bottom` direction remains distinct; exit direction is preserved; no second Director call; old project motion IDs remain loadable。
- **Implementation steps:** directional apply/scene failing test → compiled schema/project field → no-downgrade apply → compiled evaluator → transition registry compatibility → regression。
- **Tests/commands:** `tests/runtime/compiledMotion.test.ts` plus runtime/packaging/motion/project/scene/export/App regression and `pnpm lint`。
- **User-visible acceptance:** fixed plan produces different left/right transforms at the same time, and `slide_out_right` moves right during exit.
- **Failure handling:** legacy effects without compiled data use deterministic legacy compiled wrapper or existing evaluator; invalid motion IDs remain schema errors。
- **Rollback:** revert WI-04 source/test/contract/evidence/ledger records only.

