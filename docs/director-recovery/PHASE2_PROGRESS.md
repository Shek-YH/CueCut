# CueCut Director Phase 2 Progress Evidence

状态：`IN_PROGRESS`。这是核心实现的阶段性证据，不是 Core Freeze 或最终验收。

## 已落地

- `VisualUnit`、`EffectDataContract`、`EffectCapabilityCandidate`、`CandidateBundle`、`SelectionTraceEntry` 类型已加入 `src/director/types.ts`。
- `src/director/semanticPlanner.ts` 已按 timestamped SRT 生成局部 units，并能把四个 ordered steps 聚合为一个完整 process unit。
- `src/director/capabilities.ts` 已将 EffectDefinition 投影为 compact capability，并对 numeric/list/steps/quote/comparison 等数据形态执行基础校验。
- `src/director/retriever.ts` 已提供 per-VisualUnit capability-aware candidate bundles；正式 workflow 不再调用旧的 global Top-N helper。
- `src/director/contextBuilder.ts` 的 v2 builder 生成 semantic plan、units、capabilities、bundles 和 trace；旧 builder 仅保留兼容测试用途。
- `src/generation/workflow.ts` 与 `src/server/generationRoute.ts` 已接通 v2 builder，候选索引从 per-unit bundles 去重构建。
- `src/director/compositionLinter.ts` 已检查数据契约、provenance、duration capability、aspect ratio、project range、safe-area 和 visual-event 计数。
- `src/director/service.ts` 已在成功返回前运行 linter，并在 fallback/API 结果中传出 SelectionTrace。
- Prompt 已显式约束 VisualUnit、CandidateBundle、SelectionTrace、numeric provenance 与 item cue；这与本地硬校验配套，而非替代它。
- Steps/List item cue 可由 Scene renderer 按时间逐项 reveal；Linter 会拦截缺失、越界或倒序 cue。
- Visual Context 已有正式 unavailable 状态，subject/face/no-go/subtitle reserve 均可作为本地 layout blocked zones；当前生产路径明确标记人物/人脸分析不可用。
- Linter 已对有 VisualUnit 上下文的 Composition 执行 visual-event density 范围检查。
- `tests/director/golden.test.ts` 已实现并通过 GOLDEN-001…006 的本地回归。

## Fresh verification

- `pnpm test --run`：64 test files passed, 2 skipped；156 tests passed, 2 skipped。
- `pnpm test:e2e`：9 passed, 3 skipped。
- `pnpm lint`：exit 0。
- `pnpm build`：client 与 SSR build 均 exit 0。
- `git diff --check`：通过。
- Ledger `validate-ledger.mjs`：通过。
- Requirement `requirement-validate.mjs`：14 requirements / 14 MUST-or-P0 / 0 verified，结构校验通过。

## 尚未满足的 Phase 2 Gate

- 当前 linter 尚未覆盖完整 ordered structure completeness、excessive repetition 和所有 SFX ID 约束。
- 真实 subject/face/no-go detector 尚未接入；当前以明确的 `unavailable` 状态传递这一事实，不伪造坐标。
- 生成结果尚未完成从 server response 到浏览器 ProjectStore 的正式 handoff 证明。
- GOLDEN-001…006 已通过本地回归；尚未完成完整真实失败 SRT/视频和 `usedFallback=false` Provider Golden Regression。
- Core Freeze 尚未创建，因此 `fidelity-gate --final` 当前按设计返回 `core_freeze_missing_or_invalid`。

## Acceptance boundary

当前可以证明的是“核心 per-unit/capability/linter 骨架已进入真实 workflow 并通过现有回归”，不能证明 14 个 Requirement 已 VERIFIED，也不能证明 `usedFallback=false` 的完整 Golden Path 或独立 Review 已通过。
