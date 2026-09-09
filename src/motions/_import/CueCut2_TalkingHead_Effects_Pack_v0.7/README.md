# CueCut2 Talking-Head Effects Pack v0.7

本批重点：**高级图表 + KPI + 数据故事**。

## 新增 16 个 CueCut 原生候选

### Trend
- CueCutLineChart
- CueCutAreaChart
- CueCutSparkline

### Distribution / Ring
- CueCutDonutChart
- CueCutMultiRing

### Bars / Comparison
- CueCutStackedBar
- CueCutHorizontalComparison
- CueCutSlopeChart

### Advanced Data Story
- CueCutFunnelChart
- CueCutWaterfallChart
- CueCutHeatmap

### KPI / Goal
- CueCutGoalVsActual
- CueCutKPIGrid
- CueCutMilestoneTrack

### Data Callout
- CueCutDataCallout
- CueCutNumberTrend

## 这一批的核心原则

AI 不可以为了“有图表”而编造数据。

例如：
- 文案只有“增长很快” -> 不得自动生成 62%、78%、91%
- 文案明确“从 30% 到 52%” -> 可以使用 Slope / Delta / Goal
- 文案有 5 个排名数字 -> ComparisonBars / RankingBars
- 文案有“浏览->注册->付费”的逐阶段数据 -> Funnel
- 文案解释最终增长由哪些因素贡献 -> Waterfall

## Progress Driven

所有图表候选继续由 `progress: 0..1` 驱动。

不依赖图表库自己的实时动画，因此更适合：
- Timeline seek
- pause/resume
- frame rendering
- export
- SRT cue control

## Recharts / visx / Tremor

本包将它们作为未来技术/视觉参考：
- Recharts: MIT
- visx: MIT
- Tremor: Apache-2.0（上游同时包含部分额外 MIT notices）

正式 v0.7 候选没有直接复制这些项目的组件源码。
