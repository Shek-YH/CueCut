# CueCut Director Requirement Evidence

当前状态以 `.ai-ledger/extensions/requirements.json` 为准。所有 14 条 MUST/P0 Requirement 均已连接实现路径、测试和 Phase 1/2/3 证据，但在独立验证器正式绑定前保持 `IMPLEMENTED_NOT_VERIFIED`。

| Requirement | Evidence summary | Current status |
|---|---|---|
| REQ-DIR-001 | Semantic planner + workflow VisualUnits + real 18-block SRT | IMPLEMENTED_NOT_VERIFIED |
| REQ-DIR-002 | VisualUnit contract, context builder, item cues | IMPLEMENTED_NOT_VERIFIED |
| REQ-DIR-003 | Per-unit retrieval and distinct Golden candidate bundles | IMPLEMENTED_NOT_VERIFIED |
| REQ-DIR-004 | Compact Effect capability projection | IMPLEMENTED_NOT_VERIFIED |
| REQ-DIR-005 | Runtime data-contract validation and Composition Linter | IMPLEMENTED_NOT_VERIFIED |
| REQ-DIR-006 | Allowed provenance sources and fabricated-number rejection | IMPLEMENTED_NOT_VERIFIED |
| REQ-DIR-007 | Capability duration validation plus explicit deterministic repair | IMPLEMENTED_NOT_VERIFIED |
| REQ-DIR-008 | Four-step process planner/renderer tests; real sample had no ordered process | IMPLEMENTED_NOT_VERIFIED |
| REQ-DIR-009 | Item cue validation and time-based reveal tests | IMPLEMENTED_NOT_VERIFIED |
| REQ-DIR-010 | unavailable visual context contract, blocked zones, local solver | IMPLEMENTED_NOT_VERIFIED |
| REQ-DIR-011 | Composition Linter integrated before successful Director result | IMPLEMENTED_NOT_VERIFIED |
| REQ-DIR-012 | SelectionTrace in workflow, API, service, and UI | IMPLEMENTED_NOT_VERIFIED |
| REQ-DIR-013 | Visual event count and density range check | IMPLEMENTED_NOT_VERIFIED |
| REQ-DIR-014 | Explicit fallback API/UI state and Golden fallback test | IMPLEMENTED_NOT_VERIFIED |

## Not claimed

- No requirement is `VERIFIED` yet.
- No fallback output is counted as successful Director output.
- No independent verifier conclusion is inferred from Builder tests.
