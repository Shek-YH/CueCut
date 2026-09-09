# WI-007 Independent Verification Evidence

Verdict: `PASS`

Acceptance: `NOT ACCEPTED` — R90 records verification only.

## Execution identity

- Role: R90 Independent Verifier
- Work item: `WI-007`
- Verifier executionRef (this spawn agent id): `01a0834a-ce61-7f93-9441-9f6c23a89d5c`
- Owner: R06 QA / Security / Dogfood
- Owner executionRef: `01a0833c-15fb-7f21-b901-b3898e9bbf41`
- Owner and verifier executionRefs are distinct: `true`
- Verification date: `2026-09-08`

## Evidence reviewed

- `docs/context/WI-007_CONTEXT.md`
- `docs/work-items/WI-007.json`
- `docs/evidence/WI-007.md`
- `docs/evidence/WI-007-REAL-DOGFOOD.md`
- `docs/09_TEST_RESULTS.md`
- `docs/10_SECURITY_REVIEW.md`
- `docs/evidence/WI-010-VERIFIER.md`
- `server/ledger/store.ts`, `server/watcher/**`, `server/api/**`, `web/**`
- `tests/qa/**`, `tests/e2e/**`, `fixtures/project-large/**`
- `docs/handoffs/WI-007.md` (the earlier interrupted R06 handoff)

## Independent verification matrix

| Check | Result | Evidence and disposition |
| --- | --- | --- |
| Synthetic 1,000 tasks / 10,000 events | PASS | `fixture-manifest.json` declares 1,000 tasks and 10,000 events; `tests/qa/wi-007-qa.test.ts:268-281` materializes and loads those counts within the 1,000 ms budget. |
| `recentEvents` window | PASS | `server/ledger/store.ts:250` exposes `events.slice(-200)` in source order. QA and the WI-010 verifier cover exactly 200 entries and fewer-than-200 behavior. |
| LKG on malformed JSON | PASS | `LedgerStore` validates before replacing per-root LKG; QA `tests/qa/wi-007-qa.test.ts:317-329` asserts the same snapshot, `INVALID_LEDGER`, and `usedLastKnownGood=true`. API/SSE forwards the warning and snapshot; the UI renders the warning banner. |
| Allowlist / secret / path boundaries | PASS | `server/security/paths.ts:3-11,39-47,75-97` restricts ledger reads to seven files, rejects sensitive artifact segments, absolute paths, and traversal. QA `tests/qa/wi-007-qa.test.ts:334-365` verifies the denylist and recorded reads. |
| Localhost-only server | PASS | `server/index.ts:40-44` defaults to and enforces `127.0.0.1`; the QA test rejects `0.0.0.0`. `scripts/dev.mjs:4-9` uses the same local binding. |
| Dashboard task-state read-only | PASS | `web/data.ts` only has the artifact `POST`; snapshot/projects/stream are GETs. `web/App.tsx` has no task-state mutation path and visibly labels the UI READ-ONLY. QA checks this boundary and mock E2E checks the artifact POST contract. |
| Watcher / SSE refresh | PASS | `server/watcher/index.ts` watches only the allowlisted ledger paths with a 100–250 ms debounce; `server/api/**` broadcasts snapshot/error and file-specific events. Fresh QA output passed the large-project refresh in 521 ms; the full suite’s same test passed in 920 ms. |

## Fresh command evidence

All commands were independently run from `F:\CCPJ\CueCut3\AI-Project-Ledger-Dashboard` after reading the owner evidence.

| Command | Exit | Result |
| --- | ---: | --- |
| `pnpm test --run tests/qa` | 0 | 1 file / 7 tests passed; large-project SSE refresh 521 ms. |
| `pnpm test` | 0 | 20 files / 69 tests passed; large-project SSE refresh 920 ms. |
| `pnpm lint` | 0 | TypeScript no-emit check passed. |
| `pnpm build` | 0 | TypeScript build and Vite build passed; 26 modules transformed. |
| `pnpm test:e2e` | 0 | 1 Chromium test passed. This test is route-mocked aggregate-snapshot E2E and is not counted as real dogfood. |

## R00 real dogfood evidence check

The separate `WI-007-REAL-DOGFOOD.md` is treated as Real Local E2E evidence, not as the mock E2E result. Its claims are corroborated as follows:

- The current self ledger and an independent read-only live run both resolve `projectId=ai-project-ledger-dashboard-v1` and the real dashboard root. The bounded observer started `pnpm dev:all` as a child with `LEDGER_PROJECT_ROOT` set to this project and isolated localhost ports `3211`/`4211`; API status and Chromium navigation were both 200.
- The live page rendered the real project name/path, 11 task cards, the Activity navigation, and the READ-ONLY marker. No ledger write was performed by R90.
- R00 records the atomic task transition order as `tasks.json` → `project.updatedAt` → `runtime.lastWriteAt` → appended `events.jsonl`, using temp-file write plus rename. `server/atomic.ts:5-27` independently confirms complete sibling-temp write, `sync`, rename, and failed-temp cleanup. The current self ledger corroborates the final T-004 `COMPLETED` state, matching project/runtime timestamps, and the `dogfood-*` status-change event.
- R00 records 214.13 ms write-to-green Chromium refresh, below the 1,000 ms requirement; malformed `tasks.json` displayed the LKG warning and restoration returned the valid page. This mutation/LKG sequence was not replayed by R90 because the explicit verifier boundary forbids modifying `.ai-ledger`.
- R00 records `NO_DOGFOOD_LISTENERS` on ports 4211/3211 and no `*.dogfood.tmp`. The R90 bounded observer also executed exact child-tree cleanup and emitted a clean shutdown log; no additional mutation or cleanup harness was introduced.

The earlier R06 handoff remains a historical `BLOCKED` record for the interrupted execution. The later R00 supplemental real-dogfood artifact is the evidence reviewed for the completed real path; neither the mock E2E nor the old interrupted handoff is relabeled as real dogfood.

## Disposition

`PASS`. Synthetic, local integration, security, read-only UI, watcher/SSE, and the separately attributed real self-dogfood evidence satisfy WI-007’s requested gates. This document does not assign `ACCEPTED`, does not change `WI-007.json`, and does not change production, test, or `.ai-ledger` files.
