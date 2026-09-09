# CueCut Source of Truth Map｜Talking-Head Effects Phase

**Updated:** 2026-09-08

## Authority order

1. 用户当前明确指令。
2. `CueCut3_TalkingHead_Effects_Implementation_PRD_v1.0.md`（本期目标、删除规则、动效清单和验收）。
3. 本期 `docs/governance`、`docs/work-items/*.json`、`docs/effect-migration` 及已验证 Evidence。
4. `CueCut_V2_0_Codex_PRD.md`（既有产品数据/工作区/导出原则）。
5. `CueCut_Director_SKILL.md`（AI Director contract；本期不扩展 Scene Planner）。
6. `CueCut_UI_Prototype_V4_Director_EffectLab.html`（布局、导航、用户可见交互）。
7. zip 内集成指南、语义分类、来源元数据和许可证。
8. 当前代码；若与以上冲突，必须记录冲突并由 R00 处理，不能静默猜测。

## Registered sources

| Concern | Source |
|---|---|
| Product/effect scope | `CueCut3_TalkingHead_Effects_Implementation_PRD_v1.0.md` |
| Existing product contract | `CueCut_V2_0_Codex_PRD.md` |
| UI baseline | `CueCut_UI_Prototype_V4_Director_EffectLab.html` |
| Director boundary | `CueCut_Director_SKILL.md` |
| Pack taxonomy/integration | `src/motions/_import/CueCut2_TalkingHead_Effects_Pack_v0.1/` after WI-015 extraction |
| License truth | pack `05_Licenses/*` copied to `src/motions/licenses/` |
| Runtime truth | `src/motions/adapters.ts`, `src/motions/runtime.ts`, `src/render/canvasRenderer.ts` after WI-016/WI-017 |
| Canonical project state | `src/project/schema.ts`, `src/project/store.ts` |

## Non-goals preserved

本期不实现完整 AI Scene Planner、Effect RAG、人脸避障、30–50 Semantic Family、第二批高级卡片或云端下载；只为后续 Registry/Manifest 扩展保留能力字段。
