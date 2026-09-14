# WI-01 Evidence

**Status:** COMPLETED  
**Verification label:** SELF_VERIFIED

- Goal: separate FFprobe metadata readiness from browser playback readiness and make new imports start at 0s.
- Changed files: `src/media/videoPlayback.ts`, `src/app/App.tsx`, `src/editor/canvas/CanvasStage.tsx`, `tests/media/videoPlayback.test.ts`, `tests/app/video-preview-reliability.test.tsx`, `tests/editor/canvas-video.test.tsx`.
- Tests added: reducer transition coverage; App zero-second initial preview; Canvas event forwarding for `loadedmetadata`, `loadeddata`, `canplay`, `waiting`, `stalled`, and `error`.
- Commands: focused WI-01 tests 3 files/22 tests passed; controlled regression `tests/app` + `tests/editor/canvas-video.test.tsx` + `tests/media` + `tests/playback` = 16 passed, 1 skipped, 60 passed, 1 skipped; `pnpm lint` exit 0; `git diff --check` exit 0.
- Acceptance: initial and imported playback clock reset to 0 and pause; metadata alone reports `metadata-ready`; only `canplay` reports `can-play`; browser decode failure surfaces `浏览器无法解码该视频编码` without exposing provider data.
- Known limitation: real Chromium 5s/30s first-frame evidence is deferred to WI-18 Golden E2E; existing full Vitest invocation still has an unrelated jsdom navigation hang.
- Regression risk: optional Canvas callbacks preserve existing call sites; native seek/paused stale-event protection remains covered by the existing Canvas suite.
- Rollback: revert the six WI-01 source/test files and WI-01 evidence/ledger entries only.

