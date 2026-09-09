# CueCut2 Talking-Head Effects Pack v0.3

v0.3 重点补齐“口播信息卡 + 商业信息 + 高级文字包装”。

## 本批新增 CueCut 原生候选

### Quote / KeyPoint
- CueCutQuoteCard
- CueCutKeyPoint

### Term / Definition / Alert
- CueCutTermCard
- CueCutDefinitionCard
- CueCutAlertCard

### ProsCons / Feature
- CueCutProsCons
- CueCutFeatureGrid

### Entity
- CueCutToolCard
- CueCutProductCard

### Commercial / Time
- CueCutPriceCard
- CueCutDateCard

### Data relationship
- CueCutDeltaMetric
- CueCutCauseEffect

共 13 个 Semantic Effect 候选。

## 核心原则

所有 CueCut 原生组件继续采用：

`progress: number // 0..1`

不在组件内部使用 setTimeout / setInterval 驱动主要动画。

这样方便：
- Timeline seek
- frame-by-frame export
- deterministic rendering
- 30 / 60fps
- 后续 SRT cue alignment

## Skin

统一支持：
- minimal
- glass
- tech
- soft

## 第三方参考

本包额外保存两份已核实为 MIT 的源码作为“边框高光/卡片质感”研究参考：
- Motion Primitives / BorderTrail
- Magic UI / BorderBeam

建议 Codex 不要直接让它们无限循环出现在视频里。
应把“持续循环动画”改为：
- 进入时扫一圈
- 重点词出现时短暂强调
- 或由 timeline progress 映射到 offsetDistance

## AI 语义示例

- “最重要的一点是……” -> KeyPoint
- “Sam Altman 曾经说……” -> Quote
- “RAG 全称 Retrieval-Augmented Generation” -> TermCard
- “RAG 是一种……” -> DefinitionCard
- “这里一定要注意” -> AlertCard
- “优点是…缺点是…” -> ProsCons
- “它有 4 个核心能力” -> FeatureGrid
- “这个工具叫 Codex” -> ToolCard
- “这款产品的核心卖点…” -> ProductCard
- “现在只要 99 元/月” -> PriceCard
- “9 月 18 日正式发布” -> DateCard
- “效率提升 36%” -> DeltaMetric
- “因为上下文过长，所以 Token 消耗增加” -> CauseEffect

不要实现为简单关键词硬匹配；这些只是 Semantic Routing 的可解释示例。
