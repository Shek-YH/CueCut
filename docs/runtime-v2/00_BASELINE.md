# CueCut Runtime V2 + Visual Asset Layer 基线

**Work Item:** WI-00  
**日期:** 2026-09-12  
**Execution Profile:** Luna Execution Profile  
**执行模式:** constrained-single-agent（本轮未宣称独立验证）

## Safety snapshot

- Project Root: `F:\CCPJ\CueCut3`
- Branch: `main`
- HEAD: `328122a737324be16c71d71dfbf17aadc77523c2`
- 与 PRD 指定审查基线 `328122a737324be16c71d71dfbf17aadc77523c2` 的提交差异：无。
- Dirty files（保留，不覆盖）：`docs/evidence/prototype-baselines/02-effect-lab.png`、`docs/evidence/screenshots/01-edit-workspace.png`。
- Untracked user inputs（保留）：`CueCut_Runtime_V2_VisualAsset_Luna_Development_PRD_v1.0.md`、`CueCut_Codex_Luna_Master_Execution_Prompt_v1.0.md`。
- 未执行：reset、clean、stash、push、强制改写历史。

## Toolchain and baseline commands

| Command | Exit | Evidence |
|---|---:|---|
| `pnpm lint` | 0 | TypeScript project check passed |
| `pnpm build` | 0 | Client and SSR bundles built; Vite emitted existing extensionless-import warnings |
| `pnpm exec vitest --run tests/media/video.test.ts tests/media/video-probe.test.ts tests/packaging/resolve.test.ts --reporter=dot` | 0 | 3 files / 20 tests passed |
| `pnpm test --run` | 1 | Started, emitted existing jsdom `Not implemented: navigation to another Document`, stayed alive beyond 40s and was interrupted; no passing full-suite claim |

Runtime: Node `v24.11.0`, pnpm `11.19.0`. Repository inventory at intake: 117 non-import source files and 119 test files.

## Relevant code map

| Concern | Current source of behavior | Baseline finding |
|---|---|---|
| App/import | `src/app/App.tsx`, `src/media/video.ts`, `src/media/videoProbe.ts` | Probe state exists, but browser playback readiness is not a separate state; import path does not own a guaranteed pause/reset-to-zero contract. |
| Project state | `src/project/schema.ts`, `src/project/store.ts` | Project schema is v1; effects remain the editable domain model. Runtime V2 is not yet a single derived contract. |
| Director contract | `src/director/service.ts`, `src/director/oneCallGuard.ts`, `src/server/generationRoute.ts` | One-call guard and `aiCallCount: 1` exist. This is preserved. |
| Packaging | `src/packaging/resolve.ts`, `src/packaging/apply.ts`, `src/packaging-validator/validator.ts`, `src/packaging-timeline/compiler.ts` | Deterministic resolve/timeline/validator pieces exist, but apply remaps rich motion intents to legacy IDs and the validator is not proven on the main UI path. |
| Effect catalog | `src/effects/registry.ts`, `src/motions/packCatalog.ts`, `src/motions/registry.ts` | Effect metadata and pack-effect motion entries are mixed across registries; no canonical EffectTemplateRegistry contract. |
| Scene/runtime | `src/render/scene.ts`, `src/motions/runtime.ts` | Scene exposes translate fields, but active evaluation uses legacy `fade`; pack effects collapse to a small `visualKind` set. |
| Workspace/Lab | `src/editor/canvas/CanvasStage.tsx`, `src/app/App.tsx` | Workspace and Effect Lab consume generic visual families/preview logic rather than a shared RenderSpec. Draft transaction exists and must be preserved. |
| Export | `src/export/renderer.ts`, `src/render/canvasRenderer.ts` | Export has an independent generic Canvas surface and does not consume a canonical effect renderer contract. |
| Layout | `src/layout/solver.ts`, `src/layout/compositionLayout.ts`, `src/layout/visualContext.ts`, `src/packaging-layout/solver.ts` | Safe margins/context exist, but recent-placement diversity and full spatial scoring are not wired through the main path. |
| Tests/E2E | `tests/media`, `tests/packaging`, `tests/app`, `tests/e2e` | Existing tests cover pieces and a vertical slice; visual contracts for structural effect difference and Workspace/Export parity are not yet present. |

## PRD gap audit

| PRD issue | Status at current HEAD | Evidence / next item |
|---|---|---|
| Video first-frame reliability | OPEN | `CanvasStage` handles `loadedmetadata` and seeks to the current external time; WI-01 |
| Registry split | OPEN | Pack effect definitions are still in motion registry/catalog paths; WI-02 |
| Canonical RuntimeItem | OPEN | No `src/runtime/` contract; WI-03 |
| CompiledMotion end-to-end | OPEN | `src/packaging/apply.ts` maps `slide_*` to `soft-slide`, `scale_*` to `pop`, and `slide_out*` to `fly-left`; WI-04 |
| Shared renderer / five distinct effects | OPEN | `scene.ts` and `export/renderer.ts` use generic `visualKind`; WI-05 |
| Effect Lab runtime draft preview | PARTIAL | Clone/apply/cancel exists; shared real renderer does not; WI-06 |
| Layout metadata/diversity/spatial wiring | PARTIAL | Context and solver exist, but subject/face are explicitly unavailable and recent placement is absent; WI-07/WI-08 |
| Grounding validator | PARTIAL | Candidate ID/composition validation exists; KeyClaim/Evidence grounding rules are absent; WI-09 |
| Canonical packaging catalog | OPEN | Director view is derived from `effectRegistry`; resolver resolves from pack catalog paths; WI-10 |
| Visual Asset schema/planner/atlas | OPEN | No `src/visual-assets/` layer; WI-11/WI-12 |
| Provider/settings/secret integration | PARTIAL | Existing secret store is for current provider settings; visual-asset provider contract is absent; WI-13 |
| One-click integration/mainline validator | PARTIAL | Existing generate path resolves and applies, but has no asset pipeline and no proven grounding/validator gate; WI-14/WI-16 |
| Workspace asset renderer/parity/CI | OPEN | No visual asset primitive or V2 visual contract/CI gate; WI-15/WI-17/WI-18 |

## Implementation Note

1. Treat current project code as the Source of Truth after the explicit PRD.
2. Keep `oneCallGuard` and current single Director request intact.
3. Preserve old Project schema compatibility while deriving V2 runtime state.
4. Split work by one subsystem and one user-visible acceptance target.
5. Prefer synthetic fixtures for all asset tests.
6. Do not request provider credentials before WI-13 real smoke readiness.
7. Do not use the two dirty PNGs as implementation inputs or overwrite them.
8. Do not add a new framework, renderer dependency, or remote asset.
9. Label incomplete full-suite test behavior as a baseline anomaly.
10. Start WI-01 only after this snapshot and focused baseline evidence are recorded.

## Next executable Work Item

`runtime-v2-WI-01` / `WI-01 Video Preview Reliability`.

