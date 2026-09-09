# WI-008 Independent Verifier Evidence

Verdict: `NEEDS_CHANGES`

Acceptance: `NOT ACCEPTED` — this is R90 verification evidence only.

## Execution identity

- Verifier role: R90 Independent Verifier
- Verifier executionRef: `<this spawn agent id; R00 must backfill the returned spawn id>`
- Owner: R00
- WI-008 owner executionRef: `null` in `docs/work-items/WI-008.json`
- Existing WI-008 review ref: `01a0835c-4bfa-78d1-a4f8-9c7e35d78c33`
- Owner/verifier refs must be distinct; the verifier spawn id is intentionally left for R00 to record.

## Scope checked

Read and checked the WI-008 context, work item JSON, project entry, Core Golden Path, final-acceptance documents, implementation log, WI-001/002/003/004/005/006/007/009/010 owner and latest verifier evidence, WI-007 real dogfood evidence, both screenshots, all seven `.ai-ledger` files, the current global Skill, the implementation sources, tests and governance graph.

## Fresh command evidence

All commands below were independently run from `F:\\CCPJ\\CueCut3\\AI-Project-Ledger-Dashboard` before this report:

| Command | Exit | Result |
| --- | ---: | --- |
| `pnpm test` | 0 | 20 test files / 69 tests passed; QA large-project SSE refresh 836ms |
| `pnpm lint` | 0 | TypeScript no-emit check passed |
| `pnpm build` | 0 | TypeScript and Vite build passed; 26 modules transformed |
| `pnpm test:e2e` | 0 | Chromium 1/1 passed |
| `pnpm workflow` | N/A | No `workflow` script is defined in `package.json`; skipped per “if available” |

## Work-item status/reference audit

- WI-001/002/003/004/005/006/007/009/010 each currently has JSON `status=ACCEPTED`, `review.status=VERIFIED`, `review.verdict=PASS`, a non-null owner executionRef, a non-null verifier executionRef, and distinct owner/verifier refs.
- Each current review ref is present in its latest verifier evidence. Referenced artifacts/evidence paths resolve.
- WI-008 correctly remains `status=WAITING_USER`, `review.status=IN_PROGRESS`, `review.verdict=null`; this verifier does not change that state.
- Historical verifier files for WI-004 and WI-005 still contain earlier `NEEDS_CHANGES` results, but the later WI-004 recheck and WI-005 final verifier files resolve those findings. This is traceable history, not the current JSON verdict.
- `docs/09_TEST_RESULTS.md`, `docs/10_SECURITY_REVIEW.md`, and `docs/evidence/WI-007.md` still say `READY_FOR_REVIEW`/await R90 while WI-007 JSON is already `VERIFIED/PASS`. This stale status text should be normalized before release evidence is treated as internally consistent.

## Golden Path matrix

| Step | Result | Evidence |
| --- | --- | --- |
| GP-01 Add Project Folder | **NEEDS_CHANGES** | `03_CORE_GOLDEN_PATH.md` and PRD §26 require user folder input, validation and registration. `web/App.tsx:25-32,329-330` renders `Add Project Folder` but `DashboardApp` is mounted without a callback in `web/main.tsx`, so the button is inert. `server/api/index.ts:102-119` only exposes in-memory methods, and `server/index.ts:40-84` receives fixed `projectRoots` at startup; no add/register API or UI input path is wired. The existing dogfood used `LEDGER_PROJECT_ROOT`, which proves startup loading, not the requested Add Project Folder action. |
| GP-02 stable identity / ledger detection | PASS | The real isolated server returned `projectId=ai-project-ledger-dashboard-v1` and the target root; project/tasks/runtime IDs match and the normalized root binding passed. |
| GP-03 validated aggregate snapshot | PASS | The exact seven `.ai-ledger` files were present, all JSON/JSONL parsed, all machine projectIds matched, 11 task records/10 leaf tasks and 19 valid events were observed, with no warning on the live load. |
| GP-04 seven-page read-only Dashboard | PASS | Real local page navigation exposed Overview, Tasks, Blockers, Activity, Roles, Artifacts and Settings. Tasks showed the nested tree and T-008 `WAITING_USER`; Settings showed the `READ-ONLY` boundary. The stored Overview and Tasks screenshots were visually checked. |
| GP-05 watcher/SSE refresh | PASS as attributed evidence | WI-007 real evidence records atomic update plus 214.13ms UI refresh; fresh QA passed the large-project refresh in 836ms. The verifier did not mutate the target `.ai-ledger`, as explicitly prohibited. |
| GP-06 malformed JSON/LKG recovery | PASS as attributed evidence | WI-007 real evidence records warning visibility, valid restoration and `LKG_RECOVERY=PASS`; fresh ledger/QA tests passed LKG behavior. The destructive mutation sequence was not replayed by this verifier because `.ai-ledger` writes are forbidden. |
| GP-07 additive Legacy Migration | PASS | Current WI-004 recheck is R90 `PASS`; the corrected parser covers `正在开发`, safe phrase boundaries, LOW-confidence fallback, seven-file skeleton and byte-preserved Markdown. |
| GP-08 self-project dogfood / boundaries | PASS as attributed evidence | Real self-dogfood records the stable projectId, 214.13ms refresh, LKG recovery and `NO_DOGFOOD_LISTENERS`; an independent read-only live run confirmed the self project and SSE page. Current source/tests preserve localhost-only binding, allowlist/denylist, artifact containment, no task-state UI writes and no Agent Board integration. |

## Other acceptance checks

- `.ai-ledger` is exactly the seven expected files: `project.json`, `tasks.json`, `roles.json`, `sessions.json`, `artifacts.json`, `events.jsonl`, `runtime.json`; no extra file or dogfood temp file was present. Current tasks hash after the read-only run remained `CDBD72571BC6551866D8AC30ECA4D490926BA85F6B985922256A947477F57A7B`.
- The current Skill contains the seven-file contract, stable root/projectId binding, seven statuses/invariants, atomic sibling-temp rename, append-only events, LKG validation ordering, explicit secret prohibition, read-only task state and the no-Agent-Board V1 boundary. The independent Skill contract test passed.
- Target screenshots exist at `docs/evidence/screenshots/overview.png` and `docs/evidence/screenshots/tasks.png`; both were visually inspected.
- `docs/11_FINAL_ACCEPTANCE.md` and `docs/FINAL_ACCEPTANCE.md` preserve the user gate and correctly keep final status `WAITING_USER`; this verifier does not claim Product/Release Acceptance.
- Target top-level `README.md` is missing. The parent `F:\\CCPJ\\CueCut3\\README.md` belongs to CueCut and is not a Dashboard README. The runnable start command exists only in `docs/11_FINAL_ACCEPTANCE.md` (`pnpm install`, `pnpm dev:all`, `http://127.0.0.1:4173`).
- The isolated read-only run used `127.0.0.1:3311`/`4311`; after shutdown port 3311 had no listener and port 4311 had only TIME_WAIT entries, not a listener. No `.dogfood.tmp` remained.

## Blocking findings

1. **P0 GP-01 is not implemented end to end.** Add Project Folder is a rendered inert button. The required local directory input, validation, migration/skeleton decision and registry update are not available from the running Dashboard path.
2. **P1 target README is missing.** A self-contained V1 handoff has no project-local README/start guide; the parent README documents a different CueCut application.
3. **P1 acceptance evidence has stale status text.** WI-007 JSON and latest R90 evidence are `VERIFIED/PASS`, but three current supporting reports still say `READY_FOR_REVIEW`/awaiting R90. Normalize or explicitly mark those lines historical before final release review.

## Disposition

`NEEDS_CHANGES`. The implementation/test/security/self-dogfood evidence is otherwise green, but GP-01 and the required target README/start-guide check are not satisfied. R00 should address the blockers, rerun the real Add Project Folder path, update the traceability text, then request a fresh R90 verification. This document records no `VERIFIED` or `ACCEPTED` state and the verifier changed no production, test, `.ai-ledger`, or Skill file.
