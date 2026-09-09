# CueCut Realtime Chroma Capture P0 Design

## Scope

Implement the PRD's P0 proof of concept without changing the existing Alpha MOV or Normal Export paths. The P0 path captures the same canonical CueCut composition rendered by the existing SceneFrame evaluator, on a dedicated green capture surface, at 1920×1080 and 30 FPS, using browser-standard `canvas.captureStream()` and `MediaRecorder` in the current web architecture.

The existing repository has no Electron main process or Electron dependency. Therefore the first backend is a browser Canvas Capture backend. The backend contract is deliberately host-neutral so an Electron BrowserWindow backend can be added later without changing the controller, clock, health, finalizer, or validator. This is a P0 architecture choice, not a claim that Electron Window Capture is already available.

## Architecture

```text
ProjectComposition snapshot
        │
        ▼
RealtimeCaptureController
  state machine + lifecycle
        │
        ├── CaptureClock → authoritative timeline time/drift
        ├── CaptureHealthMonitor → FPS/dropped-frame/drift
        ├── CaptureBackend → canvas.captureStream + MediaRecorder
        ├── CaptureSceneSurface → green background + SceneFrame only
        └── CaptureFinalizer/Validator → blob, metadata, atomic download
```

`CaptureSceneSurface` receives a frozen serializable project snapshot and never shares editor clock state or UI nodes. It renders the same `SceneFrame` content as the editor renderer, with the chroma background overridden to `#00FF00`. Fonts and image readiness are awaited when the browser exposes those APIs. Audio is disabled in P0.

The controller starts the recorder before the first timeline tick, explicitly renders frame zero, drives time from one monotonic capture clock, renders the final frame before stopping, waits for recorder data, validates duration/frame evidence, and cleans every owned resource on success, failure, or cancellation.

## Public contracts

- `CaptureState`: `IDLE`, `PREPARING`, `LOADING_ASSETS`, `WARMING_UP`, `RECORDER_ARMED`, `TIMELINE_ARMED`, `CAPTURING`, `PLAYING`, `END_PENDING`, `STOPPING`, `FINALIZING`, `VALIDATING`, `SUCCESS`, `FAILED`, `CANCELLED`.
- `CaptureBackend`: `prepare`, `start`, `getStats`, `stop`, `cancel`, `dispose`.
- `RealtimeCaptureJob`: job id, project snapshot, output name, dimensions, FPS, duration, chroma color, state, timestamps, and error.
- `CaptureResult`: Blob/file metadata, expected and observed frames, dropped-frame estimate, drift statistics, wall-clock time, warnings, and validation status.

The browser backend chooses the first supported MIME type from MP4/H.264 and WebM/H.264/VP9/VP8 candidates. It never assumes MP4 support and reports WebM as a valid P0 fallback. The feature flag is `realtimeChromaCapture`; it is off by default outside explicit development/test opt-in.

## Failure and cleanup

Unsupported capture APIs, unsupported MIME types, recorder errors, asset readiness timeout, duration mismatch beyond one frame, or excessive drift fail validation and never produce a successful result. Cancellation stops the timeline, stops the recorder, disposes tracks and RAF/timers, revokes object URLs, removes the capture canvas, and deletes an incomplete downloaded artifact where possible.

## Verification

Unit tests cover state transitions, clock frame boundaries, drift, health statistics, MIME selection, output naming/validation, cancellation, and feature-flag behavior. Browser E2E tests exercise a real Chromium `MediaRecorder` over 10 seconds and a shorter deterministic 60-second timeline mode, save the resulting WebM artifacts, probe them with FFprobe when available, and record actual wall-clock/FPS/drift metrics. Existing Alpha/Normal export tests, full unit tests, build, and Playwright regression remain required.

Known external acceptance limits are recorded rather than hidden: this repository currently cannot perform the PRD's manual CapCut/Jianying chroma-key inspection or prove an Electron hidden-window backend without a user-provided desktop runtime. The P0 report will therefore distinguish technical capture PASS from downstream/manual acceptance.
