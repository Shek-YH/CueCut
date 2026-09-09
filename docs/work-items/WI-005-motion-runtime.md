# WI-005 Motion Registry + Motion Runtime

~~~yaml
id: WI-005
title: Motion Registry + Motion Runtime
owner: R02/R04
verifier: R07
orchestrator: R00
productOwner: User
status: READY_FOR_REVIEW
priority: P0
dependencies: [WI-004]
rolePlan: docs/governance/ROLE_PLAN.md
scope:
  in: [decoupled-enter-exit, motion-registry, representative-presets, compatibility, preview-runtime]
  out: [automatic-llm-motion-repair, advanced-render-benchmark]
realTestRequirements: RT-05; later RT-08
readinessStatus: READY for local preview; final renderer benchmark pending
review: R07 checks enter/exit controls and preview behavior against prototype
decision: Begin with 6–10 representative presets, map them into the renderer interface
artifacts: src/motions, tests/motions, docs/evidence/WI-005.md
next: implement after Canvas/Inspector contracts
lastUpdated: 2026-09-08
~~~

## Prototype Mapping

Prototype Source: CueCut_UI_Prototype_V4_Director_EffectLab.html

Prototype Regions: Effect Lab right Draft Controls with independent Enter/Exit grids and center realtime preview actions.

Required Interactions: enter-only, exit-only, replay/full cycle, local motion selection, duration/intensity controls; no Director call.
