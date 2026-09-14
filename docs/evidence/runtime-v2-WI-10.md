# WI-10 Evidence

**Status:** COMPLETED  
**Verification label:** SELF_VERIFIED

- Goal: centralize the pack catalog source and replace hard effect exclusion with soft diversity scoring.
- Changed files: `src/packaging-registry/canonicalCatalog.ts`, `src/packaging-registry/catalog.ts`, `src/packaging-registry/resolver.ts`, `src/motions/registry.ts`, `src/motions/adapters.ts`, `tests/packaging-registry/canonicalCatalog.test.ts`.
- Tests added: resolver/manifest IDs match the canonical pack source; Director view contains canonical tags; recent candidate stays selectable with `recent-use-penalty`.
- Commands: canonical/pack/resolver/motion/director regression = 6 files / 22 tests passed; `pnpm lint` exit 0; `git diff --check` exit 0.
- Acceptance: pack adapters, packaging manifests, and Director catalog view derive from `canonicalPackagingCatalog`; semantic candidate ranking is not replaced by a hard exclusion.
- Known limitation: legacy `effectRegistry` remains a compatibility surface until later catalog integration.
- Regression risk: a repeat candidate may now be selected when its semantic score outweighs the penalty, by design.
- Rollback: revert only WI-10 files and records.

