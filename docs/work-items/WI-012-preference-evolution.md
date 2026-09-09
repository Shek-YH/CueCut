# WI-012 Preference Evolution

~~~yaml
id: WI-012
title: Preference Evolution
owner: R06
verifier: R07
orchestrator: R00
productOwner: User
status: READY_FOR_REVIEW
priority: P0
dependencies: [WI-002, WI-007, WI-009, WI-010, WI-011]
rolePlan: docs/governance/ROLE_PLAN.md
scope:
  in: [initial-composition, final-composition, edit-events, diff, confidence, coordinate-profile, variant-retention, motion-retention, sfx-retention, episodic-record, director-profile]
  out: [extra-llm-learning, opaque-model-training]
realTestRequirements: RT-06, RT-10
readinessStatus: READY for local fixtures
review: R07 verifies one sample does not create high confidence and repeated context raises confidence
decision: Local structured statistics; export is sample confirmation; project can opt out
artifacts: src/preferences, tests/preferences, docs/evidence/WI-012.md
next: implement after initial/final transaction events exist
lastUpdated: 2026-09-08
~~~
