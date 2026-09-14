# WI-10｜Canonical Packaging Catalog

**Status:** COMPLETED  
**Goal:** 让 pack catalog、Packaging Resolver 与 Director 可见的 pack candidate view 从同一 source 派生，并把重复使用改为 soft penalty。

## Contract

- **Why now:** 之前 `packMotionCatalog` 被多处间接派生，resolver 还 hard-exclude 已用 effect。
- **Dependencies:** WI-09 completed。
- **Primary files:** `src/packaging-registry/canonicalCatalog.ts`、`src/packaging-registry/catalog.ts`、`src/packaging-registry/resolver.ts`、motion registry/adapters。
- **Allowed scope:** shared source accessor, derived Director view, resolver penalty; preserve old APIs。
- **Non-goals:** 不改 Director call count、不迁移 UI、不删除 legacy catalog、不做 Visual Asset planner。
- **Invariants:** one pack source; semantic suitability remains primary; repeated candidate remains available; no secrets.
- **Implementation steps:** source/penalty failing tests → shared accessor → derived catalog imports → soft penalty → regression。
- **Tests/commands:** canonical catalog/pack/resolver/motion/director regressions、`pnpm lint`、`git diff --check`。
- **User-visible acceptance:** AI and resolver cannot disagree about pack catalog membership; best semantic candidate is not silently removed solely due to recent use。
- **Failure handling:** excluded candidates receive an 8-point deterministic penalty and explicit reason; list remains non-empty when all candidates are recent。
- **Rollback:** revert WI-10 catalog/resolver/import/test/contract/evidence/ledger records only。

