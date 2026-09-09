# v0.5 开源参考

## Lucide
- Repo: https://github.com/lucide-icons/lucide
- License: ISC；上游 LICENSE 同时说明部分 Feather-derived icons 仍适用 MIT
- 价值：
  - 大规模一致性线性图标
  - React 生态成熟
  - 很适合作为 CueCut 的通用 icon provider

## 本包策略

本包没有直接复制 Lucide 图标源文件。
而是：
- 自建小型 CueCut SVG primitive
- 提供统一 IconName
- 若项目已经有 Lucide，再在 Adapter 层映射

这样减少不必要依赖，也方便视频逐帧渲染。

## 下一轮建议研究

v0.6 建议转向：
- Camera frame
- Browser window / terminal
- Code block
- Device mockup
- Screen recording frame
- App window / UI callout
- Lower third / name plate
- Chapter marker
