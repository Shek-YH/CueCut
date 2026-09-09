# v0.4 开源研究参考

## Rough Notation
- Repo: https://github.com/rough-stuff/rough-notation
- License: MIT
- 重点能力：
  - underline
  - box
  - circle
  - highlight
  - strike-through
  - crossed-off
  - bracket
- 价值：
  - 非常适合口播中的“手写批注感”
  - 为 CueCut Annotation Family 提供成熟语义分类参考

## Magic UI Highlighter
- Repo: https://github.com/magicuidesign/magicui
- License: MIT
- 实现：
  - Motion useInView
  - Rough Notation
  - ResizeObserver
- 价值：
  - 演示如何把 annotation 包成 React 组件
- CueCut 注意：
  - 其原实现偏网页运行时
  - CueCut 视频系统建议改为 frame/progress-driven

## 本包策略

第三方项目只用于：
- 设计思想
- 视觉结构
- 算法参考

正式 CueCut 候选组件位于 `01_` 至 `06_`，采用自己的 deterministic progress 驱动。
