# WI-12 Evidence

**Status:** COMPLETED  
**Verification label:** SELF_VERIFIED

- Goal: provide a deterministic synthetic atlas planning and splitting pipeline.
- Changed files: `src/visual-assets/atlasPlanner.ts`, `atlasPrompt.ts`, `splitter.ts`, `png.ts`, `manifest.ts`, `qa.ts`, `index.ts`, `tests/visual-assets/atlas.test.ts`.
- Tests added: 18→5x5+7 unused, 26→25+1 pages, row-major slots, prompt constraints, empty-cell QA, alpha bbox/trim, PNG signature output.
- Commands: atlas/planner regression = 2 files / 7 tests passed; `pnpm lint` exit 0; `git diff --check` exit 0.
- Acceptance: PNG adapter decodes supported synthetic 8-bit RGBA PNGs and returns deterministic square/trimmed PNG bytes without a new dependency or provider call.
- Known limitation: PNG adapter intentionally supports a narrow RGBA profile; large-image worker/off-main-thread is P1.
- Regression risk: standard-library `node:zlib` is kept out of the client path unless the visual-assets index is imported by a future browser bundle.
- Rollback: revert WI-12 files and records only.

