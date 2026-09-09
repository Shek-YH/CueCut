# WI-010 Layout Solver

~~~yaml
id: WI-010
title: Layout Solver
owner: R06
verifier: R07
orchestrator: R00
productOwner: User
status: READY_FOR_REVIEW
priority: P0
dependencies: [WI-002, WI-004]
rolePlan: docs/governance/ROLE_PLAN.md
scope:
  in: [safe-margins, subject-zones, face-zones, subtitle-avoidance, fx-collision, nearest-valid-coordinate, priority, normalized-coordinate, subject-relative-coordinate]
  out: [unverified-computer-vision-model]
realTestRequirements: RT-02, RT-04, RT-10
readinessStatus: READY for deterministic zones; real visual context WAITING
review: R07 runs collision/priority tests and visual evidence
decision: AI preferred coordinate is not final legal coordinate; locked/manual/high-importance priority
artifacts: src/layout, tests/layout, docs/evidence/WI-010.md
next: implement after canonical layout types
lastUpdated: 2026-09-08
~~~
