# WI-009 Verifier Evidence｜Secure Artifact Open-Parent-Folder Action

Verdict: `PASS`

Acceptance: `NOT ACCEPTED` — this is an R90 verification result only; the orchestrator owns acceptance.

## Execution identity

- Role: R90 Independent Verifier
- Work item: WI-009 — Secure Artifact Open-Parent-Folder Action
- Target: `F:\\CCPJ\\CueCut3\\AI-Project-Ledger-Dashboard`
- This spawn agent id, used as verifier `executionRef`: `01a08305-03e6-7a82-9522-1d51b3e5493a`
- Owner executionRef: `01a082e8-ce53-77b3-99c8-f2644f8c65ff`
- Owner and verifier executionRefs are different: yes

## Independent review scope

Read and checked:

- `docs/context/WI-009_CONTEXT.md`
- owner evidence/handoff: `docs/evidence/WI-009.md`, `docs/handoffs/WI-009.md`
- `server/api/index.ts`, `server/security/paths.ts`, `server/index.ts`, `scripts/dev.mjs`
- `tests/api/artifact-open.test.ts`, `tests/security/security.test.ts`
- current WI-005 contract: `docs/context/WI-005_CONTEXT.md`, `docs/handoffs/WI-005.md`, `docs/evidence/WI-005.md`, `web/data.ts`, and the artifact action in `web/App.tsx`
- `docs/work-items/WI-009.json`

No production or test source was changed by this verifier. Only the two verifier documents named in this report were written.

## Contract review

| Check | Result | Evidence |
| --- | --- | --- |
| POST route shape | PASS | `server/api/index.ts:121-130` recognizes only `/api/projects/:projectId/artifacts/open` and requires `POST`; the path parser rejects embedded path separators in the project id. |
| Registered project required | PASS | `server/api/index.ts:189-193` looks up `projectId` in the registration map and returns 404 before reading the body, resolving a path, or calling the opener. |
| Request surface | PASS | `server/api/index.ts:195-211` extracts only a string `path` from JSON; the project id is the registered route parameter. WI-005 sends exactly `{ path: artifactPath }` from `web/data.ts:37-50`. |
| Validation before opener | PASS | `server/api/index.ts:213-223` resolves with `resolveContainedArtifactPath` and invokes `artifactOpener` only after successful validation. |
| Traversal rejection | PASS | `server/security/paths.ts:85-87` rejects normalized `..` segments, including slash/backslash forms. |
| Absolute/drive-root rejection | PASS | `server/security/paths.ts:30-36,82-84` checks POSIX, host, and Windows absolute/drive-rooted forms. |
| Containment | PASS | `server/security/paths.ts:92-96` resolves under the registered root and checks the relative result stays contained. |
| Injectable opener | PASS | `ArtifactOpener` and `LedgerApiOptions.artifactOpener` are defined at `server/api/index.ts:22-24,44-48`; the focused tests inject a recorder and never launch Explorer. |
| Windows/non-Windows behavior | PASS | `server/api/index.ts:26-41` uses `explorer.exe /select,<resolvedPath>` on Windows; `server/api/index.ts:27-32,224-234` exposes `PLATFORM_UNAVAILABLE` as HTTP 501. The test injects the unavailable result after validation. |
| Localhost boundary | PASS | `server/index.ts:40-44,105-111` enforces/binds `127.0.0.1`; `scripts/dev.mjs:4,9-14` uses the same host. |
| No file content/task write | PASS | The artifact route does not call the store or filesystem and returns metadata only; `tests/api/artifact-open.test.ts:96-99` asserts no snapshot/store call and no `contents` field. No task-state write appears in the WI-009 route/security implementation. |

## Fresh verification commands

All commands below were run independently from the target directory on 2026-09-08.

| Command | Exit | Result |
| --- | ---: | --- |
| `pnpm test --run tests/api tests/security` | 0 | 4 test files / 11 tests passed, including API, artifact-open, security, HTTP, and SSE coverage selected by those directories. |
| `pnpm test` | 0 | 19 test files / 61 tests passed. |
| `pnpm lint` | 0 | TypeScript check passed. |
| `pnpm build` | 0 | TypeScript build and Vite production build passed; 26 modules transformed. |
| Additional `node --import tsx --input-type=module` boundary probe | 0 | 10 rejected candidates passed: traversal, backslash traversal, Windows absolute, drive-relative, UNC, POSIX absolute, empty, `.env`, and sensitive path; one valid contained path resolved correctly. |

## Findings

No blocking finding. The owner evidence recorded a narrower focused count and a prior lint failure, but the exact directory command and current lint run are green in this verifier run (4/11 and exit 0 respectively). The default Explorer branch was not invoked during verification to avoid an external UI side effect; its command and explicit unavailable branch were inspected, while injected-opener tests exercised the route ordering and response contract.

## Disposition

WI-009 meets the requested secure registered-project/relative-artifact action contract. R00 may record verifier verdict `PASS` with the executionRef above. This document does not assign `ACCEPTED`.
