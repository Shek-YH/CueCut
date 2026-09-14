# Preflight + External Bundle WI-00 Evidence

**Status:** COMPLETED  
**Verification label:** SELF_VERIFIED

- Baseline: `main`, HEAD `328122a737324be16c71d71dfbf17aadc77523c2`.
- Preserved existing dirty worktree; no reset, clean, stash, push, or user-file deletion.
- Relevant existing sources: `src/app/App.tsx`, `src/server/generationRoute.ts`, `src/server/packagingRoute.ts`, `src/server/settingsRoute.ts`, `src/server/visualAssetProvider.ts`, `src/runtime/*`, and existing packaging tests.
- Existing reusable capabilities: Secret Store, root `.env` Bailian parsing, Visual Asset Provider boundary, Canonical Runtime compiler, and deterministic packaging resolver.
- New PRD gaps identified before implementation: runtime capability query, client/server preflight, Bundle schema/import/binding, and real-media golden flow.
- Baseline commands: `pnpm lint` exit 0, `pnpm build` exit 0, full unit/integration regression before this PRD work `394 passed / 4 skipped`, `git diff --check` exit 0.
- Real fixture verified present: `F:\CCPJ\CueCut3\测试素材与api\jj.mp4`; FFprobe available.
