# Context Packet｜WI-007

**Role:** R06 QA / Security / Dogfood. **WI:** WI-007. **GP:** GP-05/GP-06/GP-08. Dependencies WI-003/004/005/006.

Do not modify production source. Run unit/integration/UI/Playwright, 1,000-task/10,000-event fixture, file update and SSE refresh measurement, corrupt JSON LKG, path traversal, secret denylist, localhost bind and self-project import. Record Synthetic/Local Integration/Real Local E2E separately. Return defects as NEEDS_CHANGES; never mark VERIFIED/ACCEPTED.

## Interrupted execution note — 2026-09-08

This R06 execution was stopped before launching the long-running real `pnpm dev:all` browser flow. Existing QA/full tests passed (`tests/qa` 7/7; full Vitest 69/69); the existing `pnpm test:e2e` passed only its mock API test. Real Local E2E remains `BLOCKED`: no self-project atomic transition, ≤1000ms UI measurement, malformed-JSON LKG verification, or restoration proof was completed. No production source, secret content, or self-project ledger truth was changed.
