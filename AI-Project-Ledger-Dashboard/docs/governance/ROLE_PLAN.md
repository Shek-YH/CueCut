# Role Plan｜AI Project Ledger Dashboard V1

`C4` requires separate schema, backend, migration, UI, skill and QA responsibilities. R00/R90 are mandatory governance roles.

| Role | Why needed | Non-overlap | Allowed paths |
|---|---|---|---|
| R00 | DAG/ledger/acceptance control | not R90 | governance, `.ai-ledger`, docs |
| R01 | schema/progress is shared contract | not R02/R03 | packages/ledger-schema, shared pure logic |
| R02 | filesystem/watcher/SSE/LKG are stateful | not R01/R03 | server/ledger, server/api, server/watcher |
| R03 | seven pages and accessibility need UI focus | not R02 | web/** |
| R04 | migration is conservative and potentially destructive | not R02 | server/migration, server/registry, tests/migration |
| R05 | global Skill file needs separate compliance ownership | not R03 | skill file, docs/skill-integration |
| R06 | cross-cutting QA/security/dogfood | not implementers | tests, fixtures, docs/evidence |
| R90 | independent verifier hard gate | not any owner | read-only review + evidence |

Parallel after WI-001: WI-002 and WI-004; after WI-002: WI-003 and WI-005; WI-006 can begin after schema contract; WI-007 waits for all.
