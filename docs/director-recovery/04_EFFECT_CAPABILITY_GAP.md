# CueCut Director Phase 1 — Effect Capability Gap

## Registry inventory

源码静态可证的组成：

- `legacyEffectRegistry`：13 个 legacy Effect（`src/effects/registry.ts:33-47`）。
- `contentMotionAdapterRegistry`：5 个 text + 2 个 number + 2 个 list adapter（`src/motions/adapters.ts:153-169,188`）。
- `motionLayerAdapterRegistry`：11 个 preset（`src/motions/adapters.ts:171-189`）。
- `formalEffectRegistry` 明确过滤 `category !== 'pack-effect'`（`src/motions/registry.ts:165`），所以 87 个 `packMotionCatalog` 条目（`src/motions/packCatalog.json`，136,882 bytes）不会通过这一层进入 `effectRegistry`。
- 因此按源码组合，`effectRegistry` 的直接生成候选上限为 13 + 9 + 11 = 33；87 个 pack 条目是独立 catalog，是否应成为正式 Effect candidate 需要在 Phase 3 migration 中显式决定，不能默认为已接入。

对 87 个 pack 条目做 PRD 要求字段的 compact projection 得到 46,797 UTF-8 bytes，按 4 bytes/token 只是约 11,700 token 的粗略估计，不是特定模型 tokenizer 的精确结果；原始 JSON 约 34,221 token 粗估。该测量支持 per-unit bounded bundle，而不支持把完整原始 catalog 无条件塞进一次 prompt。

## Capability comparison

| Capability | Registry source | Reaches Director today? | Local validation today? | Gap |
|---|---|---:|---:|---|
| family/variant | `EffectDefinition.familyId/variantId` | indirectly as `id` | yes, ID index | no structured capability binding |
| display name | `displayName` | no | no | prompt cannot explain candidate identity |
| content slots | `contentSlots` | no | no | arbitrary content keys/values accepted |
| min/max duration | `minDurationSec/maxDurationSec` | no | no | numeric ring max 8 is not enforced |
| aspect ratios | `supportedAspectRatios` | no | no | incompatible candidate can be selected |
| semantic/visual tags | `semanticTags/visualTags` | semantic tags only | no semantic use | visual affordance is lost |
| use/avoid cases | `useCases/avoidCases` | no | no | Director cannot distinguish suitable structure |
| timing/layout capabilities | registry fields | no | layout solver only sees generic rects | persistent/item-reveal semantics absent |
| default props | `defaultProps` | no | renderer uses effect content only | selected variant cannot declare data defaults |
| provenance | source/license refs | no | no Director trace linkage | trace cannot show why candidate is allowed |
| data contract | not formalized in current `EffectDefinition` | no | no | new explicit contract is required |

## Boundary evidence

```ts
// generationRoute.ts:236-238
function effectCandidate(effect: EffectDefinition): { id: string; tags: string[] } {
  return { id: `${effect.familyId}:${effect.variantId}`, tags: effect.semanticTags };
}
```

This is the exact loss boundary. The correct Phase 2 change is a compact projection with an explicit data contract, not sending React source or copying every registry implementation detail into the prompt.

## Reuse decision

- Reuse `EffectDefinition` and `MotionDefinition` as the local source of truth.
- Reuse `packMotionCatalog` as catalog input, but make pack inclusion and family mapping explicit.
- Add a pure compact projection function so the Director payload and local validator share the same capability data.
- Keep source/license metadata out of user-facing composition when unnecessary, but preserve a safe identifier in `SelectionTrace`.
