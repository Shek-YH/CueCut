# WI-011 Export

~~~yaml
id: WI-011
title: Export
owner: R04
verifier: R07
orchestrator: R00
productOwner: User
status: IN_PROGRESS
priority: P0
dependencies: [WI-003, WI-004, WI-005, WI-008, WI-010]
rolePlan: docs/governance/ROLE_PLAN.md
scope:
  in: [full-video, transparent-mov, unified-render-runtime, host-ffmpeg, performance-benchmark]
  out: [png-sequence-default, browser-screenshot-export, unapproved-codec]
realTestRequirements: RT-08, RT-09
readinessStatus: WAITING_FOR_READINESS; RT-09 BLOCKED pending CapCut/Jianying session
review: R07 verifies output metadata and benchmark evidence; downstream editor must be separate
decision: Full Video and Alpha MOV first; chroma/stacked-alpha are later evaluation paths
artifacts: src/render, src/export, tests/export, docs/evidence/WI-011.md
next: freeze renderer interface and benchmark host paths
lastUpdated: 2026-09-08
~~~
