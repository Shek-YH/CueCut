# Realtime Chroma Capture Real-Test Requirements

## Already available

- Real 16:9 generated project: `renders/jj-cuecut-composition.json`
  - 1920×1080, 30 FPS, 222.1 seconds, 3 registered effect families
- Matching real source video: `测试素材与api/jj.mp4`
- Real 9:16 generated project: `renders/ComfyUI_00001_qguot_1787042165-cuecut-composition.json`
  - 1080×1920, 30 FPS, 62.648 seconds, 6 effects, 18 subtitles

## Still required for final P0 acceptance

1. Run the current capture path against the real 16:9 project at 10s and 60s after timing repair; retain FFprobe output and media files.
2. If portrait support is in scope, run the real 9:16 project separately and record the fixed 1920×1080 P0 profile limitation.
3. Import the captured file into CapCut or Jianying and manually inspect text, small text, SVG, card, arrow/icon, shadow, blur, glow, and opacity edges.
4. If distribution must be Electron-native, provide or enable an Electron runtime and validate hidden/off-screen BrowserWindow capture; the current repository is Web/Vite-only.
5. Run the independent verifier with a distinct execution reference over the PRD, requirements, Core Freeze, source, tests, artifacts, runtime, and Git diff.

No credential or private media value belongs in this document or `.ai-ledger`.
