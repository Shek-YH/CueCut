# CueCut Single-Pass Packaging Engine — Atomic Requirement Matrix

Source: `CueCut_Single_Pass_AI_Packaging_Engine_PRD_V1.0.md`

This matrix is the execution source for the V1 delivery. The PRD's V1.5 and V2 sections remain recorded as deferred requirements; they are not silently removed or treated as implemented.

## V1 MUST/P0 requirements

| ID | PRD source | Atomic obligation | Acceptance | Implementation task |
|---|---|---|---|---|
| REQ-SP-001 | §2.1, §49, §51.1 | An automatic packaging run performs at most one generative AI call and persists the count. | CODE, TEST, REAL_WORLD | single-pass-18-ai-director |
| REQ-SP-002 | §4.1 | Analysis produces metadata, transcript, scenes, subjects, faces, safe zones, edge insets, audio envelope, beats, and density without generative AI. | CODE, TEST | single-pass-01-analysis-contract |
| REQ-SP-003 | §5.2, §6 | Packaging IR is schema-validated and contains canvas, style, timeline, constraints, and export hints. | CODE, TEST | single-pass-02-ir-schema |
| REQ-SP-004 | §29, §45 | Packaging IR and resolved plans are persisted locally and remain editable offline. | CODE, TEST | single-pass-03-persistence |
| REQ-SP-005 | §9 | Effects are described by an independent manifest contract with capability metadata and license provenance. | CODE, TEST, REAL_WORLD | single-pass-04-registry-manifest |
| REQ-SP-006 | §32 V1, §51.4-5 | V1 supports at least eight packaging categories and at least thirty registry effects. | CODE, TEST, REAL_WORLD | single-pass-05-registry-catalog |
| REQ-SP-007 | §10 | Registry resolution scores candidates deterministically and never requires an AI-selected final template ID. | CODE, TEST | single-pass-06-registry-resolver |
| REQ-SP-008 | §11, §53.8 | Motion is compiled from a finite DSL vocabulary with seed-controlled deterministic behavior; AI cannot emit keyframes. | CODE, TEST | single-pass-07-motion-dsl |
| REQ-SP-009 | §13, §32 V1 | Top, bottom, left, and right edge insets are independently configurable and enforced. | CODE, TEST | single-pass-08-safe-area |
| REQ-SP-010 | §12, §32 V1 | Subject `avoid` and `foreground` relations are resolved deterministically with configurable padding. | CODE, TEST, REAL_WORLD | single-pass-09-subject-spatial |
| REQ-SP-011 | §14-15 | Layout uses normalized coordinates and evaluates preferred plus fallback zones using deterministic placement scoring. | CODE, TEST | single-pass-10-layout |
| REQ-SP-012 | §16, §32 V1 | Collision resolution handles overlay, subtitle, subject, face, edge, safe-zone, and PiP conflicts without AI. | CODE, TEST | single-pass-11-collision |
| REQ-SP-013 | §17, §32 V1 | Every V1 effect has a deterministic fallback chain and failed layout never masquerades as a successful primary placement. | CODE, TEST | single-pass-12-fallback |
| REQ-SP-014 | §18, §32 V1 | Packaging Validator checks geometry, typography, timing, visual, and runtime constraints without AI. | CODE, TEST | single-pass-13-validator |
| REQ-SP-015 | §19-20 | Snapshot checkpoints are generated before full render and validator failures use only deterministic repairs. | CODE, TEST, REAL_WORLD | single-pass-14-snapshot-qa |
| REQ-SP-016 | §21, §53 | Final runtime timeline is compiled from resolved plans; render code never reads raw AI JSON directly. | CODE, TEST | single-pass-15-timeline-compiler |
| REQ-SP-017 | §25, §32 V1 | Preview and final render are separate paths; preview/scrub does not invoke final export. | CODE, TEST, REAL_WORLD | single-pass-16-preview-render-separation |
| REQ-SP-018 | §24, §32 V1, §51.15 | V1 exports normal MP4 and transparent WebM when the host codec supports it, with explicit capability errors otherwise. | CODE, TEST, REAL_WORLD | single-pass-17-export |
| REQ-SP-019 | §26-28, §45 | Theme, template, color, font, subtitle style, safe area, subject padding, speed, intensity, opacity, aspect ratio, and format edits reuse existing IR without another AI call. | CODE, TEST | single-pass-19-edit-without-ai |
| REQ-SP-020 | §28 | AI intent, resolved state, and locked user override are persisted separately; locked overrides are not auto-moved. | CODE, TEST | single-pass-19-edit-without-ai |
| REQ-SP-021 | §41-42, §51.17 | Same IR, registry version, engine version, and seed produce stable resolved output. | CODE, TEST | single-pass-20-determinism |
| REQ-SP-022 | §36, §46, §53.9 | Invalid AI JSON is schema-repaired locally once; if still invalid, the run fails without an automatic second AI call. | CODE, TEST | single-pass-18-ai-director |
| REQ-SP-023 | §50, §49 | Telemetry records AI success/failure, registry/layout fallback, collision repair, dropped overlays, render/export outcomes, manual override, and `aiCallCount`. | CODE, TEST | single-pass-21-telemetry |

## Deferred but preserved requirements

| ID | PRD source | Obligation | Planned status |
|---|---|---|---|
| REQ-SP-101 | §33, §52 | Subject matte, behind-subject, and hero-center compositing. | P1 / V1.5 |
| REQ-SP-102 | §23-24, §52 | Shader transitions, ProRes 4444 MOV, and PNG RGBA sequence export. | P1 / V1.5 |
| REQ-SP-103 | §23 | Transition cache and adjacent-scene dirty invalidation. | P1 / V1.5 |
| REQ-SP-104 | §34 | Lottie, Three.js, advanced shader, 3D, asset fusion, distributed/cloud render. | P2 / V2 |

## Fidelity decisions

- Existing frozen Director contracts remain unchanged; the new engine is introduced behind new modules and adapters.
- Existing motion registry entries are adapted into the new manifest contract only when their license/provenance metadata is present.
- HyperFrames is an architecture reference (Apache-2.0), not a source of copied assets. Any future code migration requires file-level license review and `THIRD_PARTY_NOTICES.md` evidence.
- V1.5/V2 are deferred by the PRD's own version boundary, not degraded or replaced with mocks.
