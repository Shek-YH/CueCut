# CueCut Preflight + External Packaging Bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不破坏一次 Director 调用契约的前提下，加入生成前/服务端 Preflight，并支持外部 Packaging Bundle JSON 及本地素材绑定。

**Architecture:** 共享 `RuntimeCapabilities` 与 `CueCutPackagingBundle` schema；客户端在生成前读取能力，服务端在产生副作用前二次校验。外部 Bundle 只走本地 schema、资产绑定与现有 Runtime Compiler，不调用任何 AI API。

**Tech Stack:** React 19, TypeScript, Node HTTP routes, Zod, Vitest, Playwright。

---

### Task 1: WI-00 baseline and evidence

**Files:**
- Create: `docs/evidence/preflight-external-bundle-WI-00.md`
- Inspect only: `package.json`, `src/app/App.tsx`, `src/server/*`, `src/runtime/*`, `tests/*`

- [ ] Record HEAD, branch, dirty files, current test/build commands, relevant route/runtime map, and preserved user changes.
- [ ] Run baseline typecheck, focused tests, and `git diff --check`; record exit codes without claiming product acceptance.

### Task 2: WI-01 runtime capabilities

**Files:**
- Create: `src/contracts/runtimeCapabilities.ts`, `src/server/runtimeCapabilities.ts`, `src/server/runtimeCapabilitiesRoute.ts`
- Modify: `src/server/productionHost.ts`
- Test: `tests/server/runtimeCapabilities.test.ts`

- [ ] Test secret-store/env precedence, model presence, disabled/misconfigured visual assets, and secret-free response.
- [ ] Implement `GET /api/runtime-capabilities` with `configured` distinct from `verified`.

### Task 3: WI-02/03 preflight and timeout

**Files:**
- Modify: `src/app/App.tsx`, `src/server/generationRoute.ts`, `src/server/packagingRoute.ts`, `src/director/bailianProvider.ts`
- Test: `tests/app/generation-flow.test.tsx`, `tests/server/generationRoute.test.ts`, `tests/server/packagingRoute.test.ts`

- [ ] Add failing client test proving no transcription/generation request occurs when Director is unconfigured.
- [ ] Add server test for HTTP 409 before ffmpeg/ASR and provider timeout with bounded error.
- [ ] Implement state transitions `preflight → blocked|generating` and a 30-second request timeout.

### Task 4: WI-04 optional visual-asset fallback

**Files:**
- Modify: `src/app/App.tsx`, `src/server/visualAssetProvider.ts`, `src/server/visualAssetRoute.ts`
- Test: `tests/server/visualAssetRoute.test.ts`, `tests/app/generation-flow.test.tsx`

- [ ] Prove disabled/misconfigured/failed visual assets produce warnings while native packaging remains usable and Director call count remains one.
- [ ] Keep provider input limited to frozen asset plans; never send video or full SRT.

### Task 5: WI-05 shared Bundle schema

**Files:**
- Create: `src/contracts/packagingBundle.ts`, `src/server/externalBundleValidator.ts`
- Test: `tests/contracts/packagingBundle.test.ts`

- [ ] Validate plan/project mode, asset IDs, file names, mime types, paths, URLs, and reject API-key fields.

### Task 6: WI-06/07 import and binding

**Files:**
- Create: `src/import/externalBundle.ts`, `src/import/assetBinding.ts`, `src/server/externalBundleRoute.ts`
- Modify: `src/app/App.tsx`, `src/app/layout.css`, `src/server/productionHost.ts`
- Test: `tests/import/externalBundle.test.ts`, `tests/import/assetBinding.test.ts`, `tests/app/external-bundle-import.test.tsx`

- [ ] Add “载入包装 JSON” and multi-file selection without changing primary navigation.
- [ ] Implement plan/project local import, fileName/assetId binding, optional/required partial state, hash mismatch handling, and no-AI-call assertions.
- [ ] Disable export while required assets are missing.

### Task 7: WI-09 real-media contract and final evidence

**Files:**
- Modify: `tests/e2e/vertical-slice.spec.ts`
- Create: `docs/evidence/preflight-external-bundle-WI-09.md`

- [ ] Run lint, build, unit/integration tests, Playwright with `F:\CCPJ\CueCut3\测试素材与api\jj.mp4`, and inspect browser-visible states.
- [ ] Start the production site, verify capabilities/settings/import entry, then open the site for manual takeover.
- [ ] Record real-media limitations and any remaining credential-only blocker honestly.
