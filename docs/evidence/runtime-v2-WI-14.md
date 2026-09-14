# WI-14 Evidence

**Status:** COMPLETED  
**Verification label:** SELF_VERIFIED

- Goal: connect local deterministic runtime/grounding/asset planning to the existing one-click Packaging flow.
- Changed files: `src/app/App.tsx`, `tests/app/generation-flow.test.tsx`, WI-14 contract/evidence.
- Tests added/updated: packaging UI still reports AI 1 time; mainline regression covers plan response, grounding/planner/runtime compile integrations.
- Commands: App/server/grounding/planner/runtime regression = 5 files / 18 tests passed; `pnpm lint` exit 0; `git diff --check` exit 0.
- Acceptance: non-one-call response is rejected, grounded fatal units stop before apply, visual assets are planned locally, applied Project is compiled into Canonical Runtime before store mutation.
- Verified follow-up: the button now dispatches visual asset planning and the configured visual provider path; returned assets are bound to matching `assetRequest.assetId` entries before Runtime compilation. Unconfigured providers remain an explicit visible fallback.
- Regression risk: plans containing optional grounding fields can now be rejected deterministically; legacy plans without those fields retain compatibility.
- Rollback: revert WI-14 files and records only.
