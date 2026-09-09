# CueCut2 Talking-Head Effects Pack v0.2

本包是 v0.1 的第二批扩充，重点补齐口播中最缺的“结构化信息动效”。

## 本次新增的正式候选

### Checklist / Steps
- `CueCutChecklist`
- `CueCutStepTimeline`

### Ring / Gauge / Progress
- `CueCutRingMetric`
- `CueCutGaugeMetric`
- `CueCutProgressMetric`

### Ranking / Comparison
- `CueCutRankingBars`
- `CueCutVersusCard`
- `CueCutBeforeAfterSplit`

### Timeline / Flow
- `CueCutProcessTimeline`
- `CueCutFlowSteps`

## 设计原则

这一批 CueCut 原生候选不使用内部 setTimeout 驱动动画。
统一接受：

`progress: number`

范围：

`0 -> 1`

这样 CueCut3 可以由自己的 Timeline / frame renderer 控制进度，更适合：
- 任意 seek
- 逐帧渲染
- 30/60fps
- 导出
- 以后基于 SRT cue 做 element-level timing

## Skin

原生候选统一支持：
- `minimal`
- `glass`
- `tech`
- `soft`

并允许 `accentColor` 覆盖。

## 第三方参考源码

包内额外保存：
- Motion Primitives `image-comparison.tsx` — MIT
- Magic UI `animated-beam.tsx` — MIT
- Recharts `SimpleRadialBarChart.tsx` — MIT
- Recharts `SimpleBarChart.tsx` — MIT

这些文件用于 Codex 判断：
- 是否直接适配
- 是否只参考实现
- 是否迁移为 CueCut frame-driven renderer

请不要把第三方交互式网页逻辑原封不动作为视频最终实现。例如 Magic UI Animated Beam 依赖 DOM ref 和 ResizeObserver，更适合作为视觉/算法参考；视频渲染推荐使用本包中的 `CueCutFlowSteps` 或进一步改造成基于静态坐标 + timeline progress 的 deterministic beam。

## 推荐实装优先级

P0:
1. CueCutChecklist
2. CueCutStepTimeline
3. CueCutRingMetric
4. CueCutProgressMetric
5. CueCutRankingBars

P1:
6. CueCutGaugeMetric
7. CueCutVersusCard
8. CueCutProcessTimeline
9. CueCutFlowSteps
10. CueCutBeforeAfterSplit

## 与 AI 语义选择的关系

- “需要检查这 4 项” -> Checklist
- “第一步、第二步、第三步” -> StepTimeline
- “92.4%” -> RingMetric
- “完成 70%” -> ProgressMetric
- “评分 86 / 100” -> GaugeMetric
- “Top 5” -> RankingBars
- “Claude vs Codex” -> VersusCard
- “改版前 / 改版后” -> BeforeAfterSplit
- “2024 -> 2025 -> 2026” -> ProcessTimeline
- “输入 -> 分析 -> 生成 -> 导出” -> FlowSteps

注意：这只是语义路由的基础能力，不代表现在要做关键词硬匹配。
