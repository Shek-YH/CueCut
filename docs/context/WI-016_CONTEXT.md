# Context Packet｜WI-016

**Role:** R01 Motion Architecture / Registry  
**Work Item:** `WI-016` — CueCut Motion Adapters and Registries  
**Status on entry:** TODO after WI-015 PASS; handoff only to READY_FOR_REVIEW.

## Goal / Golden Path

实现 `GP-03` 的正式能力索引：5 个文字（TextMorph/TextRoll/TextScramble/TextShimmer/AnimatedShinyText）、2 个数字（AnimatedNumber/NumberTicker）、列表底层（AnimatedList/AnimatedGroup）和 10 个 Motion Layer preset（fade/slide/scale/blur/blur-slide/zoom/flip/bounce/rotate/swing）。第三方源码在 `_import` 仅作来源证据；生产层必须使用 CueCut 自有 adapter contract，不保留 `motion/react`、`@/lib/utils` 或 Tailwind 运行时依赖。

## Source / dependencies

- PRD §8–11、§20–22；`WI-015` import/license evidence；`src/project/schema.ts`。
- 现有旧 `src/motions/registry.ts`/`runtime.ts` 和 `src/effects/registry.ts` 的旧 ID 必须兼容。

## Allowed / forbidden

允许：`src/motions/**`（不得改 `_import/**`、`licenses/**`）、`src/effects/registry.ts`、`tests/motions/**`、`tests/effects/**`、本 Work Item context/handoff/evidence。禁止 `src/app/**`、`src/editor/**`、`src/render/**`、`src/export/**`、`src/project/schema.ts`、package/lock、secret。

## Acceptance

Registry 项有唯一 id、正式显示名、category、semanticTags、用途/避用信息、defaultProps、supportedAspectRatios、timing/layout capability、source/license reference；adapter 参数覆盖 common/text/number/list。保留现有 `spring-in`、`scale-fade-out`、`pop`、`soft-slide` 等 legacy motion IDs。无重复 Motion runtime。测试先 RED 后 GREEN，记录 focused/full test 和 Evidence。

## Real/security

只做本地 contract/synthetic 测试；不联网、不读取 secret、不虚构许可证。失败按 CONTEXT/ARCHITECTURE 分类返回，不得自标 VERIFIED/ACCEPTED。
