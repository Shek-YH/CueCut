# Context Packet｜WI-022

**Role:** R00 Project Orchestrator / AI Product Steward  
**Work Item:** `WI-022` — Core Golden Path real E2E and acceptance preparation  
**Current GP:** GP-01…GP-08；依赖 WI-021。

## Goal

复跑真实本地 Golden Path：CueCut 入口 → Registry → Library/Preview/参数 → Timeline → shared renderer → local Export plan/产物，汇总 R90 独立验证和 Evidence，生成 `docs/FINAL_ACCEPTANCE.md`、`docs/TEST_RESULTS.md`、`docs/IMPLEMENTATION_LOG.md`。用户未操作 CapCut/Jianying 前，只能将下游 Alpha MOV 标记 WAITING_FOR_USER，不能声称全链路最终发布完成。

## Allowed / forbidden

允许 final docs、WI-022 context/handoff/evidence、已有 docs/evidence 更新；禁止修改 `src/**`、package/lock、部署和生产环境。R00 可修正台账状态/证据引用，但不得用自检替代 R90。

## Acceptance

逐项核对 `03_CORE_GOLDEN_PATH.md`、PRD §28/31 和所有 P0 Work Item；没有真实 child-agent/verifier executionRef、Evidence、Real Test 或用户最终 Product/Release Acceptance 时，报告真实缺口并请求一次集中验收操作。
