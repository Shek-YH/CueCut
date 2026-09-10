# CueCut Director Real-World Regression

Input: `测试素材与api/ComfyUI_00001_qguot_1787042165.mp4` (local only)

## Result

The explicit real test `CUECUT_RUN_REAL_DIRECTOR=1 pnpm exec vitest run tests/director/real-regression.test.ts` passed on the latest run after the independent-review fixes. The first four real attempts exposed malformed subtitle timing, overlong Effect durations, and unsafe layout dimensions; a later run exposed stochastic repetition/duration violations and was correctly rejected by the Linter. The latest run was the seventh real attempt and exercised one real ASR call and one real Director call, asserting `usedFallback=false`, non-empty transcript, valid Composition schema, and non-empty SelectionTrace after candidate-scope and numeric-evidence validation.

## Observed metrics

| Metric | Value |
|---|---:|
| usedFallback | false |
| SRT subtitle blocks | 18 |
| Visual Units / candidate bundles | 18 / 18 |
| Composition segments | 6 |
| Effect objects | 6 |
| Visual events | 8 (6 effects + 2 major intent transitions; no item reveal payload in this sample) |
| Visual events per minute | 7.66 |
| Density target | 9.00 |
| Effect family diversity | 4 distinct families; 6 objects |
| Data-contract failures | 0 after successful local validation |
| Duration violations | 0 after explicit capability repair |
| Ordered-process units | 0 detected in this sample; GOLDEN-001 covers the four-step fixture |
| Layout context | subject/face analysis unavailable; subtitle reserve and safe margin supplied; local solver/linter active |
| SelectionTrace coverage | 18/18 VisualUnits in the successful runtime path |
| Provider Director calls | 1 |

The ComfyUI sample itself does not contain a complete ordered four-step sequence. That acceptance case is covered by the committed fixture `tests/fixtures/director/ai-reading-four-step.srt`: the planner recognizes the real conversational markers (`第一步`, `第二`, `第三步啊`, `第四步啊`) as one ordered-process VisualUnit, and the fixture composition test verifies all four item cues and completeness. An opt-in real-video run against `测试素材与api/jj.mp4` was also attempted repeatedly: early runs exposed an ambiguous cross-unit segment and transient `fetch failed`; after deterministic scope/shape repairs, the latest run reached the local Linter but still rejected provider output for duration, item cue, provenance, comparison-slot, repetition, and ordered source-cue violations. These attempts are recorded as FAIL/NOT_ACCEPTED, not as a real ordered PASS.

## Repairs observed

- One malformed subtitle range was deterministically clamped before schema validation.
- Effect durations were bounded to registry capability maxima with explicit warnings on runs where the provider exceeded capability bounds.
- Four oversized layout cases were normalized to the safe-area boundary.
- Per-VisualUnit candidate scope was checked after global ID allow-list validation; an ID that is globally valid but absent from the unit bundle now falls back.
- Numeric values are checked against the declared SRT/user/project-data evidence source; provenance labels alone are insufficient.

These repairs are visible in warnings and do not become silent acceptance. No provider credential, raw audio, or full private transcript was written to the ledger or committed.
