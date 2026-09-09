# WI-006 Effect Lab

~~~yaml
id: WI-006
title: Effect Lab
owner: R02
verifier: R07
orchestrator: R00
productOwner: User
status: READY_FOR_REVIEW
priority: P0
dependencies: [WI-004, WI-005, WI-007]
rolePlan: docs/governance/ROLE_PLAN.md
scope:
  in: [source-effect-instance, preview-draft, real-content-preview, variant, enter, exit, color, sfx, replay, reset, cancel, apply, one-undo-transaction]
  out: [remote-regeneration, independent-ai-repair]
realTestRequirements: RT-05
readinessStatus: READY
review: R07 must compare source/draft before and after Cancel/Apply and execute UI Fidelity Review
decision: Clone draft locally; only Apply opens one project transaction
artifacts: src/editor/effect-lab, tests/editor/effect-lab, tests/visual, docs/evidence/WI-006.md
next: implement after Motion and SFX contracts
lastUpdated: 2026-09-08
~~~

## Prototype Mapping

Prototype Source: CueCut_UI_Prototype_V4_Director_EffectLab.html

Prototype Regions: left Template/Variant, center real content preview, right Draft settings, footer Reset/Cancel/Apply.

Required Interactions: current AI choice, same-family variants, enter/exit choices, color swatches, SFX select, replay, enter-only, exit-only, Reset, Cancel, Apply.
