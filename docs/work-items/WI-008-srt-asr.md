# WI-008 SRT / ASR

~~~yaml
id: WI-008
title: SRT / ASR
owner: R03/R04
verifier: R07
orchestrator: R00
productOwner: User
status: READY_FOR_REVIEW
priority: P0
dependencies: [WI-002, WI-003]
rolePlan: docs/governance/ROLE_PLAN.md
scope:
  in: [transcript-segments, inline-edit, click-seek, current-segment, srt-import-export, asr-adapter]
  out: [unapproved-provider, transcript-upload]
realTestRequirements: RT-03
readinessStatus: READY for real ASR; verifier review pending
review: R07 verifies timestamp parsing and provider boundary
decision: SRT is a local editable artifact; ASR is an adapter, not Director logic
artifacts: src/subtitles, src/media/asr, src/media/bailianAsr.ts, src/generation/workflow.ts, tests/subtitles, tests/media, docs/evidence/WI-008.md
next: WI-014 consumes the returned SRT and imports the generated composition into Workspace
lastUpdated: 2026-09-08
~~~
