# WI-015｜New Effect Import Plan

状态：`READY_FOR_REVIEW / IMPORTED_FOR_REVIEW / NOT PRODUCTION ADAPTED`

## Integrity

| item | result |
|---|---|
| source zip | `src/motions/CueCut2_TalkingHead_Effects_Pack_v0.1.zip` |
| SHA-256 | `E30C8258FC14265269184C35FC6F8B6851F68AECFB35AB7586B9640C541115D0` |
| entry validation | 16 entries；全部位于 `CueCut2_TalkingHead_Effects_Pack_v0.1/`；拒绝绝对路径和 `..` 路径 |
| extraction target | `src/motions/_import/CueCut2_TalkingHead_Effects_Pack_v0.1/` |
| extracted file count | 16 |
| production source changes | 0 |
| package/lockfile changes | 0 |

## File inventory

以下为 zip entry 的相对路径与解压后字节数；原始 zip 保留在 `src/motions/`，未散落到生产目录。

| relative path | bytes | disposition |
|---|---:|---|
| `01_Text_Emphasis/magicui/animated-shiny-text.tsx` | 946 | formal adapter candidate |
| `01_Text_Emphasis/motion-primitives/text-morph.tsx` | 1841 | formal adapter candidate |
| `01_Text_Emphasis/motion-primitives/text-roll.tsx` | 2861 | formal adapter candidate |
| `01_Text_Emphasis/motion-primitives/text-scramble.tsx` | 1999 | formal adapter candidate |
| `01_Text_Emphasis/motion-primitives/text-shimmer.tsx` | 1735 | formal adapter candidate |
| `02_Numbers_Metrics/magicui/number-ticker.tsx` | 1799 | formal adapter candidate |
| `02_Numbers_Metrics/motion-primitives/animated-number.tsx` | 828 | formal adapter candidate |
| `03_List_Steps/magicui/animated-list.tsx` | 2036 | formal adapter candidate |
| `04_Motion_Presets/motion-primitives/animated-group.tsx` | 3110 | formal adapter candidate |
| `05_Licenses/magicui-LICENSE.md` | 1060 | source notice; reference-only |
| `05_Licenses/motion-primitives-LICENCE.md` | 1064 | source notice; reference-only |
| `06_Research_References/NEXT_RESEARCH.md` | 969 | research reference-only |
| `README.md` | 1942 | provenance/integration reference |
| `INTEGRATION_GUIDE.md` | 844 | integration reference |
| `SEMANTIC_EFFECT_TAXONOMY_v0.1.md` | 1038 | taxonomy reference |
| `SOURCE_METADATA.json` | 697 | source metadata reference |

正式 adapter 候选共 9 个：5 个文字、2 个数字、`AnimatedList`、`AnimatedGroup`。它们在本 WI 中仍只作为 `_import` 源证据，不是 CueCut3 production effect。

## Source notes

- README/metadata：Motion Primitives（MIT）与 Magic UI（MIT）。
- 集成指南：先入库研究，再进行 9:16/16:9、深浅背景、中文/英文、30/60fps 筛选；不要直接覆盖 production effects。
- 已记录的兼容风险：`motion/react`、`@/lib/utils`、Tailwind 类名；本 WI 未添加依赖、未改 alias、未改 runtime。
- 语义 taxonomy：文字强调、数字指标、列表步骤、动作层；`AnimatedList` 只作为底层 list motion，不直接命名为最终 Checklist。

## Next handoff

R01/R06 可基于该目录设计本地 adapter、Manifest、license/source 关联和 deterministic frame mapping。任何正式使用前都必须重新验证依赖、中文拆分、画幅、Timeline/Renderer/Export parity。
