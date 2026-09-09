# AI Project Ledger Dashboard V1

本项目是独立的本地 AI 项目机器状态 Dashboard：`.ai-ledger` 保存机器可读当前状态，Markdown 保留审计与历史，React Dashboard 只读展示聚合 Snapshot。

## 启动

```powershell
cd F:\CCPJ\CueCut3\AI-Project-Ledger-Dashboard
pnpm install
pnpm dev:all
```

打开 [http://127.0.0.1:4173](http://127.0.0.1:4173)。默认只绑定 localhost；Ledger API 在 127.0.0.1:3100。Dashboard 自身 `.ai-ledger` 会作为首个真实 Dogfood 项目加载。

看板默认使用中文。点击右上角的语言按钮可在中文与英文之间切换；切换只影响界面文案和日期格式，不改变机器台账中的状态枚举、项目数据或只读边界。

## 验证

```powershell
pnpm test
pnpm lint
pnpm build
pnpm test:e2e
```

V1 支持 Overview、Tasks、Blockers、Activity、Roles、Artifacts、Settings、Legacy Markdown Migration、chokidar + SSE、Atomic Write、Last Known Good 和安全 Artifact path action。任务状态/进度/Role/Session 在 Dashboard 中只读；暂不集成 Agent Board、云端、账号或远程控制。
