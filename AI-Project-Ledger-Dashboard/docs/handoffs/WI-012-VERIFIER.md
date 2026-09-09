# WI-012 Verifier Handoff

Verdict: `PASS`

Acceptance decision: `NOT ACCEPTED` — acceptance remains with R00/orchestration and is not assigned by R90.

## Execution identity

- Verifier role: R90 Independent Verifier
- Work item: WI-012
- This spawn agent id, used as verifier `executionRef`: `01a0839a-b01c-7093-9940-270c7e11a445`
- Owner executionRef: `01a08389-6249-7d33-9df4-14e415442539`
- Owner and verifier executionRefs are different: yes

## Independent result

PASS. The Settings flow exposes an accessible `Project root folder` input, sends only `{ rootPath }` to `POST /api/projects`, distinguishes WI-011 `existing`/`migrated`/`initialized` feedback, refreshes the registered project list, switches to the returned project id, and loads the new snapshot/SSE lifecycle. Invalid input/errors are accessible, and no task-state or browser project-file write path was found.

The SSE cleanup removes both listeners and closes the source. The real bounded E2E used `pnpm dev:all`, isolated `APPDATA`, and a temporary empty directory with no project API mocks; it observed the real `201 initialized` response, list refresh, new snapshot, and cleanup. No residual listener remained on ports 3100 or 4173.

## Fresh verification

| Command | Exit code | Result |
| --- | ---: | --- |
| `pnpm test --run tests/ui` | 0 | 2 files / 13 tests passed |
| `pnpm test` | 0 | 21 files / 79 tests passed |
| `pnpm lint` | 0 | Passed |
| `pnpm build` | 0 | Passed; Vite transformed 26 modules |
| `pnpm test:e2e` | 0 | 2/2 Chromium tests passed against the real localhost API |

R00 may record WI-012 verifier verdict `PASS` with executionRef `01a0839a-b01c-7093-9940-270c7e11a445`. This handoff does not mark `ACCEPTED`.
