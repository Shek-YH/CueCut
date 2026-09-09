# WI-009 Verifier Handoff｜Secure Artifact Open-Parent-Folder Action

Verdict: `PASS`

Acceptance: `NOT ACCEPTED` — verification evidence only; do not transition the Work Item to `ACCEPTED` from this handoff.

## Execution identity

- Verifier: R90 Independent Verifier
- This spawn agent id / verifier `executionRef`: `01a08305-03e6-7a82-9522-1d51b3e5493a`
- Owner executionRef: `01a082e8-ce53-77b3-99c8-f2644f8c65ff`
- Owner and verifier executionRefs are different: yes

## Independent result

- `POST /api/projects/:projectId/artifacts/open` is method- and route-scoped.
- Unknown projects return 404 before body/path resolution or opener invocation.
- The action accepts a registered project id plus a relative artifact `path`; traversal, absolute/drive-rooted, sensitive, and out-of-root paths are rejected before the injectable opener.
- Windows uses `explorer.exe /select,<resolvedPath>`; non-Windows has an explicit `501 PLATFORM_UNAVAILABLE` response.
- The action returns metadata only, does not read artifact contents, and does not write task state.
- Localhost binding remains enforced at `127.0.0.1`.
- WI-005's current data contract sends exactly `{ path: artifactPath }` to the route and keeps the browser read-only for task state.

## Fresh command evidence

| Command | Result |
| --- | --- |
| `pnpm test --run tests/api tests/security` | PASS — 4 files / 11 tests |
| `pnpm test` | PASS — 19 files / 61 tests |
| `pnpm lint` | PASS — exit 0 |
| `pnpm build` | PASS — exit 0 |
| Additional path-boundary probe | PASS — 10 forbidden forms rejected and one contained relative path accepted |

The focused API tests verify successful opener invocation, traversal/absolute/unknown rejection before opener, platform-unavailable JSON, no store call, and no file-content response. No Explorer process was launched; the opener was injected for deterministic, side-effect-free verification.

R90 changed only `docs/evidence/WI-009-VERIFIER.md` and `docs/handoffs/WI-009-VERIFIER.md`. R00 should record `PASS` and verifier executionRef `01a08305-03e6-7a82-9522-1d51b3e5493a`; no `ACCEPTED` state is assigned here.
