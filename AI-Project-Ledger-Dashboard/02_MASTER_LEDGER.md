# Master Ledger｜AI Project Ledger Dashboard V1

**Epic:** `EPIC-GP-001｜Dashboard Core Golden Path`

| ID | Work Item | Owner | Verifier | Status | Priority | Dependencies | Golden Path | Next |
|---|---|---|---|---|---|---|---|---|
| WI-001 | Bootstrap + Ledger Schema | R01 | R90 | ACCEPTED | P0 | — | GP-02/03 | R90 PASS; 已开启 WI-002/WI-004 |
| WI-002 | Ledger Store + Snapshot + Progress | R01/R02 | R90 | ACCEPTED | P0 | WI-001 | GP-02/03 | R90 PASS |
| WI-003 | Watcher + Atomic Write + SSE/API | R02 | R90 | ACCEPTED | P0 | WI-002 | GP-05/06 | R90 PASS |
| WI-004 | Legacy Migration + Project Registry | R04 | R90 | ACCEPTED | P0 | WI-001 | GP-01/02/07 | R90 recheck PASS |
| WI-005 | Dashboard UX Pages | R03 | R90 | ACCEPTED | P0 | WI-002/003/009 | GP-04 | R90 final PASS |
| WI-006 | Skill Dual-Write Integration | R05 | R90 | ACCEPTED | P0 | WI-001 | GP-02/05 | R90 PASS |
| WI-007 | QA/Security/Dogfood | R06 | R90 | ACCEPTED | P0 | WI-003/004/005/006/010 | GP-05/06/08 | R90 PASS |
| WI-008 | Golden Path E2E + Final Acceptance | R00 | R90 | WAITING_USER | P0 | WI-007/011/012 | GP-01…GP-08 | R90 PASS; user view required |
| WI-009 | Secure Artifact Open-Parent-Folder Action | R02 | R90 | ACCEPTED | P0 | WI-002/003/004 | GP-04 | R90 PASS |
| WI-010 | Fix Activity recentEvents default to 200 | R02 | R90 | ACCEPTED | P0 | WI-002 | GP-04/05 | R90 PASS |
| WI-011 | Dynamic Add Project Backend API | R04 | R90 | ACCEPTED | P0 | WI-003/004 | GP-01/02 | R90 PASS |
| WI-012 | Settings Add Project Folder UI | R03 | R90 | ACCEPTED | P0 | WI-005/011 | GP-01/02/04 | R90 PASS |

状态控制面是 `.ai-ledger/tasks.json` 与 `docs/work-items/*.json`；Dashboard 不能写被观察项目的任务状态。
