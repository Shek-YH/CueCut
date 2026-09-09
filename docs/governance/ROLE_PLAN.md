# CueCut Role Plan｜Talking-Head Effects Phase

**Updated:** 2026-09-08  
**Complexity:** `C4 高复杂`（媒体编辑器 + Canvas/DOM 双渲染 + Timeline/Export + 第三方 License + 中文/画幅适配）

本期采用最小完整岗位集：R00、R01、R02、R03、R04、R05、R06、R07、R90。详细边界见 `01_ROLES_AND_RESPONSIBILITIES.md`。

| Role | Why needed | Cannot merge with | Primary paths |
|---|---|---|---|
| R00 | 控制台、DAG、证据和决策 | R90；否则失去独立性 | docs/governance, docs/work-items, docs/evidence |
| R01 | Registry/Adapter/契约是跨 UI/Renderer 的边界 | R04/R05；避免业务层直接依赖第三方 | src/motions, src/effects |
| R02 | 删除与导入有不可逆/IP风险 | R01；先审计再架构 | docs/effect-migration, src/motions/_import |
| R03 | Preview 与导出需共享确定性求值 | R04；UI 不能决定渲染真源 | src/motions, src/render |
| R04 | 动效库/Inspector 有独立 UI fidelity 责任 | R03；避免把 DOM demo 当 renderer | src/app, src/editor, tests/editor |
| R05 | Timeline/Export 是时间和媒体输出边界 | R03；避免渲染模型被编码命令污染 | src/editor/timeline, src/export |
| R06 | MIT notice/来源/再分发需要独立 IP 检查 | R02；来源事实与删除判断不同 | docs/THIRD_PARTY_MOTIONS.md, src/motions/licenses |
| R07 | 全链路 QA 和本地真实媒体检查 | R90；实现者不能自证 | tests, docs/evidence |
| R90 | 独立 verifier 是完成定义硬门槛 | 所有 owner | docs/evidence, read-only review |

## Complexity assessment

| Dimension | Level | Reason |
|---|---|---|
| UI/UX | C3 | V4 三栏 Effect Lab + Editor/Timeline 需保持现有基线 |
| Frontend/editor | C4 | canonical store、draft/apply、canvas card、timeline mutation |
| Media/render | C4 | DOM preview 与 Canvas/export 的 deterministic parity |
| Third-party/IP | C3 | Motion Primitives/Magic UI MIT，源码依赖需清理 |
| Real Test | C4 | 9:16/16:9、中文排版、host FFmpeg、下游 Alpha MOV |

## Allowed parallelism

`WI-015` 后可以并行 R01（适配/Registry）与 R06（许可证）；R03 依赖 R01；R04/R05 在 R03 后按不重叠路径并行；R07/R90 串行进入 QA gate。
