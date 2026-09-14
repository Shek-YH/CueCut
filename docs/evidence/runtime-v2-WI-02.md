# WI-02 Evidence

**Status:** COMPLETED  
**Verification label:** SELF_VERIFIED

- Goal: separate effect-template and motion semantics without a broad migration.
- Changed files: `src/effects/templateRegistry.ts`, `src/motions/transitionRegistry.ts`, `src/motions/contentRegistry.ts`, `tests/effects/registry-split.test.ts`, WI-02 contract/evidence.
- Tests added: pack template stable identity; transition excludes `pack-effect`; content registry contains only text/number/list categories.
- Commands: split + registry/pack/director/packaging regression = 8 files / 28 tests passed; `pnpm lint` exit 0; `git diff --check` exit 0.
- Acceptance: `cuecut-before-after-split` is discoverable as an EffectTemplate with stable `pack-0-2-beforeafter:cuecut-before-after-split` identity; no pack-effect is exposed as transition motion.
- Known limitation: legacy callers still use the original mixed registries; migration is intentionally deferred to WI-03/WI-10.
- Regression risk: derived views are read-only and old exports remain unchanged.
- Rollback: revert only the new registry views, split test, and WI-02 records.

