# Source of Truth｜AI Project Ledger Dashboard V1

1. 用户当前请求（独立本地 Dashboard、暂不 Agent Board、完整测试/Dogfood）。
2. `docs/source/AI_Project_Ledger_Dashboard_V1_PRD.md`（从开发包登记的产品规范）。
3. `docs/source/LEDGER_RUNTIME_CONTRACT_v1.md`（machine ledger 硬契约）。
4. `docs/governance`、`docs/work-items/*.json`、`.ai-ledger/*` 和 Evidence。
5. package sample `.ai-ledger`（只作 fixture，不是本项目真实状态）。

## Registered concerns

| Concern | Source |
|---|---|
| Product scope/UI pages | PRD §17–25, §45–50 |
| Machine data schema/status/write order | Runtime Contract + PRD §6–16 |
| Migration rules | PRD §27 |
| Runtime/API/SSE | PRD §31–35 |
| Security | PRD §36 |
| Test/Dogfood | PRD §42–45, §47 |
| Project identity | `project.json` + `Project Folder` |

Package prompt and sample data cannot override the user's latest request or this ledger.
