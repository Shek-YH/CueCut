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

## Fresh verification

- `pnpm test --run`：61 test files passed, 2 skipped；144 tests passed, 2 skipped。
- `pnpm test:e2e`：9 passed, 3 skipped。
- `pnpm lint`：exit 0。
- `pnpm build`：client 与 SSR build 均 exit 0。
- `git diff --check`：通过。
- Ledger `validate-ledger.mjs`：通过。
- Requirement `requirement-validate.mjs`：14 requirements / 14 MUST-or-P0 / 0 verified，结构校验通过。

## 尚未满足的 Phase 2 Gate

- Prompt 尚未完成 v2 contract 的明确输出约束和 provenance/item-cue schema。
- 当前 linter 尚未覆盖完整 ordered structure completeness、repetition 和全部 SFX/layout ID 约束。
- 真实 subject/face/no-go detector 尚未接入；当前仍以 unavailable/空 context 作为事实，不伪造坐标。
- 生成结果尚未完成从 server response 到浏览器 ProjectStore 的正式 handoff 证明。
- GOLDEN-001…006 仍是部分 focused tests；尚未完成完整真实失败 SRT/视频 Golden Regression。
- Core Freeze 尚未创建，因此 `fidelity-gate --final` 当前按设计返回 `core_freeze_missing_or_invalid`。

## Acceptance boundary

当前可以证明的是“核心 per-unit/capability/linter 骨架已进入真实 workflow 并通过现有回归”，不能证明 14 个 Requirement 已 VERIFIED，也不能证明 `usedFallback=false` 的完整 Golden Path 或独立 Review 已通过。
