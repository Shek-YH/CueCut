# Real Test Readiness｜AI Project Ledger Dashboard V1

| ID | Capability | Test level | Required resource | Status | Notes |
|---|---|---|---|---|---|
| RT-01 | Add local project and identify projectId | Local integration | Windows folder | READY | Use self project and fixture project |
| RT-02 | Read valid `.ai-ledger` snapshot | Unit/integration | JSON/JSONL fixtures | READY | No network/account |
| RT-03 | Watcher + SSE refresh under 1s | Real local E2E | localhost browser + file write | READY | Dashboard project only writes registry/migration |
| RT-04 | Corrupt JSON retains LKG | Integration/UI | corrupt fixture | READY | No user resources |
| RT-05 | Legacy Markdown migration | Integration | local Markdown fixture | READY | Original MD must remain |
| RT-06 | 1,000 tasks / 10,000 events | Performance fixture | generated local JSON | READY | AI can generate synthetic data |
| RT-07 | Skill dual-write contract | Static/integration | local skill file and sample ledger | READY | No secret/API |
| RT-08 | Self Dogfood | Real local E2E | this project `.ai-ledger` | PASS | R00 bounded Chromium dogfood: 214.13ms refresh + LKG recovery |

## User resources

现在无需用户提供任何资源；不需要登录、API key、真实外部服务或付费 quota。AI 已生成 synthetic fixtures并完成真实 self-dogfood。V1 只需用户在最终阶段查看本地 Dashboard 并完成一次 Product/Release Acceptance。
