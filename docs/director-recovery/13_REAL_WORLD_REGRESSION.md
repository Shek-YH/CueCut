# CueCut Director Real-World Regression

Input: `测试素材与api/ComfyUI_00001_qguot_1787042165.mp4` (local only)

## Result

The explicit real test `CUECUT_RUN_REAL_DIRECTOR=1 pnpm exec vitest run tests/director/real-regression.test.ts` passed once after the local repairs. The test exercised one real ASR call and one real Director call and asserted `usedFallback=false`, non-empty transcript, valid Composition schema, and non-empty SelectionTrace.

## Observed metrics

| Metric | Value |
|---|---:|
| usedFallback | false |
| SRT subtitle blocks | 18 |
| Visual Units / candidate bundles | 18 / 18 |
| Composition segments | 7 |
| Effect objects | 7 |
| Visual events | 7 (no item reveal payload in this sample) |
| Visual events per minute | 6.70 |
| Density target | 9.00 |
| Effect family diversity | 6 distinct families; 7 objects |
| Data-contract failures | 0 after successful local validation |
| Duration violations | 0 after explicit capability repair |
| Ordered-process units | 0 detected in this sample; GOLDEN-001 covers the four-step fixture |
| Layout context | subject/face analysis unavailable; subtitle reserve and safe margin supplied; local solver/linter active |
| SelectionTrace coverage | 18/18 VisualUnits in the successful runtime path |
| Provider Director calls | 1 |

## Repairs observed

- One malformed subtitle range was deterministically clamped before schema validation.
- Seven Effect durations were bounded to registry capability maxima with an explicit warning.
- Four oversized layout cases were normalized to the safe-area boundary.

These repairs are visible in warnings and do not become silent acceptance. No provider credential, raw audio, or full private transcript was written to the ledger or committed.
