# Core Freeze Amendment — Contract-Preserving Architect Hotfixes

Date: 2026-09-09

The independent review identified implementation gaps in frozen Director paths. The Director Architect applied narrowly scoped corrections after the freeze because the existing behavior did not satisfy the already-frozen MUST contracts. These are not requirement deviations and do not weaken any acceptance condition.

Corrections:

- `semanticPlanner.ts` now recognizes the real conversational four-step markers, preserves the complete source transcript, and labels local extraction as `seed_only`.
- `capabilities.ts` validates numeric values against source evidence and requires item cues for list/ranking contracts.
- `compositionLinter.ts` requires actual visual effects for high-importance coverage and counts major intent transitions as visual events.
- `contextBuilder.ts` starts SelectionTrace contract flags as unverified.
- `service.ts` validates unit-scoped candidate membership, makes fallback traces explicitly failed, and only materializes a passed trace after successful local validation.

The frozen path list, contract definitions, and contract hash remain unchanged. No requirement was deleted, downgraded, deferred, or replaced with a prompt-only rule. Revalidation evidence: reviewer regression 9/9, full unit suite 174 passed with 3 explicit skips, `pnpm lint`, `pnpm build`, and the explicit real Director regression passed.

The amendment is architectural recordkeeping; it does not authorize Git push or change Requirement verification status. Independent verifier status remains the acceptance gate.
