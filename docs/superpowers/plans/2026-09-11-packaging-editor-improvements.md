# Packaging Editor Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CueCut generate semantically structured, multi-layer packaging from SRT—first correcting ASR text and judging visual value—then provide reliable preview, adaptive cards, editable subtitles, color-block timelines, and shared AI-learned preferences.

**Architecture:** Keep the existing React + ProjectStore + Packaging IR + registered effect catalog. Extend the IR with persistent chapters/sections and per-element cadence, add one deterministic normalization boundary, and keep DOM preview/Canvas export driven by the same SceneFrame metadata. Store shared preference learning behind a server route that writes only to `%APPDATA%\CueCut3\用户偏好.md` and a user-level snapshot directory.

**Tech Stack:** React 19, TypeScript, Zod, Vite, Vitest, Playwright, Node `fs`/HTTP routes, existing CueCut effect and motion registries.

---

## File map and ownership

- `src/packaging-ir/schema.ts`: Packaging JSON contract, including chapters, sections, semantic roles, evidence types, cadence, and subtitle-source references.
- `src/packaging-ai/prompt.ts`: One-call Director rules and the exact chapter/section/element output envelope.
- `src/packaging-ai/service.ts`: JSON parsing, ASR correction envelope, visual-value filtering, chapter/section/visualUnit normalization, semantic defaults, and no-retry behavior.
- `src/packaging/resolve.ts`, `src/packaging/apply.ts`, `src/packaging-timeline/compiler.ts`: preserve metadata, choose catalog effects, materialize progressive item cues, and write canonical Composition.
- `src/editor/canvas/CanvasStage.tsx`, `src/render/scene.ts`, `src/render/canvasRenderer.ts`: effective-frame seeking, adaptive visual cards, and shared visual-kind rendering.
- `src/project/schema.ts`, `src/project/store.ts`, `src/editor/subtitles/SrtQuickPanel.tsx`: persistent subtitle style/visibility and editing controls.
- `src/editor/timeline/Timeline.tsx`, `src/editor/timeline/trackLayout.ts`, `src/app/layout.css`: color-only clip rendering and interval-based track placement.
- `src/preferences/*`, `src/server/preferencesRoute.ts`, `src/server/productionHost.ts`, `src/app/App.tsx`: preference diff, Markdown persistence, learning action, and next-request loading.
- `tests/`: red/green regressions for every public behavior and browser-level acceptance.

## Task 1: Reliable card selection and effective-frame preview

**Files:**
- Create: `src/editor/selection/previewTime.ts`
- Modify: `src/app/App.tsx:735-736`, `src/editor/canvas/CanvasStage.tsx`
- Test: `tests/editor/previewTime.test.ts`, `tests/app/navigation.test.tsx`

- [ ] **Step 1: Write the failing unit test**

```ts
import { describe, expect, it } from 'vitest';
import { previewTimeForEffect } from '../../src/editor/selection/previewTime';

describe('effect preview seek', () => {
  it('seeks to the fifth frame while staying inside the effect range', () => {
    expect(previewTimeForEffect({ startSec: 10, endSec: 12, fps: 30 })).toBeCloseTo(10 + 5 / 30);
    expect(previewTimeForEffect({ startSec: 10, endSec: 10.05, fps: 30 })).toBeCloseTo(10.05 - 1 / 30);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm exec vitest run tests/editor/previewTime.test.ts`

Expected: FAIL because `previewTimeForEffect` does not exist.

- [ ] **Step 3: Implement the minimal helper and atomic selection path**

```ts
export function previewTimeForEffect(input: { startSec: number; endSec: number; fps: number }): number {
  const frame = 1 / Math.max(1, input.fps);
  return Math.min(input.endSec - frame, input.startSec + frame * 5);
}
```

Change `handleLayerSelect` and timeline clip selection to call `onSeek(previewTimeForEffect(...))`; keep `selectedEffectId` update in the same event. In `CanvasStage`, use the received `currentTime` for `evaluateSceneAtTime` and, after metadata is ready, set the video element to the same preview time once so `timeupdate` cannot restore the old frame.

- [ ] **Step 4: Run focused tests**

Run: `pnpm exec vitest run tests/editor/previewTime.test.ts tests/app/navigation.test.tsx`

Expected: PASS; the selected effect is visible without a timeline drag.

- [ ] **Step 5: Commit the isolated task**

```powershell
git add src/editor/selection/previewTime.ts src/app/App.tsx src/editor/canvas/CanvasStage.tsx tests/editor/previewTime.test.ts tests/app/navigation.test.tsx
git commit -m "fix: seek effect selection to visible preview frame"
```

## Task 2: Preserve semantic packaging structure from SRT to Composition

**Files:**
- Modify: `src/packaging-ir/schema.ts`, `src/packaging-ai/prompt.ts`, `src/packaging-ai/service.ts`
- Modify: `src/packaging/resolve.ts`, `src/packaging/apply.ts`, `src/packaging-timeline/compiler.ts`
- Test: `tests/packaging-ai/service.test.ts`, `tests/packaging/resolve.test.ts`, `tests/packaging/apply.test.ts`

- [ ] **Step 1: Add failing tests for the required `jj-asr.srt` structures**

Add a provider fixture containing three independent elements (`hook`, `quote`, `ordered-process`) and assert:

```ts
expect(plan.timeline.map((item) => item.semanticRole)).toEqual(['hook', 'quote', 'ordered-process']);
expect(plan.timeline[0]?.placementIntent.preferredZones).toContain('center');
expect(plan.timeline[2]?.content.items).toHaveLength(4);
expect(plan.timeline[2]?.cadence?.cueOffsetsMs).toEqual([0, 26550, 96500, 107270]);
expect(plan.transcriptRepair?.segments[0]).toMatchObject({ originalText: expect.any(String), correctedText: expect.any(String), confidence: expect.any(Number) });
expect(plan.visualUnits?.some((unit) => unit.selectionReason)).toBe(true);
expect(plan.visualUnits?.some((unit) => unit.persistence === 'section' && unit.layer === 0)).toBe(true);
```

Add a resolve/apply assertion that the four list items become `{ text, cue: { startSec } }` and that two short emphasis elements retain their own section and track-capable time ranges.

- [ ] **Step 2: Run focused tests and confirm the old behavior fails**

Run: `pnpm exec vitest run tests/packaging-ai/service.test.ts tests/packaging/resolve.test.ts tests/packaging/apply.test.ts`

Expected: FAIL because the current normalizer discards section parameters and list cues.

- [ ] **Step 3: Extend the schema and prompt contract**

Add strict optional `transcriptRepair`, `chapters[]`, `sections[]`, and `visualUnits[]` to the plan and keep `timeline[]` as executable elements. Require the Director response to contain:

```text
transcriptRepair → chapters → sections → visualUnits → timeline
section → elements → category/content/visualIntent/motionIntent/placementIntent/constraints/cadence
visualUnit → sectionId/kind/sourceSubtitleIds/summary/selectionReason/visualIntent/layer/persistence/cueTimesSec/placement/templateQuery
```

Keep explicit rules for the current SRT: question/refusal/how-to-use sentences become separate center cards; the four-step topic becomes one persistent list/process card; short emphasis cards may overlap it on other layers.

Require `keepForVisualPackaging` and `visualValue` for each section. Sections with low visual value or repeated filler must produce no visualUnit. `templateQuery` may contain only semantic tags/content-slot requirements; the local Resolver must select an installed registry entry and never accept invented template IDs.

- [ ] **Step 4: Implement one local normalizer**

Normalize numeric `schemaVersion` to `'1.0'`; preserve original and corrected SRT text with confidence; map `sections[].elements[]` and `visualUnits[]` into timeline items; derive missing `sourceSubtitleIds` by interval overlap; preserve explicit `visualIntent`, `motionIntent`, `placementIntent`, `constraints`, `semanticRole`, `evidenceType`, `selectionReason`, `visualValue`, `layer`, `persistence`, `templateQuery`, and `cadence`; assign semantic fallback zones only when missing. Drop only units explicitly marked not worth visualizing. Never call the provider a second time.

- [ ] **Step 5: Materialize progressive item cues**

In `applyResolvedPackagingToProject`, convert `content.items` using `cueOffsetsMs`, `cueTimesSec`, or `stepMs`:

```ts
{ text: itemText, cue: { startSec: overlay.startSec + offsetMs / 1000 } }
```

Ensure `evaluateSceneAtTime` filters future items and keeps previous items visible until the enclosing element’s `endSec`.

- [ ] **Step 6: Run focused tests and commit**

Run: `pnpm exec vitest run tests/packaging-ai/service.test.ts tests/packaging/resolve.test.ts tests/packaging/apply.test.ts`

Expected: all focused tests PASS, including no-second-call coverage.

```powershell
git add src/packaging-ir/schema.ts src/packaging-ai/prompt.ts src/packaging-ai/service.ts src/packaging/resolve.ts src/packaging/apply.ts src/packaging-timeline/compiler.ts tests/packaging-ai/service.test.ts tests/packaging/resolve.test.ts tests/packaging/apply.test.ts
git commit -m "feat: preserve semantic packaging structure and cadence"
```

## Task 3: Adaptive visual cards and unified render metadata

**Files:**
- Create: `src/render/textFit.ts`
- Modify: `src/render/scene.ts`, `src/render/canvasRenderer.ts`, `src/export/renderer.ts`, `src/editor/canvas/CanvasStage.tsx`, `src/app/layout.css`
- Test: `tests/render/textFit.test.ts`, `tests/render/renderer.test.ts`, `tests/render/scene.test.ts`

- [ ] **Step 1: Write failing text-fit tests**

```ts
it('wraps long Chinese copy and reduces font size before overflow', () => {
  const result = fitText({ text: '这是一段很长的包装文案', maxWidth: 180, maxHeight: 64, fontSize: 32, maxLines: 2 });
  expect(result.lines.length).toBeLessThanOrEqual(2);
  expect(result.fontSize).toBeLessThan(32);
  expect(result.overflow).toBe(false);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm exec vitest run tests/render/textFit.test.ts`

Expected: FAIL because no shared text-fit helper exists.

- [ ] **Step 3: Implement shared adaptive fitting**

Implement `fitText` with deterministic character-width estimation, newline wrapping, maximum lines, minimum readable font size, and an `overflow` flag. Use it in CanvasStage for CSS variables and in Canvas/export renderer for line-by-line drawing. For list cards, calculate height from visible item count and use `visualKind` to choose metric/chart/list/quote/highlight/badge layouts.

- [ ] **Step 4: Add DOM constraints and renderer parity**

Set card content to `min-width: 0`, `overflow: hidden`, `overflow-wrap: anywhere`, and use CSS variables for fitted font size/line height. Do not add a second rendering algorithm; both preview and export consume `SceneItem.visualKind` and the same fitted line data.

- [ ] **Step 5: Run focused render tests and commit**

Run: `pnpm exec vitest run tests/render/textFit.test.ts tests/render/renderer.test.ts tests/render/scene.test.ts`

Expected: PASS and no long-card overflow regression.

```powershell
git add src/render/textFit.ts src/render/scene.ts src/render/canvasRenderer.ts src/export/renderer.ts src/editor/canvas/CanvasStage.tsx src/app/layout.css tests/render/textFit.test.ts tests/render/renderer.test.ts tests/render/scene.test.ts
git commit -m "feat: fit packaging card content across preview and export"
```

## Task 4: Persistent subtitle visibility, editing, and styling

**Files:**
- Modify: `src/project/schema.ts`, `src/project/store.ts`, `src/editor/subtitles/SrtQuickPanel.tsx`, `src/editor/canvas/CanvasStage.tsx`, `src/export/renderer.ts`, `src/app/App.tsx`, `src/app/layout.css`
- Test: `tests/project/schema.test.ts`, `tests/editor/srt-quick-panel.test.tsx`, `tests/editor/canvas-video.test.tsx`, `tests/export/portable-export.test.ts`

- [ ] **Step 1: Add failing schema/store tests**

Assert the default is visible and that `setSubtitleSettings` creates an undoable Composition update:

```ts
expect(project.subtitleSettings).toMatchObject({ visible: true, fontSize: 42, lineHeight: 1.2, letterSpacing: 0 });
store.setSubtitleSettings({ visible: false });
expect(store.getSnapshot().subtitleSettings.visible).toBe(false);
expect(store.undoDepth()).toBe(1);
```

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm exec vitest run tests/project/schema.test.ts tests/editor/srt-quick-panel.test.tsx`

Expected: FAIL because `subtitleSettings` and its store method do not exist.

- [ ] **Step 3: Implement the persistent subtitle settings**

Add `subtitleSettings` with bounded `visible`, `fontSize`, `color`, `strokeColor`, `strokeWidth`, `lineHeight`, `letterSpacing`, and normalized `position`. Add `ProjectStore.setSubtitleSettings` and preserve defaults during migration.

- [ ] **Step 4: Build the subtitle controls**

Add a visible/hidden toggle in the SRT block header; add inputs for text, start/end times, font size, text color, outline color/width, line height, letter spacing, and position. Every change updates the store through validated setters. The existing SRT import/export and click-to-seek remain unchanged.

- [ ] **Step 5: Apply settings in preview and export**

`CanvasStage` renders subtitles only when `subtitleSettings.visible`; its style uses the settings. `src/export/renderer.ts` applies the same visibility and typography values so hidden subtitles are absent from exported frames.

- [ ] **Step 6: Run focused tests and commit**

Run: `pnpm exec vitest run tests/project/schema.test.ts tests/editor/srt-quick-panel.test.tsx tests/editor/canvas-video.test.tsx tests/export/portable-export.test.ts`

Expected: PASS, including persistence and preview/export visibility parity.

```powershell
git add src/project/schema.ts src/project/store.ts src/editor/subtitles/SrtQuickPanel.tsx src/editor/canvas/CanvasStage.tsx src/export/renderer.ts src/app/App.tsx src/app/layout.css tests/project/schema.test.ts tests/editor/srt-quick-panel.test.tsx tests/editor/canvas-video.test.tsx tests/export/portable-export.test.ts
git commit -m "feat: add editable subtitle visibility and styling"
```

## Task 5: Color-only timeline clips with semantic layers

**Files:**
- Modify: `src/editor/timeline/Timeline.tsx`, `src/editor/timeline/trackLayout.ts`, `src/app/layout.css`
- Test: `tests/editor/timeline.test.tsx`, `tests/editor/timeline-track-layout.test.ts`

- [ ] **Step 1: Write failing UI assertions**

Render effects and subtitles, then assert the clip has a semantic color class and no visible familyId/long text node:

```ts
expect(screen.getByLabel('packaging-1 effect clip')).toHaveClass('clip-packaging');
expect(screen.queryByText('pack-0-2-percentage 1')).not.toBeInTheDocument();
expect(screen.getByLabel('packaging-1 effect clip')).toHaveAttribute('title');
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `pnpm exec vitest run tests/editor/timeline.test.tsx tests/editor/timeline-track-layout.test.ts`

Expected: FAIL because clips currently render text labels.

- [ ] **Step 3: Implement color-only clip rendering**

Create a deterministic `clipKindForEffect` mapping from family/category/visualKind to CSS classes. Render empty color blocks with `title` and `aria-label`; keep duplicate/delete controls as icon-only buttons. Keep track labels `FX1`, `SUB`, and `VIDEO` because they identify rows, while removing text from clip bodies.

- [ ] **Step 4: Preserve overlap-based row assignment**

Use interval packing only for concurrent clips. Non-overlapping clips reuse the first compatible row. Add distinct `data-track-kind` values so browser tests can inspect effect/subtitle/audio rows without relying on visible text.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm exec vitest run tests/editor/timeline.test.tsx tests/editor/timeline-track-layout.test.ts`

Expected: PASS with color blocks, accessible labels, and correct overlap rows.

```powershell
git add src/editor/timeline/Timeline.tsx src/editor/timeline/trackLayout.ts src/app/layout.css tests/editor/timeline.test.tsx tests/editor/timeline-track-layout.test.ts
git commit -m "feat: render timeline as semantic color blocks"
```

## Task 6: AI learning to shared user preferences

**Files:**
- Create: `src/preferences/learning.ts`, `src/server/preferencesRoute.ts`, `tests/preferences/learning.test.ts`, `tests/server/preferencesRoute.test.ts`
- Modify: `src/preferences/engine.ts`, `src/preferences/profile.ts`, `src/preferences/diff.ts`, `src/server/productionHost.ts`, `src/server/packagingRoute.ts`, `src/app/App.tsx`, `src/app/layout.css`

- [ ] **Step 1: Write failing learning and persistence tests**

```ts
it('writes only confirmed composition changes to the shared preference file', async () => {
  const result = await learnFromCompositions({ projectId: 'p', before, after, root: tempRoot });
  expect(result.changes.map((change) => change.kind)).toContain('coordinate');
  expect(await readFile(join(tempRoot, '用户偏好.md'), 'utf8')).toContain('coordinate');
});
```

The route test must assert `POST /api/preferences/learn` accepts before/after JSON, writes under the configured user root, returns only counts and a summary, and never returns Composition contents or secrets.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm exec vitest run tests/preferences/learning.test.ts tests/server/preferencesRoute.test.ts`

Expected: FAIL because the learning route and Markdown writer do not exist.

- [ ] **Step 3: Implement deterministic diff-to-preference learning**

Use `diffCompositions` to classify variant, coordinate, motion, color, SFX, timing, delete, and add changes. Normalize repeated identical changes into one preference entry with `sampleCount`, `confidence`, `lastSeen`, and `sourceProjectIds`. Write atomically to `%APPDATA%\CueCut3\用户偏好.md`; write redacted before/after snapshots to `%APPDATA%\CueCut3\preference-history\` with generated IDs.

- [ ] **Step 4: Wire the AI 学习 button**

Capture the packaging baseline immediately after `applyResolvedPackagingToProject`; add the button to the right of the existing fourth header button. Disable it until a baseline and current Composition exist. On click, send the baseline/current Composition to the route, show learned count/status, and do not alter the current project.

- [ ] **Step 5: Load shared preferences for future packaging**

At packaging request construction, fetch/read the shared Markdown profile through the server boundary and include a bounded text/structured profile in `preferences`. Keep the existing local in-memory engine for session updates, but merge shared entries by key/context and do not overwrite user-locked values.

- [ ] **Step 6: Run focused tests and commit**

Run: `pnpm exec vitest run tests/preferences tests/server/preferencesRoute.test.ts tests/app/generation-flow.test.tsx`

Expected: PASS, including one click, atomic file write, no project mutation, and next-request preference propagation.

```powershell
git add src/preferences src/server/preferencesRoute.ts src/server/productionHost.ts src/server/packagingRoute.ts src/app/App.tsx src/app/layout.css tests/preferences tests/server/preferencesRoute.test.ts tests/app/generation-flow.test.tsx
git commit -m "feat: learn shared packaging preferences from user edits"
```

## Task 7: Integrated packaging acceptance and release verification

**Files:**
- Modify: `tests/e2e/vertical-slice.spec.ts`, `docs/single-pass-packaging/EXECUTION_LOG.md`
- Use: `F:\CCPJ\CueCut3\renders\jj-asr.srt` and the locally configured `jj.mp4`

- [ ] **Step 1: Run the complete automated suite**

Run: `pnpm test -- --run`

Expected: all test files pass with only the repository’s existing intentional skips.

- [ ] **Step 2: Build both client and server bundles**

Run: `pnpm build`

Expected: Vite client and SSR bundles complete successfully. Record existing extensionless-import warnings separately from failures.

- [ ] **Step 3: Restart and smoke-test the local Host**

Run: `pnpm start:host` in a persistent terminal, then verify `Invoke-WebRequest http://127.0.0.1:4173/` and `Invoke-WebRequest http://127.0.0.1:4173/api/settings` both return 200.

- [ ] **Step 4: Perform browser acceptance with the real SRT**

Import the video, load/confirm `jj-asr.srt`, generate packaging once, and verify:

```text
independent center hook card
independent refusal/contrast card
persistent four-step process card
short emphasis cards on additional tracks
non-identical semantic positions
no card text overflow
subtitle hide/edit/style controls
color-only timeline clips
```

Click a generated layer and confirm the canvas shows the fifth-frame preview immediately. Adjust one card position and subtitle style, click AI 学习, and confirm `%APPDATA%\CueCut3\用户偏好.md` is appended.

- [ ] **Step 5: Record evidence and final review**

Update `docs/single-pass-packaging/EXECUTION_LOG.md` with command results, real UI observations, known warnings, and any user-accepted deviation. Run `git diff --check` and inspect `git status --short`; do not reset, clean, push, or mark the ledger project complete on behalf of the user.
