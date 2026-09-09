# CueCut Realtime Chroma Capture P0 Report

Date: 2026-09-09  
Project: CueCut3  
Recommendation: **NO-GO**

## Environment

- OS: Windows (workspace host)
- Browser runtime: Google Chrome, Chromium MediaRecorder
- App runtime: React 19 + TypeScript + Vite
- Capture resolution: 1920×1080
- Capture target: 30 FPS
- Audio: OFF
- Chroma background: `#00FF00`
- Host FFmpeg/FFprobe: FFprobe available and used for output evidence

## Capture Backend

The P0 backend is a dedicated off-editor canvas using `canvas.captureStream(0)` plus `CanvasCaptureMediaStreamTrack.requestFrame()` when available. It falls back to `canvas.captureStream(30)` when manual frame submission is unavailable. MIME selection is capability-detected; this Chrome session selected `video/webm;codecs=vp9`. No Electron dependency or Windows Native Capture was introduced because the existing repository is a browser/Vite app with no Electron main process.

## Real Test Results

Command:

```powershell
$env:VITE_REALTIME_CHROMA_CAPTURE='true'
pnpm exec playwright test tests/e2e/realtime-capture.spec.ts
```

Result: **NO-GO** for the strict P0 timing gate. The real Chromium MediaRecorder path produced playable media, but after actual Blob metadata validation the 10s capture was rejected because its encoded duration exceeded the one-frame P0 boundary. The earlier fixture-only run that reported success did not decode the output Blob and is not accepted as final evidence.

| Timeline | Output | FFprobe duration | Frames | Size | Wall clock | App FPS | Dropped | Max drift |
|---:|---|---:|---:|---:|---:|---:|---:|---:|
| 10s | `renders/realtime-capture/fixture-10s.webm` | 10.620s | 301 | 110,867 B | 10.66s | 30.0 | 0 | 0.0ms |
| 60s | `renders/realtime-capture/fixture-60s.webm` | 60.161s | 1,801 | 351,521 B | 60.21s | 30.0 | 0 | 0.0ms |

FFprobe confirms both files are `matroska,webm`, VP9, 1920×1080. The 10s stream reports `30000/1001`; the 60s stream reports `30/1`. No audio stream is present, as required by P0.

## P0 Checks

- [x] Feature flag `realtimeChromaCapture` / `VITE_REALTIME_CHROMA_CAPTURE`
- [x] Dedicated clean capture surface with no editor UI
- [x] Shared canonical CueCut composition and SceneFrame evaluator
- [x] Fixed 1920×1080 / 30 FPS / green background / audio off
- [x] Recorder starts before Timeline frame zero
- [x] Explicit `VALIDATING` state and final-frame submission before stop
- [x] FPS, dropped-frame estimate, drift, duration, wall-clock and file size metrics
- [x] Cancel/failure cleanup paths and invalid-output rejection
- [x] Host temp-store persistence through `/api/realtime-capture` with temporary write and atomic promote
- [x] Real 10s and 60s Chromium media artifacts
- [x] FFprobe output validation and actual frame-count hard check (the 10s strict timing gate currently fails)
- [x] Existing Alpha/Normal export paths unchanged by the realtime module
- [ ] Electron BrowserWindow capture: not applicable to current Web/Vite runtime; future adapter seam retained
- [ ] Manual CapCut/Jianying chroma-key inspection: not run in this environment

## Chroma Test

Downstream manual inspection remains **NOT RUN**, not PASS. The following must be checked in CapCut or Jianying with the two captured files:

- white/small text edge
- sharp SVG edge
- rounded card
- arrow/icon
- shadow
- blur
- glow
- opacity

## Alpha/Normal Regression

The realtime path only imports existing project/render contracts and the optional canvas background override. It does not change `src/export/controller.ts`, `src/export/ffmpeg.ts`, `/api/export`, or the existing Timeline clock semantics. Full regression command/results are recorded below after the final suite run.

- Vitest: **201 passed, 4 skipped** (`pnpm test --run`)
- TypeScript: **PASS** (`pnpm lint`)
- Production client + SSR host build: **PASS** (`pnpm build`)
- Playwright default-flag regression: **9 passed, 4 skipped** (`pnpm test:e2e`)
- Temp persistence tests: **3 passed** (`tests/server/realtimeCaptureStore.test.ts`, `tests/server/realtimeCaptureRoute.test.ts`)

## Known Issues and Conditions

1. This P0 proof is a real browser Canvas Capture backend, not proof of hidden/off-screen Electron `BrowserWindow` capture. An Electron host adapter is the next platform integration step.
2. MediaRecorder container/codec remains runtime-dependent. This environment reliably produced VP9 WebM; MP4 is not forced.
3. Manual CapCut/Jianying edge-quality acceptance requires a user-owned downstream application and cannot be truthfully completed by local unit/E2E tests.
4. The benchmark uses CueCut's canonical fixture composition with real registered motion evaluation; it is not a user-supplied complex project containing video/image/SVG/Glow/Blur assets.
5. Dynamic browser timing isolated the duration overrun to the MediaRecorder start window: `start()` to `onstart` measured roughly 560–730ms while CueCut capture-surface frame rendering measured roughly 0–0.2ms. The current `requestFrame()` path avoids pre-start frame submission, but the browser container still reflects the recorder startup window.
6. A disposable 1080p recorder prime with a real submitted frame reduced one observed formal start delay to roughly 160ms, but the actual-media duration gate still failed; the prime experiment was removed because it did not prove a reliable fix.
7. The strict actual-media duration gate remains NO-GO: the current 10s run is about 10.620s despite complete frame count, so a timestamp-alignment strategy (likely a different encoder/muxer or host backend) is required before P1.

## Recommendation

**NO-GO** for formal P0 acceptance. The capture files are real and frame-complete, but the 10s run is rejected by actual media duration validation (>1 frame), and downstream CapCut/Jianying inspection plus Electron Window capture remain unverified. Optimize/measure the capture path before entering P1.
