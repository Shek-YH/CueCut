# WI-12｜Atlas Planner + Prompt + Synthetic Splitter

**Status:** COMPLETED  
**Goal:** 冻结 atlas page/grid/slot，生成严格透明 prompt，并对 synthetic RGBA/PNG atlas 做 deterministic split、trim、manifest 与 QA。

## Contract

- **Why now:** VisualAsset candidates 需要在真实 Provider 前拥有可重复、可审计的 image pipeline。
- **Dependencies:** WI-11 completed。
- **Primary files:** `src/visual-assets/atlasPlanner.ts`、`atlasPrompt.ts`、`splitter.ts`、`png.ts`、`manifest.ts`、`qa.ts`。
- **Allowed scope:** 1–25 grid, 26+ pages, row-major mapping, transparent constraints, standard-library PNG, alpha bbox, square/trimmed output。
- **Non-goals:** 不调用 Provider、不 OCR/vision 识别、不读取私有视频、不实现 worker。
- **Invariants:** max grid 5; max 25 assigned cells; mapping frozen before generation; unused cells transparent; empty assigned cell fails QA。
- **Implementation steps:** page/prompt/split failing tests → RGBA splitter → PNG codec adapter → manifest/QA → lint/regression。
- **Tests/commands:** `tests/visual-assets/atlas.test.ts`、planner test、`pnpm lint`、`git diff --check`。
- **User-visible acceptance:** 18 and 26 mapping exact; synthetic PNG produces square/trimmed bytes and explicit QA issues。
- **Failure handling:** invalid dimensions/decode/empty/edge issues return issues and no false success。
- **Rollback:** revert WI-12 visual-asset files/tests/contract/evidence/ledger records only。

