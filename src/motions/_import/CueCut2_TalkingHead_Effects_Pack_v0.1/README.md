# CueCut2 Talking-Head Effects Pack v0.1

这是“第一批精选源文件包”，不是整仓库镜像。
目标是先把最容易改善口播视频观感的文字、数字、列表、基础运动能力放进项目里，供后续 CueCut2 重构成自己的 Effect Package / Manifest。

## 目录

### 01_Text_Emphasis
适合：
- 金句
- 关键词
- 术语
- 标题
- 结论
- 科技类口播强调

包含：
- Motion Primitives / TextMorph
- Motion Primitives / TextRoll
- Motion Primitives / TextScramble
- Motion Primitives / TextShimmer
- Magic UI / AnimatedShinyText

### 02_Numbers_Metrics
适合：
- BigNumber
- 百分比中心数字
- 价格
- 数据增长
- 计数

包含：
- Motion Primitives / AnimatedNumber
- Magic UI / NumberTicker

### 03_List_Steps
适合：
- BulletList
- Steps
- Checklist 的底层逐项出现能力
- FeatureList
- Tips

包含：
- Magic UI / AnimatedList

### 04_Motion_Presets
适合作为 CueCut2 的 Motion Layer 原型。
包含 AnimatedGroup 及 10 类 motion preset。

## 来源与许可证

1. Motion Primitives
   - Repo: https://github.com/ibelick/motion-primitives
   - Demo: https://motion-primitives.com
   - License: MIT
   - 许可证副本见 05_Licenses/

2. Magic UI
   - Repo: https://github.com/magicuidesign/magicui
   - Demo: https://magicui.design
   - License: MIT
   - 许可证副本见 05_Licenses/

## 重要说明

- 建议不要直接把第三方组件名称暴露为 CueCut2 商业产品中的最终“官方动效”。
- 推荐把这些源文件作为合法开源参考/底层实现，重新参数化、统一样式变量、统一 Schema、统一时间轴 API。
- 保留原许可证与版权声明。
- `@/lib/utils` 的 `cn()` 需要映射到你项目现有的 className 合并工具。
- 这些文件依赖 `motion/react`；请根据 CueCut2 当前前端依赖决定统一版本。
- Tailwind 类名需要按 CueCut2 当前 Tailwind 版本做兼容检查。
