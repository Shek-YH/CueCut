# CueCut Director Phase 1 — Risk Register

| ID | Risk | Impact | Current status | Mitigation / gate |
|---|---|---|---|---|
| RISK-DIR-001 | Global tags and global Top-N remain reachable through the production route | All units continue to share wrong candidates | OPEN / P0 | Replace the route's context-builder output with per-unit bundles; add a test proving the old path is not called. |
| RISK-DIR-002 | Capability data is duplicated or drifts from the registry | LLM sees one contract while validator uses another | OPEN / P0 | One compact projection from registry source; validator consumes the same projection; add parity tests. |
| RISK-DIR-003 | Numeric/data families accept arbitrary `unknown` content | Semantic corruption and invented data | OPEN / P0 | Discriminated EffectDataContract plus provenance checks before Workspace. |
| RISK-DIR-004 | Effect capability max duration is silently clamped only to project duration | 8-second effect can still persist 31 seconds | OPEN / P0 | Enforce min/max against selected capability; deterministic repair must be explicit and traced. |
| RISK-DIR-005 | Ordered process loses late items | Four-step case becomes two-step output | OPEN / P0 | VisualUnit structure and item-level cues; GOLDEN-001 must assert all items. |
| RISK-DIR-006 | Subject/face analysis is unavailable | Layout can overlap speaker or unsafe area | OPEN / P0 | Formal visual-context provider with unavailable state; reuse Layout Solver; never fabricate coordinates. |
| RISK-DIR-007 | Current app initializes from fixture ProjectStore | Server-generated composition may not reach Workspace | OPEN / P1 | Trace and test explicit composition handoff before claiming UI acceptance. |
| RISK-DIR-008 | Pack catalog has 87 entries but current effect registry filters pack-effect | Candidate diversity is overstated | OPEN / P1 | Explicitly decide and test pack manifest migration; do not count catalog entries as runtime candidates without evidence. |
| RISK-DIR-009 | One-call context budget is exceeded | Provider failure or truncation | OPEN / P1 | Option A bounded per-unit bundles; measure actual serialized payload and retain one call. |
| RISK-DIR-010 | Fallback masks provider/schema failures | False Golden acceptance | OPEN / P0 | Preserve `usedFallback`, expose UI/log/trace state, and reject fallback in real acceptance. |
| RISK-DIR-011 | Phase 3 changes frozen contracts without review | Architecture regression | CONTROLLED | Create Core Freeze after Phase 2; require Requirement Deviation for frozen path changes. |
| RISK-DIR-012 | Credentials or private media leak into ledger/evidence | Security and privacy incident | CONTROLLED | Existing env handling stays local; evidence is redacted; Skill secret scan runs before checkpoints. |
| RISK-DIR-013 | Automatic model switching is unavailable | Requested Luna boundary may be misrepresented | KNOWN | Record capability-based routing; emit `MODEL_SWITCH_REQUIRED=LUNA` only at Phase 3 boundary if switch remains unavailable; never pretend it switched. |

## User-action boundaries

No user action is required for Phase 1. A real provider regression may require the already-configured local credential and authorized media; the credential value must never be copied into the ledger or reports. Push remains disabled by default, and Phase 4 requires independent review.

## Gate interpretation

Phase 1 can close only when ROOT-001…009 have evidence, REQ-DIR-001…014 map to tasks, Option A is selected, frozen contracts are documented, and GOLDEN-001…006 are executable test designs. It cannot declare the Phase 2 Core Freeze or final acceptance.
