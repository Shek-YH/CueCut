# CueCut Director Phase 1 — Golden Test Plan

这些是 Phase 2 的 acceptance tests；Phase 1 只定义输入、断言和真实运行边界，不宣称已通过。

## GOLDEN-001 — 4 Step Reading Process

**Input:** timestamped SRT containing “第一步、第二步、第三步、第四步” across at least four subtitle segments.

**Real path:** `createGenerationWorkflow` → semantic planner → per-unit retrieval → one Director provider stub at the provider boundary → local validator/linter.

**Assertions:**

- one ordered-process Visual Unit or an explicitly linked process structure exists;
- all four ordered items remain, with source subtitle IDs and item cue times;
- candidate bundle contains a Step/Checklist/Flow/Process capability;
- no pure-text step is represented as `numeric:ring-*`;
- third and fourth items are not dropped.

## GOLDEN-002 — Non-numeric text cannot enter Numeric

**Input:** numeric candidate with `content.value = "盲区定位"`.

**Assertions:** family data-contract validation fails with a typed numeric error; result is rejected or deterministically repaired to a non-numeric candidate; it is never silently accepted.

## GOLDEN-003 — Duration contract

**Input:** registry capability `maxDurationSec=8`, generated effect duration 31 seconds.

**Assertions:** linter fails or applies a documented deterministic repair that produces a duration within `[min,max]`; warning/trace records the repair; silent pass is forbidden.

## GOLDEN-004 — Candidate scope

**Input:** three units with intents `ordered_process`, `quote`, and `comparison`.

**Assertions:** each unit has a bundle keyed by its `visualUnitId`; at least two bundles differ; selection trace lists the retrieved candidates for each unit; no global array is used as the only candidate scope.

## GOLDEN-005 — No fabricated number

**Input:** SRT says only “增长很快”, with no explicit number, percentage, user-provided value, or project-data value.

**Assertions:** no numeric or percentage content is generated; if a numeric family is selected, validation rejects it and trace records missing provenance.

## GOLDEN-006 — Fallback visibility

**Input:** provider intentionally rejects or returns invalid structured output.

**Assertions:** `usedFallback=true`; warning and trace identify fallback; acceptance helper marks Director Golden result not accepted; a successful fallback Composition cannot count as `usedFallback=false` Golden Path evidence.

## Cross-cutting assertions

- exactly one provider call per Generate operation;
- local parsing/validation/repair never calls the provider again;
- aspect ratio and project time range are checked;
- high-importance units are covered or produce a linter error;
- visual-event density counts effect enters, item reveals, and major transitions, not only Effect object count;
- layout checks use supplied context when available and report unavailable context without fabricated zones.

## Evidence format

Each test should emit a compact, secret-free artifact containing: fixture ID, provider call count, `usedFallback`, Visual Unit IDs, bundle IDs, selected IDs, linter result, warnings, and relevant output paths. Provider credentials and raw private media never enter evidence.
