# WI-05 Evidence

**Status:** COMPLETED  
**Verification label:** SELF_VERIFIED

- Goal: establish the shared RenderSpec boundary for the first five structural effect families.
- Changed files: `src/render/effectRenderSpec.ts`, `src/editor/canvas/CanvasStage.tsx`, `src/app/App.tsx`, `src/export/renderer.ts`, `tests/render/effectRenderSpec.test.ts`, WI-05 contract/evidence.
- Tests added: five SceneItem kinds produce five distinct primitive signatures: metric/ring, list/accent-bar, quote/quote-mark, chart/bars, highlight/underline.
- Commands: Render/Export/Canvas/App regression = 7 files / 57 tests passed; `pnpm lint` exit 0; `pnpm build` exit 0; `git diff --check` exit 0.
- Acceptance: Workspace exposes render signature/renderer metadata, Effect Lab preview uses the same signature, and Export branches through the same RenderSpec source.
- Known limitation: actual primitive drawing remains backed by existing DOM/Canvas implementations; broad all-pack migration and deeper parity checks are WI-17.
- Regression risk: additive metadata and shared branch selection; existing CSS and interaction structure are unchanged.
- Rollback: revert only WI-05 files and records.

