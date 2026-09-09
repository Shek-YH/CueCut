# v0.7 开源参考

## Recharts
- https://github.com/recharts/recharts
- MIT
- React 图表生态成熟
- 适合：Line / Area / Bar / Pie / RadialBar / Radar / Treemap

## visx
- https://github.com/airbnb/visx
- MIT
- 更底层、更可组合
- 适合未来 CueCut 自定义数据可视化底座

## Tremor
- https://github.com/tremorlabs/tremor
- Apache-2.0 为主，具体子组件可能有额外 MIT notices
- 适合参考 KPI / Metric / Tracker / Dashboard 的视觉层次

## CueCut 选择

当前 v0.7 继续使用自己的 deterministic SVG / HTML。
第三方库作为：
- 算法参考
- editor preview 备选
- future geometry provider

而不是强依赖。
