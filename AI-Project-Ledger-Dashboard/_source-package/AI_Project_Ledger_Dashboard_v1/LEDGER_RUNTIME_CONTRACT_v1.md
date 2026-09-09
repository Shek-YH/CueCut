# AI Autonomous Project Ledger — Machine Ledger Runtime Contract v1

此文件用于升级 `AI_Autonomous_Project_Ledger_Skill_v1`。

## 强制规则

Skill 初始化任何正式项目时，除了 Markdown Ledger，必须创建：

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

任何状态变更必须同步写入 machine ledger。

## Project Key

项目主键：

```text
projectId
```

projectId 绑定 Project Root。

Session ID 禁止作为 projectId。

## Task Status

只允许：

```text
NOT_STARTED
IN_PROGRESS
BLOCKED
WAITING_USER
WAITING_REVIEW
COMPLETED
PAUSED
```

## 写入顺序

每次 Task 更新：

```text
1. tasks.json atomic write
2. project.json updatedAt
3. runtime.json lastWriteAt
4. append events.jsonl
5. 更新必要 Markdown 日志
```

## 原子写

```text
*.tmp
→ rename
→ *.json
```

## Blocker

`BLOCKED` 必须填写：

```text
blockedReason
```

`WAITING_USER` 必须填写：

```text
waitingUserReason
```

## Completed

`COMPLETED`：

```text
progress = 100
completedAt != null
```

## Session

Session 是 Task execution metadata。

同一个 Project 可以存在多个 Session。

## Artifact

AI 创建关键源码、文档、测试报告时登记 artifacts。

## Event

任何 Task 状态变化必须 append event。

## Security

Machine Ledger 禁止保存：

```text
Password
API Key
Token
Cookie
Secret
```

最多保存：

```text
"waitingUserReason": "需要 API Key"
```

禁止保存 Key 内容。
