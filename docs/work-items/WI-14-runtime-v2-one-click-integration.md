# WI-14｜One-click Packaging Integration

**Status:** COMPLETED  
**Goal:** 将一次 Director 响应接入本地 grounding、Visual Asset Planner、resolve/apply 与 Canonical Runtime 校验，保留一次调用契约。

## Contract

- **Why now:** 前序能力若不进入现有按钮，产品主链路仍无法使用。
- **Dependencies:** WI-13 completed。
- **Primary files:** `src/app/App.tsx` and integration tests。
- **Allowed scope:** aiCallCount guard, optional grounding gate, planner invocation, deterministic apply/runtime count check, diagnostics count。
- **Non-goals:** 不在本项发起真实 Provider、不新增 Director、不改变 UI 一级结构、不做高级 asset inspector。
- **Invariants:** `aiCallCount === 1`; no AI repair; native packaging succeeds with provider disabled; runtime count matches applied effects。
- **Implementation steps:** one-call/integration assertion → mainline guards/planner/runtime compile → App regression。
- **Tests/commands:** App/server/grounding/planner/runtime tests、`pnpm lint`、`git diff --check`。
- **User-visible acceptance:** 点击一次生成后可进入 Workspace，显示 AI 1 次；可选视觉资产只产生本地候选，不阻断 native packaging。
- **Failure handling:** fatal grounding or non-one-call response stops before Project mutation; provider errors remain outside native path。
- **Rollback:** revert WI-14 App/test/contract/evidence/ledger records only。

