# v0.7 实装建议

## P0
优先：
1. DataCallout
2. NumberTrend
3. LineChart
4. HorizontalComparison
5. DonutChart
6. GoalVsActual
7. KPIGrid

这几种覆盖绝大多数 AI/商业/科技口播数据场景。

## 数据契约

建议未来统一：

```ts
type DataEffectInput = {
  source: "srt-explicit" | "user-provided" | "project-data";
  fabricated: false;
  unit?: string;
  values: ...
}
```

任何数据型 Semantic Effect 必须通过 `fabricated === false` 或同等校验。

## AI Routing

推荐硬规则：

- Donut / StackedBar:
  数据必须具有可解释“整体/组成”关系。
- GoalVsActual:
  必须同时存在 actual + goal。
- Slope:
  必须存在两个端点。
- Waterfall:
  delta 项必须可加总。
- Heatmap:
  必须存在二维 row x col 数据。
- Funnel:
  必须是有顺序的阶段，且通常数值逐步下降；如业务场景允许回升，需要显式说明。

## Recharts

若 CueCut3 已经装 Recharts，可以用于编辑器预览，但建议：
- production export 禁用其内部动画
- 动态值由 CueCut progress 提供
- preview/render 两条链路做一致性测试

## visx

如果后续图表继续扩张，visx 比完整图表框架更适合做低层 geometry provider。

## 风格

数据图表应保持：
- 大数字优先
- 少网格线
- 少坐标轴
- 2~6 个数据项为主
- 视频画面可读性 > dashboard 信息密度
