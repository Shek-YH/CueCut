# Realtime Chroma Capture P0 Architecture Notes

Date: 2026-09-09
Project root: `F:\\CCPJ\\CueCut3`

## Audit result

- Runtime: React 19 + TypeScript + Vite; browser renderer with a Node production host.
- Canonical state: `src/project/schema.ts`, `src/project/store.ts`, and `src/project/fixtures.ts`.
- Timeline/playback: `src/playback/clock.ts` and `src/editor/timeline/Timeline.tsx`.
- Scene evaluation: `src/render/scene.ts` (`evaluateSceneAtTime`).
- Preview renderer: `src/render/canvasRenderer.ts` (`createCanvasRenderer`).
- Existing export: `src/export/controller.ts`, `src/export/renderer.ts`, `src/export/ffmpeg.ts`, and `/api/export` in `src/server/exportRoute.ts`.
- Asset readiness: video metadata/decode is handled by the existing editor/media layer; the new controller will add browser font readiness and capture-surface readiness checks.
- Electron: no Electron package, main process, preload bridge, or `BrowserWindow` exists in this repository. Adding Electron for P0 would be a new desktop stack and conflict with the PRD's no-large-refactor constraint.

## Reuse decisions

1. Reuse the existing validated `ProjectComposition` as the capture snapshot; do not create a second project store.
2. Reuse `evaluateSceneAtTime` for capture content; do not duplicate motion/timeline evaluation.
3. Add an explicit background override to the canvas renderer so the editor keeps its palette while capture uses `#00FF00`.
4. Keep the new controller under `src/export/realtime/`; it must not modify Alpha MOV or Normal Export behavior.
5. Implement the P0 backend with a dedicated browser canvas and `canvas.captureStream(30)` + feature-detected `MediaRecorder`. Keep `CaptureBackend` host-neutral for a future Electron Window implementation.
6. Keep generated media under ignored `renders/realtime-capture/`; only metadata/report fixtures are committed.

## Capture data flow

```text
ProjectStore snapshot
  → RealtimeCaptureController
  → CaptureSceneSurface (dedicated canvas, green background, no editor UI)
  → CanvasCaptureBackend (captureStream + MediaRecorder, audio disabled)
  → Blob finalizer/validator
  → browser download / benchmark artifact
```

## P0 risks and boundaries

- The browser Canvas backend is real Chromium capture, but it is not proof of an Electron hidden/off-screen `BrowserWindow`; the report must keep this distinction explicit.
- MediaRecorder MIME support is runtime-dependent. MP4 is preferred only when `MediaRecorder.isTypeSupported` says so; WebM is an allowed P0 result.
- CapCut/Jianying manual keying cannot be automated in this repository. It remains a manual acceptance item and cannot be marked PASS without actual downstream evidence.
- The fixture project is a real canonical CueCut composition, but it is not a user-supplied complex video project. The report must distinguish fixture evidence from real customer-project evidence.

## Non-regression boundary

The new code may import existing project/render types and add a renderer background option, but it must not change:

- `src/export/controller.ts` Alpha MOV/Normal export state or FFmpeg commands;
- `src/render/scene.ts` timeline semantics;
- existing editor clock mutation behavior;
- existing `/api/export` request/response contract.
