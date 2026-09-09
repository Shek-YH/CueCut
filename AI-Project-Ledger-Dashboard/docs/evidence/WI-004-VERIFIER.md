# WI-004 Independent Verifier Evidence

Verdict: `NEEDS_CHANGES`

## Execution identity

- Verifier role: R90 Independent Verifier
- This spawn's returned agent id, used as verifier `executionRef`: `01a0828b-dbcd-7782-8013-53b45b9ead10` (R00 will record it)
- Owner: R04
- Owner executionRef: `01a0827b-86a5-7ec0-9fdd-6c17f9ac3a44`
- Owner and verifier executionRefs are different: yes

## Scope checked

Read and checked:

- `docs/context/WI-004_CONTEXT.md`
- `docs/work-items/WI-004.json`
- `docs/evidence/WI-004.md`
- `docs/handoffs/WI-004.md`
- `packages/ledger-schema/src/index.ts`
- all files under `server/migration/**` and `server/registry/**`
- all files under `tests/migration/**`
- all files under `fixtures/project-legacy-md/**`
- the relevant Legacy Migration requirements in PRD §26–27 and `docs/04_LEGACY_MIGRATION.md`

## Independent findings

| Check | Result | Evidence |
| --- | --- | --- |
| Legacy filename detection | PASS | Focused suite: 4 files / 11 tests passed. The allowlist detects the six legacy fixture files and ignores `README.md`; existing `.ai-ledger` precedence is covered. |
| Checkbox/status mapping | NEEDS_CHANGES | `[x]` → `COMPLETED`, `[ ]` → `NOT_STARTED`, `进行中` / `阻塞` / `等待用户` map as implemented (`server/migration/parse.ts:12-20`). However, PRD §27 (`docs/source/AI_Project_Ledger_Dashboard_V1_PRD.md:915-931`) explicitly names `正在开发` as the in-progress phrase; an independent probe returned `NOT_STARTED` with `LOW` confidence for `正在开发：实现迁移`. The `title.includes("进行中")` implementation (`server/migration/parse.ts:22-24`) also maps `未进行中的旧条目` to `IN_PROGRESS`, which is not conservative. |
| `migrationConfidence` and warnings | PASS | Unknown bullet status returns `NOT_STARTED`, `LOW`, and a warning retaining file, line, and task title. Focused parser/bootstrap tests pass; the independent migration harness returned 1 warning for the fixture. |
| Original Markdown preservation | PASS | Independent temp-project harness compared raw `Buffer` values: `byteEqual=true` and `sourceNamesUnchanged=true`. No migration write path targets Markdown. |
| Empty skeleton | PASS | Independent harness returned `emptyKind=initialized`, `emptySkeleton=true`, and `listMachineFiles()` contained exactly 7 files. The migration path also produced all seven files. |
| Registry add/remove safety | PASS | Independent harness returned `registryRemoved=true`, `registryTargetStillExists=true`, `registryTargetByteEqual=true`, and final registry `{ "projects": [] }`. Registry writes are confined to the supplied Dashboard registry path. |
| WI-001 machine schemas | PASS | Bootstrap integration test parses project/tasks/roles/sessions/artifacts/runtime with the shared schemas and parses `events.jsonl`; it passed in the focused suite. |
| Owner/verifier separation | PASS | `01a0827b-86a5-7ec0-9fdd-6c17f9ac3a44` differs from verifier `01a0828b-dbcd-7782-8013-53b45b9ead10`. |

## Fresh command evidence

All commands were run independently from `F:\CCPJ\CueCut3\AI-Project-Ledger-Dashboard`:

| Command | Exit code | Result |
| --- | ---: | --- |
| `pnpm exec vitest run tests/migration` | 0 | 4 test files passed; 11 tests passed |
| `pnpm test` | 0 | 11 test files passed; 37 tests passed |
| `pnpm lint` | 0 | `tsc -p tsconfig.json --noEmit` passed |
| `pnpm build` | 0 | `tsc -p tsconfig.build.json` passed |

## Required changes

1. Align the finite in-progress mapping with the PRD's explicit `正在开发` phrase, or document and get approval for a different canonical phrase.
2. Add a conservative phrase-boundary regression test so negated/embedded text such as `未进行中的旧条目` remains `NOT_STARTED` with `LOW` confidence and a warning.

The green test/lint/build commands are insufficient for a PASS while these two status-mapping requirements remain unresolved. R00 should record this verifier `executionRef` and the `NEEDS_CHANGES` verdict; the verifier executionRef is the spawn-returned agent id above and R00 will supplement the ledger record.
