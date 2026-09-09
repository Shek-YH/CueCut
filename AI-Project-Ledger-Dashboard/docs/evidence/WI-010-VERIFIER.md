# WI-010 Independent Verification Evidence

Verdict: `PASS`

Role: R90 Independent Verifier  
Work item: `WI-010`  
Verifier executionRef (this spawn agent id): `01a08323-ff15-75c0-b38c-09007b016df5`  
Owner executionRef: `dce1960e-948a-46ff-81b5-7026190be7cb`  
Execution references distinct: `true`  
Verification date: `2026-09-08`

## Evidence reviewed

- `docs/context/WI-010_CONTEXT.md`: scope is the Activity recent-events limit, order, fewer-than-200 behavior, LKG preservation, and summary preservation.
- `docs/work-items/WI-010.json`: owner R02, verifier R90, allowed implementation paths, RT-06, and execution identity.
- `docs/evidence/WI-010.md` and `docs/handoffs/WI-010.md`: owner RED/GREEN record and claimed implementation boundary.
- `docs/evidence/WI-007.md`, `fixtures/project-large/fixture-manifest.json`, and `tests/qa/wi-007-qa.test.ts`: the prior 20-vs-200 finding and the 1,000-task/10,000-event QA fixture.
- `docs/source/AI_Project_Ledger_Dashboard_V1_PRD.md` §14 and §41: `events.jsonl` is append-only, and Activity loads the most recent 200 events by default.

## Source verification

- `server/ledger/store.ts:213-215` parses `events.jsonl` into `events`; `server/ledger/store.ts:250` exposes `recentEvents: events.slice(-200)`.
- The slice keeps the source order, selects the last 200 entries, and returns all entries when fewer than 200 are present.
- `tests/ledger/store.test.ts:78-119` verifies 205 events produce exactly 200 IDs from `bulk-6` through `bulk-205` in order, then verifies a one-event ledger returns `only-event`.
- Summary behavior remains covered at `tests/ledger/store.test.ts:64` (`total: 4`, `progress: 48`).
- LKG behavior remains covered at `tests/ledger/store.test.ts:152-209`, including malformed JSON, schema-invalid JSON, and project identity drift.
- The WI-007 large fixture remains covered at `tests/qa/wi-007-qa.test.ts:268-281` for 1,000 tasks, 10,000 events, 200 recent events, and a sub-second load; its watcher/SSE refresh is covered at `tests/qa/wi-007-qa.test.ts:287-315`.

## Fresh verification runs

| Command | Exit | Result |
| --- | ---: | --- |
| `pnpm test --run tests/ledger tests/qa` | 0 | 2 files / 12 tests passed; the large-project SSE refresh test passed in 511 ms. |
| `pnpm test` | 0 | 20 files / 69 tests passed; the large-project SSE refresh test passed in 950 ms. |
| `pnpm lint` | 0 | TypeScript no-emit check passed. |
| `pnpm build` | 0 | TypeScript build and Vite production build passed; 26 modules transformed. |

These fresh runs independently confirm the recent-events contract, event order, fewer-than-200 behavior, WI-007 fixture behavior, LKG behavior, and summary behavior with no observed regression.

## Disposition

`PASS`. The WI-010 functional and regression gates are satisfied. This verification does not make a product-acceptance decision and does not change the WI-010 JSON state.

The checkout is an uncommitted/untracked parent workspace with no commit baseline, so a trustworthy VCS diff for independently proving the owner's complete change scope was unavailable. The implementation and test inspection above directly covers the requested behavior; no production code was changed by this verifier.
