# CueCut3｜Master Ledger

**Updated:** 2026-09-08  
**Epic:** `EPIC-GP-001｜Core Golden Path`

| ID | Epic | Work Item | Owner | Verifier | Status | Priority | Dependencies | Golden Path | Next |
|---|---|---|---|---|---|---|---|---|---|
| WI-015 | EPIC-GP-001 | Audit/import/cleanup evidence | R02 | R90 | ACCEPTED | P0 | — | GP-01, GP-02 | 已通过 R90；开启 WI-016/WI-020 |
| WI-016 | EPIC-GP-001 | Motion adapters and registries | R01 | R90 | IN_PROGRESS | P0 | WI-015 | GP-03 | Leibniz execution `01a08239-3311-7f01-8b30-afed1aa4a415` |
| WI-017 | EPIC-GP-001 | Deterministic preview/renderer | R03 | R90 | TODO | P0 | WI-016 | GP-04, GP-06 | 派发 R03 |
| WI-018 | EPIC-GP-001 | Effect library UI and inspector | R04 | R90 | TODO | P0 | WI-016, WI-017 | GP-04 | 派发 R04 |
| WI-019 | EPIC-GP-001 | Timeline/export integration | R05 | R90 | TODO | P0 | WI-017 | GP-05, GP-07 | 派发 R05 |
| WI-020 | EPIC-GP-001 | License/IP compliance | R06 | R90 | IN_PROGRESS | P0 | WI-015 | GP-02, GP-03 | Lorentz execution `01a08239-3406-76f2-a195-477abafbb43f` |
| WI-021 | EPIC-GP-001 | QA and regression | R07 | R90 | TODO | P0 | WI-018, WI-019, WI-020 | GP-08 | 派发 R07 |
| WI-022 | EPIC-GP-001 | Core Golden Path real E2E / acceptance prep | R00 | R90 + Product Owner | TODO | P0 | WI-021 | GP-01…GP-08 | 派发 R90；最后请求用户总体验收 |

机器控制面是 `docs/work-items/WI-015.json` 至 `WI-022.json` 和 `docs/governance/WORK_ITEM_GRAPH.json`；本表只是人类摘要。

## Gate 规则

`TODO → IN_PROGRESS` 必须有真实 child-agent executionRef；实现者交付后只能进入 `READY_FOR_REVIEW`。R90 使用不同 executionRef 检查后才允许 `VERIFIED`；R00 仅在 Evidence、关键 Real Test 和无 P0 blocker 满足时推进 `ACCEPTED`。
