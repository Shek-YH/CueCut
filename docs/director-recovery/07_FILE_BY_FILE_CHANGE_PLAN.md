# CueCut Director Phase 1 — File-by-file Change Plan

生产源码在 Phase 1 保持不变；以下是 Phase 2/3 的受控变更计划。

## Phase 2 core files

| File | Planned responsibility | Requirement links |
|---|---|---|
| `src/director/types.ts` | Add `VisualUnit`, capability, bundle, trace, and v2 DirectorInput types without removing project/transcript compatibility fields. | REQ-DIR-001…004, 009, 012 |
| `src/director/semanticPlanner.ts` | Build timestamped Visual Units from complete SRT, preserve ordered/list/quote/comparison structure and extracted data provenance. | REQ-DIR-001, 002, 006, 008, 009 |
| `src/director/capabilities.ts` | Project local Effect/Motion definitions into compact capabilities and expose executable data contracts. | REQ-DIR-004, 005, 006, 007 |
| `src/director/retriever.ts` | Replace tag-only ranking with capability-aware per-unit retrieval; keep a separately marked legacy helper only if existing tests require it. | REQ-DIR-003, 004, 012 |
| `src/director/contextBuilder.ts` | Remove production use of whole-transcript global tags; assemble Visual Units, bundles, SFX preferences, and trace inputs. | REQ-DIR-001, 003, 004 |
| `src/generation/workflow.ts` | Preserve ASR/Director order, derive candidate indexes from v2 bundles, and carry trace through the workflow. | REQ-DIR-001, 003, 012, 014 |
| `src/server/generationRoute.ts` | Pass compact capabilities and real visual-context provider output; keep API secret handling redacted and explicit. | REQ-DIR-004, 010, 014 |
| `src/director/prompt.ts` | Serialize v2 unit/bundle/trace contract and enforce one composition response; do not put React source in prompt. | REQ-DIR-001, 003, 004, 012 |
| `src/director/validator.ts` | Upgrade ID-only checks to family data, duration, aspect, item cue, and provenance validation. | REQ-DIR-005…009, 011 |
| `src/director/compositionLinter.ts` | Add `CompositionLintResult`, coverage, visual-event density, repetition, ordered completeness, and layout checks. | REQ-DIR-011, 013 |
| `src/director/service.ts` | Run linter before Workspace handoff; preserve one provider call; expose fallback and trace state. | REQ-DIR-011, 012, 014 |
| `src/project/schema.ts` | Extend composition content/structure only with an explicit backward-compatible migration, preserving current schema acceptance until the new path is proven. | REQ-DIR-008, 009, 011 |
| `src/layout/solver.ts` | Accept real visual context and intent; resolve safe/no-go zones deterministically. | REQ-DIR-010, 011 |

## Phase 2 tests

| File | Coverage |
|---|---|
| `tests/director/semanticPlanner.test.ts` | complete SRT → VisualUnits; four ordered items; subtitle/time trace |
| `tests/director/capabilities.test.ts` | full registry fields → compact capability; numeric/list/steps/quote/comparison contracts |
| `tests/director/retriever.test.ts` | three unit intents receive different bundles; score includes capability and ratio |
| `tests/director/validator.test.ts` | non-numeric numeric value fails; fabricated numbers fail; duration/aspect/cue errors fail |
| `tests/director/compositionLinter.test.ts` | coverage, visual events, repetition, ordered completeness, layout checks |
| `tests/director/service.test.ts` | one provider call, fallback visibility, linter gate, trace propagation |
| `tests/generation/workflow.test.ts` | v2 pipeline reaches one Director call with per-unit bundles |
| `tests/server/generationRoute.test.ts` | real visual-context interface/unavailable state and generated artifact metadata |

## Phase 3 expansion files

- `src/effects/registry.ts`, `src/motions/registry.ts`, and pack manifests: complete capability/data-contract coverage for all production candidates.
- `src/app/App.tsx` and Director trace UI: show `usedFallback`, warnings, trace summary, and explicit generated-composition handoff.
- `docs/director-recovery/10_PHASE2_TEST_RESULTS.md` through `14_PRE_PUSH_ACCEPTANCE.md`: record local acceptance and real regression evidence.

## Prohibited changes

- Do not restore global regex → global Top-N as the main path.
- Do not make data contracts Prompt-only.
- Do not silently clamp capability violations.
- Do not replace real runtime evidence with fixtures and claim acceptance.
- Do not modify frozen Phase 2 paths during Phase 3 without a Requirement Deviation.
