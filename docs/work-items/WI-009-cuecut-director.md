# WI-009 CueCut Director

~~~yaml
id: WI-009
title: CueCut Director
owner: R03
verifier: R07
orchestrator: R00
productOwner: User
status: READY_FOR_REVIEW
priority: P0
dependencies: [WI-002, WI-004, WI-005, WI-007, WI-008, WI-010]
rolePlan: docs/governance/ROLE_PLAN.md
scope:
  in: [context-builder, candidate-retriever, skill-loader, structured-output, one-llm-call, local-validator, local-fallback, composition-import]
  out: [second-llm-fix, full-registry-prompt, automatic-regeneration-after-manual-edit]
realTestRequirements: RT-04
readinessStatus: WAITING_FOR_READINESS for real provider; deterministic local fallback READY
review: R07 verifies call count, candidate-only IDs, local correction and no second call
decision: One inference boundary with an injectable provider and explicit local fallback
artifacts: src/director, tests/director, docs/evidence/WI-009.md
next: implement after SRT/candidate contracts and approved provider readiness
lastUpdated: 2026-09-08
~~~
