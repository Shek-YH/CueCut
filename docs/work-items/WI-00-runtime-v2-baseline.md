# WI-00｜Baseline / Source of Truth / Safety Snapshot

**Status:** COMPLETED  
**Goal:** 建立当前真实基线，确认仓库是否已经前进，并保留用户 dirty changes。

## Contract

- **Why now:** 后续每个 Runtime V2 Work Item 都必须基于当前 HEAD，而不是历史审查假设。
- **Dependencies:** none。
- **Primary files:** `docs/runtime-v2/00_BASELINE.md`、现有 `docs/governance/SOURCE_OF_TRUTH.md`、`.ai-ledger/`。
- **Allowed scope:** 只读代码/测试/Git/工具链审计；写入基线、Source of Truth 增量与 ledger 状态。
- **Non-goals:** 不改业务源码、不修 full-suite hang、不改截图、不 reset/clean/stash/push。
- **Invariants:** one Director call contract、既有 UI 信息架构、用户 dirty/untracked 文件完整保留。
- **Implementation steps:** 只读 intake → Git snapshot → code map/gap audit → baseline commands → write evidence → mark complete。
- **Tests/commands:** `pnpm lint`、`pnpm build`、三文件 focused Vitest、`pnpm test --run` baseline attempt。
- **User-visible acceptance:** baseline artifact contains HEAD, dirty files, commands with exit codes, code map, fixed/open PRD gaps, and next WI。
- **Failure handling:** full-suite hang is recorded as a baseline anomaly; it does not become a user blocker or a false pass。
- **Rollback:** remove only WI-00 documentation/ledger additions; do not touch pre-existing governance or user files。

