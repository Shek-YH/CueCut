# Core Golden Path｜EPIC-GP-001

| Step | User action | Input | System action | Output | Success | Owner/WI | Real Test |
|---|---|---|---|---|---|---|---|
| GP-01 | 输入本地项目目录 | Project Folder | 校验存在、规范化 root、读取 project.json | 已注册 Project | 不越界、不删除原文件 | R04/WI-004 | Local integration |
| GP-02 | 选择项目 | stable `projectId` + `.ai-ledger` | 识别 machine ledger 或执行 migration/skeleton | Project identity | projectId 不取 Session ID | R01/R04/WI-001/004 | Local integration |
| GP-03 | 打开项目 | 7 个 machine files | Zod parse、progress/phase/summary 聚合 | LKG snapshot | schema valid 才替换 LKG | R01/R02/WI-002 | Unit/integration |
| GP-04 | 浏览 Dashboard | Snapshot | React 渲染 Overview/Tasks/Blockers/Activity/Roles/Artifacts/Settings | 可读 UI | 状态颜色、文字、icon、树/filter 完整 | R03/WI-005 | UI |
| GP-05 | 外部修改 tasks.json | atomic JSON change | chokidar debounce → store → SSE | UI 状态变化 | 1 秒内刷新，Dashboard 不写任务 | R02/R06/WI-003/007 | Real local |
| GP-06 | 写入损坏 JSON | invalid tasks.json | 保留 lastKnownGood 并发 error | 旧 snapshot + warning | 页面不崩、不清空 | R02/R06/WI-003/007 | Integration |
| GP-07 | 添加 legacy 项目 | Markdown ledger only | 有限规则迁移到 `.ai-ledger`，原 MD 保持不变 | migration result/warnings | 不猜不删 | R04/WI-004 | Integration |
| GP-08 | 观察自身项目 | Dashboard `.ai-ledger` | self project appears, then QA/security/final acceptance | Dogfood evidence | 真实自身数据链路通过 | R06/R90/WI-007/008 | Real E2E |

只有真实入口到最终 UI/刷新/错误恢复的 E2E 才算核心链路完成；静态 mock 不替代 Real local test。
