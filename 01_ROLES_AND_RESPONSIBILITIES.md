# CueCut3｜本期角色与职责

本期角色由 `docs/governance/ROLE_PLAN.md` 动态规划。Role 是职责边界，Agent Instance 是实际执行上下文；每次实现只允许一个 child agent 承担一个角色。

## R00｜Project Orchestrator / AI Product Steward

- 负责：PRD/Source of Truth、DAG、台账、调度、Evidence、冲突升级和最终验收编排。
- 不负责：长期代替专业实现者写全部代码，也不把自检冒充独立验证。
- 可修改：治理文件、Work Item 状态、Evidence 索引、必要的集成胶水。
- 禁止：擅自改产品行为、push/deploy、把未验证项标为 VERIFIED/ACCEPTED。

## R01｜Motion Architecture / Registry

- 负责：Motion Adapter contract、Effect/Motion Registry、正式目录规范、兼容 ID 和参数 Schema。
- 不负责：最终 UI 布局、Timeline 手势或独立 QA。
- 验收：所有候选有唯一 ID、类别、能力、默认值、许可证来源和兼容性。

## R02｜Migration / Import / Cleanup

- 负责：旧动效盘点、引用扫描、新 zip 解压、导入证据、迁移/删除计划和旧 ID 回归边界。
- 不负责：修改运行时架构或删除无证据文件。
- 验收：EFFECT_LIBRARY_AUDIT、OLD_EFFECT_DELETE_PLAN、NEW_EFFECT_IMPORT_PLAN 完整，未误删。

## R03｜Motion Runtime / Renderer

- 负责：确定性 frame-based motion 求值、DOM/Canvas 共用模型、中文/画幅适配。
- 不负责：动效库视觉导航或导出命令策略。
- 验收：Preview 与 Canvas renderer 同一输入得到一致状态；30fps、9:16、16:9 测试通过。

## R04｜Effect Library UX / Inspector

- 负责：动效库分类、实时 Preview、Effect Lab Draft、参数编辑和 Apply/Cancel 语义。
- 不负责：改变 canonical store 结构或自行声明验证通过。
- 验收：所有本期动效可见、可预览、可编辑；Cancel 不污染主项目，Apply 一个 Undo transaction。

## R05｜Timeline / Export Integration

- 负责：添加/移动/trim/复制/删除/预览、Timeline 与 playhead 解耦、统一 Renderer 到 FFmpeg Export 计划。
- 不负责：改变 Registry 语义或许可证结论。
- 验收：编辑后的时间和动效能进入导出计划；30fps frame mapping 有证据。

## R06｜License / IP Compliance

- 负责：第三方来源、MIT notice、原始源码与正式适配文件的对应关系、无远程依赖审计。
- 不负责：批准无来源的新素材。
- 验收：许可证副本可追溯，`THIRD_PARTY_MOTIONS.md` 无未知来源和遗漏。

## R07｜QA / Real Test Operator

- 负责：typecheck、lint、build、unit/component/E2E、真实本地媒体预览/渲染和回归记录。
- 不负责：验证自己实现的 Work Item 为 PASS；R90 承担独立 verifier。
- 验收：测试层级明确区分 synthetic、local integration、real integration、real E2E。

## R90｜Independent Verifier

- 负责：以不同 executionRef 独立核验 Scope、功能、Regression、Golden Path、UI fidelity、License/IP 和 Evidence。
- 不负责：直接代替 owner 修改代码或把 NEEDS_CHANGES 隐藏为 PASS。
- 输出：只允许 `PASS` 或 `NEEDS_CHANGES`，并带可复核命令/文件证据。
