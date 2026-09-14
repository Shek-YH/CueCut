# WI-13 Evidence

**Status:** COMPLETED  
**Verification label:** SELF_VERIFIED

- Goal: add provider/settings/secret boundaries with Disabled-safe behavior.
- Changed files: `src/server/visualAssetProvider.ts`, `src/server/visualAssetRoute.ts`, `src/server/settingsRoute.ts`, `src/server/productionHost.ts`, `src/server/generationRoute.ts`, `src/server/packagingRoute.ts`, `src/server/transcriptionRoute.ts`, `src/app/App.tsx`, `src/app/layout.css`, `.env.example`, `tests/server/visualAssetRoute.test.ts`, `tests/server/settingsRoute.test.ts`, `tests/server/bailianConfig.test.ts`, `tests/app/generation-flow.test.tsx`.
- Tests added/updated: disabled provider returns empty assets without apiKey; settings fake store tracks secret names independently; visual asset settings survive a new store instance; settings form loads/saves without retaining the key; root `.env` `API KEY=` and `model=` assignments are supported.
- Commands: focused settings/config/app regression = 15 tests passed; full unit/integration regression = 394 passed / 4 skipped; `pnpm lint` exit 0; `pnpm build` exit 0; `git diff --check` exit 0.
- Acceptance: visual asset provider defaults to disabled, server reads `visualAssetApiKey` only for enabled calls, public settings expose configured bool only, nonsecret visual settings persist to `%APPDATA%/CueCut3/visual-asset-settings.json`, and Director uses root `.env` `qwen3.8-flash` when configured.
- Known limitation: no real provider credential configured or smoke-tested yet; this becomes the only expected user-only blocker at real-provider acceptance.
- Regression risk: settings route is now long-lived in production host so nonsecret provider config persists across restarts; real provider smoke remains unverified.
- Follow-up fix: Bailian and visual-asset settings now submit through separate handlers; saving one section no longer clears the other section's draft. Each section has an independent success/error message, and failed saves keep the entered value for retry.
- Rollback: revert WI-13 files and records only.
