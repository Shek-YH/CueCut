# WI-13｜Visual Asset Provider + Settings + Secret Store

**Status:** COMPLETED  
**Goal:** 提供 Disabled-safe 的 Visual Asset provider abstraction、持久化 settings 表单、server-only secret 与 `/api/generate-visual-assets` 路由。

## Contract

- **Why now:** WI-14 需要知道 provider 是否可用，但 native packaging 不应被视觉资产失败拖垮。
- **Dependencies:** WI-12 completed。
- **Primary files:** `src/server/visualAssetProvider.ts`、`visualAssetRoute.ts`、`settingsRoute.ts`、`productionHost.ts`、`src/app/App.tsx`、server/app tests。
- **Allowed scope:** provider settings, secret names, disabled/openai-compatible request boundary, route/error shape。
- **Non-goals:** 不在此项调用真实 provider、不上传视频/SRT、不把 key 返回前端、不自动启用收费 provider；不把 `qwen3.8-flash`误作为生图模型。
- **Invariants:** Disabled default; secret server-only; route never reinterprets SRT; provider errors are isolated at route boundary。
- **Implementation steps:** Disabled route failing test → settings/config store → provider abstraction → host route → secret-safe regression。
- **Tests/commands:** visual asset/settings/host/secret tests、`pnpm lint`、`git diff --check`。
- **User-visible acceptance:** provider disabled returns success-safe empty result；设置面板可保存第三方 Provider/Endpoint/生图模型/风格/数量上限/参考图条件；Key 不回显且重启后无需重新输入；Director 从项目根 `.env`读取 `qwen3.8-flash`。
- **Failure handling:** missing key/endpoint/provider HTTP errors return 502 error shape without secret/payload leakage。
- **Rollback:** revert WI-13 server/settings/test/contract/evidence/ledger records only。
