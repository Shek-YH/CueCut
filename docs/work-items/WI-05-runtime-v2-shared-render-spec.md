# WI-05｜Shared Render Spec + First 5 Real Pack Effects

**Status:** COMPLETED  
**Goal:** 为 metric/list/quote/chart/highlight 五类首批效果建立共享结构 spec，供 Workspace、Effect Lab、Export 消费。

## Contract

- **Why now:** 三处已有 generic 分支会漂移，必须先统一结构 contract 再扩展更多 variant。
- **Dependencies:** WI-04 completed。
- **Primary files:** `src/render/effectRenderSpec.ts`、`src/editor/canvas/CanvasStage.tsx`、`src/app/App.tsx`、`src/export/renderer.ts`。
- **Allowed scope:** 有限 primitives、稳定 renderer/signature、三处消费者接入；首批五种结构。
- **Non-goals:** 不迁移全部 Pack、不替换 UI 信息架构、不新增第三方 renderer、不做完整 Canvas primitive engine。
- **Invariants:** 同一 SceneItem 由同一 spec 产生结构签名；现有 CSS/UI 布局保留。
- **Implementation steps:** five-family signature test → shared spec → Canvas/Lab/Export metadata/branch consumption → build/regression。
- **Tests/commands:** `tests/render/effectRenderSpec.test.ts`、render/export/canvas/App regression、`pnpm lint`、`pnpm build`。
- **User-visible acceptance:** 五类结构产生不同签名，Workspace/Lab/Export 均读取同一 spec source。
- **Failure handling:** 未识别 visual kind 使用 text fallback；旧 CSS class 保留。
- **Rollback:** revert RenderSpec consumers/test/contract/evidence/ledger records only。

