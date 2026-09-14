# WI-02｜Registry Concept Split

**Status:** COMPLETED  
**Goal:** 将 Effect Template、Transition Motion、Content Animation 从现有兼容 registry 中按语义分离，避免 pack effect 被当作 transition motion。

## Contract

- **Why now:** WI-03 RuntimeItem 需要明确的模板与 motion 来源，避免继续依赖混合 registry。
- **Dependencies:** WI-01 completed。
- **Primary files:** `src/effects/templateRegistry.ts`、`src/motions/transitionRegistry.ts`、`src/motions/contentRegistry.ts`。
- **Allowed scope:** 新增只读 registry views 与 lookup helper；保持旧 `effectRegistry`/`motionRegistry` API 不变。
- **Non-goals:** 不迁移 Canvas/Export、不改变 Project schema、不修改 AI 主链路、不移除历史 registry。
- **Invariants:** pack effect 属于模板；transition registry 不含 `pack-effect`；text/number/list 属于 content animation。
- **Implementation steps:** 先写分类/identity failing tests → 建立三份 derived registry → 运行现有 registry/pack/director 回归。
- **Tests/commands:** `tests/effects/registry-split.test.ts`、registry/pack/director/packaging regression、`pnpm lint`。
- **User-visible acceptance:** 同一 pack effect 在模板 registry 中有稳定 renderer identity，且不会被 transition registry 暴露。
- **Failure handling:** 仅新增兼容层，不改变旧消费者；分类错误由 registry split test 阻止。
- **Rollback:** 删除三份 derived registry、split test、contract/evidence 与对应 ledger entries。

