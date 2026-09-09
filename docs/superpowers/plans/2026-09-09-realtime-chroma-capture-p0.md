# Realtime Chroma Capture P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove a real CueCut composition can be captured in Chromium at 1920×1080/30 FPS with a green background, synchronized timeline, measurable health, and validated WebM output without changing existing exports.

**Architecture:** Add a host-neutral realtime capture controller around the existing `ProjectComposition` and `SceneFrame` evaluator. Implement the first backend with a dedicated capture canvas, `canvas.captureStream(30)`, and feature-detected `MediaRecorder`; isolate all lifecycle, timing, health, finalization, and validation logic behind small interfaces so an Electron Window backend can be added later.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Playwright, Chromium MediaRecorder, Canvas 2D, optional host FFmpeg/FFprobe for evidence.

---

### Task 1: P0 architecture notes, ledger requirements, and freeze boundary

**Files:**
- Create: `P0_ARCHITECTURE_NOTES.md`
- Create: `docs/superpowers/specs/2026-09-09-realtime-chroma-capture-design.md`
- Create: `.ai-ledger/extensions/requirements.json` entries for `REQ-RT-*`
- Modify: `.ai-ledger/project.json`, `.ai-ledger/tasks.json`, `.ai-ledger/roles.json`, `.ai-ledger/artifacts.json`, `.ai-ledger/events.jsonl`
- Create/modify: `CORE_FREEZE.md` and `.ai-ledger/extensions/core-freeze.json` only after the new contracts are documented

- [ ] Record the existing web-only architecture, current export paths, renderer reuse points, and the deliberate browser-backend P0 boundary.
- [ ] Add atomic MUST/P0 requirements for feature flag, capture surface, shared snapshot, 1080p30, backend contract, MediaRecorder fallback, state machine, clock/health, cleanup/validation, regression, and real benchmarks.
- [ ] Add an execution phase and ordered tasks with dependencies; bind requirements to task IDs before implementation.
- [ ] Run `node .../validate-ledger.mjs F:\\CCPJ\\CueCut3`, `requirement-validate.mjs`, and `fidelity-gate.mjs --final`.
- [ ] Create a Core Freeze covering the new public realtime contracts and acceptance contract; do not freeze unrelated existing Director files again.

### Task 2: Capture contracts, clock, state machine, and health monitor

**Files:**
- Create: `src/export/realtime/types.ts`
- Create: `src/export/realtime/clock.ts`
- Create: `src/export/realtime/stateMachine.ts`
- Create: `src/export/realtime/health.ts`
- Test: `tests/export/realtime/clock.test.ts`, `tests/export/realtime/stateMachine.test.ts`, `tests/export/realtime/health.test.ts`

- [ ] Write failing tests for frame zero/final-frame timing, monotonic drift, legal/illegal state transitions, dropped-frame estimation, and healthy/warning/failed thresholds.
- [ ] Run the focused tests and observe RED for missing contracts.
- [ ] Implement minimal typed contracts, deterministic clock math, transition table, and health aggregation.
- [ ] Run focused tests, then the full unit suite.

### Task 3: Capture scene surface and browser MediaRecorder backend

**Files:**
- Create: `src/export/realtime/captureScene.ts`
- Create: `src/export/realtime/mime.ts`
- Create: `src/export/realtime/browserCanvasBackend.ts`
- Test: `tests/export/realtime/mime.test.ts`, `tests/export/realtime/browserCanvasBackend.test.ts`
- Modify: `src/render/canvasRenderer.ts` only if needed to support an explicit background override without changing the default editor behavior

- [ ] Write failing tests for supported MIME selection, green background, fixed canvas dimensions, no audio tracks, and backend cleanup.
- [ ] Implement a dedicated off-editor canvas that renders `evaluateSceneAtTime(project, time)` and overrides only the background color.
- [ ] Implement `captureStream(30)`, `MediaRecorder`, data chunk collection, track stop, and deterministic dispose; report WebM fallback explicitly.
- [ ] Add an Electron-compatible `CaptureBackend` contract adapter seam without introducing the Electron dependency or claiming it as runtime support.
- [ ] Run focused tests and build.

### Task 4: Controller, finalizer, validator, and debug entry

**Files:**
- Create: `src/export/realtime/controller.ts`
- Create: `src/export/realtime/finalizer.ts`
- Create: `src/export/realtime/validator.ts`
- Create: `src/export/realtime/featureFlag.ts`
- Create: `src/editor/realtime/RealtimeCapturePanel.tsx`
- Modify: `src/app/App.tsx`, `src/app/layout.css`
- Test: `tests/export/realtime/controller.test.ts`, `tests/export/realtime/validator.test.ts`, `tests/editor/realtime-capture-panel.test.tsx`

- [ ] Write failing tests for recorder-before-timeline ordering, warmup, end-pending final frame, cancel/failure cleanup, duration validation, filename collision safety, and flag-off behavior.
- [ ] Implement the controller using a frozen project snapshot and the backend/clock/health interfaces.
- [ ] Finalize blobs to a P0 WebM file/download, validate metadata and evidence, and never report success after a failed health/duration check.
- [ ] Add an experimental debug entry showing state, MIME, FPS, dropped frames, drift, wall-clock duration, and output result; keep all debug UI outside the capture canvas.
- [ ] Run focused tests, full tests, lint, and build.

### Task 5: Real Chromium benchmark and regression evidence

**Files:**
- Create: `tests/e2e/realtime-capture.spec.ts`
- Create: `scripts/probe-realtime-capture.mjs` if FFprobe evidence needs a repeatable command
- Create: `P0_REALTIME_CAPTURE_REPORT.md`
- Create: `renders/realtime-capture/.gitkeep` only if the ignore policy requires a directory marker
- Modify: `.gitignore` if needed to ignore generated capture artifacts

- [ ] Run a real 10-second Chromium capture from the fixture project and save a playable WebM artifact with metrics.
- [ ] Run a real 60-second timeline capture (or an explicitly documented reduced-render benchmark if browser limits prevent a full artifact) and save metrics separately.
- [ ] Probe output dimensions, FPS, duration, container, codec, and file size with FFprobe when available; distinguish synthetic/unit evidence from real media evidence.
- [ ] Run existing Alpha MOV/Normal Export regression tests and the full Playwright suite.
- [ ] Record CapCut/Jianying manual chroma-key tests as PASS only with actual user/environment evidence; otherwise record NOT RUN and use GO WITH CONDITIONS/NO-GO per the PRD.

### Task 6: Independent verification and final acceptance

**Files:**
- Create: `FINAL_ACCEPTANCE.md`
- Modify: `.ai-ledger/extensions/verification.json`, `.ai-ledger/extensions/requirements.json`, `.ai-ledger/project.json`, `.ai-ledger/tasks.json`, `.ai-ledger/artifacts.json`, `.ai-ledger/events.jsonl`, `P0_REALTIME_CAPTURE_REPORT.md`

- [ ] Run the final fidelity and security checks; ensure no secrets or unrelated dirty files are staged.
- [ ] Use a distinct verifier execution reference/session to reread PRD, requirements, Core Freeze, diff, source, tests, artifacts, and runtime evidence.
- [ ] Mark each requirement `VERIFIED` only with the required implementation/test/real-world evidence; keep manual CapCut/Electron gaps explicit.
- [ ] Run `verification-gate.mjs ... --final --complete`; only emit `PROJECT_COMPLETED` if every MUST/P0 requirement and real acceptance gate passes. Otherwise leave the project in the correct `WAITING_USER`/`WAITING_REVIEW`/`BLOCKED` state with repair or follow-up tasks.
