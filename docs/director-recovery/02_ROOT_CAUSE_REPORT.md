# CueCut Director Phase 1 — Root Cause Report

状态含义：`CONFIRMED` 表示源码直接证明；`PARTIAL` 表示相关能力存在但没有接入正式生成路径。

| Root cause | 状态 | 源码证据 | 结论 |
|---|---|---|---|
| ROOT-001 Effect Capability 被压扁 | CONFIRMED | `src/server/generationRoute.ts:121` 调用 `effectRegistry.map(effectCandidate)`；`236-238` 只返回 `id` 与 `semanticTags`。完整字段定义于 `src/effects/registry.ts:4-31`。 | Director 看不到 slots、duration、ratio、use/avoid、timing/layout、provenance 等能力。 |
| ROOT-002 全片一次性 semanticTags | CONFIRMED | `src/director/contextBuilder.ts:14-21` 将所有 segment 文本拼接，并以数字、比较、引用、强调正则生成单组 tags；`33` 对整条 transcript 调用一次。 | 一个局部数字会污染整片语义；没有局部结构或 unit 级意图。 |
| ROOT-003 全片一次 Top-N Effect | CONFIRMED | `contextBuilder.ts:48-50` 对全局 tags 调用 `retrieveCandidates(..., 8)` / `(..., 6)`；`DirectorInput` 只有单一数组。 | 所有 subtitle/semantic unit 共享同一组 bounded candidates。改变 N 不能解决 scope 问题。 |
| ROOT-004 Retriever 只做 tag overlap | CONFIRMED | `src/director/retriever.ts:6-12` 仅累加 `wanted.has(tag)`，无 capability、content、duration、ratio 或 structure 评分。 | 必须改为 capability-aware retrieval。 |
| ROOT-005 DirectorInput 贫血 | CONFIRMED | `src/director/types.ts:29-31` 的 effect/motion/sfx candidate 是 thin `{id,tags}` 结构；`generation/workflow.ts:48-55` 从 thin candidates 生成 indexes。 | Prompt 无法恢复被丢弃的 capability，也不能表达 per-unit bundle。 |
| ROOT-006 Validator 只校验 ID/schema | CONFIRMED | `src/project/schema.ts:53` 将 `content` 定义为 `Record<string, unknown>`；`src/director/validator.ts:14-21,40-56` 只检查 Effect/Motion/SFX ID。 | `numeric.value` 为中文字符串在当前语义层可通过；没有 family data contract。 |
| ROOT-007 Duration capability 没有硬校验 | CONFIRMED | Registry 给 numeric ring `maxDurationSec: 8`（`src/effects/registry.ts:44-46`）；`service.ts:86-125` 只按 project duration clamp，不查 EffectDefinition min/max。 | 31 秒 numeric ring 不会因 capability 被拒绝；现有 clamp 不能替代 capability validation。 |
| ROOT-008 Visual Context 没有真实接入 | CONFIRMED | `src/server/generationRoute.ts:114-120` 固定传 `subjectZones: []`、`faceZones: []`；`src/layout/solver.ts:29-61` 需要 blocked rect 但没有生成路径调用；现有搜索未发现正式 subject/face detector。 | subtitle reserved zone 与 safe margin 有接口值，但 subject/face/no-go 不是实测数据。Phase 2 应接正式接口并显式报告 unavailable，不伪造坐标。 |
| ROOT-009 Density/coverage 只是 Prompt 意图 | CONFIRMED | `src/director/prompt.ts:19-23` 把 `densityTargetPerMin: 9` 写入 prompt skeleton；`project/schema.ts:123-127` 仅校验该数字存在；未找到 visual-event linter。 | 当前没有高重要度 coverage、visual-event density、repetition 或结构完整性的代码门禁。 |

## 当前最危险的组合

```text
full transcript
  → global regex tags
  → thin global Top-N candidates
  → prompt requests semantic quality
  → schema/ID validation only
  → project-range clamp
  → composition accepted or fallback
```

Prompt 中的要求不能恢复已经在 Context Builder 丢失的数据，也不能替代运行时硬校验。

## Phase 1 结论

ROOT-001~009 均已由源码确认或确认其“存在但未接入”状态。Phase 2 的关键不是增加 Top-N 数量，而是先产生 Visual Units，再按 unit 召回 compact capability bundles，并在一次 Director 调用返回后执行本地 data/duration/structure/layout/density linter。
