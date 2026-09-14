# WI-03｜Canonical RuntimeItem

**Status:** COMPLETED  
**Goal:** 建立唯一、可校验、确定性的 `Project → RuntimeItem[]` 派生层，为后续 Workspace/Lab/Export 共用输入。

## Contract

- **Why now:** 后续 renderer/motion parity 不能继续从 Project 各自猜 effect 语义。
- **Dependencies:** WI-02 completed。
- **Primary files:** `src/runtime/types.ts`、`src/runtime/schema.ts`、`src/runtime/compiler.ts`。
- **Allowed scope:** RuntimeItem 类型、schema、Project 编译器、模板 identity/provenance 映射。
- **Non-goals:** 不改 Project schema 主版本、不迁移 UI/Export、不实现 renderer、不改 motion evaluator。
- **Invariants:** 编译不修改 Project；template identity stable；rich motion IDs preserved；旧 Project 可继续 load。
- **Implementation steps:** failing deterministic/schema test → runtime types/schema → compiler → runtime/project/scene regression。
- **Tests/commands:** `tests/runtime/canonicalRuntime.test.ts`、project/scene/packaging regressions、`pnpm lint`。
- **User-visible acceptance:** 固定 Project 能生成同样的 RuntimeItem，带 template/layout/time/motion/provenance，且 schema 校验通过。
- **Failure handling:** 未知 effect 使用稳定 family/variant fallback，不破坏旧 Project load；schema 拒绝非法 runtime 数据。
- **Rollback:** 删除 `src/runtime`、runtime test、WI-03 contract/evidence 与 ledger additions。

