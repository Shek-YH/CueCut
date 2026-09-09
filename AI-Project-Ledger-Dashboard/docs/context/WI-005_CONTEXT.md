# Context Packet｜WI-005

**Role:** R03 Dashboard UX / React. **WI:** WI-005. **GP:** GP-04. Dependency WI-002.

Consume one aggregate `/api/projects/:projectId/snapshot`; browser never reads project files or writes task state. Preserve read-only V1: only project add/remove/init/migration controls may mutate. Implement Overview, Tasks tree with phase/status/role/priority/search filters, Blockers split BLOCKED vs WAITING_USER, Activity, Roles, Artifacts and Settings. Every status shows text plus icon/aria label and fixed token color; task card has 4px status bar. Tests first, no direct server changes; WI-009 supplies the secure artifact-open API contract.
