# CueCut Director Phase 1 — Retrieval Architecture Options

## Constraints observed

- The production path has a one-call guard (`src/director/oneCallGuard.ts:6-17`); a second LLM repair call is not an acceptable recovery strategy.
- Current direct Effect registry has 33 statically derived entries, while the separate pack catalog has 87 entries.
- Raw pack catalog is 136,882 bytes; the measured compact projection of all 87 entries is 46,797 bytes, approximately 11,700 tokens by a deliberately coarse byte/4 estimate.
- Current candidate payload is only `{id,tags}` and current retrieval is global tag overlap.
- The desired result needs different candidate scopes for ordered process, quote, and comparison units.

## Option A — Local seed segmentation + per-unit retrieval + one Director call

```text
full SRT
  → deterministic/local seed planner
  → VisualUnit[]
  → capability-aware retrieval for each unit
  → one DirectorInput v2 containing bundles keyed by unit
  → one Director call
```

优点：unit scope is explicit; bounded bundles control prompt size; deterministic local tests can prove scope; one call remains intact; local layout and validation stay authoritative.

代价：需要建立 seed planner and preserve uncertain semantic cases as explicit units; planner quality must be tested against real SRT.

## Option B — Category router + per-category bundles + one Director call

```text
full SRT
  → category router
  → bundles for numeric/list/quote/comparison/etc.
  → one Director call
```

优点：implementation is simpler than full segmentation for coarse categories; categories can map to registry families.

代价：category is not a time-bounded Visual Unit; an ordered process spanning several subtitles can still be flattened; unit-level item cues and importance coverage need another structure. It risks replacing one global tag list with several global category lists.

## Option C — Complete compact capability index in one Director call

```text
full SRT
  → one Director call with the complete compact index
```

优点：the model has maximum candidate visibility; no local retrieval ranking bias.

代价：all 87 pack entries are ~11,700 coarse estimated tokens before transcript, schema, instructions, and output; actual tokenizer and context budget are not established. It does not itself create Visual Units or selection trace and makes candidate scope harder to prove. It is not selected without a measured context budget.

## Decision matrix

| Criterion | A | B | C |
|---|---:|---:|---:|
| Per-VisualUnit scope | Strong | Partial | Weak unless model infers it |
| One-call compatibility | Strong | Strong | Conditional on context |
| Prompt boundedness | Strong | Medium | Weak |
| Deterministic testability | Strong | Medium | Weak |
| Ordered process / item cues | Strong | Partial | Model-dependent |
| Reuses current code | Medium | Medium | Low |
| Traceability | Strong | Medium | Weak |

## Phase 1 decision

Select **Option A**. It is the smallest architecture that directly satisfies the PRD's per-VisualUnit requirement while preserving the one-call constraint. Option B can be a local router inside the seed planner, but it is not the external contract. Option C is rejected for the current measured catalog size and unverified context budget.
