# WI-07｜Template Layout Metadata

**Status:** COMPLETED  
**Goal:** 为 EffectTemplateRegistry 增加模板级 default/min/max 尺寸、区域偏好与 content/fixed aspect 行为。

## Contract

- **Why now:** 当前 resolver 使用统一 `0.36 × 0.12`，为 WI-08 的确定性布局评分提供真实模板约束。
- **Dependencies:** WI-06 completed。
- **Primary files:** `src/effects/templateRegistry.ts`、`tests/effects/templateLayout.test.ts`。
- **Allowed scope:** 从现有语义 tags 派生 layout metadata；不改 Project schema、solver、UI。
- **Non-goals:** 不随机分布、不改既有 catalog IDs、不迁移所有 pack renderer。
- **Invariants:** min ≤ default ≤ max；quote/stat/list 几何不同；preferred zones 非空。
- **Implementation steps:** metadata failing test → tag-based layout derivation → focused registry regression。
- **Tests/commands:** template layout/split tests、`pnpm lint`。
- **User-visible acceptance:** numeric、quote、list 模板不再共享同一默认几何。
- **Failure handling:** 未识别语义使用稳定通用 fallback metadata。
- **Rollback:** revert WI-07 files and ledger/evidence records only。

