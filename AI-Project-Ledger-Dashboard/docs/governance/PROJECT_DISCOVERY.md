# Project Discovery｜AI Project Ledger Dashboard V1

**Gate:** G1 — Discovery / Bootstrap  
**Date:** 2026-09-08

## Verified facts

- 用户要求的是一个独立本地工具，当前落点为 `F:\CCPJ\CueCut3\AI-Project-Ledger-Dashboard`；父 CueCut3 动效项目不是本项目代码源。
- 开发包包含 PRD、Runtime Contract、Launch Prompt 和 sample `.ai-ledger` 七文件；已完整读取。
- 技术栈目标为 Node 20+、TypeScript、React/Vite、Zod、chokidar、SSE；V1 不需要数据库、Agent Board、远程服务或外部 API。
- Dashboard 必须使用 Project Folder + `projectId` 主键，Session 只能是关联记录；`.ai-ledger` 是机器状态，Markdown 保留为审计/历史。
- 实时链路只监听 `<projectRoot>/.ai-ledger/*.json` 和 `events.jsonl`，不监听源码目录。
- Server 必须绑定 `127.0.0.1`；artifact open path 必须在 project root 内；secret 文件名/内容不得读取或进入 snapshot。

## Complexity

`C4 高复杂`：虽然 UI 是本地 Dashboard，但同时包含稳定 schema、聚合/进度算法、文件系统安全、atomic/LKG、watcher/SSE、legacy migration、7 页面、self-dogfood 和 skill dual-write。

## Technical decisions

1. 采用轻量 Node `http` 而不是 Fastify，减少 V1 依赖；保留可复用 ledger schema/store/watcher 模块边界。
2. 前后端同仓但独立 `server/`、`web/`、`packages/ledger-schema/`；Vite 负责 UI，Node server 负责 API/SSE。
3. 使用 `chokidar` 监听、100–250ms debounce、内存 Last Known Good；JSON 原子写由独立 helper 实现。
4. Project registry 只存 Dashboard 自己的用户配置路径，不把被观察项目任务状态写回。
5. 读取 `.ai-ledger` 时按文件名白名单；`.env`、credentials、ssh、token、cookie 等只存在检查 denylist，不读取内容。

## Bootstrap

初始 `.ai-ledger/` 已建立用于 Dogfood；后续 agents 会生成 package scripts、fixtures、server/web 和测试。Docker 不需要。
