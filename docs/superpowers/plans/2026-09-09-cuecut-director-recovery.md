# CueCut Director Architecture Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recover the CueCut Director architecture from the supplied PRD, establish evidence-backed requirements and a frozen Phase 1 design, then implement the core Golden Path in later phases without weakening any MUST/P0 requirement.

**Architecture:** Phase 1 is production-code frozen and produces the call graph, loss map, root-cause evidence, capability-aware retrieval decision, file plan, and Golden Test plan. Phase 2 will add first-class Visual Units, compact capability contracts, per-unit candidate bundles, hard validation/linting, and trace without a second LLM repair call. Phase 3 will expand manifests/adapters/UI/tests only inside the Core Freeze contract.

**Tech Stack:** React 19, TypeScript, Zod, Vite, Vitest, Playwright, Node.js, existing CueCut registries and shared AI Project Ledger v2.3 runtime.

---

### Task 1: Initialize Director recovery governance

**Files:**
- Read: `CueCut_Director_Architecture_Recovery_Phase1_3_Codex_PRD_v1.md`
- Modify: `.ai-ledger/project.json`, `.ai-ledger/tasks.json`, `.ai-ledger/sessions.json`, `.ai-ledger/artifacts.json`, `.ai-ledger/runtime.json`, `.ai-ledger/events.jsonl`
- Create: `.ai-ledger/extensions/requirements.json`, `.ai-ledger/extensions/verification.json`, `.ai-ledger/extensions/deviations.json`, `.ai-ledger/extensions/model-routing.json`

- [ ] **Step 1: Run read-only intake and Git Gate**

Run:

```powershell
git status --short --branch
node C:\Users\Administrator\.codex\skills\ai-autonomous-project-ledger-skill\scripts\git-gate.mjs F:\CCPJ\CueCut3
node C:\Users\Administrator\.codex\skills\ai-autonomous-project-ledger-skill\scripts\validate-ledger.mjs F:\CCPJ\CueCut3
```

Expected: existing repository is preserved; no reset, clean, stash, or push occurs; the seven core ledger files validate.

- [ ] **Step 2: Classify the project and bootstrap requirement extensions**

Run:

```powershell
node C:\Users\Administrator\.codex\skills\ai-autonomous-project-ledger-skill\scripts\complexity-classifier.mjs F:\CCPJ\CueCut3
node C:\Users\Administrator\.codex\skills\ai-autonomous-project-ledger-skill\scripts\requirement-bootstrap.mjs F:\CCPJ\CueCut3 --requirements-file F:\CCPJ\CueCut3\docs\director-recovery\requirement-traceability.json
```

Expected: complexity is `COMPLEX`; requirement extensions are present and retain the existing project identity.

- [ ] **Step 3: Record Architect session, phases, task tree, and dependencies**

Add a Director Recovery Phase 1–4 task tree while preserving existing CueCut tasks. Every REQ-DIR-001…014 links to a concrete Phase 2/3 implementation task, and Phase 1 tasks link to their document artifacts.

- [ ] **Step 4: Validate the initialized control plane**

Run:

```powershell
node C:\Users\Administrator\.codex\skills\ai-autonomous-project-ledger-skill\scripts\validate-ledger.mjs F:\CCPJ\CueCut3
node C:\Users\Administrator\.codex\skills\ai-autonomous-project-ledger-skill\scripts\requirement-validate.mjs F:\CCPJ\CueCut3
```

Expected: both commands exit 0 and report the Director requirements with no secret-like data.

### Task 2: Produce the Phase 1 architecture audit

**Files:**
- Create: `docs/director-recovery/00_CURRENT_CALL_GRAPH.md`
- Create: `docs/director-recovery/02_ROOT_CAUSE_REPORT.md`
- Create: `docs/director-recovery/03_DATA_FLOW_LOSS_MAP.md`
- Create: `docs/director-recovery/04_EFFECT_CAPABILITY_GAP.md`
- Test: existing `pnpm test --run`, `pnpm lint`

- [ ] **Step 1: Trace the real import-to-export path**

Document file and line evidence for video import, generation workflow, audio/ASR, context builder, registries, retriever, DirectorInput, prompt/provider/parser, validator/schema, layout solver, workspace, and export. For every edge record input, output, lost fields, validation, fallback, and existing test coverage.

- [ ] **Step 2: Verify ROOT-001…ROOT-009 from source**

Use only observed source behavior and existing tests. Mark each root cause `CONFIRMED`, `PARTIAL`, or `NOT_REPRODUCED`; cite exact file/line evidence and state what Phase 2 must change.

- [ ] **Step 3: Run the existing baseline suite**

Run:

```powershell
pnpm test --run
pnpm lint
```

Record exact counts and any pre-existing failures in the audit; do not modify production code to make Phase 1 pass.

### Task 3: Extract atomic requirements and choose retrieval architecture

**Files:**
- Create: `docs/director-recovery/01_REQUIREMENT_TRACEABILITY.md`
- Create: `docs/director-recovery/requirement-traceability.json`
- Create: `docs/director-recovery/05_RETRIEVAL_ARCHITECTURE_OPTIONS.md`
- Create: `docs/director-recovery/06_SELECTED_ARCHITECTURE.md`

- [ ] **Step 1: Extract REQ-DIR-001…014 atomically**

Each requirement records PRD source section, one semantic obligation, MUST/P0 level, implementation tasks, dependencies, code evidence, test evidence, and `NOT_VERIFIED` acceptance status. Do not merge independent data, security, runtime, or acceptance obligations.

- [ ] **Step 2: Measure current registry and compact-index constraints**

Record registry counts, candidate field sizes, current candidate payload shape, one-call guard behavior, and whether the configured Director context can accept a complete compact index. Do not infer token capacity without evidence.

- [ ] **Step 3: Compare Options A/B/C and select one**

Evaluate per-unit retrieval quality, one-call compatibility, token cost, traceability, deterministic behavior, and reuse of existing modules. The selected architecture must avoid global regex tags plus global Top-N and must not require a second LLM repair call.

### Task 4: Freeze the Phase 2 implementation contract and Golden Tests

**Files:**
- Create: `docs/director-recovery/07_FILE_BY_FILE_CHANGE_PLAN.md`
- Create: `docs/director-recovery/08_GOLDEN_TEST_PLAN.md`
- Create: `docs/director-recovery/09_RISK_REGISTER.md`

- [ ] **Step 1: Define frozen contracts**

Specify the future `VisualUnit`, `EffectCapabilityCandidate`, `EffectDataContract`, per-unit candidate bundle, `SelectionTrace`, and `CompositionLintResult` shapes; identify existing modules to reuse and new modules to add.

- [ ] **Step 2: Define GOLDEN-001…006 as executable acceptance cases**

Include four-step process preservation, non-numeric rejection, duration max enforcement, distinct candidate scopes, no fabricated numbers, and explicit fallback visibility. Each case includes input fixture, expected output/assertions, and the real runtime path it must exercise.

- [ ] **Step 3: Record risks and gates**

List model switching as a role boundary (`MODEL_SWITCH_REQUIRED=LUNA` when unavailable), real credential/media requirements, layout-context gaps, migration hazards, and all anti-degradation conditions. No P0 is deferred as TODO or fallback.

### Task 5: Start the shared dashboard and close the Phase 1 gate

**Files:**
- Modify: `.ai-ledger/*` and `.ai-ledger/extensions/*` through the Skill's atomic writers only
- Create/update: Phase 1 Markdown ledger artifacts as required by the existing project convention

- [ ] **Step 1: Start or reuse the shared dashboard**

Run:

```powershell
node C:\Users\Administrator\.codex\skills\ai-autonomous-project-ledger-skill\scripts\ledger-dashboard.mjs start F:\CCPJ\CueCut3
```

Expected: the existing healthy dashboard is reused or a shared runtime starts once; control returns immediately to execution.

- [ ] **Step 2: Run the Phase 1 fidelity checks**

Run:

```powershell
node C:\Users\Administrator\.codex\skills\ai-autonomous-project-ledger-skill\scripts\requirement-validate.mjs F:\CCPJ\CueCut3
node C:\Users\Administrator\.codex\skills\ai-autonomous-project-ledger-skill\scripts\fidelity-gate.mjs F:\CCPJ\CueCut3 --final --prd F:\CCPJ\CueCut3\CueCut_Director_Architecture_Recovery_Phase1_3_Codex_PRD_v1.md
```

Expected: requirement validation passes; fidelity remains blocked until Phase 2 Core Freeze exists, which is correct at the Phase 1 boundary and must be recorded rather than hidden.

- [ ] **Step 3: Mark only verified Phase 1 work**

Update task evidence and requirement evidence using the Skill's dual-write order. Keep all implementation requirements `NOT_IMPLEMENTED` or `IN_PROGRESS`; do not emit `PROJECT_COMPLETED`, `CORE_FREEZE_CREATED`, or Phase 2 completion before the corresponding evidence exists.
