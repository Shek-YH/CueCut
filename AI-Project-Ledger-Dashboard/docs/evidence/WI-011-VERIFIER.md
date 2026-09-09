# WI-011 Independent Verifier Evidence

Verdict: `PASS`

Acceptance decision: not assigned by R90.

## Execution identity

- Verifier role: R90 Independent Verifier
- This spawn agent id, used as verifier `executionRef`: `01a0837e-99a3-7b93-b50e-c0ab0e813403` (from `docs/work-items/WI-011.json.review.executionRef`)
- Owner: R04 Legacy Migration / Project Bootstrap
- Owner `executionRef`: `01a0836c-6ca3-7eb1-a576-ae21a9099c19` (from `docs/work-items/WI-011.json.execution.executionRef`)
- Owner and verifier executionRefs are different: yes

## Scope read

Read and independently checked:

- `docs/context/WI-011_CONTEXT.md`
- `docs/work-items/WI-011.json`
- `docs/evidence/WI-011.md`
- `docs/handoffs/WI-011.md`
- WI-003 watcher context/evidence/handoff and `server/watcher/index.ts`
- WI-004 migration/registry context/evidence/handoff and all `server/migration/**` and `server/registry/**`
- `server/api/index.ts`, `server/index.ts`
- related `server/ledger/store.ts`, `server/security/paths.ts`, and project-root contract
- `tests/api/projects.test.ts`, API/SSE/HTTP tests, all `tests/migration/**`, and fixtures
- PRD §§26–27, §§31–37 and the local backend/security notes

## Requirement checks

| Check | Result | Evidence |
| --- | --- | --- |
| POST `/api/projects` input and directory validation | PASS | `server/api/index.ts:156-165,215-255` routes POST, parses JSON, requires a non-empty string `rootPath`, and returns stable generic errors. `server/index.ts:54-70` resolves the path and requires an existing directory. |
| projectId/root identity validation | PASS | `server/index.ts:150-169` reloads through `LedgerStore` before registration. `server/ledger/store.ts:220-240` calls `assertProjectRootContract` with the submitted root; the contract checks project/tasks/runtime IDs and session identity. `tests/api/projects.test.ts:266-280` rejects a mismatched `project.json.rootPath` without echoing the supplied value. |
| Existing / legacy / empty routing | PASS | `server/migration/bootstrap.ts:143-168` selects existing first, legacy migration second, and empty skeleton otherwise. Existing returns before writes; legacy and empty paths create the intended seven machine files. API tests cover `existing`, `migrated`, and `initialized` results. |
| Conservative migration and preservation | PASS | WI-004 parser/detection tests passed; `[x]`/`[ ]`, `正在开发`/`进行中`/`阻塞`/`等待用户`, LOW-confidence warnings, and conservative phrase boundaries are present. `tests/api/projects.test.ts:203-227` preserves legacy Markdown bytes, and migration bootstrap tests validate the generated schemas. |
| Dashboard registry boundary and conflicts | PASS | `server/registry/index.ts:31-70` writes only the configured registry file. `server/index.ts:108-122` rejects duplicate project IDs on another root and duplicate roots under another project before watcher/registry registration. Existing registration leaves the machine ledger unchanged; registry tests confirm project-folder bytes remain unchanged. |
| Dynamic watcher and API list | PASS | `server/index.ts:124-147,171-179` creates/reuses a watcher for the added root, waits for readiness, persists the registry entry, and updates the API map. `tests/api/projects.test.ts:176-200` observes `task:changed` over SSE after POST, while the existing-project test confirms immediate `GET /api/projects` visibility. |
| Localhost and security boundary | PASS | `server/index.ts:76-80,223-230` defaults to and enforces `127.0.0.1`. The watcher uses the seven allowlisted ledger files only; the store reads the same allowlist. Relevant security/API tests passed, and the reviewed WI-011 path has no outbound network call or secret-file read. |
| No task overwrite / safe errors | PASS | Existing registration returns from migration without writes; `tests/api/projects.test.ts:141-169` proves `tasks.json` is byte-identical. Invalid roots and invalid root bindings return generic messages without supplied paths; migration writes are additive machine-ledger initialization only. |

## Fresh command evidence

All commands were run independently from `F:\CCPJ\CueCut3\AI-Project-Ledger-Dashboard` on 2026-09-08:

| Command | Exit | Result |
| --- | ---: | --- |
| `pnpm test --run tests/api tests/migration` | 0 | 8 test files / 26 tests passed |
| `pnpm test` | 0 | 21 test files / 75 tests passed |
| `pnpm lint` | 0 | `tsc -p tsconfig.json --noEmit --jsx react` passed |
| `pnpm build` | 0 | TypeScript build passed; Vite transformed 26 modules |

## Verifier conclusion

WI-011 satisfies the requested dynamic add-project backend checks. The owner evidence and the current source/tests are consistent with the fresh command results. R00 may record verifier `executionRef` `01a0837e-99a3-7b93-b50e-c0ab0e813403` and verdict `PASS`; this document does not assign an acceptance status.

R90 changed only this evidence file and the matching verifier handoff; no production, test, schema, watcher, migration, registry, fixture, or UI source was changed by this verification.
