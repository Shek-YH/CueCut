# WI-07 Evidence

**Status:** COMPLETED  
**Verification label:** SELF_VERIFIED

- Goal: add deterministic bounded layout metadata to template registry entries.
- Changed files: `src/effects/templateRegistry.ts`, `tests/effects/templateLayout.test.ts`, WI-07 contract/evidence.
- Tests added: numeric/quote/list default geometry differs; all templates satisfy min/default/max and non-empty preferred zones.
- Commands: template split/layout tests = 2 files / 3 tests passed; `pnpm lint` exit 0.
- Acceptance: metadata is derived from existing semantic tags and does not change old registry IDs or Project schema.
- Known limitation: packaging resolver still uses its legacy size until WI-08 wires template metadata into layout scoring.
- Regression risk: additive metadata only.
- Rollback: revert WI-07 files and records.

