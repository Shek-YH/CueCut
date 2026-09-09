# CueCut Director Requirement Traceability

Machine-readable source: [`requirement-traceability.json`](./requirement-traceability.json)。本矩阵把 PRD 的 14 个不可降级 Requirement 逐条连接到 Phase 2/3 task、证据和测试；当前 Phase 1 只完成抽取与架构证据，因此所有 acceptance status 保持 `NOT_VERIFIED`。

| ID | Priority / Level | Atomic obligation | Implementation task(s) | Phase 1 evidence | Acceptance status |
|---|---|---|---|---|---|
| REQ-DIR-001 | P0 / MUST | 完整 SRT 形成全局语义结构，不能以一条 SRT 或一组全局 tags 代替 | `director-phase2-semantic-planner`, `director-phase3-runtime-migration` | `00_CURRENT_CALL_GRAPH.md`, `02_ROOT_CAUSE_REPORT.md`, `06_SELECTED_ARCHITECTURE.md` | NOT_VERIFIED |
| REQ-DIR-002 | P0 / MUST | VisualUnit 是一等结构，含时间、来源、意图、重要性、结构和 extracted data | `director-phase2-semantic-planner`, `director-phase2-visual-unit-contract` | `06_SELECTED_ARCHITECTURE.md`, `07_FILE_BY_FILE_CHANGE_PLAN.md` | NOT_VERIFIED |
| REQ-DIR-003 | P0 / MUST | 候选召回按 VisualUnit 发生，不是全片 global Top-N | `director-phase1-retrieval-decision`, `director-phase2-per-unit-retrieval` | `05_RETRIEVAL_ARCHITECTURE_OPTIONS.md`, `06_SELECTED_ARCHITECTURE.md` | NOT_VERIFIED |
| REQ-DIR-004 | P0 / MUST | Effect candidate 携带 compact capability | `director-phase1-capability-audit`, `director-phase2-capability-contract` | `04_EFFECT_CAPABILITY_GAP.md` | NOT_VERIFIED |
| REQ-DIR-005 | P0 / MUST | Data Contract 由代码执行并覆盖指定 family | `director-phase2-data-contract-validation`, `director-phase2-composition-linter` | `07_FILE_BY_FILE_CHANGE_PLAN.md`, `08_GOLDEN_TEST_PLAN.md` | NOT_VERIFIED |
| REQ-DIR-006 | P0 / MUST | Numeric/data 不得发明，必须有 SRT/user/project-data provenance | `director-phase2-data-contract-validation`, `director-phase3-real-regression` | `03_DATA_FLOW_LOSS_MAP.md`, `08_GOLDEN_TEST_PLAN.md` | NOT_VERIFIED |
| REQ-DIR-007 | P0 / MUST | Effect duration 满足 capability min/max | `director-phase2-duration-validation`, `director-phase2-composition-linter` | `02_ROOT_CAUSE_REPORT.md`, `08_GOLDEN_TEST_PLAN.md` | NOT_VERIFIED |
| REQ-DIR-008 | P0 / MUST | Ordered Process 保留完整 4-step 等结构 | `director-phase2-semantic-planner`, `director-phase2-composition-linter`, `director-phase3-real-regression` | `08_GOLDEN_TEST_PLAN.md` | NOT_VERIFIED |
| REQ-DIR-009 | P0 / MUST | Steps/List/Ranking/Process 支持 item-level cues | `director-phase2-visual-unit-contract`, `director-phase2-composition-linter` | `06_SELECTED_ARCHITECTURE.md`, `08_GOLDEN_TEST_PLAN.md` | NOT_VERIFIED |
| REQ-DIR-010 | P0 / MUST | Layout 使用 subject/face/subtitle/safe/no-go context，AI 仅给 intent | `director-phase1-layout-context-audit`, `director-phase2-layout-integration`, `director-phase3-real-regression` | `00_CURRENT_CALL_GRAPH.md`, `02_ROOT_CAUSE_REPORT.md` | NOT_VERIFIED |
| REQ-DIR-011 | P0 / MUST | Composition 进入 Workspace 前通过本地 Linter | `director-phase2-composition-linter` | `07_FILE_BY_FILE_CHANGE_PLAN.md`, `08_GOLDEN_TEST_PLAN.md` | NOT_VERIFIED |
| REQ-DIR-012 | P0 / MUST | Selection Trace 证明 unit、候选、选择、契约结果 | `director-phase2-selection-trace`, `director-phase3-trace-viewer` | `06_SELECTED_ARCHITECTURE.md`, `08_GOLDEN_TEST_PLAN.md` | NOT_VERIFIED |
| REQ-DIR-013 | P0 / MUST | Density 以 visual events 统计并受 linter 约束 | `director-phase2-composition-linter` | `08_GOLDEN_TEST_PLAN.md`, `09_RISK_REGISTER.md` | NOT_VERIFIED |
| REQ-DIR-014 | P0 / MUST | fallback 显式可见且不得计作成功 Golden Path | `director-phase2-fallback-contract`, `director-phase3-real-regression` | `00_CURRENT_CALL_GRAPH.md`, `08_GOLDEN_TEST_PLAN.md` | NOT_VERIFIED |

## Phase 1 gate checklist

- [x] PRD source recorded for every requirement.
- [x] Every requirement is atomic at the semantic-obligation level.
- [x] Every requirement has at least one implementation task.
- [x] Every ROOT-001…009 has source evidence in `02_ROOT_CAUSE_REPORT.md`.
- [x] Retrieval Options A/B/C were compared using measured registry/catalog constraints.
- [x] Option A was selected without adding a second LLM call.
- [x] Core contracts and Golden Test cases are specified.
- [ ] Runtime implementation evidence — Phase 2 work.
- [ ] Independent verification evidence — Phase 4 work.

`NOT_VERIFIED` is intentional. Task completion, build success, and a fallback Composition cannot change it.
