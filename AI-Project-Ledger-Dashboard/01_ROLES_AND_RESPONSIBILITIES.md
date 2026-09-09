# Roles and Responsibilities｜AI Project Ledger Dashboard V1

## R00｜Project Orchestrator / Control Plane

维护 PRD、Source of Truth、Golden Path、DAG、`.ai-ledger`、Evidence、调度和最终用户验收；不在正式实现中长期代替专业 agent，不把自检当独立验证。

## R01｜Ledger Architecture / Schema

负责独立 `packages/ledger-schema`、Zod 状态契约、progress/phase/summary 纯函数和稳定 `projectId` 主键规则；不负责 HTTP/UI。

## R02｜Backend / Ledger Store / Watcher / SSE

负责安全读取、Last Known Good、chokidar debounce、SSE/API、atomic writer 和 project registry；不负责 React 页面或 Skill 文档。

## R03｜Dashboard UX / React

负责 Overview、Tasks tree/filter/search、Blockers、Activity、Roles、Artifacts、Settings、状态颜色和可访问性；只读项目状态，不直接写 tasks.json。

## R04｜Legacy Migration / Project Bootstrap

负责 Markdown 检测、有限规则迁移、migrationConfidence/warnings、`.ai-ledger` skeleton 和项目 registry 添加/移除安全语义；不删除/移动原 Markdown。

## R05｜Skill Integration / Dual Write

负责升级 `AI_Autonomous_Project_Ledger_Skill_v1` 的双写规范、`.ai-ledger` 初始化和事件契约；不修改 Dashboard UI。

## R06｜QA / Security / Dogfood

负责 unit/integration/UI/E2E、1 秒刷新、corrupt JSON、path traversal、secret exclusion、localhost bind 和自身导入；不修自己发现的生产缺陷。

## R90｜Independent Verifier

每个实现 Work Item 使用独立 executionRef 检查 scope、测试、真实证据、安全、Golden Path 和文档；只能给 PASS/NEEDS_CHANGES。
