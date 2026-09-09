# Context Packet｜WI-006

**Role:** R05 Skill Integration / Dual Write. **WI:** WI-006. **GP:** GP-02/GP-05. Dependency WI-001.

Using `writing-skills` discipline, run a baseline pressure scenario before editing the global `C:\Users\Administrator\.codex\skills\ai-autonomous-project-ledger-skill\SKILL.md`; document the missing machine-ledger behavior. Patch only the existing Skill plus `docs/skill-integration/**` and tests. Preserve current multi-agent gates. Add `.ai-ledger` initialization, status/schema/event rules, atomic order (tasks → project.updatedAt → runtime.lastWriteAt → events.jsonl → Markdown log), secret prohibition and dual-write requirements. Do not integrate Agent Board or modify Dashboard code.
