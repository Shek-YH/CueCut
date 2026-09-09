# CueCut V2.0 Engineering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox ( - [ ] ) syntax for tracking.

**Goal:** Turn the supplied CueCut PRD, Director Skill and V4 UI prototype into a testable host-native editor whose first vertical slice imports a video, maintains one canonical project, plays/scrubs it, edits an effect timeline, previews a local Effect Lab draft and commits only on Apply.

**Architecture:** Use React + TypeScript + Vite for the browser editor. Keep a canonical immutable Project Store behind typed commands and transactions; PlaybackClock is separate state; Canvas/Timeline/Inspector read the same project snapshot. Define a renderer interface now and keep final export behind it so React DOM screenshots are never the export contract.

**Tech Stack:** Node 24, pnpm 11, React, TypeScript, Vite, Zod, Vitest, Playwright; host FFmpeg/ffprobe for later media integration.

---

### Task 1: Bootstrap the local repository and toolchain

**Files:**
- Create: .gitignore, .gitattributes, .editorconfig, .node-version, package.json, tsconfig.json, tsconfig.node.json, vite.config.ts, index.html, src/main.tsx
- Modify: docs/evidence/WI-000.md
- Test: pnpm build, pnpm test

- [x] Step 1: Initialize local Git and verify the root.
- [x] Step 2: Add ignore/editor/runtime rules that exclude dependencies, secrets, outputs and large local media.
- [x] Step 3: Add the smallest buildable app shell with packageManager pinned to pnpm@11.19.0.
- [x] Step 4: Run pnpm install, pnpm build and pnpm test --run; record exit codes.
- [x] Step 5: Record exact dependency versions/licenses in docs/governance/DEPENDENCIES.md.

### Task 2: Establish canonical composition contracts with TDD

**Files:**
- Create: src/project/schema.ts, src/project/store.ts, src/project/fixtures.ts
- Test: tests/project/schema.test.ts, tests/project/store.test.ts
- Modify: docs/work-items/WI-002-canonical-project-model.md, docs/evidence/WI-002.md

- [x] Step 1: Write failing schema tests for cuecut.composition/1, required fields, normalized coordinates, valid timing and nullable SFX.
- [x] Step 2: Run pnpm test --run tests/project/schema.test.ts and confirm RED due to missing contracts.
- [x] Step 3: Implement minimal Zod composition types while preserving userFlags and variantStateCache.
- [x] Step 4: Write failing store tests proving draft isolation, one Apply undo entry and zero Cancel entries.
- [x] Step 5: Implement store commands and run focused then full tests.

### Task 3: Build PlaybackClock, video import and Timeline math

**Files:**
- Create: src/playback/clock.ts, src/media/video.ts, src/editor/timeline/timeMath.ts, src/editor/timeline/Timeline.tsx
- Test: tests/playback/clock.test.ts, tests/editor/timeline/timeMath.test.ts, tests/e2e/vertical-slice.spec.ts
- Modify: src/app/App.tsx, docs/work-items/WI-003-playback-timeline.md, docs/evidence/WI-003.md

- [x] Step 1: Write failing tests for clamp/frame conversion and decoupled mutations.
- [x] Step 2: Run focused tests and confirm the expected RED failures.
- [x] Step 3: Implement clock/time math and pointer handlers with independent playhead state.
- [x] Step 4: Add local video file input using object URLs and cleanup on replacement/unmount.
- [x] Step 5: Run focused tests, build and full tests.

### Task 4: Implement the prototype-faithful Editor shell

**Files:**
- Create: src/app/App.tsx, src/app/layout.css, src/editor/layers/LayersPanel.tsx, src/editor/subtitles/SrtQuickPanel.tsx, src/editor/canvas/CanvasStage.tsx, src/editor/inspector/Inspector.tsx
- Test: tests/app/navigation.test.tsx, tests/e2e/vertical-slice.spec.ts
- Modify: index.html, docs/work-items/WI-004-effect-registry-canvas-inspector.md, docs/evidence/WI-004.md

- [x] Step 1: Write failing navigation/layout tests for four nav items, Edit regions, locked Video Layer 0 and Special-first Inspector.
- [x] Step 2: Implement the dark token system and stable panel layout without changing prototype information architecture.
- [x] Step 3: Implement Canvas selection/drag and Inspector updates through Project Store only.
- [x] Step 4: Run UI tests at 1920x1080, 1600x900 and 1440x900 and save screenshot evidence.

### Task 5: Add Motion Registry and local runtime preview

**Files:**
- Create: src/motions/registry.ts, src/motions/runtime.ts, tests/motions/registry.test.ts, tests/motions/runtime.test.ts
- Modify: src/app/App.tsx, docs/work-items/WI-005-motion-runtime.md, docs/evidence/WI-005.md

- [x] Step 1: Write failing registry, compatibility and runtime tests.
- [x] Step 2: Run focused tests and confirm RED.
- [x] Step 3: Add six representative enter/exit presets and compatibility checks.
- [x] Step 4: Make preview use the runtime interface with no LLM call.
- [x] Step 5: Run focused/full tests and record evidence.

### Task 6: Implement Effect Lab Preview Draft → Apply/Cancel

**Files:**
- Test: tests/project/store.test.ts, tests/e2e/vertical-slice.spec.ts
- Modify: src/app/App.tsx, docs/work-items/WI-006-effect-lab.md, docs/evidence/WI-006.md

- [x] Step 1: Write failing tests for draft isolation and one Apply transaction.
- [x] Step 2: Run the focused test and confirm RED.
- [x] Step 3: Implement clone/reset/local preview state.
- [x] Step 4: Implement Apply as one store transaction and Cancel as discard.
- [x] Step 5: Run component tests and Playwright interaction/screenshot evidence.

### Task 7: Add SFX metadata registry and favorites

**Files:**
- Create: src/sfx/registry.ts, src/sfx/favorites.ts, src/editor/sfx/SfxLibrary.tsx
- Test: tests/sfx/favorites.test.ts, tests/editor/sfx-library.test.tsx
- Modify: docs/governance/DEPENDENCIES.md, docs/work-items/WI-007-sfx-favorites.md, docs/evidence/WI-007.md

- [x] Step 1: Write failing favorite/filter/weak-ranking tests.
- [x] Step 2: Run focused tests and confirm RED.
- [x] Step 3: Implement metadata-only registry, favorite timestamps and recent list.
- [x] Step 4: Implement list/detail/preview/replace entry points without audio egress.
- [x] Step 5: Run focused/full tests and document missing authorized audio.

### Task 8: Add SRT parser/export and ASR adapter boundary

**Files:**
- Create: src/subtitles/srt.ts, src/media/asr.ts, tests/subtitles/srt.test.ts, tests/media/asr.test.ts
- Modify: src/editor/subtitles/SrtQuickPanel.tsx, docs/work-items/WI-008-srt-asr.md, docs/evidence/WI-008.md

- [x] Step 1: Write failing SRT parse/export and adapter tests.
- [x] Step 2: Run focused tests and confirm RED.
- [x] Step 3: Implement local parser/serializer and deterministic adapter contract.
- [x] Step 4: Wire click seek, inline edit and current-segment highlighting.
- [x] Step 5: Run tests and leave real ASR as WAITING_FOR_READINESS.

### Task 9: Implement Director context, one-call guard and local validation

**Files:**
- Create: src/director/types.ts, src/director/contextBuilder.ts, src/director/retriever.ts, src/director/oneCallGuard.ts, src/director/validator.ts, src/director/localFallback.ts
- Test: tests/director/retriever.test.ts, tests/director/oneCallGuard.test.ts, tests/director/validator.test.ts, tests/director/service.test.ts
- Modify: docs/work-items/WI-009-cuecut-director.md, docs/evidence/WI-009.md

- [x] Step 1: Write failing candidate-only, one-call and local-fallback tests.
- [x] Step 2: Run focused tests and confirm RED.
- [x] Step 3: Implement retriever limits and DirectorInput builder.
- [x] Step 4: Implement exactly one provider invocation per Generate operation.
- [x] Step 5: Implement local parse/schema/registry/time/layout validation and fallback without a second LLM call.
- [x] Step 6: Run tests; do not use a live paid provider without explicit readiness and authorization.

### Task 10: Implement Layout Solver and preference evolution

**Files:**
- Create: src/layout/solver.ts, src/preferences/diff.ts, src/preferences/engine.ts
- Test: tests/layout/solver.test.ts, tests/preferences/diff.test.ts, tests/preferences/engine.test.ts
- Modify: src/editor/canvas/CanvasStage.tsx, docs/work-items/WI-010-layout-solver.md, docs/work-items/WI-012-preference-evolution.md

- [x] Step 1: Write failing collision, priority, diff and confidence tests.
- [x] Step 2: Run focused tests and confirm RED.
- [x] Step 3: Implement nearest-valid normalized layout with locked/manual/high-importance priority.
- [x] Step 4: Implement initial/final diff and context-aware local confidence updates.
- [x] Step 5: Run tests and verify one sample stays below strong confidence.

### Task 11: Define renderer/export contracts and host integration gates

**Files:**
- Create: src/render/types.ts, src/render/canvasRenderer.ts, src/export/exporter.ts, tests/render/renderer.test.ts, tests/export/exporter.test.ts
- Modify: docs/governance/ADR-001-runtime-and-renderer.md, docs/work-items/WI-011-export.md, docs/evidence/WI-011.md

- [x] Step 1: Write failing renderer contract and benchmark metadata tests.
- [x] Step 2: Run focused tests and confirm RED.
- [x] Step 3: Implement frame evaluation behind the renderer interface.
- [x] Step 4: Implement the host FFmpeg command boundary without treating PNG sequence as default; WebCodecs integration remains a later runtime adapter.
- [ ] Step 5: Run local/synthetic export tests; keep RT-08 WAITING and RT-09 BLOCKED until real evidence exists.

### Task 12: Independent verification and delivery evidence

**Files:**
- Create: tests/e2e/, tests/visual/, docs/evidence/WI-013.md, docs/governance/DEPENDENCIES.md
- Modify: all relevant Work Item/Evidence files

- [x] Step 1: Run the complete unit/component suite and production build.
- [x] Step 2: Run Playwright at 1920x1080, 1600x900 and 1440x900.
- [x] Step 3: Review Layout, Component, Interaction and Visual Fidelity against the prototype.
- [x] Step 4: Run available host-real scenarios and record synthetic vs real separately.
- [ ] Step 5: Mark only evidence-supported Work Items VERIFIED; leave missing resources BLOCKED/WAITING.
- [ ] Step 6: Ask the Product Owner for acceptance; never emit ACCEPTED on the user's behalf.

## Self-review

- Spec coverage: Tasks 1 and 12 cover G0/G0.5/G1/G2; Tasks 2–12 cover WI-002 through WI-013; Tasks 4, 6, 7 and 12 cover prototype fidelity and required viewports; Task 9 covers one-call and clean-room constraints; Task 11 leaves export blockers explicit.
- Placeholder scan: future real-resource gaps are named as readiness states; no unspecified provider, secret, container or acceptance is assumed.
- Type consistency: Project Store is shared by Timeline, Canvas, Inspector and Effect Lab; Renderer and Director are injectable boundaries.
