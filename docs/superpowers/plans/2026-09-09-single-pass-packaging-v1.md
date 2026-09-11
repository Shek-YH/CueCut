# Single-Pass AI Packaging Engine V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the V1 deterministic packaging engine described by `CueCut_Single_Pass_AI_Packaging_Engine_PRD_V1.0.md`, with one-call AI intent generation followed by offline registry resolution, layout, collision, validation, preview, and MP4/WebM export.

**Architecture:** Add a new packaging pipeline beside the existing frozen Director/Layout contracts. Persist AI intent as `PackagingPlan`, resolve it into `ResolvedPackagingPlan`, and compile only the resolved form into the existing render/export boundary. Keep V1.5 and V2 requirements recorded as deferred work.

**Tech Stack:** TypeScript, Zod, Vitest, existing React/Vite render/export pipeline, Node/FFmpeg adapters where already supported.

---

## Execution rules

- Use TDD for each new production behavior: write one focused failing test, run it, then implement the smallest passing code.
- Do not modify frozen files listed in `CORE_FREEZE.md` without a recorded architecture/requirement deviation.
- Do not add a second generative call for repair, layout, QA, aspect-ratio changes, theme changes, or export.
- Do not copy HyperFrames code/assets; preserve license evidence in `THIRD_PARTY_NOTICES.md` if any future migration is approved.

### Task 1: Deterministic analysis contract

**Files:** Create `src/analysis/packagingAnalysis.ts`, `tests/analysis/packagingAnalysis.test.ts`.

- [ ] Test that the analysis snapshot contains video metadata, transcript, scenes, subjects, faces, safe zones, edge insets, audio envelope, beats, and scene density without a provider dependency.
- [ ] Implement typed `AnalysisSnapshot` and deterministic normalization of supplied metadata/transcript/settings.
- [ ] Run `pnpm exec vitest run tests/analysis/packagingAnalysis.test.ts`.

### Task 2: Packaging IR schema

**Files:** Create `src/packaging-ir/schema.ts`, `src/packaging-ir/index.ts`, `tests/packaging-ir/schema.test.ts`.

- [ ] Test valid top-level plan, timeline item, category, subject relation, edge inset, seed, and user override data.
- [ ] Test rejection of pixel coordinates, unknown Motion DSL values, invalid time ranges, and missing required intent fields.
- [ ] Implement Zod schemas and normalization; preserve AI intent separately from resolved/user override state.
- [ ] Run the focused schema suite.

### Task 3: Local persistence

**Files:** Create `src/packaging-ir/persistence.ts`, `tests/packaging-ir/persistence.test.ts`.

- [ ] Test atomic save/load of `analysis/`, `ai/packaging-plan.json`, and `resolved/resolved-plan.json` under a project directory.
- [ ] Test that a failed parse never replaces the last valid plan.
- [ ] Implement local persistence with sibling temporary files and no secret values.
- [ ] Run the focused persistence suite.

### Task 4: Registry manifest contract

**Files:** Create `src/packaging-registry/manifest.ts`, `tests/packaging-registry/manifest.test.ts`.

- [ ] Test manifest validation for category, style tags, aspect ratios, zones, subject relations, duration, motion capabilities, content schema, runtime, and license reference.
- [ ] Test that invalid or license-less entries are rejected from the catalog.
- [ ] Implement the manifest schema and registry adapter interface.
- [ ] Run the focused manifest suite.

### Task 5: V1 catalog and resolver

**Files:** Create `src/packaging-registry/catalog.ts`, `src/packaging-registry/resolver.ts`, `tests/packaging-registry/resolver.test.ts`.

- [ ] Test at least eight categories and at least thirty catalog entries using existing provenance-backed motion definitions where available.
- [ ] Test the documented 30/15/15/10/10/10/10 deterministic score and candidate fallback ordering.
- [ ] Implement catalog construction and resolver without accepting final template IDs from AI.
- [ ] Run the focused resolver suite.

### Task 6: Motion DSL

**Files:** Create `src/packaging-motion/dsl.ts`, `src/packaging-motion/compiler.ts`, `tests/packaging-motion/dsl.test.ts`.

- [ ] Test all V1 entrance/emphasis/exit/camera vocabulary validation and rejection of arbitrary keyframes/code.
- [ ] Test seeded output equality for repeated compilation and inequality for distinct seeds where randomness is used.
- [ ] Implement compiler presets with no `Math.random()`.
- [ ] Run the focused motion suite.

### Task 7: Safe area and subject spatial model

**Files:** Create `src/packaging-layout/safeArea.ts`, `src/packaging-subject/spatial.ts`, tests under `tests/packaging-layout/` and `tests/packaging-subject/`.

- [ ] Test independent edge insets and 0–50% subject padding.
- [ ] Test `avoid` and `foreground` relation behavior with normalized rectangles.
- [ ] Implement safe-area and subject-zone helpers without changing frozen `src/layout/*`.

### Task 8: Layout candidate solver

**Files:** Create `src/packaging-layout/candidates.ts`, `src/packaging-layout/solver.ts`, `tests/packaging-layout/solver.test.ts`.

- [ ] Test preferred plus three fallback zones, normalized output, safe-area clamping, and deterministic score ordering.
- [ ] Implement layout solver with subject/subtitle/background/edge/overlap score inputs.

### Task 9: Collision and fallback engines

**Files:** Create `src/packaging-collision/resolver.ts`, `src/packaging-fallback/engine.ts`, tests under `tests/packaging-collision/` and `tests/packaging-fallback/`.

- [ ] Test repair order: move, alternate zone, shrink, shorten, alternate template, lighter effect, drop non-critical overlay.
- [ ] Test fallback chains for `avoid`, `foreground`, and failed candidate layouts with explicit reason codes.
- [ ] Implement both engines without provider access.

### Task 10: Packaging Validator and deterministic repair

**Files:** Create `src/packaging-validator/validator.ts`, `src/packaging-validator/repair.ts`, tests under `tests/packaging-validator/`.

- [ ] Test geometry, typography, timing, visual, runtime, and simultaneous-overlay failures.
- [ ] Test rule repairs for overflow, face collision, subtitle collision, and unsupported runtime.
- [ ] Implement `ValidationReport` and bounded repair loop with no AI call.

### Task 11: Timeline compiler and snapshot QA

**Files:** Create `src/packaging-timeline/compiler.ts`, `src/packaging-preview/snapshots.ts`, tests under `tests/packaging-timeline/` and `tests/packaging-preview/`.

- [ ] Test that compiler accepts resolved plans only, maps DSL to runtime motion, and emits deterministic timeline items.
- [ ] Test opening/signature/peak/final checkpoints plus per-overlay samples.
- [ ] Implement snapshot plan generation and runtime timeline compilation.

### Task 12: Preview/render separation

**Files:** Create `src/packaging-preview/service.ts`, tests under `tests/packaging-preview/`.

- [ ] Test preview requests return frame/timeline data and never call export.
- [ ] Test final export is the only path that calls the existing export adapter.
- [ ] Implement the separation adapter around the existing renderer.

### Task 13: MP4/WebM export capabilities

**Files:** Modify existing export adapter only after a failing test identifies the missing capability; create `tests/packaging-export/format.test.ts` and `tests/packaging-export/export.test.ts`.

- [ ] Test capability detection and explicit unsupported-format failure.
- [ ] Test MP4 normal export and transparent WebM request wiring without invoking AI.
- [ ] Implement the smallest adapter compatible with current FFmpeg/host behavior.

### Task 14: Telemetry and edit-without-AI behavior

**Files:** Create `src/packaging-telemetry/events.ts`, `src/packaging-ir/editing.ts`, tests under `tests/packaging-telemetry/` and `tests/packaging-ir/`.

- [ ] Test exact `aiCallCount` behavior and required event names.
- [ ] Test theme/template/aspect/safe-area/subject-padding/format edits reuse the persisted plan and preserve locked overrides.
- [ ] Implement telemetry and pure editing transforms.

### Task 15: Single-Pass AI Director integration

**Files:** Create `src/packaging-ai/prompt.ts`, `src/packaging-ai/service.ts`, `tests/packaging-ai/service.test.ts`.

- [ ] Test one provider call on success, local repair of one invalid JSON shape, and failure without retry when repair fails.
- [ ] Test provider input contains complete analysis and preferences while output is schema-validated intent only.
- [ ] Implement the one-call guard and integrate with the persistence/resolve pipeline.

### Task 16: UI flow and settings

**Files:** Modify `src/app/App.tsx` and existing packaging UI seam only after focused UI tests; add tests under `tests/app/` where existing conventions support them.

- [ ] Test the visible `生成 AI 包装` flow states and advanced settings fields.
- [ ] Wire analysis → one-call generation → resolve → validate → editable result without exposing internal multi-module complexity.
- [ ] Preserve the existing UI source-of-truth and do not redesign unrelated screens.

### Task 17: Requirement evidence and independent verification

**Files:** Create `docs/single-pass-packaging/02_TEST_PLAN.md`, `docs/single-pass-packaging/03_VERIFICATION_REPORT.md`, update `.ai-ledger` through the Skill contract.

- [ ] Run focused suites, full `pnpm test --run`, `pnpm lint`, `pnpm build`, and applicable browser/export tests.
- [ ] Record code/test/artifact evidence per REQ-SP requirement; Builder must not mark requirements VERIFIED.
- [ ] Independent verifier rereads PRD, matrix, architecture, Core Freeze, diff, source, tests, artifacts, and runtime evidence.
- [ ] Run `requirement-validate.mjs`, `fidelity-gate.mjs --final`, and `verification-gate.mjs --final`.

### Task 18: Final acceptance

**Files:** Update `FINAL_ACCEPTANCE.md`, `.ai-ledger/extensions/verification.json`, `.ai-ledger/project.json` only after all gates pass.

- [ ] Confirm all V1 MUST/P0 requirements are VERIFIED or explicitly user-accepted deviations.
- [ ] Create a safe local checkpoint commit containing only intended changes; never push.
- [ ] Append `PROJECT_COMPLETED` only when the final gate permits it.
