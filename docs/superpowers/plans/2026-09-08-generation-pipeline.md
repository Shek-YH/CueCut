# CueCut Generation Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect video import and the `开始生成动效` action into one local workflow that extracts audio, calls Alibaba Bailian ASR, treats the resulting SRT and local Preference Profile as the Director context, calls the CueCut Director Skill exactly once, and imports the validated composition plus SRT into Workspace.

**Architecture:** The browser keeps the selected `File` for preview and sends it only to a same-origin local Vite endpoint. The endpoint streams the video to a temporary host file, runs FFmpeg audio extraction, reads the Bailian key only on the host, invokes ASR, builds bounded Director context from the returned SRT and local Preference Profile, loads `CueCut_Director_SKILL.md` as the Director behavior specification, invokes the existing one-call Director service once, and returns redacted-safe JSON containing the transcript and composition. The browser replaces the canonical ProjectStore snapshot only after the complete response is validated.

**Tech Stack:** React 19, TypeScript, Vite middleware, Node host APIs, FFmpeg, Vitest, Playwright, Zod.

---

### Task 1: Define and test the sequential generation workflow

**Files:**
- Create: `src/generation/workflow.ts`
- Test: `tests/generation/workflow.test.ts`

- [x] **Step 1: Write the failing test**

Test the exact dependency order and one Director invocation:

```ts
it('runs video audio extraction, ASR, and one Director generation in order', async () => {
  const calls: string[] = [];
  const workflow = createGenerationWorkflow({
    extractAudio: async () => { calls.push('audio'); return { audioDataUri: 'data:audio/mpeg;base64,AA==', format: 'mp3' as const }; },
    transcribe: async () => { calls.push('asr'); return { requestId: 'asr-1', processedDurationSec: 12, segments: [{ id: 's-1', startSec: 0, endSec: 2, text: '一个数字比例' }] }; },
    generateDirector: async (input) => { calls.push('director'); expect(input.transcript[0]?.text).toBe('一个数字比例'); return { composition: createFixtureProject(), usedFallback: false, warnings: [] }; },
  });

  const result = await workflow.generate({
    project: { projectId: 'real-video', durationSec: 12, fps: 30, canvasWidth: 1080, canvasHeight: 1920, aspectRatio: '9:16' },
    visualContext: { subjectZones: [], faceZones: [], subtitleReservedZone: null, safeMargins: 0.05 },
    effects: [{ id: 'numeric:ring-a', tags: ['number'] }],
    motions: [{ id: 'spring-in', tags: ['spring'] }],
    sfx: [],
    preferences: {},
  });

  expect(calls).toEqual(['audio', 'asr', 'director']);
  expect(result.transcript).toHaveLength(1);
  expect(result.director.composition.schema).toBe('cuecut.composition/1');
});
```

- [x] **Step 2: Run test to verify it fails**

Run `pnpm test --run tests/generation/workflow.test.ts`.

Expected: FAIL because `src/generation/workflow.ts` does not exist.

- [x] **Step 3: Implement the minimal workflow**

Define `createGenerationWorkflow(deps)` with `generate(input)` that calls `deps.extractAudio(input)`, passes the returned audio to `deps.transcribe`, builds bounded Director input using `buildDirectorInput`, adds `candidateIndexes`, then calls `deps.generateDirector` exactly once. Return `{ transcript, asr, director }` without invoking any second provider.

- [x] **Step 4: Run focused tests**

Run `pnpm test --run tests/generation/workflow.test.ts tests/media/bailian-asr.test.ts tests/director/service.test.ts`.

Expected: all tests pass.

### Task 2: Add the host-only generation endpoint

**Files:**
- Create: `src/server/generationRoute.ts`
- Modify: `vite.config.ts`
- Test: `tests/server/generationRoute.test.ts`

- [x] **Step 1: Write the failing route contract test**

Assert that a `POST /api/generate-effects` host handler passes the raw video stream to the injected pipeline, rejects other methods with 405, and never returns an API key field.

- [x] **Step 2: Run the test to verify it fails**

Run `pnpm test --run tests/server/generationRoute.test.ts`.

Expected: FAIL because the route module does not exist.

- [x] **Step 3: Implement the host route**

Add a Vite `configureServer` middleware for `POST /api/generate-effects`. Stream the request body to a unique temporary MP4, extract mono 16 kHz MP3 with FFmpeg, convert that audio to a Data URI, read `F:\CCPJ\CueCut3\测试素材与api\.env` on the host, create `createBailianAsrClient` with model `qwen-audio-3.0-asr-flash`, and pass its ordered timestamped SRT segments into `buildDirectorInput`. Load `F:\CCPJ\CueCut3\CueCut_Director_SKILL.md` as the system behavior specification, include the local Preference Profile and bounded candidate indexes in the user message, create `createBailianProvider` and `createDirectorService`, and invoke that service exactly once. Delete only the route’s own temporary files in `finally`; never delete user source media. Return `{ transcript, composition, warnings, asrRequestId, asrDurationSec, usedFallback }` and no secret.

- [x] **Step 4: Run focused route and type checks**

Run `pnpm test --run tests/server/generationRoute.test.ts tests/generation/workflow.test.ts` and `pnpm lint`.

Expected: all focused tests pass and lint exits 0.

### Task 3: Add the user-facing generate action and Workspace import

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/editor/subtitles/SrtQuickPanel.tsx`
- Modify: `src/project/store.ts`
- Test: `tests/app/generation-flow.test.tsx`

- [x] **Step 1: Write the failing UI test**

Mock `fetch('/api/generate-effects')`, select a local video File, click `开始生成动效`, assert the button says `生成中…`, then resolve a valid response and assert the returned SRT text, real duration, source filename, and generated effect are visible in Edit Workspace. Assert the endpoint is called once with the selected File as the request body.

- [x] **Step 2: Run the test to verify it fails**

Run `pnpm test --run tests/app/generation-flow.test.tsx`.

Expected: FAIL because the button, generation state, controlled SRT data, and composition import do not exist.

- [x] **Step 3: Implement the minimal UI flow**

Store `sourceVideoFile`, `transcriptItems`, and `generationState` in `App`. Enable `开始生成动效` only after import. On click, POST the selected File to `/api/generate-effects` with `Content-Type: video/mp4` and `X-CueCut-Filename`; on success call a new `store.replaceComposition(composition)`, set transcript items, reset clock duration, select the first generated effect, return to Edit, and show the generated Workspace. Pass controlled `items` and `onItemsChange` into `SrtQuickPanel`. On failure, keep the imported video and existing project state while showing a local error.

- [x] **Step 4: Run focused UI tests**

Run `pnpm test --run tests/app/generation-flow.test.tsx tests/editor/srt-quick-panel.test.tsx tests/project/store.test.ts`.

Expected: all tests pass.

### Task 4: Verify the complete local path and update governance

**Files:**
- Modify: `tests/e2e/vertical-slice.spec.ts`
- Modify: `docs/work-items/WI-008-srt-asr.md`
- Modify: `docs/evidence/WI-008.md`
- Modify: `docs/evidence/WI-013.md`
- Modify: `docs/governance/REAL_TEST_READINESS.md`
- Modify: `README.md`

- [x] **Step 1: Add a browser flow test with a controlled local endpoint**

Route `/api/generate-effects` to a deterministic valid composition response, import the supplied local video fixture, click `开始生成动效`, and assert that the generated SRT and composition appear in Workspace without a second browser request.

- [x] **Step 2: Run full verification**

Run `pnpm test --run`, `pnpm build`, `pnpm lint`, and `pnpm test:e2e`.

Expected: all unit/component tests pass, build/lint exit 0, and all Playwright tests pass.

- [x] **Step 3: Record real versus synthetic evidence**

Keep the previously completed one-real-ASR evidence separate from the deterministic UI flow. The user-authorized real full-flow run is recorded separately, including one ASR call, one Director call, the local timing repair, data egress, and the secret-safe host boundary.

- [x] **Step 4: Reopen the local page**

Keep `http://127.0.0.1:5174/` open and verify the visible `导入视频` and `开始生成动效` controls.
