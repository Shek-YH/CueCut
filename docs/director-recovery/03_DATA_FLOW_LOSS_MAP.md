# CueCut Director Phase 1 — Data Flow Loss Map

## 1. Loss map

| Boundary | Source shape | Destination shape | Lost / weakened fields | Severity | Required recovery |
|---|---|---|---|---|---|
| Effect Registry → generation input | `EffectDefinition` with 27 declared capability/provenance fields | `{ id, tags }` | displayName, slots, duration bounds, ratios, use/avoid, motion/SFX recommendations, props, style, timing/layout, source/license | P0 | Project a compact `EffectCapabilityCandidate` at the boundary; retain source object locally for validation. |
| Motion Registry → generation input | `MotionDefinition` with role, duration range, family compatibility, styles and capabilities | `{ id, tags }` | role, range, compatibility, style, capabilities, source/license | P1/P0 for timing | Send compact motion capability or derive compatible motions locally from the selected effect. |
| SFX Registry → Context Builder | SFX definition plus tags/favorite/usage | `{ id, tags, isFavorite, usageScore }` | any extra intent/provenance fields | P1 | Preserve enough intent and provenance for trace; keep favorite/usage ranking deterministic. |
| Transcript segments → semantic planner | timestamped segments | same segments plus one global tag list | unit boundaries, structure type, item list, numeric provenance, importance, local intent | P0 | Introduce `VisualUnit[]` with source IDs, times, structure, extracted data, and importance. |
| Visual context → generation input | `VisualContext` contract | empty subject/face arrays + fixed subtitle zone/safe margin | actual subject/face/no-go geometry | P0 | Use a formal detector/provider interface; pass unavailable state rather than fake coordinates. |
| Full candidate set → DirectorInput | registry-level list | global 8 effects / 6 motions / 8 SFX | per-unit scope and excluded rationale | P0 | Return `CandidateBundle[]` keyed by `visualUnitId` and add selection trace. |
| Candidate → prompt | `{id,tags}` | JSON string in prompt | data contract, max duration, ratio support, avoid cases | P0 | Serialize only compact capabilities; do not include React source. |
| Provider output → local acceptance | arbitrary JSON/string | Zod composition | semantic data types, family/content compatibility, item completeness, visual event density | P0 | Run composition linter after schema parsing and before Workspace handoff. |
| Composition timing → service | effect range | project-range-clamped range | effect capability min/max | P0 | Validate against selected registry capability; deterministic repair only if the capability explicitly permits it. |
| Composition → Workspace | response + files in `renders/` | browser app starts from fixture ProjectStore | observed handoff of generated composition | P1 | Add an explicit composition import/handoff boundary and trace it in integration tests. |
| Composition → export | project object at export controller | ffmpeg command | Director evidence / acceptance state | P1 | Keep export validation separate; do not treat successful encoding as Director acceptance. |

## 2. What is preserved today

- Original timestamped ASR segments reach `DirectorInput.transcript` and are returned in the API.
- Project dimensions and aspect ratio are derived from ffprobe and merged into the returned composition.
- Full EffectDefinition fields remain in the local registry and can be reused; they are not destroyed globally.
- Local ID sanitization, project-range clamping, and schema validation exist.

## 3. What is not evidence of recovery

- Prompt text mentioning density or layout does not enforce those properties.
- A Zod `Record<string, unknown>` is not a data contract.
- A non-empty candidate list is not a per-unit candidate scope.
- A successful fallback composition is not a successful Director generation.
- A passing export is not proof of semantic, timing, or capability correctness.
