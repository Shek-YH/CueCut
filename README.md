# CueCut

CueCut is a host-native React/TypeScript editor for the workflow:

~~~text
Import once → AI Director once → Human fine-tune → Export
~~~

The current product and UI baselines are documented in:

- CueCut_V2_0_Codex_PRD.md
- CueCut_Director_SKILL.md
- CueCut_UI_Prototype_V4_Director_EffectLab.html
- docs/governance/SOURCE_OF_TRUTH.md

## Status

The first local editor vertical slice is implemented: local video import/metadata, canonical project state, global Timeline, Canvas Card move/resize, SRT import/seek, the video → audio → Bailian `qwen-audio-3.0-asr-flash` → SRT → `CueCut_Director_SKILL.md` → Workspace generation flow, Effect Lab draft/apply/cancel, registry-backed SFX favorites/recent/replace, and Director local one-call contracts. Work Item status and real-test readiness are tracked under docs/.

## Local development

~~~powershell
corepack enable
pnpm install
pnpm dev
pnpm build
pnpm test --run
~~~

Host FFmpeg/ffprobe are used for later media integration. Docker is intentionally not required for the current local editor; see docs/governance/PROJECT_DISCOVERY.md.

After `pnpm dev`, import a video and click `开始生成动效`. The host-side local API keeps the Bailian key out of the browser bundle, extracts audio, produces SRT, performs one Director call, writes ignored artifacts under `renders/`, and imports the result into Workspace.

Do not put API keys, private media or generated exports into Git. Use a local .env.local or the existing secret mechanism; evidence records only configured/not configured.
