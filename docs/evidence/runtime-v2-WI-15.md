# WI-15 Evidence

**Status:** COMPLETED  
**Verification label:** SELF_VERIFIED

- Goal: bind serializable visual assets into Workspace runtime rendering.
- Changed files: `src/project/schema.ts`, `src/render/scene.ts`, `src/render/effectRenderSpec.ts`, `src/editor/canvas/CanvasStage.tsx`, `tests/runtime/assetBinding.test.ts`, `tests/editor/canvas-video.test.tsx`.
- Tests added: ProjectAssetRef survives SceneFrame and RenderSpec; Workspace exposes asset image with the configured project ref.
- Commands: asset/Canvas/RenderSpec/Project regression = 4 files / 32 tests passed; `pnpm lint` exit 0; `git diff --check` exit 0.
- Acceptance: image primitive metadata and Workspace `<img>` are driven from the same SceneItem asset ref; normal effect card controls remain present.
- Known limitation: Export image byte decode and full parity are WI-17; generation binding is WI-14/16 follow-up scope.
- Regression risk: asset is optional, so legacy effects remain unchanged.
- Rollback: revert WI-15 files and records only.

