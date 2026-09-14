# WI-15｜Workspace Visual Asset Renderer

**Status:** COMPLETED  
**Goal:** 让 serializable ProjectAssetRef 进入 SceneFrame、shared RenderSpec 与 Workspace，继续使用现有 layout/motion/selection/resize/opacity 机制。

## Contract

- **Why now:** WI-12/13 已能规划并生成 asset bytes，但 Workspace 还没有 image primitive/asset ref。
- **Dependencies:** WI-14 completed。
- **Primary files:** `src/project/schema.ts`、`src/render/scene.ts`、`src/render/effectRenderSpec.ts`、`src/editor/canvas/CanvasStage.tsx`、runtime tests。
- **Allowed scope:** optional effect asset schema, SceneItem propagation, image primitive metadata, Workspace image element。
- **Non-goals:** 不做 provider dispatch、不做高级 Inspector、不改 Export Canvas image decode（parity gate in WI-17）。
- **Invariants:** ProjectAssetRef is serializable; no Object URL as persistence contract; asset keeps normal effect transform/motion and controls。
- **Implementation steps:** asset binding failing test → schema/Scene propagation → RenderSpec image primitive → Canvas image → regression。
- **Tests/commands:** asset/Canvas/RenderSpec/Project tests、`pnpm lint`、`git diff --check`。
- **User-visible acceptance:** bound robot PNG appears in Workspace and remains governed by effect layout/motion.
- **Failure handling:** missing asset ref renders no image and does not crash native effect rendering。
- **Rollback:** revert WI-15 files/tests/contract/evidence/ledger records only。

