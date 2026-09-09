# Motion Pack Installation Evidence

Date: 2026-09-09

## Scope

- ZIPs discovered: 7 total.
- Already installed baseline: v0.1.
- Remaining packs processed in this run: v0.2, v0.3, v0.4, v0.5, v0.6, v0.7.
- ZIPs with unsafe entries: 0.
- Source-pack scripts executed: none.
- Staging root: `src/motions/_import`.

The source ZIPs are retained under `src/motions` and the extracted source remains under `_import` for provenance. Third-party reference folders are not imported by the formal runtime. Formal runtime code uses CueCut-local, deterministic, serializable adapters.

## Formal counts

| Measure | Result |
|---|---:|
| v0.2-v0.7 descriptor entries | 87 |
| Formal Motion definitions with adapters | 106 |
| Formal Effect definitions | 106 |
| Runtime-capable formal entries | 106 |
| Registry/runtime mismatches | 0 |
| Legacy compatibility motions | 11 |

Machine-readable gate: `docs/audit/MOTION_RUNTIME_GATE.json` (`status=PASS`).

## License/provenance gate

v0.1 selected upstream files retain their MIT notices. v0.2-v0.7 formal adapter implementations are CueCut-local (`PROJECT-LOCAL`); upstream packages listed by the packs remain reference-only with their notices in the staged source. No unverified upstream code is imported into the formal runtime, so no pack required quarantine.

## Verification commands

```text
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/motion-pack-audit.ps1 -Extract
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-motion-catalog.ps1
pnpm exec vitest run tests/motions/pack-audit.test.ts tests/motions/pack-catalog.test.ts tests/motions/installation-gate.test.ts
```

The audit and installation tests passed after the formal registry/runtime was installed. The formal runtime scan only finds provenance URLs in registry metadata; it finds no runtime fetch, CDN, iframe, WebSocket, or remote font dependency.

## Gate status

Motion-pack implementation evidence is complete. Overall project acceptance remains open until the P0 work-item ledger is independently verified and the downstream transparent-MOV CapCut/Jianying check is performed by the Product Owner.
