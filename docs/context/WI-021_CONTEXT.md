# Context Packet｜WI-021

**Role:** R07 QA / Real Test Operator  
**Work Item:** `WI-021` — QA, regression and real local verification  
**Current GP:** GP-08；依赖 WI-018/WI-019/WI-020。

## Goal

独立于实现者运行 typecheck、lint、build、完整 Vitest、Playwright（可用时）、9:16/16:9、中文/英文、30fps、最小 render/export 以及旧 effect 删除回归。Evidence 必须标明 synthetic、local integration、real integration、real E2E；不得把浏览器 preview 当下游 Alpha MOV 通过。

## Allowed / forbidden

允许 `tests/**`、`docs/evidence/**`、`docs/TEST_RESULTS.md`、`docs/IMPLEMENTATION_LOG.md`、本 WI docs；禁止修改 `src/**`、package/lock、secret/media。发现缺陷返回 NEEDS_CHANGES 给 R00，不直接修代码。

## Acceptance

证据包含命令、exit code、失败计数、测试层级、viewports/fps、输出路径和数据出站说明；在所有 P0 通过前保持 READY_FOR_REVIEW/NEEDS_CHANGES，不标 VERIFIED。
