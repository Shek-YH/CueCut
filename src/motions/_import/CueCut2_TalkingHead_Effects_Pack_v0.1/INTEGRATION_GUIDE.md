# CueCut2 接入建议

## 第一阶段：只做素材入库，不重构 AI

建议先把本包放入类似：

src/effect-research/open-source/

不要直接覆盖现有 production effects。

## 第二阶段：视觉筛选

每个效果做：
- 9:16 预览
- 16:9 预览
- 深色背景
- 浅色背景
- 中文 4~16 字
- 英文短句
- 30fps / 60fps

标记：
- KEEP
- MODIFY
- REJECT

## 第三阶段：转 CueCut Effect

统一拆成：
- semantic family
- style/skin
- motion
- timing
- placement
- content params

例如 AnimatedList 不应最终叫 AnimatedList，
而应成为 Checklist / Steps / FeatureList 等语义卡的一个 Motion 实现。

## 第四阶段：补缺口

优先再找：
- Checklist / StepTimeline
- RingMetric / Gauge
- Progress
- Ranking Bars
- Versus / ProsCons
- Timeline / Flow
- Quote / Entity / Tool Card
