# WI-007 SFX Registry + Favorites

~~~yaml
id: WI-007
title: SFX Registry + Favorites
owner: R05
verifier: R07
orchestrator: R00
productOwner: User
status: READY_FOR_REVIEW
priority: P0
dependencies: [WI-002]
rolePlan: docs/governance/ROLE_PLAN.md
scope:
  in: [intent-category, style-pack, waveform-metadata, favorite, favorite-filter, recent, ai-recommended, add, replace, sfx-track]
  out: [unlicensed-audio-download, forced-favorite-selection]
realTestRequirements: RT-06
readinessStatus: WAITING_FOR_READINESS for audio files; metadata fixtures READY
review: R07 verifies favorite metadata and Director preference hint contract
decision: Favorite is a weak ranking signal only; no forced selection
artifacts: src/sfx, tests/sfx, docs/evidence/WI-007.md
next: use metadata-only candidates until authorized audio is supplied
lastUpdated: 2026-09-08
~~~

## Prototype Mapping

Prototype Source: CueCut_UI_Prototype_V4_Director_EffectLab.html

Prototype Regions: SFX Intent categories left, list with waveform/favorite center, current preview/detail right.

Required Interactions: AI Recommended, Favorites, Recent, category filter, preview, favorite/unfavorite, replace current Effect, add at playhead.
