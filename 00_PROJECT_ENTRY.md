# CueCut3｜Talking-Head Effects 项目入口

**执行模式:** `AI Autonomous Project Ledger / MULTI_AGENT_REQUIRED`
**当前项目:** `F:\CCPJ\CueCut3`
**当前 PRD:** `CueCut3_TalkingHead_Effects_Implementation_PRD_v1.0.md`
**当前 Gate:** G1 — Project Understanding / Ledger Ready
**主控:** R00｜Project Orchestrator / AI Product Steward

## 本轮目标

将 `src/motions/CueCut2_TalkingHead_Effects_Pack_v0.1.zip` 中的第一批口播动效真正接入 CueCut3：动效库选择 → Preview → 参数编辑 → Timeline → 统一 Renderer → Export → QA。

## Source of Truth

1. 用户当前指令与本期专用 PRD。
2. 本项目治理文件和 `docs/work-items/*.json`。
3. `CueCut_V2_0_Codex_PRD.md` 的既有编辑器/数据契约。
4. `CueCut_Director_SKILL.md` 的 Director 约束。
5. `CueCut_UI_Prototype_V4_Director_EffectLab.html` 的可见布局和交互基线。
6. zip 内 `INTEGRATION_GUIDE.md`、`SEMANTIC_EFFECT_TAXONOMY_v0.1.md`、许可证和来源元数据。

## Golden Path

`GP-01` 项目启动与动效盘点 → `GP-02` 导入并审核新包 → `GP-03` Registry/Adapter → `GP-04` 动效库 Preview/参数编辑 → `GP-05` 加入并编辑 Timeline → `GP-06` 统一 Renderer 预览 → `GP-07` Export → `GP-08` QA 与最终用户验收。

## 当前状态

- MA-00 Multi-Agent Preflight：`READY`；首个 Explorer executionRef 已记录于 `docs/governance/MULTI_AGENT_PREFLIGHT.md`。
- 新动效包：已完成只读清单和源码/许可证审阅，待正式解压至 `_import`。
- 旧动效：已完成代码/文档引用扫描，待 R02 生成正式删除/保留结论。
- 真实测试：本地 9:16/16:9 视频可用；CapCut/Jianying 下游 Alpha MOV 验证仍需用户设备配合，但不阻塞先行开发。

## 当前 Work Item

`WI-015`（审计、导入、许可证原始证据）是首个可调度项；其完成后按 DAG 自动推进 `WI-016`、`WI-020`，再推进运行时、UI、Timeline/Export 和 QA。

## 硬约束

- 不盲删；删除前必须有引用扫描、运行时依赖分析和回归证据。
- 不能只解压或制作 Demo；所有新动效必须穿过 Registry、Preview、参数、Timeline、Renderer、Export。
- 不新增远程 CDN、在线字体、运行时网络依赖；不读取或提交密钥、用户视频和导出物。
- 实现 Work Item 必须有 child-agent executionRef；验证必须使用不同的 R90 verifier executionRef。
- 最终用户 Product/Release Acceptance 未完成前，不宣称最终发布完成。
