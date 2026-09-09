# WI-002 Canonical Project Model

~~~yaml
id: WI-002
title: Canonical Project Model
owner: R01
verifier: R07
orchestrator: R00
productOwner: User
status: READY_FOR_REVIEW
priority: P0
dependencies: [WI-001]
rolePlan: docs/governance/ROLE_PLAN.md
scope:
  in: [cuecut.composition/1, zod-schema, canonical-store, effect-instance, motion, sfx, subtitle, normalized-layout, locks, variant-state-cache, serializer, undo-transaction]
  out: [remote-llm, final-export-codec, desktop-shell]
realTestRequirements: RT-05 synthetic/local portion; RT-10 local diff fixtures
readinessStatus: READY
review: R07 reruns schema/store contract tests and checks store-only mutation
decision: Immutable snapshots plus explicit transactions; no duplicate Canvas/Timeline data
artifacts: src/project, tests/project, docs/evidence/WI-002.md
next: write failing schema and transaction tests before implementation
lastUpdated: 2026-09-08
~~~
