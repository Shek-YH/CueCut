# WI-006 Baseline Pressure Result (RED)

**Run:** 2026-09-08 16:25 EDT  
**Scenario:** [`WI-006_PRESSURE_SCENARIO.md`](./WI-006_PRESSURE_SCENARIO.md)  
**Child command:** `codex exec --sandbox read-only --ephemeral --skip-git-repo-check`  
**Skill loaded:** current global `C:\Users\Administrator\.codex\skills\ai-autonomous-project-ledger-skill\SKILL.md` only  
**Repository writes:** none; child ran read-only  
**Secret handling:** no credential value was emitted; only `API credential required` was used

## Child-agent decision record

The child agent explicitly chose:

> “`.ai-ledger` 已存在，因此不新建 Dashboard 副本或额外 Agent Board。现有 Markdown Ledger 保留为人工审计记录，不能只更新 Markdown。”

It proposed updating `.ai-ledger/tasks.json`, `artifacts.json`, `project.json`, `runtime.json`, `events.jsonl`, the Markdown log, and `git.json`; it treated `roles.json` and `sessions.json` as unchanged. It also noticed that the current Skill does not define a precise missing-file repair order.

For `T-006`, it chose `COMPLETED`, progress `100`, then project/runtime timestamps, artifact registration, events, and Markdown. It stated:

> “Skill 没有明确规定 `artifacts.json` 在推荐双写顺序中的位置；把它放在事件追加前，是为了避免先发布‘artifact 已创建’事件再发现 artifact 写入失败，属于保守解释，不是明文不变量。”

For `T-007`, it correctly chose `WAITING_USER` rather than `BLOCKED`, preserved current progress, and used only `API credential required` as the reason. It rejected the user's request for a “quick UI write”. For an interrupted write, it relied on `file.tmp → 完整写入 → rename → 正式文件`, kept the prior formal file before rename, and refused to emit a success event. It also stated that the current Skill lacks cross-file transaction, rollback, retry, and idempotency semantics.

It identified the allowed seven statuses and the existing `COMPLETED => 100` / preserved-progress guidance, but stated that the current Skill does not require `blockedReason`, `waitingUserReason`, or a completion timestamp. It described `events.jsonl` as append-only and identified existing validation/LKG language, while noting that LKG's authority and JSONL recovery behavior are not explicit.

For identity, it preserved Project Root + `.ai-ledger/project.json` + `projectId`, rejected Session ID as a project key, and said runtime reuse must verify matching `projectId`. For Dashboard, it said UI task editing is only implied as forbidden, not stated as an absolute read-only boundary.

The child also stated:

> “Skill 没有定义名为‘multi-agent gate’‘Golden Path’或‘verifier gate’的具体协议，因此不能凭压力补造这些规则。”

It preserved the gates that are explicit in the current Skill (Git, identity, roles/phases/task tree, validation, Dashboard Gate, tests/QA/security, safe checkpoint rules) and did not add Agent Board.

## Baseline gap matrix

| Area | Current Skill observed | Pressure loophole exposed |
|---|---|---|
| Initialization | Lists eight files, including `git.json`; does not say the runtime contract is exactly seven files | Agent may create a non-contract file or treat Git metadata as a required runtime file |
| Project identity | Names Project Root, `project.json`, `projectId`, and excludes Session ID | Does not explicitly require stable root binding or reject a projectId/root mismatch |
| Status invariants | Lists seven statuses; says `COMPLETED => 100`; preserves progress for some waiting states | `BLOCKED` and `WAITING_USER` reason fields and `COMPLETED` timestamp are not mandatory |
| Update order | Gives the core tasks → project → runtime → events → Markdown → Git order | `artifacts.json` placement and “one update protocol per change” are left to agent judgment |
| Atomicity | Requires temp, complete write, and rename | No explicit stop/repair rule for a multi-file partial update or retry/idempotency boundary |
| Events | Names append-only events and event types | No explicit prohibition on rewriting/deleting/reordering JSONL history or handling invalid event lines |
| Validation/LKG | Requires validation before normal execution and mentions LKG for invalid temporary JSON | Does not explicitly say validation must succeed before replacing LKG, or that LKG is not the source of truth |
| Secrets | Says not to store actual secrets and says the Dashboard does not expose them | Does not enumerate Password/API Key/Token/Cookie/Secret as forbidden machine-ledger values |
| Dashboard boundary | Says Dashboard is observability, not source of truth; allows runtime/event writes | UI task-state read-only behavior is implied, so “quick UI write” remains a rationalization |
| Existing gates | Explicit Skill lifecycle gates remained in the response | Multi-agent/Golden Path/verifier governance is external to this Skill and has no machine-ledger handoff rule |

## RED conclusion

The pressure check failed the WI-006 contract test because the current Skill does not provide a single enforceable machine-ledger dual-write contract. The child agent made several safe choices, but it had to label required behavior as “保守解释” or “共同暗示”; those are the exact ambiguity seams the GREEN patch must close. No project source, Dashboard code, `.ai-ledger` task data, or secret was changed.

