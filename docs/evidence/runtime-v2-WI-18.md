# WI-18 Evidence

**Status:** WAITING_USER  
**Verification label:** SELF_VERIFIED

- Goal: establish CI commands and run the available synthetic/local Golden gates.
- Changed files: `.github/workflows/ci.yml`, `tests/e2e/vertical-slice.spec.ts` (updated stale current-UI selector), WI-18 evidence.
- Commands: `pnpm lint` exit 0; `pnpm build` exit 0; full unit/integration with `--exclude tests/e2e/** --pool=forks --maxWorkers=1 --no-file-parallelism` = 125 passed / 4 skipped / exit 0; full Playwright E2E `pnpm test:e2e -- --workers=1` = 9 passed / 5 skipped / 0 failed; ledger JSON validation exit 0.
- Acceptance: CI workflow covers lint, controlled Vitest, build, and Playwright E2E; synthetic import/generate/Workspace/Lab Apply/Undo/export path passed in Chromium.
- Known limitation: real Visual Asset Provider smoke has not run because no provider credential is configured; optional real media tests remain skipped without approved paths.
- Safety incident: the full E2E run rewrote the two screenshots that were already dirty before this task (`docs/evidence/prototype-baselines/02-effect-lab.png` and `docs/evidence/screenshots/01-edit-workspace.png`). No local backup or test-results copy was found; they remain dirty and were not overwritten with HEAD. This must not be treated as preserved original content.
- Waiting user: configure the Visual Asset provider/key in CueCut Settings or the server secret store; do not paste the secret into chat or ledger. Then run one approved asset-generation smoke and update this evidence.
- Regression risk: CI uses synthetic fixtures and does not prove third-party provider reliability or private-media policy.
- Rollback: revert CI/test selector/evidence and WI-18 ledger records only.
