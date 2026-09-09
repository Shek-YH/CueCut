# CueCut Development Guide

## Source of truth

Read docs/governance/SOURCE_OF_TRUTH.md before changing UI or product behavior. The V4 prototype is the UI baseline and must not be redesigned without a UI_CHANGE_PROPOSAL and Product Owner approval.

## Workflow

1. Select a Work Item and read its scope, dependencies, readiness and Prototype Mapping.
2. For code, write a failing test first and run it to confirm the expected failure.
3. Implement the smallest behavior that makes the focused test pass.
4. Run the focused suite, full suite and build.
5. Save Evidence with commands, exit codes, synthetic vs real status, dependencies, licenses and data-egress notes.
6. A separate verifier reviews UI fidelity and Work Item evidence. Codex must not mark Product Owner acceptance.

## Commands

~~~powershell
pnpm dev
pnpm build
pnpm test --run
pnpm test:e2e
~~~

## Media and secrets

Use host-native ffmpeg/ffprobe. Do not commit the supplied 55.8 MB MP4, generated exports, model files, or .env values. Do not upload user media or call paid providers without an approved readiness entry.

