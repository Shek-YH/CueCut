# CueCut Director Phase 1 — Current Call Graph

审计日期：2026-09-09。本文只记录当前仓库可由源码和测试证明的路径；没有把 PRD 目标架构当成现状。

## 1. 真实生产入口

```text
HTTP POST /api/generate-effects
  → src/server/productionHost.ts:40-42
  → createGenerationRoute(...):45-67
  → createHostGenerationRunner(...):70-187
  → write video stream to temp file:84-90
  → ffprobe metadata:90
  → ffmpeg audio extraction:91-98
  → Bailian ASR:127-131, workflow.ts:37-42
  → buildDirectorInput: contextBuilder.ts:24-52
  → candidateIndexes derived from bounded candidates: workflow.ts:48-55
  → buildDirectorMessages: generationRoute.ts:153-156 / prompt.ts:6-41
  → one Bailian Director provider call: service.ts:17-27
  → JSON parse + projectCompositionSchema: service.ts:29-40
  → candidate ID validation/sanitization: service.ts:42-50
  → merge detected project metadata: generationRoute.ts:159-166
  → write SRT and Composition to renders/:167-173
  → return transcript/composition/warnings/usedFallback: generationRoute.ts:175-183
```

## 2. Stage-by-stage contract audit

| Stage | Input | Output | Data lost | Validation / fallback | Existing evidence |
|---|---|---|---|---|---|
| Video import / route | HTTP stream, filename, encoded preference header | `GenerationRouteRequest` | Request contains no explicit visual analysis result | POST-only and filename sanitization; route returns 500 on runner error | `productionHost.ts:40-42`, `generationRoute.test.ts:17-54` |
| Video probe | Temp video file | duration, fps, width, height | No subject/face detection result | `probeVideoFile`; ffprobe/process errors reject generation | `generationRoute.ts:84-111`, `videoProbe.ts` |
| Audio extract | Video path | 16 kHz mono MP3 as data URI | No audio provenance beyond request ID in final response | 10 MB Base64 limit; process failure rejects | `generationRoute.ts:91-98,142-152` |
| ASR / transcript | Audio data URI | timestamped `BailianAsrResult.segments` | No semantic structure beyond segment text/times | Bailian response parsing; no semantic planner | `generationRoute.ts:147-152`, `workflow.ts:39-42` |
| Context builder | full transcript, visual context, candidate arrays, preferences | `DirectorInput` | Transcript is preserved as an array, but semantic model is only global tags; candidate capabilities are already reduced at caller | global regex tags and bounded Top-N; no per-unit model | `contextBuilder.ts:14-52` |
| Effect registry | full `EffectDefinition` objects | caller maps to `{id,tags}` | display name, slots, duration, aspect ratio, use/avoid, timing/layout, provenance, data contract | registry lookup exists later for rendering, not retrieval | `effects/registry.ts:4-31,69-107`; `generationRoute.ts:121` and `236-238` |
| Motion registry | `MotionDefinition` objects | `{id,tags}` | duration/capabilities, role, compatible families, style, provenance | motion IDs checked later | `generationRoute.ts:122`; `motions/registry.ts:23-49` |
| SFX registry | SFX definitions | `{id,tags,isFavorite,usageScore}` | Other registry metadata, if any | local ranking by global tags | `generationRoute.ts:123`; `contextBuilder.ts:34-42` |
| Retriever | candidate `{id,tags}`, global requested tags, limit | one global list | capability semantics and unit scope | tag overlap count only | `retriever.ts:1-13` |
| DirectorInput | project, transcript, empty/real visual context, bounded candidates, preferences | prompt payload | no `VisualUnit`, no candidate capability, no candidate bundle scope, no trace | TypeScript interface accepts only thin candidates | `director/types.ts:16-33` |
| Prompt builder | skill, DirectorInput, candidate indexes | system + user messages | prompt asks for fields but cannot restore omitted capability | one output object instruction; no hard semantic validation | `prompt.ts:25-38` |
| Provider | messages, model, API key | assistant content string | Provider response is not trace-bound to candidate bundles | one-call guard; provider failure uses local fallback | `bailianProvider.ts:18-57`, `service.ts:17-27` |
| Response parser | string/object | parsed unknown | JSON extraction accepts a broad object before schema | code-fence/substring parse; fallback on schema failure | `service.ts:29-37,62-77` |
| Candidate validator | Composition, candidate indexes | pass or sanitized Composition | only IDs are checked; semantic content survives invalid | invalid IDs are replaced and result is marked fallback | `validator.ts:14-91`, `service.ts:42-50` |
| Composition schema | composition object | typed Zod object | `content` is `Record<string, unknown>`; no effect data contract or segment/effect linkage semantics | project range and motion registry checks only | `project/schema.ts:47-76,128-156` |
| Layout solver | preferred rect, safe margin, blocked rects, flags | normalized rect | no subject/face/reserved-zone integration in generation path | clamps and avoids supplied blocked rects; not called from generation route | `layout/solver.ts:29-61`, tests only |
| Workspace | returned composition | current app ProjectStore / editor state | generation response writes files but no observed handoff to `ProjectStore`; UI initializes fixture project | local store validates composition on edits | `project/store.ts:15-17,205-210`; `App.tsx:374-380` |
| Export | ProjectComposition + local video | MP4 / MOV | export is a separate route and does not prove Director acceptance | ffmpeg/ffprobe validation | `productionHost.ts:32-34`, `export/controller.ts` |

## 3. Important separation

The source has a working one-call Director server route and separate browser editing/export paths. Existing tests prove the route, workflow, schema, renderer, and export independently; they do not prove that the Director result is loaded into the browser Workspace or that the candidate payload is capability-aware.

## 4. Test coverage boundary

- Covered: audio → ASR → one Director dependency order (`tests/generation/workflow.test.ts:5-41`).
- Covered: global candidate length and global tag ranking (`tests/director/contextBuilder.test.ts:5-20`, `retriever.test.ts:4-21`).
- Covered: ID validation and local ID sanitization (`tests/director/validator.test.ts:5-53`).
- Covered: JSON/schema fallback, one-call guard, project-range clamping (`tests/director/service.test.ts:6-127`).
- Not covered: VisualUnit creation, per-unit candidate bundles, data contracts, duration capability, item cues, selection trace, visual-event density, real subject/face context, and a Director result reaching `ProjectStore`.
