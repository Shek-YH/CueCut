# WI-014 Video-to-Workspace Generation Pipeline

~~~yaml
id: WI-014
title: Video-to-Workspace Generation Pipeline
owner: R03/R04
verifier: R07
orchestrator: R00
productOwner: User
status: READY_FOR_REVIEW
priority: P0
dependencies: [WI-003, WI-008, WI-009, WI-012]
rolePlan: docs/governance/ROLE_PLAN.md
scope:
  in: [video-import, start-generation, audio-extract, asr-srt, director-skill, preference-profile, composition-import]
  out: [desktop-packaging, full-export, downstream-editor-acceptance]
realTestRequirements: RT-03, RT-04
readinessStatus: local and real full-flow result recorded; independent verifier pending
review: R07 verifies ordered stages, one Director call boundary, and Workspace import
decision: keep provider credentials on the host-side Vite middleware; browser receives only generated transcript/composition
artifacts: src/generation, src/server/generationRoute.ts, src/app/App.tsx, tests/generation, tests/server, tests/app/generation-flow.test.tsx, tests/e2e/vertical-slice.spec.ts
next: independent review, then an explicitly selected real full-flow run if needed
lastUpdated: 2026-09-08
~~~
