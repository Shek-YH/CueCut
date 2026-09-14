# Preflight + External Bundle WI-09 Evidence

**Status:** WAITING_USER  
**Verification label:** REAL_MEDIA_PARTIAL

## Real test

Fixture: `F:\CCPJ\CueCut3\测试素材与api\jj.mp4`

- FFprobe: exit 0; H.264, 1920×1080, 30fps, 222.1s, audio present.
- `GET /api/runtime-capabilities`: HTTP 200; Director configured; model `qwen3.8-flash`; `verified=false`; visual assets disabled.
- `GET /api/settings`: HTTP 200; public response contained configured booleans and non-secret settings only.
- `POST /api/probe-video`: HTTP 200; returned real media metadata.
- `POST /api/transcribe-video`: HTTP 200; returned 66 timestamped SRT segments; response had no API Key field.
- Browser-visible flow: imported `jj.mp4`, passed client preflight, completed ASR with 66 segments, completed one streamed Director call, resolved 8 timeline items, compiled 8 Runtime items, and loaded the current Workspace successfully.
- Development observability: the browser keeps a visible eleven-stage workflow panel (`配置检查`, `视频读取`, `视频 → 音频`, `音频 → SRT`, `SRT → Director`, `视觉资产规划`, `视觉资产生成`, `本地 Resolve / Layout`, `Runtime 编译`, `载入 Workspace`); each stage retains success/failure and detail text while the flow runs.
- Control experiment: same `qwen3.8-flash` endpoint with empty transcript returned HTTP 200 and `aiCallCount=1`; the remaining issue is long real-context latency, not missing Key/endpoint routing.
- Streaming regression: the same full-context Director call returned HTTP 200 in approximately 59–85 seconds during real smoke runs instead of the previous 120-second non-streaming timeout.

## Implemented coverage

- `GET /api/runtime-capabilities` with secret-free configured/verified distinction.
- Client Preflight blocks before ASR/Director when the Director is not configured.
- Server Preflight blocks before FFmpeg/ASR when the Director is not configured.
- Director requests use Qwen non-thinking mode, streamed output, `max_completion_tokens`, and an explicit 30-second default timeout with bounded 1–300 second override; the real smoke used 180 seconds only to accommodate the external provider.
- Director output is locally normalized for unsupported asset kinds and renderer-incompatible content slots before asset planning and Resolver selection.
- The Packaging mainline now executes the visual asset planning/generation stage. With no raster candidate, it reports `无 raster asset，已跳过`; with an unconfigured visual provider, it falls back to native packaging and keeps the failure visible.
- Shared `cuecut.packaging-bundle` schema and local plan/project import path are covered by tests; import performs no AI requests.
- Required external asset absence is surfaced as `partial` and disables export.

## Remaining boundary

- The observed `jj.mp4` long-context Director timeout is resolved in the current streamed implementation; external provider latency can still vary, so the workflow keeps a bounded timeout and visible failure state.
- Visual Asset Provider remains disabled until an approved third-party image endpoint/model is configured; no private media was uploaded to it.
- P1 `.cuecut-bundle` archive, hash computation in browser binding, and full required-asset visual E2E remain outstanding.
