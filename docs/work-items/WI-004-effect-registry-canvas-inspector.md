# WI-004 Effect Registry + Canvas + Inspector

~~~yaml
id: WI-004
title: Effect Registry + Canvas + Inspector
owner: R02/R05
verifier: R07
orchestrator: R00
productOwner: User
status: READY_FOR_REVIEW
priority: P0
dependencies: [WI-002, WI-003]
rolePlan: docs/governance/ROLE_PLAN.md
scope:
  in: [effect-registry, family-contract, candidate-assets, canvas-card, drag, resize, scale, color, z-index, special-settings, common-settings, video-z0-locked]
  out: [motion-runtime, final-export]
realTestRequirements: RT-05, RT-07
readinessStatus: READY with supplied MIT asset metadata
review: R07 performs UI fidelity and video z0 checks
decision: Registry definitions own family contracts; local SVGs retain MIT license text and are sanitized before use
artifacts: src/effects, src/editor/canvas, src/editor/inspector, tests/effects, docs/evidence/WI-004.md
next: wait for canonical model and timeline slice
lastUpdated: 2026-09-08
~~~

## Prototype Mapping

Prototype Source: CueCut_UI_Prototype_V4_Director_EffectLab.html

Prototype Regions: center Canvas with z0 video, safe zone/person guide, multi-FX cards; right Inspector with Special-first and Common sections; left Layers panel.

Required Interactions: select from Layer/Card, drag X/Y, resize, edit special/common fields, keep video locked at z0.
