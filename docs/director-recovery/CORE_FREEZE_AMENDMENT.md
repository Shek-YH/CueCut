# Core Freeze Amendment — Contract-Preserving Architect Hotfixes

Date: 2026-09-09

The independent review identified implementation gaps in frozen Director paths. The Director Architect applied narrowly scoped corrections after the freeze because the existing behavior did not satisfy the already-frozen MUST contracts. These are not requirement deviations and do not weaken any acceptance condition.

Corrections:

- `semanticPlanner.ts` now recognizes the real conversational four-step markers, preserves the complete source transcript, and labels local extraction as `seed_only`.
- `capabilities.ts` validates numeric values against source evidence and requires item cues for list/ranking contracts.
- `compositionLinter.ts` requires actual visual effects for high-importance coverage and counts major intent transitions as visual events.
- `contextBuilder.ts` starts SelectionTrace contract flags as unverified.
- `service.ts` validates unit-scoped candidate membership (including missing bundles), makes fallback and unvalidated traces explicitly failed, and only materializes a passed trace after successful local validation.
- `prompt.ts` states the frozen no-excessive-repetition contract explicitly so the model has the same constraint as the local Linter.
- `candidateScope.ts` is the new non-frozen enforcement module that is called by the frozen service boundary; its inter-unit intersection check is part of the amendment record.

The frozen path list, contract definitions, and contract hash remain unchanged. No requirement was deleted, downgraded, deferred, or replaced with a prompt-only rule. Revalidation evidence: reviewer regression 12/12, full unit suite 196 passed with 4 explicit skips, `pnpm lint`, `pnpm build`, and the latest successful ComfyUI explicit real Director regression passed. The separate `jj.mp4` ordered run remains not accepted because its latest provider output failed local Linter validation.

The amendment is architectural recordkeeping; it does not authorize Git push or change Requirement verification status. Independent verifier status remains the acceptance gate.
