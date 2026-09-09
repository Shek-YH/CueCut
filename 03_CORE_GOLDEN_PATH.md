# CueCut3｜Core Golden Path

**Epic:** `EPIC-GP-001｜Core Golden Path`  
**最终 Work Item:** `WI-GP-E2E-001`（由 `WI-022` 控制）

| Step | 用户动作 | 输入 Artifact | 系统动作 | 输出 Artifact | 成功条件 | 失败状态 | Owner | Work Item | Real Test | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| GP-01 | 打开项目并选择动效库 | CueCut3 工程 | 加载 canonical store 和 Registry | 可用的本期候选索引 | 无 broken entry、视频仍为 Layer 0 | 启动/Registry 报错 | R00/R02 | WI-015 | Local Integration | WI-015 |
| GP-02 | 审核并导入新动效包 | 指定 zip、来源与许可证 | 解压到 `_import`，筛选并登记正式适配范围 | 导入证据、许可证副本、迁移计划 | 所有来源可追溯且无未知依赖 | checksum/许可证缺失 | R02/R06 | WI-015/WI-020 | Local Integration | WI-015/WI-020 |
| GP-03 | 在动效库选择正式动效 | Effect/Motion Registry | Adapter 将能力映射为 CueCut 参数 | 注册的文字/数字/列表/运动能力 | 5+2+2+10 目标项可索引 | ID/参数/许可证不一致 | R01 | WI-016 | Synthetic + Local Integration | WI-016 |
| GP-04 | 预览并编辑参数 | 文本、数字、列表、颜色、画幅 | 生成 Preview Draft，按时间显示确定性动效 | Draft 与可编辑参数 | Preview/Apply/Cancel 语义正确 | Draft 污染主项目 | R03/R04 | WI-017/WI-018 | Browser E2E | WI-018 |
| GP-05 | 加入、拖动、trim、复制或删除 Timeline Clip | Draft/EffectInstance | 只改 canonical store 的 timing | Timeline clip 与 Project Store 同步 | playhead 与 clip timing 独立 | 时间越界/Undo 丢失 | R05 | WI-019 | Browser E2E | WI-019 |
| GP-06 | 播放/逐帧预览 | Project Store、fps、画幅 | DOM 预览和 Canvas renderer 共享 frame model | 当前帧真实文字/数字/列表 | 中文、30fps、9:16/16:9 无溢出 | 预览与导出错位 | R03 | WI-017 | Local Render | WI-017 |
| GP-07 | 执行 Export | 本地视频、Project Store、Renderer | 生成统一渲染/FFmpeg 计划并输出 | MP4 或透明 MOV 计划/产物 | 无远程运行时依赖且时间一致 | 编码/Alpha downstream 未证实 | R05 | WI-019 | Host Integration | WI-019 |
| GP-08 | 运行 QA 并完成总体验收 | 全部 Evidence、测试报告 | 独立 verifier 复核全链路 | Final Acceptance 报告 | R90 PASS 且用户完成最终体验收 | P0 blocker/用户未验收 | R07/R90/R00 | WI-021/WI-022 | Real E2E + Manual Acceptance | WI-021/WI-022 |

核心链路必须从真实用户入口走到真实最终输出；只通过单测、只看到 Demo 或只解压文件，都不等于 GP PASS。
