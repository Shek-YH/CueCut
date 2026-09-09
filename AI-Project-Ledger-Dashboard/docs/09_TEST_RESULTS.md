# WI-007 QA Test Results

Status: `VERIFIED`

| Evidence class | Result | Notes |
|---|---|---|
| Synthetic | `PASS` | 1,000-task/10,000-event fixture, 200-event Activity window, schema/security tests. |
| Local Integration | `PASS` | LKG, path safety, allowlist, localhost, watcher/SSE 530ms, full 69-test suite. |
| Real Local E2E | `PASS` | Self project loaded through `dev:all`; atomic task update reflected in 214.13ms; malformed JSON warning and recovery passed. |

## Commands

| Command | Exit | Result |
|---|---:|---|
| `pnpm test --run tests/qa` | 0 | 1 file / 7 tests |
| `pnpm test` | 0 | 20 files / 69 tests |
| `pnpm lint` | 0 | TypeScript clean |
| `pnpm build` | 0 | Vite/TypeScript build passed |
| `pnpm test:e2e` | 0 | 1 Chromium test |
| bounded self dogfood | 0 | 214.13ms refresh, LKG recovery PASS |

The previous `recentEvents=20` defect is resolved by WI-010 and its independent R90 PASS. WI-007 QA is now independently verified and accepted; this report is the current supporting test record.
