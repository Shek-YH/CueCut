# WI-09｜Grounding Validator

**Status:** COMPLETED  
**Goal:** 在本地验证 KeyClaim/Evidence 的 subtitle 来源、数字来源、placeholder 与相邻重复，不通过 AI retry。

## Contract

- **Why now:** Director prompt 规则不能单独证明重点提取真实可靠。
- **Dependencies:** WI-08 completed。
- **Primary files:** `src/director/grounding.ts`、`src/packaging-ir/schema.ts`、grounding tests。
- **Allowed scope:** pure local validation result with FATAL/WARN/drop classifications; optional IR fields。
- **Non-goals:** 不调用模型、不接主 generate flow（WI-16）、不改 resolver/UI。
- **Invariants:** source IDs must exist; numeric claim must be source-grounded; generic placeholder cannot enter runtime。
- **Implementation steps:** invalid-output tests → normalizer/source map → fatal/drop/warn rules → focused validation。
- **Tests/commands:** `tests/director/grounding.test.ts`、`pnpm lint`。
- **User-visible acceptance:** malformed AI evidence is blocked or dropped before runtime admission。
- **Failure handling:** fatal units are excluded; duplicate claims remain accepted with diagnostics for later deterministic policy。
- **Rollback:** revert WI-09 validator/IR/test/contract/evidence/ledger records only。

