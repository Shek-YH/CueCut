# WI-002 Independent Verifier Evidence

Verdict: PASS

## Execution identity

- Verifier role: R90 Independent Verifier
- This spawn's returned agent id, used as verifier `executionRef`: `01a08289-062c-71d3-bd07-7d77329e66d7` (R00 will record it)
- Owner: R02 Backend Ledger Store / Security
- Owner executionRef: `01a0827b-85a8-76f2-a3cb-66a9ff89079f`
- Owner and verifier executionRefs are different: yes

## Scope checked

Read and checked:

- `docs/context/WI-002_CONTEXT.md`
- `docs/work-items/WI-002.json`
- `docs/evidence/WI-002.md`
- `docs/handoffs/WI-002.md`
- `packages/ledger-schema/src/index.ts`
- `server/ledger/store.ts`
- `server/security/paths.ts`
- `tests/ledger/store.test.ts`
- `tests/security/security.test.ts`
- WI-001 schema contract tests, the runtime contract, and the relevant PRD security/snapshot sections

## Independent findings

| Check | Result | Evidence |
| --- | --- | --- |
| Project Folder + stable `projectId`/root binding | PASS | `assertProjectRootContract` binds project, task, and runtime IDs, normalizes `rootPath`, rejects session ID reuse, and matches the expected project root. `LedgerStore` keys both bindings and LKG by the normalized absolute project root and rejects later `projectId` drift. |
| Exact seven-file allowlist | PASS | `ALLOWED_LEDGER_FILES` contains exactly `project.json`, `tasks.json`, `roles.json`, `sessions.json`, `artifacts.json`, `events.jsonl`, and `runtime.json`; the store iterates only this list. The read recorder test observes exactly these seven basenames. |
| Secret denylist and sensitive reads | PASS | `isSensitivePath` denies `.env`/`.env.*` and the `credentials`, `token`, `cookie`, `password`, `ssh`, and `secret` tokens. The production reader constructs only `.ai-ledger/<allowlisted file>` paths; the focused recorder test observes no sensitive path, and artifact contents are never opened. |
| Artifact containment | PASS | `resolveContainedArtifactPath` resolves against the project root, rejects empty/sensitive paths, rejects `..` traversal and sibling paths via `path.relative`, and is applied to every parsed artifact before the snapshot is returned. |
| Malformed/schema-invalid LKG | PASS | JSON, Zod schema, event, identity, and artifact-path failures are converted to `INVALID_LEDGER`; after a valid load, the prior per-root snapshot is returned with `usedLastKnownGood: true`. Tests cover malformed JSON, schema-invalid `projectId`, and later identity drift. |
| Aggregate summary / phase / task tree | PASS | The store uses the WI-001 pure contracts `summarizeTasks`, `buildPhaseSummaries`, and `buildTaskTree`. The fixture test verifies total `4`, progress `48`, ordered phase progress `100/46/0`, and task-tree roots `T-001` through `T-004`. |

## Fresh verification evidence

All requested commands were independently rerun from `AI-Project-Ledger-Dashboard` on 2026-09-08:

| Command | Exit code | Result |
| --- | ---: | --- |
| `pnpm test --run tests/ledger tests/security` | 0 | 2 suites / 7 tests passed |
| `pnpm test` | 0 | 11 suites / 37 tests passed |
| `pnpm lint` | 0 | TypeScript check passed |
| `pnpm build` | 0 | TypeScript build passed |

Additional direct type-check of the WI-002 source and tests:

| Command | Exit code | Result |
| --- | ---: | --- |
| `pnpm exec tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --esModuleInterop --skipLibCheck --types node,vitest/globals server/ledger/store.ts server/security/paths.ts tests/ledger/store.test.ts tests/security/security.test.ts` | 0 | Passed with no diagnostics |

The owner handoff records 36 full tests; the fresh verifier run reports 37. This is a stale count discrepancy only; all current suites and tests passed.

## Conclusion

WI-002 satisfies the requested secure ledger-read, project identity, containment, LKG, and aggregation checks. R90 changed only this verifier evidence file and the matching verifier handoff; no production or test source was changed by R90. R00 should record the verifier `executionRef` above and the `PASS` verdict.
