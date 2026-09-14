# WI-11｜Visual Asset Schema + Native Eligibility + Planner

**Status:** COMPLETED  
**Goal:** 将 VisualAssetRequest 解析、native eligibility、stable dedupe 与 deterministic budget 变成本地 candidate planner，不调用图片 Provider。

## Contract

- **Why now:** Visual Asset Layer 必须先能从 Director 输出筛选真正 raster-worthy 对象。
- **Dependencies:** WI-10 completed。
- **Primary files:** `src/visual-assets/schema.ts`、`styles.ts`、`nativeEligibility.ts`、`planner.ts`、planner tests。
- **Allowed scope:** eight request kinds, six local styles, native rejection, assetId/fingerprint/dedupe/source/budget。
- **Non-goals:** 不生成图片、不上传 SRT/视频、不接 secret/provider、不实现 atlas split。
- **Invariants:** native text/number/arrow never enter image pipeline; robot can; stable IDs; source subtitle trace retained; default budget 12。
- **Implementation steps:** planner failing tests → Zod request schema → style map/eligibility → deterministic candidate merge/sort/budget。
- **Tests/commands:** `tests/visual-assets/planner.test.ts`、`pnpm lint`。
- **User-visible acceptance:** fixed PackagingPlan produces fixed candidates and ignores native-renderable requests。
- **Failure handling:** invalid request or native-eligible request is ignored; no AI retry。
- **Rollback:** revert WI-11 visual-asset files/test/contract/evidence/ledger records only。

