# CueCut Motion Component Lab / Overlay Studio PRD

> 文档类型：产品需求文档（PRD）  
> 目标开发环境：React + TypeScript + Vite  
> 目标执行方：Codex  
> 当前阶段：动效组件系统重构与组件库扩充  
> 核心原则：**AI 负责编排，不负责设计。**

---

## 0. 文档目标

本 PRD 用于将现有 `motion-playground / Overlay Studio` 从“少量动效 Demo”升级为 CueCut 的正式 **动效组件实验室 + Effect Registry + 统一渲染器 + 布局引擎 + Overlay JSON 系统**。

当前已经验证的核心组件：

1. `MetricFocus`
2. `CompareSplit`
3. `QuoteLockup`

本阶段在保留上述 3 个核心组件的基础上，新增 37 个标准动效组件，总计 **40 个 Effect Kind**。

最终目标不是让 AI 自由生成 UI，而是：

```text
SRT
  ↓
语义理解 / 重点提炼
  ↓
Semantic Beat
  ↓
Effect Selector
  ↓
Effect Registry
  ↓
Layout Engine
  ↓
Overlay JSON
  ↓
Unified ComponentRenderer
  ├─ Effect Library
  ├─ Workspace
  └─ Exporter
```

---

# 1. 产品定位

## 1.1 产品名称

内部项目名：

`motion-playground`

产品定位：

**CueCut Motion Component Lab / Overlay Studio**

## 1.2 当前阶段不做什么

本阶段不是完整视频剪辑器。

禁止主动扩展为：

- 多轨专业 NLE
- Premiere / Final Cut 替代品
- Remotion 工程
- ffmpeg 视频合成系统
- 自动发布平台
- 云端协同系统
- AI 自由生成 React 组件
- AI 自由设计视觉风格
- AI 自由创建未知 Effect Kind

本阶段唯一核心目标：

> 建立稳定、可复用、可语义选择、可时间驱动、可布局避让、可透明导出的短视频高级动效组件系统。

---

# 2. 核心产品原则

## 2.1 AI 负责编排，不负责设计

AI 未来只允许决定：

- 使用哪个现有 Effect Kind
- 使用哪个已注册 Variant
- 填写什么内容
- 什么时候开始
- 什么时候结束
- 放在哪个 Placement
- 优先级
- Motion Preset
- Style Preset
- 来源字幕 ID

AI 禁止：

- 新建 React 组件
- 新建未知 Effect Kind
- 自由发明 UI
- 自由决定视觉语言
- 自由生成任意动画
- 自由修改组件内部结构
- 无约束生成 `x/y`
- 绕过 Effect Registry
- 绕过 JSON Validation

---

# 3. 设计语言

所有组件默认遵守以下设计方向：

- 黑 / 白 / 灰为主
- 强调色少量使用
- 强调色默认低饱和
- 高级科技感
- Apple 发布会 / Netflix 科技纪录片 / 高级数码栏目的视觉气质
- 大量留白
- 字号层级清晰
- 细线条
- 弱透明
- 少阴影
- 少装饰
- 视觉克制
- 信息优先

禁止：

- 彩虹渐变
- 低质霓虹风
- 大面积强 Glow
- 卡通弹跳
- 无意义旋转
- 过度 Spring
- 过多粒子
- 过度镜头晃动
- 复杂炫技遮挡信息
- 大量高饱和色

注意：

某些组件名称中包含 `Burst / Bounce / Glow / Particle / Shake`，但实现必须仍然服从整体高级克制风格。

例如：

`PointerBounce`

不得实现为卡通式连续弹跳，只允许轻微、短促、可控位移。

`GlowPulse`

不得使用夸张霓虹外发光，只允许局部低透明、低半径、短时呼吸强调。

---

# 4. 典型使用场景

主要场景：

- 横版 16:9 真人口播
- 人物位于中央
- 动效优先出现在人物左右两侧
- 文字、数字、图形包装作为视频叠加层
- 后续导出透明素材进入剪映 / Premiere / Final Cut Pro

典型布局：

```text
┌──────────────┬──────────────────┬──────────────┐
│              │                  │              │
│ LEFT AREA    │ PERSON SAFE AREA │ RIGHT AREA   │
│              │                  │              │
│  Overlay     │     禁止遮挡      │   Overlay    │
│              │                  │              │
└──────────────┴──────────────────┴──────────────┘
```

---

# 5. 产品界面结构

保持三栏核心布局。

```text
┌──────────────────────────────────────────────────────┐
│ Toolbar                                               │
├────────────┬───────────────────────────┬─────────────┤
│ Effect     │ Workspace                 │ Inspector   │
│ Library    │                           │             │
│            │ 1920 × 1080 Preview       │ Parameters  │
│            │                           │             │
├────────────┴───────────────────────────┴─────────────┤
│ Timeline / Overlay Track                              │
└──────────────────────────────────────────────────────┘
```

## 5.1 左侧 Effect Library

功能：

- 分类浏览
- 搜索 Effect
- 查看真实动效预览
- Variant 快速预览
- 点击插入 Workspace
- 收藏
- 最近使用
- Semantic Role 标签
- 兼容 Placement 显示

禁止使用静态假 Preview。

必须通过同一个 `ComponentRenderer` 渲染。

## 5.2 中央 Workspace

默认：

`1920 × 1080`

支持：

- 视频导入
- 视频播放
- 暂停
- 拖动 currentTime
- Overlay 实时渲染
- Safe Zone
- 边缘安全区
- Subtitle Safe Zone
- Overlay 拖拽
- Overlay Resize
- Overlay Selection
- 多 Overlay 同时显示
- 时间同步

## 5.3 右侧 Inspector

根据选中组件动态展示：

- 文本内容
- 数字内容
- 图片 / SVG 资源
- Variant
- Placement
- Start
- End
- Motion Preset
- Style Preset
- Font Size
- Alignment
- Accent Color
- Opacity
- Width / Height
- Manual X / Y Override
- Component-specific Parameters

---

# 6. 时间系统

## 6.1 唯一时间源

整个系统必须只有一个统一时间源：

```ts
currentTime: number
```

Effect Library Preview、Workspace、未来 Exporter 必须使用同一套时间驱动逻辑。

禁止组件自己使用：

- 无限 CSS animation
- 独立 setInterval
- 与 currentTime 无关的动画循环

所有组件必须通过：

```ts
renderEffectAtTime(effect, currentTime)
```

或同等统一机制计算视觉状态。

---

# 7. 动画生命周期

每个组件统一拆成：

```text
ENTER
  ↓
HOLD
  ↓
EXIT
```

统一提供：

```ts
interface MotionTiming {
  enterDuration: number
  holdDuration?: number
  exitDuration: number
}
```

所有 Effect 必须能够在 Workspace 中真实看到：

- 入场
- 保持
- 出场

---

# 8. 统一 Effect Registry

必须建立唯一 Effect Registry。

建议：

```ts
interface EffectDefinition {
  kind: EffectKind
  name: string
  category: EffectCategory
  description: string

  semanticRoles: string[]

  variants: EffectVariant[]
  defaultVariant: string

  allowedPlacements: Placement[]

  contentSchema: unknown

  defaultDuration: number
  minDuration: number
  maxDuration: number

  motionPresets: string[]
  defaultMotionPreset: string

  stylePresets: string[]
  defaultStylePreset: string

  previewData: unknown

  supportsMedia?: boolean
  supportsVideoAwarePreview?: boolean
  supportsTransparentExport?: boolean
}
```

Effect Registry 是唯一真相源。

禁止 Skill 或业务代码硬编码：

“只能是 3 种 / 5 种组件”。

以后新增 Effect 只需要注册 Registry。

---

# 9. 统一 ComponentRenderer

必须只存在一套真实渲染逻辑：

```text
ComponentRenderer
      ↓
Effect Library Preview

ComponentRenderer
      ↓
Workspace

ComponentRenderer
      ↓
Future Exporter
```

禁止：

- Library 一套 Renderer
- Workspace 一套 Renderer
- Exporter 一套 Renderer

这条为 P0 架构要求。

---

# 10. Effect Kind 总表

系统总计 40 个标准 Effect Kind。

---

## 10.1 核心基础组件

### 1. MetricFocus

用途：

- 核心数字
- 百分比
- 金额
- 倍数
- KPI
- 增长 / 下降

Semantic Roles：

```text
metric
percentage
money
number
growth
decline
multiple
```

建议 Variants：

```text
clean
line
editorial
```

---

### 2. CompareSplit

用途：

- 左右对比
- 新旧
- 前后
- 优缺点
- A / B

Semantic Roles：

```text
comparison
before_after
old_new
pros_cons
versus
```

Variants：

```text
vertical
horizontal
minimal
```

---

### 3. QuoteLockup

用途：

- 金句
- 结论
- 强观点
- 核心判断
- 警示

Semantic Roles：

```text
quote
statement
conclusion
warning
key_point
```

Variants：

```text
editorial
documentary
statement
```

---

# 11. 数值 & 信息类

## 11.1 BarReveal

用途：

条形数据比较。

动画：

- 基线出现
- Bar 依次增长
- Label 延后出现
- Value Count Up

适合：

```text
ranking
comparison_metric
multi_value
growth
```

内容结构建议：

```ts
{
  title?: string
  items: {
    label: string
    value: number
    displayValue?: string
  }[]
}
```

---

## 11.2 RingCountUp

用途：

环形进度 + 百分比。

动画：

- Ring Stroke Draw
- 数字 Count Up
- 辅助说明 Fade In

适合：

```text
percentage
progress
completion
ratio
score
```

---

## 11.3 TableFadeIn

用途：

对比表格、参数表。

动画：

- Header 先出现
- Row / Cell 逐行渐入
- 重点单元格轻微强调

禁止：

复杂 Excel 风格。

必须保持短视频级简洁。

---

## 11.4 ListTickBuild

用途：

- 要点列表
- Checklist
- 优势列表
- 步骤简述

动画：

- 单条进入
- Tick 绘制
- 下一条继续

注意：

名称中“弹出”不应实现成夸张 Bounce。

---

## 11.5 CounterPulse

用途：

快速数值变化。

动画：

- Count Up / Count Down
- 数值变化瞬间轻微 Scale
- 极短 Opacity / Weight Emphasis

适合：

```text
live_metric
delta
change
count
```

---

## 11.6 AxisPlotDraw

用途：

折线趋势。

动画：

- Axis Draw
- Line Path Draw
- Data Point Reveal
- Label Reveal

第一版只支持：

- 1 条或 2 条曲线
- 简单数据
- 不实现复杂 BI 图表系统

---

# 12. 分屏 & 对比类

## 12.1 SlideSwap

用途：

两组图文 / 媒体对照。

动画：

- Left Slide
- Right Slide
- 交换位置
- 可选 Center Divider

支持媒体槽位。

---

## 12.2 MaskWipe

用途：

划像、对照切换。

注意：

如果只导出透明 Overlay，不允许将原视频像素写入透明导出结果。

因此实现拆成：

### Overlay Mode

只渲染：

- Mask Line
- Label
- Wipe Indicator
- Foreground UI

### Video-aware Preview Mode

Workspace 可利用背景视频演示视觉效果，但透明导出时不得包含原视频。

---

## 12.3 DualOverlay

用途：

上下 / 前后半透明对照。

注意：

如果组件涉及视频底图或原画面：

透明导出只能输出叠加 UI、边框、标签、半透明块。

禁止导出原视频帧。

---

## 12.4 QuadGrid

用途：

4 宫格内容展示。

第一版支持：

- 图片
- 图标
- 文本
- 可选静态缩略图

暂不承担复杂多视频同步播放。

---

## 12.5 SidePull

用途：

侧边补充信息。

非常适合真人口播。

动画：

- 从左 / 右边缘拉出
- Content Reveal
- Exit Retract

优先 Placement：

```text
left-center
right-center
```

---

## 12.6 CrossFadePair

用途：

A / B 两组内容交替。

支持：

- 文本
- 图片
- 图标

动画：

```text
A enter
A hold
A exit
B enter
B hold
B exit
```

---

# 13. 文案 & 标题金句类

## 13.1 HeadlineBurst

用途：

短标题强强调。

注意：

“Burst”必须高级克制。

实现建议：

- 快速 Clip Reveal
- Tracking 收拢
- Font Weight Emphasis

禁止：

卡通爆炸
粒子爆炸
大幅弹跳

---

## 13.2 WordHighlight

用途：

关键词逐词强调。

内容：

```ts
{
  text: string
  highlights: {
    word: string
    startOffset?: number
  }[]
}
```

支持：

- Underline
- Accent Color
- Background Marker

---

## 13.3 TextUnderlineDraw

用途：

标题 / 关键词手绘下划线。

动画：

- Text Reveal
- Underline SVG Path Draw

---

## 13.4 StickyCaption

用途：

固定解释标签。

注意：

“不消失”不代表无限时长。

仍必须：

```text
start
end
```

只是 Hold 时间较长。

---

## 13.5 MarkStamp

用途：

- Approved
- Important
- Warning
- 推荐
- 核心
- 已完成

视觉：

低饱和印章 / Label 风格。

禁止廉价红色橡皮章风格。

---

## 13.6 QuoteFloat

用途：

轻量引用 / 辅助观点。

动画：

- Soft Translate
- Opacity
- Border Reveal

禁止持续漂浮。

---

# 14. 图形、标记、指引类

## 14.1 ArrowTrace

用途：

指向 UI、产品功能、路径。

基于 SVG Path。

参数：

- startPoint
- endPoint
- curvature
- arrowHead
- lineWidth

---

## 14.2 CircleSpotlight

用途：

圈出画面重点。

输出只包含：

- Circle / Ellipse
- 可选半透明局部 Halo

不得修改底层视频像素。

---

## 14.3 BoxDraw

用途：

矩形框标记。

动画：

- 4 边 Path Draw
- 可选 Corner Accent

---

## 14.4 PointerBounce

用途：

模拟鼠标指引。

默认实现：

- Pointer Fade
- 轻微 4-8px 位移
- Click Ripple 可选

禁止连续卡通 Bounce。

---

## 14.5 BadgePop

用途：

- NEW
- TIP
- AI
- PRO
- 推荐
- Beta

默认动画：

- Scale 0.96 → 1
- Opacity
- 微小 Y Translate

---

# 15. 图层、卡片容器类

## 15.1 CardStack

用途：

多卡片展示。

第一版最大建议：

3–5 张。

动画：

- Stack Reveal
- Offset
- Sequential Expand

---

## 15.2 FlipPanel

用途：

正反面信息切换。

注意：

避免过度 3D。

默认：

8–15° perspective 感即可。

---

## 15.3 CollapseExpand

用途：

信息展开 / 收起。

Timeline 驱动。

不是交互式 Accordion 为主。

即：

口播时间到达时自动展开。

---

## 15.4 LayerPeel

用途：

揭示第二层信息。

第一版：

通过：

- clip-path
- transform
- pseudo-layer

模拟轻量 Peel。

禁止实现复杂物理布料模拟。

---

## 15.5 CornerRise

用途：

高级轻量卡片入场。

动画：

- slight rotate
- slight Y
- shadow increase
- opacity

必须非常克制。

---

# 16. 转场、画面修饰类

## 16.1 GlowPulse

用途：

短时强调。

实现限制：

- 低 Saturation
- 低 Alpha
- 小 Blur Radius
- 最多 1–2 次 Pulse

禁止持续霓虹闪烁。

---

## 16.2 ParticleSweep

用途：

文字 / 边框短暂扫光。

实现建议：

第一版不引入粒子引擎。

使用：

- 小量 DOM / SVG dots
- Mask / Gradient Sweep
- 最多几十个简单节点

必须保证性能。

---

## 16.3 DistortShake

用途：

警示、错误、风险。

实现：

- 2–6px Controlled Shake
- 100–300ms
- 可选 RGB Split 极轻版本

禁止长时间抖动。

---

## 16.4 ZoomAnchor

这是特殊组件。

原定义：

锁定画面某一点放大推进。

由于透明 Overlay 导出不得包含原视频，所以不能直接在透明导出中放大原视频。

第一版定义为：

**Zoom Guide Overlay**

渲染：

- Focus Frame
- Magnifier Border
- Anchor Indicator
- Zoom Label
- 可选局部视觉 Lens UI

Workspace 可以通过 CSS transform 临时模拟背景视频缩放预览，但：

透明导出时仅输出 Overlay UI。

必须保证不会把原视频像素写进导出帧。

---

# 17. 时间 / 时序类

## 17.1 TimelineMarch

用途：

时间发展 / 历史节点。

内容：

```ts
{
  events: {
    label: string
    timeLabel?: string
  }[]
}
```

动画：

- Base Line
- Dot
- Label
- Progress

---

## 17.2 StepFlow

用途：

流程解释。

动画：

- Node
- Connector
- Next Node

适合：

```text
workflow
tutorial
process
steps
pipeline
```

---

## 17.3 ClockTick

用途：

倒计时 / 时间推进。

支持：

- 秒数
- 分钟
- 百分比进度

不做真实系统时钟组件。

一切由 currentTime 驱动。

---

# 18. 图标符号类

## 18.1 IconSketch

用途：

SVG Icon 手绘。

要求：

只能使用：

- 内置 SVG
- 用户导入 SVG
- 明确许可图标

动画：

`stroke-dasharray / stroke-dashoffset`

---

## 18.2 IconMorph

高复杂度组件。

第一版禁止：

任意两个 SVG 自动 Morph。

因为 Path 拓扑不同会导致不可控结果。

第一版只支持：

**预先登记的兼容 Morph Pair**

例如：

```text
play → pause
plus → check
arrow-up → arrow-right
circle → check-circle
```

Effect Registry 中增加：

```ts
allowedMorphPairs
```

未知组合必须拒绝。

---

# 19. 组件分类

```ts
type EffectCategory =
  | "metric"
  | "comparison"
  | "text"
  | "annotation"
  | "container"
  | "decorative"
  | "timeline"
  | "icon"
```

---

# 20. EffectKind

建议建立单独类型：

```ts
type EffectKind =
  | "MetricFocus"
  | "CompareSplit"
  | "QuoteLockup"
  | "BarReveal"
  | "RingCountUp"
  | "TableFadeIn"
  | "ListTickBuild"
  | "CounterPulse"
  | "AxisPlotDraw"
  | "SlideSwap"
  | "MaskWipe"
  | "DualOverlay"
  | "QuadGrid"
  | "SidePull"
  | "CrossFadePair"
  | "HeadlineBurst"
  | "WordHighlight"
  | "TextUnderlineDraw"
  | "StickyCaption"
  | "MarkStamp"
  | "QuoteFloat"
  | "ArrowTrace"
  | "CircleSpotlight"
  | "BoxDraw"
  | "PointerBounce"
  | "BadgePop"
  | "CardStack"
  | "FlipPanel"
  | "CollapseExpand"
  | "LayerPeel"
  | "CornerRise"
  | "GlowPulse"
  | "ParticleSweep"
  | "DistortShake"
  | "ZoomAnchor"
  | "TimelineMarch"
  | "StepFlow"
  | "ClockTick"
  | "IconSketch"
  | "IconMorph"
```

实际运行时仍必须以 Registry 为准，不允许业务代码依赖手写数组。

---

# 21. 组件实施分层

为了避免一次性开发 40 个组件导致质量下降，必须分层完成。

## Tier A：基础稳定组件

优先完成：

```text
MetricFocus
CompareSplit
QuoteLockup
BarReveal
RingCountUp
ListTickBuild
SidePull
WordHighlight
TextUnderlineDraw
ArrowTrace
CircleSpotlight
BoxDraw
StepFlow
```

目标：

先覆盖短视频最常见 70% 场景。

---

## Tier B：常用增强组件

```text
TableFadeIn
CounterPulse
AxisPlotDraw
SlideSwap
CrossFadePair
HeadlineBurst
StickyCaption
MarkStamp
QuoteFloat
PointerBounce
BadgePop
CardStack
CornerRise
TimelineMarch
ClockTick
IconSketch
```

---

## Tier C：媒体 / 布局增强组件

```text
MaskWipe
DualOverlay
QuadGrid
FlipPanel
CollapseExpand
LayerPeel
GlowPulse
ParticleSweep
DistortShake
ZoomAnchor
```

---

## Tier D：高复杂度

```text
IconMorph
```

只有在统一 Renderer / Registry / Timeline / Layout Engine 完成后才开发。

---

# 22. Placement System

标准 Placement：

```ts
type Placement =
  | "left-top"
  | "left-center"
  | "left-bottom"
  | "right-top"
  | "right-center"
  | "right-bottom"
  | "top-center"
  | "bottom-center"
  | "center"
  | "custom"
```

默认情况下：

AI 不允许输出 `custom`。

`custom` 仅供用户手动拖拽后保存。

---

# 23. Safe Zone System

至少支持：

## 23.1 Person Safe Zone

默认：

中央区域。

用户可：

- 开启 / 关闭
- 调整宽度
- 调整高度
- 手动拖动
- 从帧识别结果初始化

本阶段不要求实现完整 AI 人脸识别。

---

## 23.2 Subtitle Safe Zone

用于防止 Overlay 与字幕冲突。

---

## 23.3 Edge Safe Zone

四边独立配置：

```ts
{
  top: number
  right: number
  bottom: number
  left: number
}
```

不能只用统一 Margin。

---

# 24. Layout Engine

输入：

```ts
interface LayoutRequest {
  placement: Placement
  canvas: Rect
  componentSize: Size
  personSafeZones: Rect[]
  subtitleSafeZones: Rect[]
  edgeInsets: EdgeInsets
  existingOverlays: Rect[]
  priority: number
}
```

输出：

```ts
interface LayoutResult {
  x: number
  y: number
  width: number
  height: number
  placement: Placement
  collisionScore: number
  warnings: string[]
}
```

Layout Engine 必须：

- 避让 Person Safe Zone
- 避让 Subtitle Safe Zone
- 避让 Edge Safe Zone
- 避让同时段已有 Overlay
- 保证不超出画布
- 尽量维持所选 Placement
- 无合法位置时给 Warning
- 不允许静默堆叠

---

# 25. 多 Overlay Collision

当两个 Overlay 时间区间相交：

```text
A.start < B.end
AND
B.start < A.end
```

系统必须进行 Collision Detection。

优先处理策略：

1. 保持用户锁定位置
2. 调整低优先级 Overlay
3. 在同侧上下重排
4. 尝试另一合法 Placement
5. 缩小至最低合法尺寸
6. 仍无法处理则 Warning

禁止：

全部默认放同一个位置。

---

# 26. Overlay JSON V2

建议结构：

```json
{
  "version": "2.0",
  "canvas": {
    "width": 1920,
    "height": 1080,
    "fps": 30
  },
  "duration": 60,
  "overlays": [
    {
      "id": "overlay_001",
      "kind": "MetricFocus",
      "start": 3.2,
      "end": 6.4,
      "content": {
        "label": "效率提升",
        "value": "40%",
        "caption": "GPT-5.6"
      },
      "variant": "clean",
      "placement": "right-center",
      "layout": {
        "x": 1320,
        "y": 320,
        "width": 420,
        "height": 260
      },
      "priority": 80,
      "motionPreset": "metric-count-line",
      "stylePreset": "graphite",
      "sourceSubtitleIds": [
        "srt_012"
      ],
      "locked": false
    }
  ]
}
```

---

# 27. JSON Validation

导入 JSON 时必须校验：

- Version
- Canvas
- Duration
- id 唯一
- kind 是否存在于 Registry
- start >= 0
- end > start
- end <= project duration
- variant 是否属于该 Effect
- placement 是否合法
- motionPreset 是否属于该 Effect
- stylePreset 是否属于该 Effect
- content 是否符合 contentSchema
- Layout 是否超出 Canvas

错误必须显示明确原因。

禁止自动吞掉错误。

---

# 28. Semantic Layer

未来 AI 不直接：

```text
SRT → Overlay JSON
```

必须先：

```text
SRT
 ↓
Semantic Beats
 ↓
Effect Selection
 ↓
Overlay JSON
```

建议 Semantic Beat：

```ts
interface SemanticBeat {
  id: string
  start: number
  end: number

  text: string

  importance: number

  semanticType:
    | "metric"
    | "comparison"
    | "quote"
    | "list"
    | "process"
    | "timeline"
    | "annotation"
    | "warning"
    | "title"
    | "icon"
    | "other"

  extracted: Record<string, unknown>

  sourceSubtitleIds: string[]
}
```

---

# 29. Effect Selector

Effect Selector 不直接生成 React。

输入：

```text
Semantic Beat
```

输出：

```ts
{
  kind
  variant
  placement
  content
  priority
}
```

示例：

输入：

```text
以前需要30分钟，现在AI只需要3分钟。
```

分析：

```json
{
  "semanticType": "comparison",
  "importance": 0.96,
  "extracted": {
    "leftLabel": "传统流程",
    "leftValue": "30分钟",
    "rightLabel": "AI流程",
    "rightValue": "3分钟"
  }
}
```

推荐：

```json
{
  "kind": "CompareSplit",
  "variant": "minimal",
  "placement": "right-center"
}
```

---

# 30. Effect Semantic Mapping

Registry 应维护：

```text
metric
→ MetricFocus
→ RingCountUp
→ CounterPulse

multi_value
→ BarReveal
→ TableFadeIn
→ AxisPlotDraw

comparison
→ CompareSplit
→ SlideSwap
→ CrossFadePair

list
→ ListTickBuild

quote
→ QuoteLockup
→ QuoteFloat

title
→ HeadlineBurst
→ TextUnderlineDraw

keyword_emphasis
→ WordHighlight

annotation
→ ArrowTrace
→ CircleSpotlight
→ BoxDraw
→ PointerBounce

badge
→ BadgePop
→ MarkStamp

process
→ StepFlow

timeline
→ TimelineMarch
→ ClockTick
```

后续允许一个 Semantic Role 对应多个 Effect，由 Selector 根据上下文和最近使用情况选择。

---

# 31. 动效多样性控制

为避免 AI 总选同一个效果，Effect Selector 后续加入：

- 最近 Effect 历史
- 重复惩罚
- 同类轮换
- Variant 轮换
- Semantic Fit Score
- Layout Fit Score
- Density Score

示例：

```ts
finalScore =
  semanticFit * 0.45 +
  layoutFit * 0.25 +
  visualDiversity * 0.20 +
  durationFit * 0.10
```

本阶段可以先实现纯规则版接口，不要求接大模型。

---

# 32. 重点提炼规则

不是每句字幕都生成 Overlay。

只有满足至少一项：

- 重要数字
- 强结论
- 对比
- 步骤
- 列表
- 产品核心功能
- 强关键词
- 时间关系
- 警告
- 关键转折

才候选生成 Overlay。

建议：

```text
importance < 0.55
→ 不生成

0.55–0.75
→ 轻量动效

0.75–0.90
→ 标准动效

> 0.90
→ 强重点动效
```

---

# 33. 动效密度限制

必须避免屏幕一直有包装。

默认建议：

- 5–12 秒至少留出视觉喘息
- 同时强动效不超过 2 个
- 同一区域同时尽量不超过 1 个大型组件
- 装饰组件可以与信息组件叠加
- 不允许连续高强度强调

后续可配置：

```ts
motionDensity:
  "low"
  | "medium"
  | "high"
```

---

# 34. Inspector 通用参数

所有 Effect 至少拥有：

```text
Start
End
Variant
Placement
Motion Preset
Style Preset
Opacity
Scale
Width
Height
Priority
Lock Position
```

组件特殊参数通过 Schema 动态生成。

---

# 35. 手动编辑规则

用户手动拖动后：

```text
placement = custom
locked = true
```

Layout Engine 不再自动重排。

除非用户：

`重新自动布局`

---

# 36. Video Import

支持用户导入本地：

```text
mp4
mov
webm
```

浏览器支持范围内优先使用原生 Video。

需求：

- URL.createObjectURL
- 不上传服务器
- 本地预览
- 保存项目时只保存路径引用或元信息，不复制视频到 Overlay JSON

---

# 37. Timeline

最低能力：

- Video Track 只作为背景参考
- Overlay Track
- 每个 Overlay 一个 Block
- Block 可左右拖动
- 左右边缘可改变 Start / End
- 点击 Block 选择 Overlay
- Playhead 独立
- 拖动 Overlay 不应错误改变 Playhead
- Timeline Zoom

---

# 38. Effect Library Preview

每个 Effect 卡片：

必须展示真实：

```text
enter
hold
exit
```

鼠标 Hover 可：

- Replay
- Preview Variant

点击：

- Insert to Workspace

不得使用 GIF 替代真实 Renderer。

---

# 39. 资源系统

支持：

```text
text
number
image
svg
icon
```

媒体型 Effect：

```text
SlideSwap
QuadGrid
CrossFadePair
```

允许用户选择本地资源。

第一版：

不做完整 Asset Manager。

只需基本导入与引用。

---

# 40. Icon System

禁止依赖远程字体图标。

优先：

- 本地 SVG
- lucide 等明确许可的 SVG icon package
- 用户导入 SVG

所有资源必须可本地运行。

---

# 41. Style Preset

建立 Style Preset Registry。

例如：

```text
graphite
paper
documentary
mono-line
soft-panel
studio-dark
studio-light
```

Style Preset 控制：

- 背景
- Border
- Typography
- Accent
- Radius
- Shadow
- Opacity

禁止 AI 自由拼接 CSS。

---

# 42. Motion Preset

建立 Motion Preset Registry。

示例：

```text
fade-slide
clip-reveal
line-draw
count-up
stroke-draw
mask-reveal
soft-scale
panel-pull
word-highlight
```

禁止 AI 自由生成 animation code。

---

# 43. Performance

目标：

1080p Preview 下：

- 30fps 体验稳定
- 普通场景 1–6 Overlay 同时存在不卡顿
- 不引入大型 Canvas / WebGL 引擎除非确有必要
- 优先 DOM + CSS Transform + SVG
- 动画只用 GPU 友好属性优先
- 避免频繁 Layout Thrashing

第一版不要求 4K 实时编辑。

---

# 44. Export Architecture

当前重点仍是透明 Overlay。

禁止将视频合成进 Overlay 输出。

输出内容：

仅：

- Overlay
- SVG
- Text
- Shape
- Image Asset
- UI Effect

不包含：

- 原视频帧
- 背景视频
- 视频声音

---

# 45. PNG Sequence Export

保留 / 实现：

按钮：

`导出透明动效层`

要求：

- 背景 Alpha = 0
- 每帧按照 currentTime 渲染
- 尺寸与 Canvas 一致
- FPS 使用项目 FPS
- 时长与项目一致
- 文件名：

```text
frame_000001.png
frame_000002.png
...
```

导出目录：

```text
exports/
```

如果纯浏览器无法直接写本地目录：

允许使用：

- File System Access API
- 或项目现有本地 Node server

但不要因此引入 Electron。

---

# 46. 特殊组件透明导出规则

以下组件必须特别处理：

```text
MaskWipe
DualOverlay
ZoomAnchor
```

Workspace 可以利用视频背景做视觉模拟。

但 Exporter：

必须只渲染 Overlay UI。

不得把底层视频像素捕获到透明输出。

---

# 47. 项目本地运行

保持：

```text
localhost
```

支持：

Windows：

```text
start.bat
```

Mac：

```text
start.command
```

双击：

1. 检查依赖
2. 启动 Vite / Node
3. 自动打开浏览器
4. 进入 Overlay Studio

禁止为此引入 Electron / Tauri。

---

# 48. 推荐目录结构

在不破坏现有合理结构前提下，逐步演进为：

```text
src/
├─ effects/
│  ├─ registry/
│  │  ├─ effectRegistry.ts
│  │  ├─ effectTypes.ts
│  │  └─ semanticMapping.ts
│  │
│  ├─ components/
│  │  ├─ MetricFocus/
│  │  ├─ CompareSplit/
│  │  ├─ QuoteLockup/
│  │  ├─ BarReveal/
│  │  └─ ...
│  │
│  ├─ renderer/
│  │  ├─ ComponentRenderer.tsx
│  │  ├─ renderEffectAtTime.ts
│  │  └─ motionState.ts
│  │
│  ├─ motion-presets/
│  └─ style-presets/
│
├─ layout/
│  ├─ LayoutEngine.ts
│  ├─ CollisionEngine.ts
│  ├─ SafeZoneEngine.ts
│  └─ geometry.ts
│
├─ overlay/
│  ├─ schema/
│  ├─ validation/
│  ├─ migration/
│  └─ overlayTypes.ts
│
├─ semantic/
│  ├─ beatTypes.ts
│  ├─ effectSelector.ts
│  └─ semanticPlayground.ts
│
├─ workspace/
│  ├─ Workspace.tsx
│  ├─ VideoLayer.tsx
│  ├─ OverlayLayer.tsx
│  └─ SafeZoneLayer.tsx
│
├─ timeline/
│  ├─ Timeline.tsx
│  ├─ OverlayTrack.tsx
│  └─ Playhead.tsx
│
├─ export/
│  ├─ pngSequenceExporter.ts
│  └─ exportTypes.ts
│
└─ app/
```

不要为了完全匹配目录而进行无价值的大重构。

---

# 49. 开发阶段

## Phase 0：架构修复

必须先完成：

- Effect Registry
- EffectKind
- ComponentRenderer
- currentTime 驱动
- Overlay JSON V2
- JSON Validation
- Placement System
- Safe Zone
- Layout Engine
- Collision Engine

完成前不要批量写 37 个组件。

---

## Phase 1：核心 3 组件标准化

完成：

```text
MetricFocus
CompareSplit
QuoteLockup
```

确保：

- Registry
- Variant
- Renderer
- Timeline
- Workspace
- Library
- JSON
- Export

全部打通。

---

## Phase 2：Tier A

完成：

```text
BarReveal
RingCountUp
ListTickBuild
SidePull
WordHighlight
TextUnderlineDraw
ArrowTrace
CircleSpotlight
BoxDraw
StepFlow
```

---

## Phase 3：Tier B

完成常用增强组件。

---

## Phase 4：Tier C

开发媒体型和特殊组件。

---

## Phase 5：Tier D

实现受限版 `IconMorph`。

---

## Phase 6：Semantic Playground

增加：

文本输入：

```text
以前30分钟，现在只需要3分钟。
```

用户可手工设置：

```text
semanticType = comparison
```

系统展示推荐：

```text
CompareSplit
SlideSwap
CrossFadePair
```

并允许一键生成测试 Overlay。

本阶段仍可不接 LLM。

---

# 50. 测试要求

每一个 Effect 必须拥有：

- Unit Test 或 Schema Test
- Registry Test
- Render Smoke Test
- Timeline Boundary Test
- JSON Roundtrip Test
- Placement Test
- Transparent Background Test

---

# 51. Timeline Boundary Test

必须验证：

```text
currentTime < start
→ 不显示

currentTime == start
→ enter 第一帧

start < currentTime < end
→ 正常动画

currentTime 接近 end
→ exit

currentTime >= end
→ 不显示
```

---

# 52. JSON Roundtrip

必须确保：

```text
Workspace
→ Export JSON
→ Clear Project
→ Import JSON
→ Workspace
```

最终视觉一致。

---

# 53. Library / Workspace 一致性验收

同一个 Effect：

```text
kind
variant
content
motionPreset
stylePreset
```

在：

```text
Effect Library
Workspace
Exporter
```

必须由同一 ComponentRenderer 输出。

不允许视觉不一致。

---

# 54. 首要验收流程

开发完成后必须真实演示：

1. 打开本地 Overlay Studio。
2. 导入一段 16:9 真人视频。
3. 视频正常加载。
4. Workspace 显示 Person Safe Zone。
5. 插入 `MetricFocus`。
6. Placement 选择 `right-center`。
7. Start = 3s。
8. End = 6s。
9. 播放至 3s，看到真实 Enter。
10. 3–6s 正常 Hold。
11. 接近 6s 看到 Exit。
12. 插入 `CompareSplit`。
13. 两个组件视觉结构必须明显不同。
14. 插入 `QuoteLockup`。
15. Effect Library 的 Preview 与 Workspace 一致。
16. 同一时间增加第二个组件。
17. Collision Engine 不允许两个组件直接完全重叠。
18. 手动拖动组件后保存为 `custom + locked`。
19. Export JSON。
20. Reload JSON。
21. 视觉恢复一致。
22. 导出透明 PNG。
23. PNG 不包含原视频。
24. PNG Alpha 正常。
25. MaskWipe / ZoomAnchor 等特殊组件不会错误把视频像素导出。

---

# 55. 组件级验收原则

每个新组件必须满足：

- 一眼看出它与其它组件不是同一个模板换文字
- 有独立视觉结构
- 有独立 Motion Language
- 不破坏整体设计系统
- 默认参数可直接用于真实短视频
- 不需要用户大量调整才能看
- 与人物安全区兼容
- 支持时间轴
- 支持 JSON Save / Load
- 支持透明背景
- 不依赖远程资源

---

# 56. Definition of Done

本 PRD 阶段完成的最低标准：

## 架构

- [ ] Effect Registry 成为唯一真相源
- [ ] ComponentRenderer 唯一
- [ ] currentTime 唯一时间源
- [ ] Layout Engine 可运行
- [ ] Collision Engine 可运行
- [ ] Overlay JSON V2 可导入导出
- [ ] JSON Validation 可运行

## 编辑

- [ ] 视频导入
- [ ] Workspace
- [ ] Inspector
- [ ] Timeline
- [ ] Safe Zone
- [ ] Placement
- [ ] Drag / Resize
- [ ] Lock

## Effect

- [ ] 40 个 Kind 均已注册
- [ ] 按 Phase 分批实现
- [ ] 每个已实现 Effect 有真实 Preview
- [ ] 每个 Effect 有至少 1 个高质量默认 Variant
- [ ] 核心组件至少 3 Variants

## 导出

- [ ] Overlay-only PNG Sequence
- [ ] Transparent Background
- [ ] 不包含原视频
- [ ] currentTime 帧同步正确

---

# 57. Codex 开发纪律

Codex 必须遵守：

1. 不允许一次性把 40 个组件全部草率实现。
2. 必须严格按 Phase 开发。
3. Phase 0 未通过前，不得批量扩组件。
4. 每完成一批 Effect，先做真实 Workspace 测试。
5. 禁止为赶数量复制同一个组件然后改名字。
6. 禁止每个 Effect 各写一套独立时间系统。
7. 禁止 Effect Library 使用假预览。
8. 禁止绕过 ComponentRenderer。
9. 禁止 AI 代码生成未知组件。
10. 禁止任意 Effect 写死大量绝对坐标。
11. 禁止忽略 Safe Zone。
12. 禁止忽略 Collision。
13. 禁止破坏当前已经调试好的核心组件视觉。
14. 禁止自动进入 Remotion / ffmpeg / MOV 阶段。
15. 每个 Phase 完成后必须先报告结果，再进入下一 Phase。

---

# 58. 每阶段 Codex 必须输出

每完成一个 Phase，输出：

```text
1. 完成内容
2. 修改文件
3. 新增文件
4. 数据结构变化
5. Effect Registry 变化
6. JSON Schema 变化
7. UI变化
8. 测试结果
9. 已知问题
10. 下一阶段建议
```

---

# 59. 最终目标

最终 CueCut 不再是：

```text
AI
↓
自由生成一堆未知 UI / 动效
↓
随机坐标
↓
视觉不可控
```

而是：

```text
SRT
↓
重点提炼
↓
Semantic Beat
↓
Effect Selector
↓
40 个经过验证的 Effect
↓
Variant / Motion / Style
↓
Layout Engine
↓
Safe Zone / Collision
↓
Overlay JSON
↓
统一 ComponentRenderer
↓
Workspace / Library / Export
```

最终形成：

> **一个由高质量动效组件库提供视觉能力、由 AI 提供内容理解和编排能力、由 Layout Engine 提供空间约束、由 Timeline 提供时间约束的短视频动效包装系统。**

---

# 60. 当前开发优先级

Codex 收到本 PRD 后，第一步不要开始写 37 个新 Effect。

第一步必须先检查现有代码，并回答：

```text
1. 当前是否已有统一 Effect Registry？
2. Library 与 Workspace 是否共用同一个 Renderer？
3. 组件动画是否真正由 currentTime 驱动？
4. 当前 Overlay JSON Schema 是什么？
5. 为什么已有 Effect 会出现位置重叠？
6. 当前 Safe Zone 是否真正进入 Layout 计算？
7. 当前视频为什么可能无法成功加载？
8. 当前 Effect Library 切换为什么看起来像同一个效果？
9. 现有代码中哪些部分可以保留？
10. Phase 0 最小修改方案是什么？
```

完成代码审查后：

**先执行 Phase 0。**

不得跳过基础架构直接开始堆组件。

---

# 61. 开发启动指令

Codex 执行时：

```text
请严格依据本 PRD 开发。

先读取当前完整代码，不要假设项目结构。

先做 Phase 0 架构审查。

不要一次性实现 40 个 Effect。

不要为了完成数量牺牲动效质量。

任何新 Effect 必须通过 Effect Registry 注册，并通过统一 ComponentRenderer 渲染。

所有视觉动画必须由 currentTime 驱动。

AI 未来只负责编排，不负责设计。

完成每一个 Phase 后停止，汇报测试结果和问题，等待进入下一阶段。
```
