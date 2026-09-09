# WI-008 Final Independent Verifier Evidence

Verdict: `NEEDS_CHANGES`

Acceptance: not assigned. This report records the R90 verification result only; it does not mark WI-008 `ACCEPTED` and does not claim Product/Release Acceptance.

## Execution identity

- Verifier role: R90 Independent Verifier
- Work item: WI-008 — Core Golden Path / Final Acceptance Prep
- This spawn agent id, used as verifier `executionRef`: `01a083a3-a80c-7ec3-828e-c091fafcbe8e` (R00 must confirm/backfill the WI record)
- Owner: R00
- WI-008 owner `execution.executionRef`: `null` in the current JSON because this is the main control-plane execution; no JSON was changed by this verifier.
- Verification date: 2026-09-08

## Scope reviewed

Read and checked:

- `docs/context/WI-008_CONTEXT.md`, `docs/work-items/WI-008.json`
- `00_PROJECT_ENTRY.md`, `03_CORE_GOLDEN_PATH.md`, `README.md`
- `docs/11_FINAL_ACCEPTANCE.md`, `docs/FINAL_ACCEPTANCE.md`, `docs/IMPLEMENTATION_LOG.md`, `docs/09_TEST_RESULTS.md`, `docs/10_SECURITY_REVIEW.md`
- WI-001/002/003/004/005/006/007/009/010/011/012 owner evidence and latest verifier evidence, including WI-004 recheck, WI-005 final, and WI-007 real dogfood evidence
- `docs/evidence/WI-008.md`, the prior `docs/evidence/WI-008-VERIFIER.md`, both real screenshots, all seven `.ai-ledger` files, current implementation sources, tests, and the current global `AI_Autonomous_Project_Ledger_Skill_v1`

Only this evidence file and `docs/handoffs/WI-008-VERIFIER-FINAL.md` were written.

## Fresh command evidence

All commands were run from `F:\CCPJ\CueCut3\AI-Project-Ledger-Dashboard` before this final write:

| Command | Exit | Result |
| --- | ---: | --- |
| `pnpm test` | 0 | 21 test files / 79 tests passed |
| `pnpm lint` | 0 | TypeScript no-emit check passed |
| `pnpm build` | 0 | TypeScript build passed; Vite transformed 26 modules |
| `pnpm test:e2e` | 0 | 2/2 Chromium tests passed; one is a route-mocked UI contract test and one is the real Add Project test |
| `pnpm exec vitest run tests/skill --reporter=dot` | 0 | 1 file / 2 tests passed |
| `pnpm exec vitest run tests/api/projects.test.ts tests/qa/wi-007-qa.test.ts --reporter=dot` | 0 | 2 files / 13 tests passed |

## Real bounded GP-01 verification

The authoritative real GP-01 check used a direct in-process `createLedgerServer` and Vite server on bounded `127.0.0.1` dynamic ports, then headless Chromium. It did not set `LEDGER_PROJECT_ROOT`, `LEDGER_PORT`, or `VITE_PORT`, did not call `page.route`, and did not mock any API.

- Settings accepted a real temporary empty directory.
- The real `POST /api/projects` returned HTTP `201`, `ok=true`, `kind=initialized`, and a stable project registration.
- Initialization created exactly the seven expected machine-ledger files.
- The real registry persisted the new project.
- The subsequent real `GET /api/projects` returned HTTP `200` and contained the added project.
- The subsequent real snapshot GET returned HTTP `200` with matching projectId and normalized root path.
- Chromium observed `Project registered`, `Empty ledger initialized`, and the switched project root.
- The temporary project and temporary registry were removed; both bounded server ports had no listener after shutdown.

An initial harness attempt used strict raw-string equality for Windows root separators and failed in its assertion layer after the product flow completed. The corrected rerun compared normalized absolute paths and passed; this was not a product or API failure.

## Golden Path matrix

| Step | Result | Independent basis |
| --- | --- | --- |
| GP-01 Add Project Folder | PASS | Direct real Chromium/localhost run above; WI-011 and WI-012 latest verifier evidence also PASS. |
| GP-02 Stable identity / ledger detection | PASS | Current `.ai-ledger/project.json`, `tasks.json`, and `runtime.json` use `ai-project-ledger-dashboard-v1`; existing R00/WI-007 real evidence and direct server startup loaded the self project. |
| GP-03 Validated aggregate snapshot | PASS | Current ledger has exactly the seven files; full test suite, direct API checks, and WI-001/002 verifier evidence cover schema, binding, aggregation, and LKG ordering. |
| GP-04 Seven-page read-only Dashboard | PASS | The two real screenshots show Overview and Tasks, including `READ-ONLY`; existing R00/WI-005/WI-007 evidence covers all Overview, Tasks, Blockers, Activity, Roles, Artifacts, and Settings views. |
| GP-05 Watcher/SSE refresh | PASS as attributed evidence | WI-007 real dogfood records atomic update and Chromium refresh in `214.13ms`; fresh QA/API tests passed, including the watcher/SSE path. The self ledger was not mutated by this verifier. |
| GP-06 Malformed JSON / LKG recovery | PASS as attributed evidence | WI-007 real dogfood records visible LKG warning and `LKG_RECOVERY=PASS`; fresh QA tests passed LKG behavior. The destructive self-ledger mutation was not replayed under this docs-only verifier boundary. |
| GP-07 Additive Legacy Migration | PASS | Latest WI-004 R90 recheck is PASS; migration tests and evidence cover conservative mapping, seven-file skeleton, and byte-preserved Markdown. |
| GP-08 Self dogfood / final boundaries | PASS as attributed evidence | R00 records self-project dogfood, `214.13ms`, LKG recovery, and no listeners; WI-007 latest verifier is PASS. Current source/tests retain localhost-only bind, allowlist/denylist, artifact containment, read-only task state, and no Agent Board integration. |

## Ledger, evidence, and traceability audit

- WI-001/002/003/004/005/006/007/009/010/011/012 each currently has JSON `status=ACCEPTED`, `review.status=VERIFIED`, `review.verdict=PASS`, non-null owner/verifier refs, and distinct owner/verifier refs.
- No duplicate owner/verifier execution reference was found across the accepted Work Items.
- Every current JSON `evidence` path resolves, including both screenshot paths and the WI-007 real dogfood path.
- WI-008 remains `status=IN_PROGRESS`, `review.status=IN_PROGRESS`, `review.verdict=null`; this verifier did not change that state.
- `docs/11_FINAL_ACCEPTANCE.md` and `docs/FINAL_ACCEPTANCE.md` correctly preserve the separate user Product/Release Acceptance gate as `WAITING_USER`.
- `README.md` exists in the target project and documents `pnpm install`, `pnpm dev:all`, `http://127.0.0.1:4173`, the four verification commands, and the V1 read-only/no-Agent-Board boundary.
- The current global Skill and `tests/skill/wi-006-contract.test.ts` cover seven-file initialization, stable root/projectId binding, dual-write order, atomic sibling-temp rename, append-only events, validation-before-LKG replacement, secret prohibition, read-only task state, and no Agent Board integration. The focused Skill test passed.

## Blocking findings

The implementation and the WI-011/WI-012/R00 real-path evidence are green, but the requested QA-document status consistency is not yet complete. These stale statements conflict with current JSON and latest verifier state:

1. `docs/09_TEST_RESULTS.md:22` says the report “awaits WI-007 R90 verification” although the report status is `VERIFIED` and WI-007 JSON/latest verifier are `ACCEPTED`/`VERIFIED`/`PASS`.
2. `docs/10_SECURITY_REVIEW.md:13` says R90 security/QA review “remains required” although the review status is `VERIFIED` and WI-007 latest verifier is `PASS`.
3. `docs/evidence/WI-007.md:36` says the evidence is ready for independent review and “does not mark VERIFIED/ACCEPTED” although its header is `Status: VERIFIED` and the current WI-007 JSON is accepted.
4. `docs/evidence/WI-007-REAL-DOGFOOD.md:33` says R90 still must verify WI-007 although `docs/evidence/WI-007-VERIFIER.md` is already `PASS`.

R00 must normalize those four historical/stale sentences or explicitly label them historical, while preserving the user-facing `WAITING_USER` product-acceptance gate. Because the user explicitly required QA docs status consistency, this is a blocking documentation finding and the final verifier verdict is `NEEDS_CHANGES`.

## Disposition

`NEEDS_CHANGES`. GP-01 through GP-08, self-dogfood evidence, Skill dual-write, README/start command, security boundary, and no-Agent-Board V1 scope are otherwise verified or independently corroborated. This report does not assign `ACCEPTED`; R00 must first normalize the four stale QA/evidence statements and record the verifier execution reference above.
