# AI Project Ledger Dashboard V1｜Project Entry

**Project Root:** `F:\CCPJ\CueCut3\AI-Project-Ledger-Dashboard`  
**Stable projectId:** `ai-project-ledger-dashboard-v1`  
**Execution mode:** `LEDGER_MODE_REQUIRED + MULTI_AGENT_REQUIRED + REAL_EVIDENCE_REQUIRED`  
**Current Gate:** G1 — Discovery / Ledger Bootstrap

## User request

开发一个独立的本地 AI Project Ledger Dashboard V1：读取任意项目根目录下的 `.ai-ledger` machine state，以只读 Dashboard 展示 Project、Tasks、Blockers、Activity、Roles、Artifacts、Settings；支持 Legacy Markdown Migration、chokidar + SSE、Atomic Write、Last Known Good、安全边界和自身 Dogfood；暂不集成 Agent Board。

## Source of Truth

1. 用户当前粘贴的需求文本。
2. `_source-package/AI_Project_Ledger_Dashboard_v1/AI_Project_Ledger_Dashboard_V1_PRD.md`。
3. `_source-package/AI_Project_Ledger_Dashboard_v1/LEDGER_RUNTIME_CONTRACT_v1.md`。
4. 本项目 `docs/governance`、`docs/work-items/*.json` 和 Evidence。
5. `_source-package/.../sample-project/.ai-ledger/*` 仅作示例数据，不是产品状态。

## Core Golden Path

`GP-01` 添加 Project Folder → `GP-02` 识别 stable projectId / `.ai-ledger` → `GP-03` 读取、校验并聚合 snapshot → `GP-04` 展示 Overview/Tasks/Blockers/Activity/Roles/Artifacts → `GP-05` 修改 tasks.json 后 1 秒内通过 watcher+SSE 刷新 → `GP-06` 损坏 JSON 保留 Last Known Good → `GP-07` Legacy Migration 不删除 Markdown → `GP-08` 本项目自身 `.ai-ledger` Dogfood + QA/安全验收。

## Current status

- Package PRD、Runtime Contract 和 sample `.ai-ledger` 已完整读取并登记。
- 本项目 `.ai-ledger/` 已建立，Dashboard 开发会用它自身做第一个被观察项目。
- MA-00 Preflight：`IN_PROGRESS`，executionRef 记录在 `docs/governance/MULTI_AGENT_PREFLIGHT.md`。
- 近期无用户资源阻塞；不需要 API key、密码、Token、真实外部服务或付费调用。

## Non-goals

Agent Board、云端 Dashboard、账号系统、多人协作、远程 Agent 控制、Dashboard 修改任务、WebSocket 双向控制、云数据库、移动端 App 均不属于 V1。
