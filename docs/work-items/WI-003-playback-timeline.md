# WI-003 PlaybackClock + Video + Timeline Core

~~~yaml
id: WI-003
title: PlaybackClock + Video + Timeline Core
owner: R02/R04
verifier: R07
orchestrator: R00
productOwner: User
status: READY_FOR_REVIEW
priority: P0
dependencies: [WI-002]
rolePlan: docs/governance/ROLE_PLAN.md
scope:
  in: [video-import, playback-clock, play-pause, space, seek, scrub, zoom, pan, tracks, independent-playhead, clip-drag, trim, frame-time]
  out: [full-video-export, alpha-mov, real-asr]
realTestRequirements: RT-01, RT-02, RT-07
readinessStatus: RT-01 READY; RT-02 WAITING_FOR_READINESS; RT-07 READY
review: R07 must perform pointer E2E and confirm effect drag does not move playhead
decision: PlaybackClock is separate store state; clip mutations are project transactions
artifacts: src/playback, src/media, src/editor/timeline, tests/playback, tests/visual
next: implement vertical slice after WI-002 contracts
lastUpdated: 2026-09-08
~~~

## Prototype Mapping

Prototype Source: CueCut_UI_Prototype_V4_Director_EffectLab.html

Prototype Regions: bottom full-width Timeline with ruler, FX tracks, SFX, SUB, locked VIDEO layer and independent red playhead.

Required Interactions: blank scrub, playhead drag, effect move, left/right trim handles, zoom 50–400%, Fit, SRT click seek, Space play/pause.
