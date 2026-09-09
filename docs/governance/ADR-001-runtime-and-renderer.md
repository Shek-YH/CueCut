# ADR-001: Host-Native Web Editor and Renderer Boundary

**Status:** ACCEPTED FOR INITIAL SLICE  
**Date:** 2026-09-08

## Context

CueCut needs real local video files, browser playback, WebCodecs/GPU behavior, host FFmpeg and eventual Alpha MOV export. The repository currently contains no native shell or service. The supplied prototype is a visual and interaction baseline, not production architecture.

## Decision

Start with a React + TypeScript + Vite host-native web editor. Use a canonical project store as the only mutable project state. Define `Renderer.evaluate(time)` and `Renderer.renderFrame(time, target)` interfaces before choosing the final Canvas 2D/WebGL/WebGPU implementation. Use browser DOM/Canvas preview only behind that boundary; export must not be implemented as React screenshots or an implicit PNG sequence.

Defer Electron/Tauri until local file and media contracts are stable. Set Docker mode to `none` for now because no backend/service exists and containerization cannot certify the host behavior that matters for this product.

## Consequences

- Fast local setup and real browser testing are available immediately.
- Native file selection is represented by browser file input first; a desktop adapter can be added later without changing the project model.
- Render technology remains replaceable, so benchmarks must be collected before freezing the production path.
- Full video and Alpha MOV remain later Work Items and cannot be claimed from the first slice.

## Alternatives rejected

- **Full Electron first:** invents a container before requirements and adds packaging/GPU complexity.
- **Full Docker development:** cannot reproduce Windows file pickers, GPU, WebCodecs or CapCut compatibility.
- **React screenshot export:** violates the PRD's unified render-runtime requirement.

