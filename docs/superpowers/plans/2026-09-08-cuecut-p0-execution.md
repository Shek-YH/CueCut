# CueCut P0 Golden Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Process all six remaining motion packs, make the formal registry/runtime/UI deterministic and registry-driven, then close the Core Golden Path through canonical project state, host probing, unified rendering, actual local export, portable tests, and evidence.

**Architecture:** Keep `src/motions/_import` as provenance-only staging, generate formal definitions through the existing motion/effect registry and adapter contracts, and evaluate every visible/exported frame from one deterministic project-to-SceneFrame function. Keep Vite middleware as a development adapter and add reusable host/export functions that can run from a production Node entry.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Playwright, Zod, Node child processes, FFmpeg/FFprobe, PowerShell/.NET ZIP inspection on Windows.

---

### Task 1: Inventory, safe extraction, and provenance evidence

**Files:**
- Create: `scripts/motion-pack-audit.ps1`
- Create: `docs/audit/MOTION_PACK_INVENTORY.md`
- Create: `docs/audit/MOTION_PACK_INSTALL_REPORT.md`
- Modify: `src/motions/_import/**` and `src/motions/licenses/**` only with audited pack contents/notices
- Test: `tests/motions/pack-audit.test.ts`

- [ ] Enumerate every ZIP under `src/motions`, compute size/SHA256, read `SOURCE_METADATA.json`, count entries, and record the v0.1 baseline plus v0.2–v0.7 remaining packs.
- [ ] Implement safe extraction that rejects absolute paths, traversal, symlink-like entries, and executable/script/postinstall entries before writing any file; never execute source-pack files.
- [ ] Extract the six remaining packs into `src/motions/_import/<pack-slug>/`, copy only license notices into `src/motions/licenses/`, and record third-party references as reference-only.
- [ ] Classify every pack as `FORMALLY_INSTALLED` only after registry/adapter/runtime tests pass; otherwise record an explicit `QUARANTINED_<REASON>` status.
- [ ] Run `pnpm exec vitest run tests/motions/pack-audit.test.ts` and verify all seven ZIPs are accounted for.

### Task 2: Formal pack catalog, adapter/runtime parity, and motion library data

**Files:**
- Create: `src/motions/packCatalog.ts`
- Create: `src/motions/packAdapters.ts`
- Modify: `src/motions/format.ts`, `src/motions/adapters.ts`, `src/motions/registry.ts`, `src/motions/runtime.ts`, `src/effects/registry.ts`
- Test: `tests/motions/registry.test.ts`, `tests/motions/runtime.test.ts`, `tests/motions/adapters.test.ts`, `tests/effects/registry.test.ts`, `tests/motions/pack-catalog.test.ts`

- [ ] Add semantic intent, visual expression, and motion-category unions while preserving existing public types and legacy IDs.
- [ ] Build a local catalog for every descriptor in v0.2–v0.7, with source pack/ref, license/ref, semantic tags, visual tags, aspect ratios, duration, use/avoid cases, and a serializable default property model.
- [ ] Add one deterministic local pack adapter contract that evaluates content and visual motion from frame/fps without importing third-party UI or using network state.
- [ ] Make every registered motion resolve to an adapter/runtime evaluator; unknown IDs must throw in development/test and emit a diagnostic before any production safe fallback.
- [ ] Add tests for unique IDs, license gate, adapter existence, 30fps determinism, 9:16/16:9, Chinese/English content, serialization, and unknown motion behavior.

### Task 3: Registry-driven Effect Lab and real preview states

**Files:**
- Modify: `src/app/App.tsx`, `src/editor/canvas/CanvasStage.tsx`, `src/editor/inspector/Inspector.tsx`, `src/editor/layers/LayersPanel.tsx`, `src/app/layout.css`
- Create/modify: `src/editor/effect-lab/**`
- Test: `tests/editor/effect-lab.test.tsx`, `tests/editor/canvas-motion.test.tsx`, `tests/app/navigation.test.tsx`

- [ ] Replace hard-coded effect/motion button arrays and fake preview labels with `effectRegistry`/`motionRegistry` category-family-variant data.
- [ ] Render only visible/selected/hovered previews, use runtime-generated states, and expose formal pack metadata in the library.
- [ ] Keep draft/apply/cancel as one canonical store transaction and ensure installed pack variants are selectable without direct third-party imports.
- [ ] Verify no production default path references demo/placeholder motion content.

### Task 4: Production host boundary and real media probing

**Files:**
- Create: `src/server/productionHost.ts`
- Modify: `src/server/generationRoute.ts`, `src/media/video.ts`, `vite.config.ts`
- Modify: `package.json`
- Test: `tests/server/productionHost.test.ts`, `tests/media/video.test.ts`

- [ ] Extract reusable host operations for file I/O, FFmpeg, FFprobe, and generation routes; keep Vite middleware as a dev adapter.
- [ ] Implement FFprobe metadata parsing for duration, width, height, codec, r_frame_rate, avg_frame_rate, audio presence, and explicit VFR handling.
- [ ] Add a production server entry and a build-compatible API path for `/api/generate-effects` without adding a new desktop stack.
- [ ] Prove 30, 29.97, 59.94, and 60 fps parsing with unit tests.

### Task 5: Canonical composition, subtitles, timeline, and persistence

**Files:**
- Modify: `src/project/schema.ts`, `src/project/store.ts`, `src/project/fixtures.ts`, `src/editor/subtitles/SrtQuickPanel.tsx`, `src/editor/timeline/Timeline.tsx`, `src/app/App.tsx`
- Create/modify: `src/project/persistence.ts`, `src/project/timeline.ts`
- Test: `tests/project/schema.test.ts`, `tests/project/store.test.ts`, `tests/project/persistence.test.ts`, `tests/editor/srt-quick-panel.test.tsx`, `tests/editor/timeline/**`

- [ ] Add `schemaVersion`, canonical `subtitles[]`, and `VIDEO/SUBTITLE/EFFECT/SFX` timeline derivation to `ProjectComposition` with migration from the current schema.
- [ ] Remove `SrtQuickPanel` production fallback subtitles; new media starts with an empty subtitle list, while fixtures remain under tests/fixtures only.
- [ ] Route SRT import/edit/export, timeline display, preview, save/reload, and Director input through the same canonical subtitle data.
- [ ] Implement move/trim/delete/duplicate/undo/redo on canonical timeline items and Create/Save/Close/Open/Continue persistence with validated migrations.

### Task 6: Unified SceneFrame and renderer parity

**Files:**
- Create: `src/render/scene.ts`
- Modify: `src/render/types.ts`, `src/render/canvasRenderer.ts`, `src/editor/canvas/CanvasStage.tsx`
- Test: `tests/render/scene.test.ts`, `tests/render/renderer.test.ts`, `tests/editor/canvas-motion.test.tsx`

- [ ] Implement `evaluateSceneAtTime(project, timeSec)` returning content, visibility, layout, opacity, translate, scale, rotation, blur, appearance, z-index, and motion phase for text/number/list/motion-layer effects.
- [ ] Make DOM preview and Canvas renderer consume the same SceneFrame; remove active-ID-only and colored-rectangle-only behavior.
- [ ] Verify enter/active/exit phases, deterministic frames, Chinese/English text, normalized layouts, and both required aspect ratios.

### Task 7: Actual MP4/transparent MOV export and portable fixture tests

**Files:**
- Create: `src/export/controller.ts`, `src/export/renderer.ts`, `scripts/create-test-video.ps1`
- Modify: `src/export/ffmpeg.ts`, `src/export/exporter.ts`, `src/app/App.tsx`, `package.json`
- Test: `tests/export/controller.test.ts`, `tests/export/portable-export.test.ts`, `tests/e2e/portable-export.spec.ts`

- [ ] Add export controller states Preparing/Rendering/Encoding/Finalizing/Done/Failed/Cancelled with child-process cancellation and temp cleanup.
- [ ] Render SceneFrames to a local overlay/video stream, invoke FFmpeg for full MP4 and ProRes 4444 alpha MOV, and validate output using FFprobe rather than exit code alone.
- [ ] Add a generated 5–10 second 30fps color/tone fixture and an automated composition containing one subtitle, 2–3 installed motions, and optional metadata-only SFX.
- [ ] Keep real-media tests opt-in through `CUECUT_REAL_MEDIA_16_9` and `CUECUT_REAL_MEDIA_9_16`; remove default machine-path assumptions.

### Task 8: Ledger gates, reports, verification, and handoff

**Files:**
- Modify: `scripts/workflow.mjs`, `docs/governance/REAL_TEST_READINESS.md`, `docs/02_MASTER_LEDGER.md` only if the repository uses that path, `docs/work-items/WI-016.json` through `WI-022.json` as evidence warrants
- Create: `docs/audit/CUECUT_P0_IMPLEMENTATION_REPORT.md`, `docs/audit/CUECUT_RELEASE_READINESS_REPORT.md`, `docs/evidence/MOTION_PACK_INSTALLATION.md`
- Test: `tests/governance/workflow.test.ts`, `tests/governance/p0-gates.test.ts`

- [ ] Enforce descendant completion, READY-versus-PASS, real-test, and independent-verifier gates in the existing workflow control plane.
- [ ] Generate the four required audit/evidence reports with counts, results, blockers, and reproducible commands.
- [ ] Run fresh verification: `pnpm lint`, `pnpm test --run`, `pnpm build`, `pnpm test:e2e`, `pnpm workflow:check`, `pnpm workflow:golden`, and `pnpm workflow:readiness`.
- [ ] Record remaining Product Owner validations (especially CapCut/Jianying downstream alpha acceptance and any unavailable credentials/media); do not push automatically.
