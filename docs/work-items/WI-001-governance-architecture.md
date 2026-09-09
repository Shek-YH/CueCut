# WI-001 Governance & Architecture

~~~yaml
id: WI-001
title: Governance & Architecture
owner: R01
verifier: R07
orchestrator: R00
productOwner: User
status: IN_PROGRESS
priority: P0
dependencies: [WI-000]
rolePlan: docs/governance/ROLE_PLAN.md
scope:
  in: [discovery, source-of-truth, roles, risks, ADR, real-test-readiness, work-item-breakdown, directory-skeleton]
  out: [feature-implementation, real-provider-validation, product-owner-acceptance]
realTestRequirements: none for governance; governs RT-01 through RT-10
readinessStatus: READY
review: R07 verifies source registration, gate ordering, risk accuracy and no unverified acceptance claims
decision: ADR-001 selects host-native React/TypeScript/Vite with renderer boundary
artifacts: docs/governance, docs/work-items, docs/evidence, docs/superpowers/plans
next: finish bootstrap baseline; start WI-002 contract tests
lastUpdated: 2026-09-08
~~~

## Prototype Mapping

Prototype Source: CueCut_UI_Prototype_V4_Director_EffectLab.html

Prototype Regions:

- 编辑: Layers + SRT left, Canvas center, Inspector right, Timeline bottom.
- 动效库: Template/Variant left, real-content preview center, Draft controls right, footer actions.
- 音效库: Intent categories left, sound list center, current preview/detail right.
- 自进化: local navigation left, metrics/heatmap/episodic memory center, procedural rules right.

Required Interactions:

- Primary navigation order remains unchanged.
- Timeline playhead and effect clip are independent.
- SRT click seeks; Effect Lab changes remain draft until Apply.
- SFX favorites can be filtered and are weak preference signals.
- First load uses layout scheduling, not a manual zoom repair.

