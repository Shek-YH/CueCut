# AI Project Ledger Dashboard V1 — PRD

> 目标：把 AI 自主开发项目中的 Markdown 台账，升级为“机器可读状态 + 人类可视化 Dashboard”，但暂不集成 Agent Board。
>
> 执行建议：Codex + `AI_Autonomous_Project_Ledger_Skill_v1`
>
> 设计基线：**Project Folder / Project ID 是项目主键；Session ID 只是执行记录。**

---

## 0. 项目定位

当前 AI 自主开发台账主要以 Markdown 形式存在，例如：

```text
00_PROJECT_ENTRY.md
01_ROLES_AND_RESPONSIBILITIES.md
02_CURRENT_STATE_AUDIT.md
03_EFFECT_LIBRARY_AUDIT.md
...
07_IMPLEMENTATION_LOG.md
08_TEST_PLAN.md
09_TEST_RESULTS.md
11_FINAL_ACCEPTANCE.md
```

Markdown 适合：
- AI 阅读
- 人工追溯
- 项目复盘
- 审计

但不适合：
- 实时状态展示
- 任务树
- 进度计算
- 阻塞汇总
- Agent / Session 状态关联
- Dashboard
- 程序稳定读取

因此新增：

```text
MD = 详细台账 / 审计文档
JSON = 实时机器状态
Dashboard = 人类查看层
```

V1 为**独立本地工具**，后续再考虑集成到 Agent Board。

---

# 1. 产品目标

开发一个本地运行的 AI Project Ledger Dashboard。

用户可以添加任意项目文件夹，例如：

```text
F:\CCPJ\CueCut3
F:\CCPJ\AgentBoard
F:\Project\SomeOtherApp
```

Dashboard 自动识别：

```text
<project-root>\.ai-ledger\
```

并实时展示：

- 项目总进度
- Phase 进度
- 任务树
- 主任务 / 子任务
- 未开始
- 进行中
- 阻塞
- 等待用户
- 等待验收
- 已完成
- 暂停
- 当前负责人
- Agent
- Session ID
- 依赖关系
- 阻塞原因
- 最近更新时间
- 产出文件
- 最近活动

---

# 2. 核心设计决策

## 2.1 项目标识

禁止用 Session ID 作为项目主键。

关系应为：

```text
Project Folder
    ↓
.ai-ledger/project.json
    ↓
projectId
    ↓
Project
├─ Tasks
├─ Roles
├─ Sessions
├─ Artifacts
└─ Events
```

例如：

```json
{
  "schemaVersion": 1,
  "projectId": "cuecut3-7f56e1a9",
  "name": "CueCut3",
  "rootPath": "F:\\CCPJ\\CueCut3",
  "createdAt": "2026-09-08T13:30:00-04:00",
  "updatedAt": "2026-09-08T13:38:22-04:00"
}
```

Session 只是：

```text
Project
└─ session_xxx
   └─ 负责或参与 T-021
```

---

# 3. V1 技术形态

建议技术栈：

## Backend

```text
Node.js 20+
TypeScript
Fastify（或项目已有轻量 HTTP 框架）
chokidar
SSE
zod
```

## Frontend

```text
React
TypeScript
Vite
CSS Variables / CSS Modules
```

如果项目已有成熟 UI 体系，可以沿用，但不要为了 Dashboard 引入大型设计框架。

## 数据层

V1 不需要数据库。

直接读取：

```text
<project-root>\.ai-ledger\
```

工具本身只保存项目列表：

```text
%APPDATA%\AIProjectLedgerDashboard\projects.json
```

或等价的跨平台用户数据目录。

---

# 4. 为什么使用 SSE

V1 推荐：

```text
File Watcher
    ↓
Ledger Store
    ↓
SSE
    ↓
Browser Dashboard
```

而不是 WebSocket。

原因：

- Dashboard 主要是服务端 → 前端推送
- 更简单
- 自动重连
- 足够满足实时刷新

后续需要 Dashboard 反向控制 Agent 时，再考虑 WebSocket。

---

# 5. `.ai-ledger` 标准目录

每个被 AI Autonomous Ledger 管理的项目，应存在：

```text
.ai-ledger/
├─ project.json
├─ tasks.json
├─ roles.json
├─ sessions.json
├─ artifacts.json
├─ events.jsonl
└─ runtime.json
```

Markdown 原台账继续保留在项目原有位置。

建议：

```text
docs/
└─ ledger/
   ├─ 00_PROJECT_ENTRY.md
   ├─ 01_ROLES_AND_RESPONSIBILITIES.md
   └─ ...
```

如果旧项目已经放在根目录，不强制移动。

---

# 6. 状态标准

统一使用以下枚举：

```ts
type TaskStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "WAITING_USER"
  | "WAITING_REVIEW"
  | "COMPLETED"
  | "PAUSED"
```

禁止自由文本状态作为机器状态。

---

# 7. 状态颜色

统一 Dashboard Color Token：

| Status | 中文 | 颜色 |
|---|---|---|
| NOT_STARTED | 未开始 | `#64748B` |
| IN_PROGRESS | 进行中 | `#3B82F6` |
| BLOCKED | 阻塞 | `#EF4444` |
| WAITING_USER | 等待用户 | `#F59E0B` |
| WAITING_REVIEW | 等待验收 | `#8B5CF6` |
| COMPLETED | 已完成 | `#22C55E` |
| PAUSED | 暂停 | `#475569` |

任务卡左侧必须显示状态色条。

示例：

```text
│████│ T-021 接入 Effect Registry
│蓝色│ 进行中 · 56%
```

不要只用颜色表达状态，同时必须显示文字 / Icon，避免可访问性问题。

---

# 8. Tasks 数据结构

`tasks.json`：

```json
{
  "schemaVersion": 1,
  "projectId": "cuecut3-7f56e1a9",
  "updatedAt": "2026-09-08T13:38:22-04:00",
  "tasks": [
    {
      "id": "T-021",
      "phaseId": "P02",
      "parentId": null,
      "title": "接入 Effect Registry",
      "description": "将候选动效注册进 CueCut Registry。",
      "status": "IN_PROGRESS",
      "progress": 56,
      "priority": "P0",
      "roleId": "R01",
      "agent": "codex",
      "sessionId": "session_xxx",
      "dependsOn": ["T-020"],
      "blockedReason": null,
      "waitingUserReason": null,
      "startedAt": "2026-09-08T12:40:00-04:00",
      "updatedAt": "2026-09-08T13:38:22-04:00",
      "completedAt": null,
      "artifacts": [
        "src/motions/registry/index.ts"
      ],
      "children": ["T-021-01", "T-021-02"]
    }
  ]
}
```

---

# 9. Progress 计算规则

## 9.1 叶子任务

叶子任务允许：

```text
NOT_STARTED = 0
IN_PROGRESS = 1~99
BLOCKED = 保留当前进度
WAITING_USER = 保留当前进度
WAITING_REVIEW = 建议 90~99
COMPLETED = 100
PAUSED = 保留当前进度
```

但 AI 不得随意猜百分比。

## 9.2 父任务

父任务优先从子任务自动计算。

默认权重：

```text
NOT_STARTED      = 0.0
IN_PROGRESS      = 0.5
BLOCKED          = current child progress
WAITING_USER     = current child progress
WAITING_REVIEW   = 0.9
COMPLETED        = 1.0
PAUSED           = current child progress
```

如果每个子任务有明确 `progress`，优先使用其 progress。

父任务：

```text
parentProgress =
sum(childProgress * childWeight)
/
sum(childWeight)
```

V1 默认所有子任务权重为 1。

未来可增加：

```json
"weight": 2
```

---

# 10. Phase

建议任务支持：

```json
{
  "phaseId": "P02"
}
```

Phase 数据可以放在：

```text
project.json
```

或独立：

```text
phases.json
```

V1 建议直接放 `project.json`：

```json
{
  "phases": [
    {
      "id": "P01",
      "name": "项目分析",
      "order": 1
    },
    {
      "id": "P02",
      "name": "开发实现",
      "order": 2
    },
    {
      "id": "P03",
      "name": "测试验收",
      "order": 3
    }
  ]
}
```

Phase Progress 根据所属 Task 自动计算。

---

# 11. Roles

`roles.json`：

```json
{
  "schemaVersion": 1,
  "roles": [
    {
      "id": "R01",
      "name": "Motion Architecture",
      "agent": "codex",
      "description": "负责 Effect Registry、Adapter 和架构。"
    }
  ]
}
```

---

# 12. Sessions

`sessions.json`：

```json
{
  "schemaVersion": 1,
  "sessions": [
    {
      "id": "session_xxx",
      "provider": "codex",
      "roleId": "R01",
      "status": "ACTIVE",
      "startedAt": "2026-09-08T12:30:00-04:00",
      "lastSeenAt": "2026-09-08T13:38:00-04:00",
      "taskIds": ["T-021"]
    }
  ]
}
```

V1 只展示，不负责控制 Session。

---

# 13. Artifacts

`artifacts.json`：

```json
{
  "schemaVersion": 1,
  "artifacts": [
    {
      "id": "A-001",
      "taskId": "T-021",
      "type": "source",
      "path": "src/motions/registry/index.ts",
      "exists": true,
      "updatedAt": "2026-09-08T13:35:12-04:00"
    }
  ]
}
```

Dashboard 可以显示：

```text
T-021
├─ src/motions/registry/index.ts
└─ docs/effect-migration/...
```

---

# 14. Event Log

`events.jsonl` 为 append-only。

每行：

```json
{"eventId":"evt-001","ts":"2026-09-08T13:38:22-04:00","type":"TASK_STATUS_CHANGED","taskId":"T-021","from":"NOT_STARTED","to":"IN_PROGRESS","actor":"codex","sessionId":"session_xxx"}
```

事件类型至少：

```text
PROJECT_CREATED
TASK_CREATED
TASK_UPDATED
TASK_STATUS_CHANGED
TASK_PROGRESS_CHANGED
TASK_BLOCKED
TASK_UNBLOCKED
WAITING_USER
USER_INPUT_RECEIVED
TASK_COMPLETED
ROLE_ASSIGNED
SESSION_STARTED
SESSION_ENDED
ARTIFACT_CREATED
ARTIFACT_UPDATED
TEST_STARTED
TEST_PASSED
TEST_FAILED
```

---

# 15. runtime.json

用于监控 Ledger 最近心跳：

```json
{
  "schemaVersion": 1,
  "projectId": "cuecut3-7f56e1a9",
  "ledgerWriter": "AI_Autonomous_Project_Ledger_Skill_v1",
  "active": true,
  "currentTaskIds": ["T-021"],
  "lastWriteAt": "2026-09-08T13:38:22-04:00"
}
```

Dashboard 顶部可以显示：

```text
🟢 Ledger Active · 13:38 updated
```

---

# 16. Atomic Write

AI / Skill 不允许直接覆盖 JSON 并留下半写状态。

推荐：

```text
tasks.json.tmp
↓
fsync / write complete
↓
rename
↓
tasks.json
```

Dashboard File Watcher 必须 debounce。

建议：

```text
100~250ms
```

---

# 17. Dashboard 页面

V1 页面：

```text
Overview
Tasks
Blockers
Activity
Roles
Artifacts
Settings
```

---

# 18. Overview

顶部：

```text
CueCut3
F:\CCPJ\CueCut3
72% Complete
Ledger Active
Last update 8 sec ago
```

统计：

```text
Completed      18
In Progress     4
Blocked         1
Waiting User    2
Not Started     7
```

Phase：

```text
项目分析        ██████████ 100%
动效迁移        ████████░░  80%
Renderer        █████░░░░░  50%
QA              ░░░░░░░░░░   0%
```

最近进行：

```text
T-021 接入 Effect Registry
R01 Motion Architecture
Codex
56%
```

---

# 19. Tasks 页面

需要支持：

```text
树形
列表
按 Phase 分组
按 Status 筛选
按 Role 筛选
按 Priority 筛选
搜索
```

树：

```text
P02 开发实现
├─ T-020 ✅ 导入基础动效
├─ T-021 🔵 Registry
│  ├─ T-021-01 ✅ 类型
│  ├─ T-021-02 🔵 注册
│  └─ T-021-03 ⚪ UI
├─ T-022 🔴 Renderer
└─ T-023 🟠 等待素材
```

---

# 20. Task Card

必须展示：

```text
状态色条
ID
Title
Status
Progress
Priority
Role
Agent
Session
Updated At
```

展开后：

```text
Description
Dependencies
Children
Artifacts
Blocked Reason
Waiting User Reason
Started At
Completed At
Recent Events
```

---

# 21. Blockers 页面

分成：

## BLOCKED

```text
🔴 T-022 Renderer Export
原因：motion/react export renderer 不兼容
负责人：R03
阻塞 28m
```

## WAITING_USER

```text
🟠 T-023 真实素材验证
需要：
- 9:16 口播视频
- SRT
```

两者禁止混合。

---

# 22. Activity 页面

从 `events.jsonl` 读取：

```text
13:38  T-021 → IN_PROGRESS
13:34  T-020 → COMPLETED
13:21  A-008 created
13:08  session_xxx started
```

支持：

```text
All
Task
Session
Artifact
Test
User
```

---

# 23. Roles 页面

展示：

```text
R01 Motion Architecture
Agent: Codex

2 Active
5 Completed
1 Blocked
```

点击查看负责的 Task。

---

# 24. Artifacts 页面

按任务 / 类型展示：

```text
Source
Docs
Tests
Assets
Reports
```

V1 默认只展示路径。

允许：

```text
Copy Path
Open Parent Folder
```

Windows 可使用本地 Backend：

```text
explorer.exe /select,<path>
```

必须校验路径属于当前 Project Root。

---

# 25. Settings

V1：

```text
Project List
Add Project Folder
Remove from Dashboard
Reconnect Watcher
Theme
Refresh
```

删除项目：

```text
只从 Dashboard registry 移除
禁止删除用户项目目录
禁止删除 .ai-ledger
```

---

# 26. 添加项目

用户输入：

```text
F:\CCPJ\CueCut3
```

Backend：

1. 校验目录存在。
2. 查找 `.ai-ledger/project.json`。
3. 如果存在：
   - 注册。
4. 如果不存在：
   - 检查 Legacy MD Ledger。
5. 如果检测到旧 MD：
   - 提示/执行 Legacy Migration。
6. 如果完全不存在：
   - 创建空 `.ai-ledger` 项目骨架。

---

# 27. Legacy MD Migration

V1 必须支持已有项目。

检测常见文件：

```text
00_PROJECT_ENTRY.md
01_ROLES_AND_RESPONSIBILITIES.md
*TASK*
*TODO*
*IMPLEMENTATION_LOG*
*TEST_PLAN*
*FINAL_ACCEPTANCE*
```

迁移原则：

- 不删除 MD
- 不移动 MD
- 不改写原历史
- 生成 `.ai-ledger`
- 无法可靠解析的内容标记：

```json
{
  "migrationConfidence": "LOW"
}
```

不要猜状态。

如果 Markdown 存在：

```text
- [x]
```

可转换：

```text
COMPLETED
```

如果：

```text
- [ ]
```

转换：

```text
NOT_STARTED
```

对于自然语言：

```text
正在开发
阻塞
等待用户
```

可以使用有限规则映射。

其余保持：

```text
NOT_STARTED
```

并记录 migration warning。

---

# 28. AI_Autonomous_Project_Ledger_Skill_v1 升级

Codex 必须查找当前 Skill。

目标：

```text
AI_Autonomous_Project_Ledger_Skill_v1
```

将其升级为：

```text
Markdown Ledger
+
Machine Ledger
```

以后 Skill 初始化项目时自动创建：

```text
.ai-ledger/
```

每次：

```text
创建任务
改变任务状态
改变 progress
产生 artifact
Session 切换
发生 blocker
等待用户
测试完成
```

必须同步 JSON / JSONL。

---

# 29. Machine Ledger 写入契约

任何 Task 状态变化必须：

```text
1. 更新 tasks.json
2. 更新 project.updatedAt
3. 更新 runtime.lastWriteAt
4. append events.jsonl
5. 必要时更新 Markdown implementation log
```

状态改变不得只写 Markdown。

---

# 30. Dashboard 只读原则

V1 Dashboard 对项目状态默认：

```text
READ ONLY
```

原因：

避免：

```text
AI 写 tasks.json
+
Dashboard 写 tasks.json
```

形成竞争。

V2 再增加人工改状态。

V1 允许的写行为仅：

```text
添加/移除 Dashboard project registry
Legacy Migration
初始化空 .ai-ledger
```

---

# 31. File Watcher

监听：

```text
.ai-ledger/*.json
.ai-ledger/*.jsonl
```

不要监听整个项目源码。

使用：

```text
chokidar
```

变化时：

```text
FS event
↓
debounce
↓
parse
↓
zod validation
↓
Ledger Store
↓
SSE event
↓
React state
```

---

# 32. SSE API

建议：

```text
GET /api/projects
POST /api/projects
DELETE /api/projects/:projectId

GET /api/projects/:projectId/snapshot
GET /api/projects/:projectId/events

GET /api/stream?projectId=...
```

SSE event：

```text
ledger:snapshot
task:changed
event:appended
runtime:changed
error
```

---

# 33. Snapshot

Dashboard 前端尽量消费一个聚合 Snapshot：

```json
{
  "project": {},
  "summary": {},
  "phases": [],
  "tasks": [],
  "roles": [],
  "sessions": [],
  "artifacts": [],
  "recentEvents": [],
  "runtime": {}
}
```

避免前端自己反复读取多个文件。

---

# 34. 错误处理

若 AI 正在原子写文件：

```text
tmp
↓
rename
```

不应出现半 JSON。

若文件仍解析失败：

Dashboard：

```text
Ledger data temporarily invalid
Last valid snapshot retained
```

不要直接把页面清空。

---

# 35. Last Known Good

Backend 每个项目维护内存：

```text
lastKnownGoodSnapshot
```

只有 schema validation 通过才替换。

---

# 36. 安全要求

本地 Server 默认：

```text
127.0.0.1
```

禁止默认监听：

```text
0.0.0.0
```

禁止读取：

```text
.env
API Key
Token
Cookie
credentials
SSH key
```

Watcher 只允许：

```text
.ai-ledger
```

Artifact open path 必须：

```text
resolvedPath.startsWith(projectRoot)
```

避免 path traversal。

---

# 37. Project Registry

Dashboard 自身：

```json
{
  "projects": [
    {
      "projectId": "cuecut3-7f56e1a9",
      "rootPath": "F:\\CCPJ\\CueCut3",
      "addedAt": "..."
    }
  ]
}
```

Dashboard 启动后自动 reconnect watcher。

---

# 38. UI 设计

目标：

```text
Linear / modern project status
+
developer dashboard
```

不要做：

```text
复杂企业 ERP
大面积渐变
过多玻璃效果
炫技动画
```

主要视觉：

```text
浅/深主题
状态色
清晰层级
高密度但易读
```

---

# 39. Task 状态条

Task card 左侧：

```css
width: 4px;
border-radius: 4px;
```

颜色由 status token 决定。

Progress bar：

```text
底色：neutral
前景：状态颜色
```

BLOCKED：

```text
progress 保留
但 bar 变红
```

WAITING_USER：

```text
progress 保留
bar 橙色
```

---

# 40. 项目总进度

项目总进度默认：

```text
所有叶子任务 progress 平均
```

未来支持 task weight。

已完成 Phase 不因为后续新增任务突然显示错误，可在 Phase 配置：

```json
"locked": true
```

V1 可不实现 locked，但 Schema 预留。

---

# 41. 性能

目标：

```text
1,000 tasks
10,000 events
```

Dashboard 仍正常工作。

Activity 默认只加载最近：

```text
200
```

事件。

后续再虚拟列表。

---

# 42. 测试数据

必须建立 fixture：

```text
fixtures/
├─ project-normal/
├─ project-blocked/
├─ project-waiting-user/
├─ project-legacy-md/
├─ project-corrupt-json/
└─ project-large/
```

---

# 43. 自动化测试

至少：

## Unit

```text
progress calculation
status summary
phase calculation
JSON schema
legacy checkbox parser
path validation
event parser
```

## Integration

```text
file watcher
atomic write
SSE update
last known good
project registry
```

## UI

```text
status color
task tree
filters
blockers
activity
project switch
```

---

# 44. 实时测试

测试：

```text
手工修改：

tasks.json

T-021:
IN_PROGRESS
↓
COMPLETED

要求 Dashboard 在 1 秒内变绿。
```

测试：

```text
WAITING_USER
```

要求：

```text
Blockers / Waiting User
```

立即出现。

---

# 45. 验收标准

V1 Definition of Done：

- [ ] 可以添加项目文件夹。
- [ ] 自动识别 projectId。
- [ ] Session ID 不作为项目主键。
- [ ] 能读取 `.ai-ledger`。
- [ ] 能迁移旧 Markdown Ledger。
- [ ] Markdown 不被删除。
- [ ] Task 有标准状态。
- [ ] 每种状态有不同颜色。
- [ ] Task 支持 progress。
- [ ] 父任务自动计算 progress。
- [ ] Phase 自动计算 progress。
- [ ] Overview 可用。
- [ ] Task Tree 可用。
- [ ] Blockers 页面可用。
- [ ] WAITING_USER 独立显示。
- [ ] Activity 可用。
- [ ] Roles 可用。
- [ ] Artifacts 可用。
- [ ] chokidar 实时监听。
- [ ] SSE 实时推送。
- [ ] 修改 tasks.json 后页面 1 秒内刷新。
- [ ] 错误 JSON 不破坏 last known good。
- [ ] Server 只监听 localhost。
- [ ] 不扫描项目 secrets。
- [ ] `AI_Autonomous_Project_Ledger_Skill_v1` 已升级为双写 MD + Machine Ledger。
- [ ] 有迁移文档。
- [ ] 有测试报告。
- [ ] 有最终验收报告。

---

# 46. 推荐项目目录

独立项目建议：

```text
AI-Project-Ledger-Dashboard/
├─ apps/
│  ├─ server/
│  │  └─ src/
│  │     ├─ api/
│  │     ├─ watcher/
│  │     ├─ ledger/
│  │     ├─ migration/
│  │     └─ security/
│  └─ web/
│     └─ src/
│        ├─ pages/
│        ├─ components/
│        ├─ stores/
│        ├─ styles/
│        └─ api/
├─ packages/
│  └─ ledger-schema/
│     ├─ src/
│     └─ schemas/
├─ fixtures/
├─ docs/
└─ package.json
```

如果 Codex 判断 monorepo 对 V1 过度，可以简化为：

```text
server/
web/
shared/
```

但 Schema 必须保持独立模块。

---

# 47. 台账自身

本项目本身也必须调用：

```text
AI_Autonomous_Project_Ledger_Skill_v1
```

进行开发。

也就是说 Dashboard 项目自身就是第一个真实 Dogfood 项目。

开发过程中：

```text
.ai-ledger/
```

要实时生成。

Dashboard 能够把自己作为项目加载进去。

---

# 48. Codex 自主执行角色

建议：

```text
R01 Ledger Architecture
R02 Backend / Watcher
R03 Dashboard UX
R04 Legacy Migration
R05 Skill Integration
R06 QA / Security
```

---

# 49. 项目开发台账文件

Codex 至少生成：

```text
00_PROJECT_ENTRY.md
01_ROLES_AND_RESPONSIBILITIES.md
02_ARCHITECTURE.md
03_LEDGER_SCHEMA.md
04_LEGACY_MIGRATION.md
05_BACKEND_IMPLEMENTATION.md
06_DASHBOARD_IMPLEMENTATION.md
07_SKILL_INTEGRATION.md
08_TEST_PLAN.md
09_TEST_RESULTS.md
10_SECURITY_REVIEW.md
11_FINAL_ACCEPTANCE.md
12_FOLLOW_UP_TODO.md
```

同时必须生成：

```text
.ai-ledger/
```

---

# 50. 非 V1 范围

暂不实现：

```text
Agent Board 集成
远程云 Dashboard
多人协作
账号系统
Dashboard 修改 Task
远程控制 Agent
Agent 消息发送
WebSocket 双向控制
云数据库
移动端 App
```

这些放 V2+。

---

# 51. 未来 Agent Board 接口预留

不要写死 UI。

核心能力必须放：

```text
ledger-schema
ledger-reader
ledger-watcher
ledger-snapshot
```

未来 Agent Board 可以直接复用。

理想：

```text
Agent Board
    ↓
Ledger SDK
    ↓
.ai-ledger
```

而不是重新解析 Markdown。

---

# 52. Codex 启动指令

```text
请在一个独立项目中开发 AI Project Ledger Dashboard V1。

先调用 AI_Autonomous_Project_Ledger_Skill_v1 进入自主项目台账模式。

必须先分析当前可用的 Skill 与项目环境，再建立角色、台账与任务树。

本项目核心要求：

1. 项目文件夹 / projectId 作为项目主键，Session ID 仅作为执行关联。
2. 原有 Markdown 台账继续保留。
3. 新增 .ai-ledger 机器可读状态层。
4. AI_Autonomous_Project_Ledger_Skill_v1 必须升级为双写 MD + Machine Ledger。
5. Dashboard 必须实时读取每个 Task 的状态与进度。
6. 不同状态使用固定颜色：
   - NOT_STARTED 灰
   - IN_PROGRESS 蓝
   - BLOCKED 红
   - WAITING_USER 橙
   - WAITING_REVIEW 紫
   - COMPLETED 绿
   - PAUSED 深灰
7. 使用文件监听 + SSE 实现接近实时刷新。
8. V1 Dashboard 默认只读。
9. 支持已有 Markdown 台账迁移。
10. 不读取 .env / Token / Cookie / API Key 等敏感文件。
11. Server 默认只绑定 127.0.0.1。
12. 需要完整测试，尤其是状态文件更新后 Dashboard 1 秒内更新。
13. Dashboard 必须能够加载自身项目的 .ai-ledger 做 Dogfood 测试。

除非遇到必须由用户本人处理的问题，否则不要中途停止等待确认。

最终输出：
- 架构
- Schema
- Migration
- Skill 修改
- Backend
- Dashboard
- Tests
- Security Review
- Final Acceptance
- Follow-up TODO
```

---

# 53. 最终原则

这不是一个“Markdown 美化器”。

真正的目标是建立：

```text
AI Project Runtime State
```

让未来：

```text
Codex
Claude
其他 Agent
AI_Autonomous_Project_Ledger_Skill
Agent Board
Dashboard
```

都围绕同一份项目机器状态协作。

Markdown 继续负责“解释发生了什么”。

`.ai-ledger` 负责“现在是什么状态”。

Dashboard 负责“让人一眼看懂”。
