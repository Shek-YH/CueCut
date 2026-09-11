# CueCut Single-Pass Packaging Engine — Architecture Phase

## Boundary

The engine has one creative boundary and one deterministic boundary:

```text
AnalysisSnapshot + Preferences
          ↓ (one call maximum)
Packaging IR (AI intent only)
          ↓
Registry Resolve → Layout → Subject/Collision → Fallback → Validate/Repair
          ↓
Resolved Plan → Runtime Timeline → Preview or Export
```

The deterministic chain is callable offline after the IR is persisted. No QA, layout, collision, fallback, aspect-ratio change, theme change, or re-export can call the generative provider.

## New module layout

| Module | Responsibility | Forbidden dependency |
|---|---|---|
| `src/packaging-ir/` | Zod schema, types, normalization, user override state | provider, renderer |
| `src/analysis/` | deterministic input snapshot contracts and local analysis adapters | generative AI |
| `src/packaging-registry/` | manifest validation, catalog, deterministic resolver | provider |
| `src/packaging-motion/` | finite Motion DSL and seeded compiler | provider, `Math.random()` |
| `src/packaging-layout/` | safe area, candidate placement, normalized geometry | provider |
| `src/packaging-subject/` | subject relations and expanded avoid zones | provider |
| `src/packaging-collision/` | conflict detection and deterministic repair ordering | provider |
| `src/packaging-fallback/` | candidate fallback chains and drop policy | provider |
| `src/packaging-validator/` | geometry/typography/timing/visual/runtime checks and repairs | provider |
| `src/packaging-timeline/` | resolved-plan to runtime timeline compiler | raw AI JSON |
| `src/packaging-preview/` | checkpoint sampling and preview plan | final export |
| `src/packaging-export/` | MP4/WebM capability contracts and export adapters | AI state |
| `src/packaging-ai/` | one-call guard, prompt contract, local JSON repair, schema validation | layout/collision/QA |
| `src/packaging-telemetry/` | append-only generation telemetry and call count | secrets |

The existing frozen paths under `src/director/` and `src/layout/` are not modified in the first implementation pass. Adapters may consume their public types where compatible.

## Core contracts

1. `PackagingPlan` is the persisted AI-facing IR.
2. `ResolvedPackagingPlan` is the only input accepted by the runtime timeline compiler.
3. `UserOverride` has explicit `locked` semantics.
4. `RegistryManifest` carries category, style, aspect, zone, relation, duration, motion, content, and license metadata.
5. `ValidationReport` distinguishes primary success, fallback, repair, and dropped non-critical overlay.
6. `GenerationTelemetry.aiCallCount` is monotonic within one generation run and must be exactly `1` on a successful provider-backed automatic packaging run.

## HyperFrames reference boundary

The inspected HyperFrames repository exposes useful patterns in its `producer`, `registry`, capture, render-plan, frame, and runtime packages. CueCut adopts the ideas of registry capability metadata, seek-safe deterministic runtime, staged render plans, and frame/snapshot validation. It does not copy HyperFrames assets, UI, generated catalog content, or implementation files.
