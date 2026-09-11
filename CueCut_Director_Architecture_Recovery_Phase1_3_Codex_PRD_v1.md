# CueCut Director 架构恢复与核心修复执行规范
## Phase 1–3 Codex 执行 / Phase 4 独立 GitHub 验收
Version: 1.0

> 本文档的目标不是让 Codex “重新理解需求后自行简化实现”，而是把已经发现的 CueCut Director 根因转成不可降级的工程约束、测试和阶段门禁。
>
> 本文档默认使用现有 `ai-autonomous-project-ledger-skill` 管理 Git、Machine Ledger、Dashboard、Task、Test 和 Final Acceptance。
>
> **重要：执行 AI 不能把本文中的 MUST / P0 要求降级为 MVP、临时方案、TODO、fallback 或“先跑通再说”。**

---

# 0. 执行模式

整个修复分为四个阶段：

```text
Phase 1  架构恢复 / Requirement Recovery
         → Codex + GPT-5.6 Sol High/Extra High
         → 禁止修改生产实现

Phase 2  Core Architecture / Golden Path
         → Codex + GPT-5.6 Sol High/Extra High
         → 实现核心契约、硬校验和 Golden Path
         → 完成后 Core Freeze

Phase 3  Production Expansion / Bulk Implementation
         → Codex + GPT-5.6 Luna High/Extra High
         → 只能在 Core Freeze 契约内扩展
         → 测试、Adapter、Manifest、UI/Trace、迁移等

Phase 4  Independent Review
         → Push 到 GitHub
         → 由独立 Reviewer 重新读取仓库、Diff、测试、真实产物验收
```

如果 Codex 当前环境不能在同一 Session 自动切换模型：

- Phase 1/2 完成后输出：
  `MODEL_SWITCH_REQUIRED=LUNA`
- 保持同一项目、同一 `.ai-ledger`、同一 Requirement Matrix。
- 用户切换到 Luna 后只执行 Phase 3。
- **禁止 Luna 重新规划 Phase 1/2 已冻结架构。**

---

# 1. 当前已知根因（必须先验证，再修）

以下是当前仓库已经暴露出的高风险点。Phase 1 必须逐条通过源码确认，不允许直接假定，也不允许忽略。

## ROOT-001 — Effect Capability 被压扁

当前生成入口把完整 `EffectDefinition` 转成近似：

```ts
{
  id: `${familyId}:${variantId}`,
  tags: semanticTags
}
```

而真实 Registry 中原本还包含：

- displayName
- contentSlots
- minDurationSec
- maxDurationSec
- supportedAspectRatios
- recommendedMotionCategories
- recommendedSfxIntents
- defaultProps
- useCases
- avoidCases
- supportedStyles
- supportedMotions
- timingCapabilities
- layoutCapabilities
- visualTags
- source/license metadata

必须验证最终发给 Director 的 payload 到底丢失了哪些字段。

---

## ROOT-002 — 全片一次性 semanticTags

当前 `contextBuilder` 疑似把整条 transcript 拼成一段文本，再通过数字/比较/引用/强调等正则生成一组全局标签。

这会把：

```text
“4步”
“第一步”
“第二步”
“10分钟”
```

污染成全片 `number/data` 倾向。

必须证明实际调用路径，并删除“整片单一标签决定所有 Effect 候选”的架构。

---

## ROOT-003 — 全片一次 Top-N Effect

当前疑似：

```text
whole transcript
→ global tags
→ retrieveCandidates(..., 8)
→ whole video shares same 8 candidates
```

这违反：

```text
每个 Visual Unit / semantic unit 应获得自己的候选集
```

禁止用“把 Top 8 改成 Top 16/32”作为修复。

---

## ROOT-004 — Retriever 只做 tag overlap

当前检索评分疑似只计算：

```text
candidate.tags 与 requestedTags 的交集数量
```

必须升级成 capability-aware retrieval。

---

## ROOT-005 — DirectorInput 贫血

当前 `effectCandidates` 疑似只有：

```ts
{id, tags}
```

必须建立真正的 Compact Capability Contract。

---

## ROOT-006 — Validator 只校验 ID / Schema，不校验语义数据

必须检查当前 Validator 是否允许：

```json
{
  "familyId": "numeric",
  "content": {
    "value": "盲区定位"
  }
}
```

如果允许，则属于 P0 缺陷。

---

## ROOT-007 — Duration Capability 没有硬校验

已知 Registry 中某些 numeric ring 的 maxDuration 约为 8 秒，而失败 Composition 曾出现约 31 秒持续时间。

必须增加代码级 duration validation / repair policy。

---

## ROOT-008 — Visual Context 没有真实接入

生成入口当前疑似：

```ts
subjectZones: []
faceZones: []
```

必须检查项目是否已经存在人物/人脸/禁放区/安全边距计算模块。

- 如果已有：必须接真实数据，不允许重新做一套重复模块。
- 如果没有：建立正式接口和明确 P0/P1 Gap，不允许伪造 subject/face coordinates。

---

## ROOT-009 — Density/coverage 只是 Prompt 意图

当前 Director Meta 可能写 `densityTargetPerMin=9`，但没有代码级 coverage/density linter。

必须建立“视觉事件”而不是简单“Effect Object 数量”的统计定义。

例如：

```text
一个 StepTimeline
+ 4 个 item reveal
```

可以计为多个 visual events，不能机械要求 4 个独立 Effect Object。

---

# 2. 不可降级 Requirement Matrix

Phase 1 必须创建：

```text
docs/director-recovery/REQUIREMENT_TRACEABILITY.md
docs/director-recovery/requirement-traceability.json
```

注意：不要修改 `.ai-ledger` 的七文件运行时契约；Requirement Matrix 属于项目工程文档/扩展数据。

每个 Requirement 至少包含：

```json
{
  "requirementId": "REQ-DIR-001",
  "priority": "P0",
  "must": true,
  "source": "Director Recovery Spec",
  "title": "...",
  "implementationTasks": [],
  "codeEvidence": [],
  "testEvidence": [],
  "acceptanceStatus": "NOT_VERIFIED"
}
```

以下 Requirement 是最小集合。

---

## REQ-DIR-001 — 全局语义理解必须存在

Director 生成前/生成过程中必须基于完整 SRT 理解：

- 主题
- Hook
- 章节
- 论点
- Evidence
- Comparison
- Ordered Process
- List
- Definition
- Conclusion
- 跨多个 SRT 的语义结构

禁止：

```text
一条 SRT = 一个 Effect
```

禁止：

```text
整条 SRT = 一组全局 tags
```

作为最终语义模型。

---

## REQ-DIR-002 — Visual Unit 必须是一等数据结构

建立正式 `VisualUnit` Contract。

至少表示：

```ts
interface VisualUnit {
  visualUnitId: string;
  sourceSubtitleIds: string[];
  startSec: number;
  endSec: number;

  semanticIntent: string;
  importance: number;

  structure?: {
    type: string;
    items?: Array<{
      id: string;
      text: string;
      startSec?: number;
      endSec?: number;
    }>;
  };

  extractedData?: {
    numbers?: number[];
    percentages?: number[];
    labels?: string[];
    orderedItems?: string[];
  };
}
```

最终字段名可根据现有类型系统调整，但语义能力不得缩水。

---

## REQ-DIR-003 — 候选召回必须按 Visual Unit 发生

禁止：

```text
whole video → one global Top-N candidate list
```

目标：

```text
Visual Unit A → candidates A
Visual Unit B → candidates B
Visual Unit C → candidates C
```

如果为了“一次 Director LLM 调用”需要采用 Hybrid 方案，可在 Phase 1 比较以下方案：

### Option A
Local seed segmentation + per-unit retrieval + one Director call

### Option B
Category router + per-category candidate bundles + one Director call

### Option C
将完整 Compact Capability Index 交给一次 Director call
仅在真实 token budget 可接受时使用

Phase 1 必须基于：
- 当前 Effect Registry 实际数量
- Compact Index token 大小
- Director 模型上下文
- 一次调用约束

做选择。

**禁止未经分析直接回到 global Top 8。**

---

## REQ-DIR-004 — Effect Candidate 必须包含 Compact Capability

AI 至少需要获得：

```ts
interface EffectCapabilityCandidate {
  familyId: string;
  variantId: string;
  displayName: string;

  semanticTags: string[];
  visualTags?: string[];

  contentSlots: string[];

  minDurationSec: number;
  maxDurationSec: number;

  supportedAspectRatios: string[];

  useCases?: string[];
  avoidCases?: string[];

  timingCapabilities?: string[];
  layoutCapabilities?: string[];

  dataContract?: EffectDataContract;
}
```

不要把完整 React 源码塞给模型。

也不要只传 `id + tags`。

---

## REQ-DIR-005 — Data Contract 必须代码级执行

Effect Data Contract 不是 Prompt 建议。

例如 Numeric：

```text
numeric value
→ 必须可解析为 number
```

如果：

```text
value = "盲区定位"
```

必须：

```text
FAIL / reject candidate / deterministic repair
```

而不是继续输出。

至少覆盖：

- numeric / percentage / ring
- list
- steps
- comparison
- quote
- progress
- ranking
- chart/data families

---

## REQ-DIR-006 — 不得发明数据

Numeric/Data visualization 只能来自：

```text
SRT explicit
user-provided
project-data
```

例如字幕只有：

```text
“增长很快”
```

禁止生成：

```text
78%
```

---

## REQ-DIR-007 — Duration 必须满足 Capability

Effect 时间必须满足：

```text
minDurationSec <= duration <= maxDurationSec
```

如果某种 Effect 支持 persistent / item-reveal 等特殊 timing capability，可通过显式 capability 例外。

禁止普通 numeric ring 从 8 秒 max 自动变成 31 秒。

---

## REQ-DIR-008 — Ordered Process 必须保留完整结构

真实回归案例中的“AI 读书 4 步法”必须识别为一个整体过程。

必须保留：

1. 第一步
2. 第二步
3. 第三步
4. 第四步

允许表现为：

- StepTimeline
- Checklist
- FlowSteps
- ProcessTimeline
- 其他真正支持 ordered process 的 Effect

禁止表现成：

```text
Step 1 → numeric ring
Step 2 → numeric ring
Step 3 → no effect
Step 4 → no effect
```

---

## REQ-DIR-009 — Element-level Cue

对于：

- Steps
- Checklist
- List
- Ranking
- Process

必须支持 item-level timing。

目标结构类似：

```json
{
  "items": [
    {"text": "第一步", "cue": {"startSec": 24.0}},
    {"text": "第二步", "cue": {"startSec": 53.0}},
    {"text": "第三步", "cue": {"startSec": 116.0}},
    {"text": "第四步", "cue": {"startSec": 127.0}}
  ]
}
```

不要求完全采用此字段名，但必须能表达逐项 reveal。

---

## REQ-DIR-010 — Layout 不能依赖空 subject/face 数据

必须检查并接入现有：

- subject zone
- face zone
- subtitle reserved zone
- safe margins
- edge safe area
- no-go zones

如果项目已有模块，必须复用。

AI 输出 preferred placement intent，本地 Layout Solver 负责最终合法坐标。

---

## REQ-DIR-011 — Composition Linter

最终 Composition 在进入 Workspace 前必须通过本地 Linter。

至少检查：

- unknown effect/motion/sfx ID
- content/data contract
- min/max duration
- project time range
- high-importance coverage
- ordered structure completeness
- excessive repetition
- visual event density
- aspect-ratio compatibility
- illegal numeric fabrication
- invalid item cues
- layout bounds / safe-area constraints（在可获得视觉上下文时）

---

## REQ-DIR-012 — Selection Trace

生成结果必须提供足够 trace，证明当前 Director 实际看过什么。

建议：

```json
{
  "selectionTrace": {
    "visualUnitId": "vu-...",
    "semanticIntent": "ordered_process",
    "retrievedCandidates": [
      "step-timeline:...",
      "checklist:...",
      "flow-steps:..."
    ],
    "selected": "step-timeline:...",
    "dataContractPassed": true,
    "durationContractPassed": true
  }
}
```

生产 Composition 如不希望携带全部 Debug Trace，可：

- Debug build 完整保存；
- Production build 保留摘要；
- 或写入旁路 `director-trace.json`。

但测试必须能获取。

---

## REQ-DIR-013 — Density 必须定义为 Visual Events

不要简单用 Effect Object count。

定义：

```text
effect enter = visual event
element-level reveal = visual event
major state transition = visual event
```

Linter 对 Visual Director 的 density target 做范围检查。

不要为了凑 9/min 强制堆无意义卡片。

---

## REQ-DIR-014 — Fallback 不得伪装成高质量成功

如果 LLM Provider 失败或结构化输出失败进入 local fallback：

- `usedFallback=true`
- UI / logs / trace 必须明确显示
- fallback 不得被 Final Acceptance 当作 Director 成功案例
- 真实 Golden Path 验收必须 `usedFallback=false`

---

# 3. Phase 1 — Architecture Recovery
## 模型：GPT-5.6 Sol High / Extra High
## 生产源码：冻结

Phase 1 只允许：

- 读代码
- 运行现有测试
- 运行诊断
- 生成报告/trace
- 更新项目台账
- 创建 `docs/director-recovery/*`

禁止修改 Director 生产行为。

---

## 3.1 必须审计的调用链

从真实视频导入入口开始，逐文件追踪：

```text
Video Import
→ Generation Route
→ Audio Extract
→ ASR
→ Transcript
→ Context Builder
→ Effect Registry
→ Motion Registry
→ SFX Registry
→ Retriever
→ DirectorInput
→ Prompt Builder
→ Provider
→ Response Parser
→ Candidate Validator
→ Composition Schema
→ Layout Solver
→ Workspace
→ Export
```

每一步记录：

```text
Input
Output
Data lost
Validation
Fallback
Test coverage
```

---

## 3.2 必须输出的 Phase 1 文档

```text
docs/director-recovery/
├─ 00_CURRENT_CALL_GRAPH.md
├─ 01_REQUIREMENT_TRACEABILITY.md
├─ 02_ROOT_CAUSE_REPORT.md
├─ 03_DATA_FLOW_LOSS_MAP.md
├─ 04_EFFECT_CAPABILITY_GAP.md
├─ 05_RETRIEVAL_ARCHITECTURE_OPTIONS.md
├─ 06_SELECTED_ARCHITECTURE.md
├─ 07_FILE_BY_FILE_CHANGE_PLAN.md
├─ 08_GOLDEN_TEST_PLAN.md
├─ 09_RISK_REGISTER.md
└─ requirement-traceability.json
```

---

## 3.3 Phase 1 Gate

进入 Phase 2 前必须满足：

- 所有 ROOT-001~009 有源码证据。
- 所有 REQ-DIR-001~014 映射到实现 Task。
- 选定单次 Director Call 下的 retrieval architecture。
- 确定不需要第二次 LLM 修 JSON。
- 确定哪些现有模块复用，哪些新增。
- 明确 Core Freeze 接口。
- Golden Test 已设计。
- 不允许存在：
  `“后面再处理”` 的 P0 Requirement。

---

# 4. Phase 2 — Core Architecture / Golden Path
## 模型：GPT-5.6 Sol High / Extra High

Phase 2 只实现“最容易造成架构偏差”的核心。

---

## 4.1 Core Contracts

至少落地：

```text
VisualUnit
EffectCapabilityCandidate
EffectDataContract
PerUnitCandidateSet / CandidateBundle
SelectionTrace
CompositionLintResult
```

---

## 4.2 Core Pipeline

实现：

```text
Transcript
↓
Global/Seed Semantic Planning
↓
Visual Units
↓
Capability-aware candidate retrieval
↓
DirectorInput v2
↓
ONE Director Call
↓
Structured Composition
↓
Data Contract Validation
↓
Duration Validation
↓
Coverage / Density / Structure Lint
↓
Layout Resolution
↓
Workspace
```

具体“一次调用约束”下的 planner/retrieval 方法以 Phase 1 选定架构为准。

---

## 4.3 必须删除或替换的错误模式

不允许继续存在生产路径：

```text
whole transcript
→ regex global tags
→ one global Top 8
```

如果旧函数为兼容测试必须保留：

- 标记 deprecated
- 不进入 Golden Path
- 添加测试证明主生成路径不调用

---

## 4.4 Validator 必须从 ID Validator 升级

至少建立以下验证：

```text
ID validity
Content slot validity
Data type validity
Duration validity
Aspect ratio validity
Ordered structure completeness
No invented numeric data
Item cue validity
```

---

## 4.5 Golden Tests

必须使用真实失败案例做回归。

### GOLDEN-001 — 4 Step Reading Process

输入包含：

```text
第一步
第二步
第三步
第四步
```

必须：

- 识别为完整 ordered process；
- 4 个 item 全部存在；
- 每个 item 与对应 subtitle/time 可追踪；
- 候选含至少一个 Step/Checklist/Process 类能力；
- 不允许以 Numeric Ring 表示纯文字步骤；
- 不遗漏第三步/第四步。

---

### GOLDEN-002 — Non-numeric text cannot enter Numeric

```text
value = "盲区定位"
```

Validator 必须失败。

---

### GOLDEN-003 — Duration contract

Registry：

```text
maxDurationSec=8
```

Composition：

```text
duration=31
```

必须失败或按明确 deterministic policy 修复。

不能静默通过。

---

### GOLDEN-004 — Candidate scope

对至少三个不同 Visual Units：

```text
ordered_process
quote
comparison
```

它们获得的 candidate bundle 必须可以不同。

测试必须能证明系统不是全片共享同一 Top-N。

---

### GOLDEN-005 — No fabricated number

字幕：

```text
“增长很快”
```

不得生成具体百分比。

---

### GOLDEN-006 — Fallback visibility

Provider 故意失败时：

```text
usedFallback=true
```

并且 Golden Acceptance 不得把 fallback 输出算 PASS。

---

# 5. Core Freeze

Phase 2 完成后创建：

```text
docs/director-recovery/CORE_FREEZE.md
```

冻结：

```text
VisualUnit contract
Capability contract
Data contract
Retriever contract
DirectorInput v2
SelectionTrace contract
Linter contract
Golden tests
```

任何 Phase 3 修改这些接口：

```text
必须创建 REQUIREMENT_DEVIATION
```

未经人工批准不得合并。

---

# 6. Phase 2 Gate

必须全部满足：

- REQ-DIR-001~014 至少有 Core Evidence。
- GOLDEN-001~006 全部 PASS。
- production generation path 不再使用 global Top-8 architecture。
- Numeric text misuse 被代码阻止。
- duration capability 被代码阻止。
- ordered process 不遗漏 item。
- DirectorInput 能证明携带 capability。
- Selection Trace 可证明实际候选。
- `usedFallback=false` 的 Golden Path 已成功执行。
- build/typecheck/tests 通过。
- Core Freeze 文档完成。

此时才允许 Phase 3。

---

# 7. Phase 3 — Luna 批量实现
## 模型：GPT-5.6 Luna High / Extra High

Phase 3 的职责是扩展，不是重新设计。

允许：

- 批量补 Effect Capability Manifest
- 补 Data Contracts
- Adapter migration
- Registry cleanup
- Debug/Trace Viewer
- UI 状态展示
- Test fixtures
- Unit tests
- Integration tests
- Documentation
- performance/cache
- repetitive refactor
- legacy migration

禁止：

- 把 per-unit retrieval 改回 global retrieval
- 把 semantic planner 改成全局 regex
- 把 hard validator 改成 Prompt-only
- 删除 Selection Trace
- 删除 Golden Tests
- 降低 MUST/P0 Requirement
- 为“先跑通”绕过 Data Contract
- 将 failing tests skip
- 将不完整功能标记 COMPLETED

---

# 8. Requirement Fidelity Gate

Codex 每个 Task 开始前必须读取：

```text
Requirement ID
Core Contract
Acceptance Test
```

每个 Task 完成时必须更新：

```text
implementation evidence
test evidence
acceptance status
```

禁止仅凭：

```text
TASK COMPLETED
```

判定 Requirement 完成。

---

# 9. Anti-Degradation Rule

以下行为均视为 Requirement Deviation：

- 用 regex 代替明确要求的 semantic planning；
- 用全片 Top-N 代替 per-unit retrieval；
- 用 mock/fixture 代替真实 runtime path 并宣称完成；
- 删除 validator/linter/hard guard；
- 只完成类型声明但 runtime 未接通；
- 只完成 UI 但真实 generation path 未使用；
- 用 TODO 代替 P0；
- 为通过测试而降低断言；
- skip/disable Golden Test；
- 将 fallback 输出作为成功验收。

一旦发生：

```text
acceptanceStatus = BLOCKED
```

直到修复或人工批准。

---

# 10. Git / Ledger 规则

调用现有：

```text
C:\Users\Administrator\.codex\skills\ai-autonomous-project-ledger-skill
```

并遵守其：

- Git Gate
- Machine Ledger
- Dashboard Gate
- dual write
- atomic write
- WAITING_USER
- checkpoint
- security
- Final Acceptance

但注意：

**Ledger Skill 负责项目执行过程，不拥有修改本文 MUST Requirement 的权限。**

如果 Skill 的任务拆解与本文冲突：

```text
本文 Requirement / Phase Gate 优先
```

不得通过“自主优化任务拆分”降低需求。

---

# 11. Git Checkpoint

建议：

```text
Phase 1
docs(director): complete architecture recovery

Phase 2
refactor(director): implement capability-aware golden path

Phase 3
feat(director): complete production capability migration
```

每个 checkpoint 前：

- test
- diff review
- secret check
- 不混入无关用户修改

默认不 push，直到 Phase 3 完成且用户要求。

---

# 12. Phase 3 Final Local Acceptance

Push 前必须生成：

```text
docs/director-recovery/
├─ 10_PHASE2_TEST_RESULTS.md
├─ 11_PHASE3_IMPLEMENTATION_REPORT.md
├─ 12_REQUIREMENT_EVIDENCE.md
├─ 13_REAL_WORLD_REGRESSION.md
└─ 14_PRE_PUSH_ACCEPTANCE.md
```

必须重新用真实失败 SRT/视频生成 Composition。

至少报告：

```text
usedFallback
visual unit count
visual event count
visual events per minute
effect family distribution
candidate diversity
high-importance coverage
data-contract failures
duration violations
ordered-process completeness
layout context availability
selection-trace coverage
```

---

# 13. Push 后 Phase 4

Phase 3 完成后：

```text
commit
push
```

然后停止自我宣布最终通过。

最终状态：

```text
WAITING_REVIEW
```

不要写：

```text
PROJECT_COMPLETED
```

Phase 4 由独立 Reviewer 完成。

Reviewer 将重新检查：

```text
latest GitHub push
PRD / Requirement Matrix
source code
Git diff
tests
Golden Tests
real generated composition
selection trace
fallback state
```

Reviewer 不以开发 AI 的完成总结为事实依据。

---

# 14. Codex Master Prompt

把下面内容作为执行入口：

```text
你现在负责 CueCut Director 架构恢复项目。

首先读取本文件全文，然后调用：

C:\Users\Administrator\.codex\skills\ai-autonomous-project-ledger-skill

进入自主台账模式。

注意：Ledger Skill 只能管理执行流程，不得简化、删除或降低本文件任何 MUST / P0 Requirement。

本任务分为三个本地执行阶段：

Phase 1：
使用 GPT-5.6 Sol High/Extra High。
只做 Architecture Recovery。
生产源码冻结。
必须完成 Root Cause、Requirement Traceability、Data Flow Loss Map、Retrieval Architecture、Golden Test Plan。

Phase 2：
继续使用 GPT-5.6 Sol High/Extra High。
实现核心 Golden Path：
VisualUnit、Capability Contract、Per-Unit Retrieval、Data Contract、Duration Validation、Selection Trace、Composition Linter、Golden Tests。
完成后建立 CORE_FREEZE.md。

Phase 3：
如果当前环境支持模型切换，切换 GPT-5.6 Luna High/Extra High。
如果不支持，输出 MODEL_SWITCH_REQUIRED=LUNA 后暂停，不得让 Luna 重新规划 Phase 1/2。
Luna 只负责批量 Production Expansion。

严格禁止：
whole transcript → global regex tags → one global Top-N
作为正式生成架构。

严格禁止：
Numeric Effect 接收非 numeric value。

严格禁止：
Effect duration 超过 Capability maxDuration 后静默通过。

严格禁止：
遗漏 ordered process 中的重要 item。

严格禁止：
用 Prompt 建议代替代码级 Data Contract / Linter。

必须使用真实失败 SRT/视频做 Golden Regression。

Phase 3 完成后 commit + push，并把项目状态设为 WAITING_REVIEW。
不要自行写 PROJECT_COMPLETED。
最终 Phase 4 由外部独立 Reviewer 根据最新 GitHub Push 验收。

除非真正需要用户登录、2FA、API Credential、真实素材路径/权限或硬件操作，否则不要中途询问“是否继续”。

如果遇到技术问题，自行诊断、修复、测试、更新台账后继续。
```

---

# 15. 最终成功定义

真正成功不是：

```text
Build PASS
Tests PASS
JSON 能生成
```

而是：

```text
完整 SRT
→ 正确语义结构
→ 正确 Visual Units
→ 正确 Effect capability candidates
→ 正确 content/data
→ 正确 timing
→ 正确 item cues
→ 正确 layout intent/context
→ Linter PASS
→ Composition
```

并且失败案例不再出现：

```text
文字 → Numeric Ring
4步 → 只保留2步
max 8s → 实际31s
整片 → 只会少量 family
全部 → 同一个默认 layout
density target → 无代码约束
```
