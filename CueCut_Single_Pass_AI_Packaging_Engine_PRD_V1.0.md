# CueCut AI 动效包装引擎 PRD
## Single-Pass AI Packaging Engine

**文档版本**：V1.0
**目标读者**：Codex / 开发团队 / 架构评审
**项目**：CueCut
**核心目标**：在“每个视频项目原则上只调用一次生成式 AI”的前提下，实现自动口播视频动效包装、字幕包装、人物避让/遮挡、动效模板匹配、确定性 QA、自修复与多格式导出。

---

# 1. 项目背景

CueCut 的核心方向不是做一个依赖 AI 反复生成和修复的视频编辑器，而是做一个：

> **AI 只负责一次性创意编排，后续全部由确定性程序完成的视频包装引擎。**

现有方向可概括为：

- L1：动效卡片库 / Overlay Registry
- L2：AI 读取 SRT / Transcript 并生成 Overlay JSON
- L3：本地预览、云渲染、最终导出

本 PRD 在此基础上进一步升级，并参考 HyperFrames 中值得借鉴的设计思想，包括：

- motion graphics 分类
- talking-head recut
- Registry / Block 模型
- shot-plan IR
- Motion Vocabulary
- seek-safe animation
- subject matte / background text
- transparent WebM / MOV
- shader transition
- snapshot QA

但 CueCut 不照搬 HyperFrames 的多轮 Agent 流程，而是强制改造成：

```text
视频 + SRT + 视频分析结果 + 用户设置
                    ↓
            唯一一次 AI 调用
                    ↓
          packaging-plan.json
                    ↓
         后续不再调用生成式 AI
                    ↓
Registry Resolver
Layout Solver
Motion Compiler
Collision Resolver
Subject Layer Solver
QA Validator
Fallback / Auto Repair
Renderer
                    ↓
MP4 / WebM / MOV / PNG Sequence
```

---

# 2. 核心产品原则

## 2.1 Single-Pass AI Principle

每个视频项目的自动包装流程原则上只允许执行一次生成式 AI 调用。

该调用负责：

- 理解整条视频语义
- 判断内容节奏
- 判断信息密度
- 判断哪些位置值得加包装
- 决定包装类型
- 决定强调程度
- 决定语义级位置偏好
- 决定人物关系
- 决定动效意图
- 生成完整 Packaging IR

该调用不得负责：

- 最终像素坐标
- 精确字号
- 最终模板 ID
- 最终动画 keyframe
- 精确碰撞处理
- 实际安全区计算
- 实际人物框计算
- 渲染
- QA 后重新请求 AI 修复

---

# 3. 总体架构

```text
┌────────────────────────────┐
│        Input Layer         │
│ Video / SRT / Script / UI  │
└──────────────┬─────────────┘
               ↓
┌────────────────────────────┐
│      Analysis Engine       │
│ 非生成式 / 本地 / 规则型    │
├────────────────────────────┤
│ Metadata                   │
│ ASR / SRT Parse            │
│ Scene Detection            │
│ Subject Detection          │
│ Face Detection             │
│ Safe Zone                  │
│ Edge Insets                │
│ Audio Envelope             │
│ Beat Detection             │
│ Shot Density               │
└──────────────┬─────────────┘
               ↓
┌────────────────────────────┐
│ Packaging Director AI      │
│ 唯一一次生成式 AI           │
└──────────────┬─────────────┘
               ↓
┌────────────────────────────┐
│   packaging-plan.json      │
│     Packaging IR           │
└──────────────┬─────────────┘
               ↓
┌────────────────────────────┐
│ Deterministic Execution    │
├────────────────────────────┤
│ Registry Resolver          │
│ Motion DSL Compiler        │
│ Layout Solver              │
│ Subject Layer Solver       │
│ Collision Resolver         │
│ Fallback Resolver          │
│ Timeline Compiler          │
│ Packaging Validator        │
│ Render Engine              │
└──────────────┬─────────────┘
               ↓
┌────────────────────────────┐
│ Output                     │
│ MP4 / WebM / MOV / PNG     │
└────────────────────────────┘
```

---

# 4. 模块划分

## 4.1 Analysis Engine

该模块不允许调用生成式 AI。

### 输入

- video file
- SRT / VTT / transcript
- 用户设置
- 项目画布比例

### 输出

```json
{
  "videoMeta": {},
  "transcript": [],
  "scenes": [],
  "subjects": [],
  "faces": [],
  "safeZones": [],
  "edgeInsets": {},
  "audioEnvelope": [],
  "beats": [],
  "sceneDensity": []
}
```

### 负责能力

1. 获取视频宽高、FPS、时长
2. SRT 标准化
3. 逐词/逐句时间戳
4. 人物/人脸检测
5. 主体区域扩张
6. 用户可配置人物避让阈值
7. 四边独立 Safe Margin
8. 场景切换检测
9. 音量包络
10. 节拍检测
11. 镜头运动强度估计
12. 背景亮度估计
13. 可放置区域计算

---

# 5. Packaging Director AI

这是整个自动包装流程中唯一允许调用生成式 AI 的模块。

## 5.1 AI 输入

```json
{
  "script": "...",
  "transcript": [],
  "sceneAnalysis": [],
  "subjectZones": [],
  "safeZones": [],
  "beats": [],
  "userPreferences": {
    "style": "clean-tech",
    "energy": "medium",
    "density": "auto",
    "allowBehindSubject": true,
    "maxConcurrentOverlays": 2
  }
}
```

## 5.2 AI 输出要求

必须输出合法、完整、可验证的 `packaging-plan.json`。

AI 不得输出：

- GSAP 代码
- CSS
- HTML
- shader
- 像素级坐标
- 最终 effectId
- 最终字体大小

AI 只输出语义级包装计划。

---

# 6. Packaging IR

## 6.1 顶层 Schema

```json
{
  "schemaVersion": "1.0",
  "projectId": "string",
  "canvas": {
    "width": 1080,
    "height": 1920,
    "aspectRatio": "9:16",
    "fps": 30
  },
  "globalStyle": {
    "visualStyle": "clean-tech",
    "energy": 0.55,
    "density": "auto",
    "paletteIntent": "derive-from-brand",
    "motionIntensity": 0.5
  },
  "timeline": [],
  "constraints": {},
  "exportHints": {}
}
```

---

# 7. Timeline Item Schema

```json
{
  "id": "overlay-001",
  "startSec": 3.2,
  "endSec": 7.8,

  "intent": "highlight_key_claim",

  "category": "kinetic-type",

  "content": {
    "text": "Token 降低 67%",
    "primaryValue": "67%",
    "supportingText": "更低消耗"
  },

  "importance": 0.92,

  "visualIntent": {
    "style": "clean-tech",
    "energy": 0.75,
    "emphasis": "strong"
  },

  "motionIntent": {
    "entrance": "scale_punch",
    "emphasis": "scale_pulse",
    "exit": "fade_out"
  },

  "placementIntent": {
    "preferredZones": [
      "upper-left",
      "upper-right"
    ],
    "subjectRelation": "avoid",
    "anchor": "scene-safe"
  },

  "constraints": {
    "maxLines": 2,
    "mustRemainReadable": true,
    "mayOverlapSubtitle": false
  }
}
```

---

# 8. 动效 Category

V1 建议支持：

```text
kinetic-type
stat
lower-third
callout
quote
data-card
chart
progress
code
ui-highlight
notification
social-card
picture-in-picture
logo-reveal
headline
freeze-frame-dressing
transition
```

V2 可增加：

```text
map
tweet/news
asset-fusion
3d
shader-vfx
advanced-particle
```

---

# 9. Registry 系统

CueCut 必须建立独立 Effect Registry。

目录建议：

```text
effect-package/
├── manifest.json
├── preview.png
├── thumbnail.png
├── runtime/
│   ├── index.ts
│   └── styles.css
├── schema.json
├── presets/
├── assets/
└── tests/
```

## 9.1 manifest.json

```json
{
  "id": "lower-third-clean-01",
  "version": "1.0.0",

  "category": "lower-third",

  "title": "Clean Lower Third",

  "tags": [
    "clean",
    "business",
    "talking-head",
    "technology"
  ],

  "supportedAspectRatios": [
    "16:9",
    "9:16",
    "4:5"
  ],

  "supportedZones": [
    "lower-left",
    "lower-right"
  ],

  "subjectRelations": [
    "avoid",
    "foreground"
  ],

  "duration": {
    "min": 2,
    "recommended": 4,
    "max": 8
  },

  "motionCapabilities": {
    "entrance": ["slide_left", "wipe"],
    "emphasis": ["none"],
    "exit": ["fade_out"]
  },

  "contentSchema": {
    "name": "string",
    "role": "string"
  },

  "safeZoneAware": true,
  "subtitleAware": true,
  "subjectAware": true,

  "runtime": "gsap"
}
```

---

# 10. Registry Resolver

AI 不能直接指定最终模板。

AI 只输出：

```json
{
  "category": "lower-third",
  "visualStyle": "clean-tech",
  "energy": 0.3,
  "subjectRelation": "avoid",
  "preferredZones": ["lower-left"]
}
```

程序根据规则评分：

```text
category match                 30
style tag match                15
aspect ratio support           15
zone support                   10
subject relation support       10
duration fit                   10
content schema compatibility   10
```

选择最高分模板。

若第一名布局失败：

```text
candidate #1
→ validation fail
→ candidate #2
→ validation fail
→ candidate #3
```

不调用 AI。

---

# 11. CueCut Motion DSL

AI 只能输出有限 Motion Vocabulary。

## 11.1 Entrance

```text
fade_in
fade_blur
slide_left
slide_right
slide_top
slide_bottom
wipe_left
wipe_right
scale_grow
scale_punch
word_reveal
typewriter
slam
```

## 11.2 Emphasis

```text
none
scale_pulse
shake
glow
color_shift
underline_sweep
highlight_sweep
counter
bar_fill
scribble
```

## 11.3 Exit

```text
fade_out
slide_out_left
slide_out_right
slide_out_bottom
scale_out
wipe_out
```

## 11.4 Camera

```text
punch_in
slow_zoom
pan
dolly_zoom
rack_focus
freeze_frame
```

## 11.5 Compiler

例如：

```text
scale_punch
```

由程序映射：

```text
scale: 0.6 → 1
opacity: 0 → 1
ease: back.out
duration: preset
```

AI 不生成 keyframe。

---

# 12. Subject Spatial System

现有“人物禁放区”升级为“主体空间关系系统”。

## 12.1 subjectRelation

```text
avoid
foreground
behind
hug-left
hug-right
hero-center
ignore
```

## 12.2 avoid

动效不能进入人物扩展区域。

用户可设置：

```text
subjectAvoidPadding = 10%
```

允许 0~50%。

---

## 12.3 foreground

动效显示在人物前面。

适合：

- lower third
- subtitle
- notification
- callout

---

## 12.4 behind

动效位于人物后面。

通过人物 matte 实现：

```text
Background Graphic
↓
Subject Matte
↓
Foreground
```

适合：

- hero word
- 巨型标题
- cinematic text
- climax typography

---

## 12.5 hug-left / hug-right

动效贴近人物轮廓边缘，但不覆盖主体。

---

## 12.6 hero-center

文字有意穿过人物中心区域，通过人物遮挡文字。

不得用于普通说明字幕，只用于高权重 Hero 包装。

---

# 13. Edge Safe Area

四边必须支持独立设置：

```json
{
  "top": 0.04,
  "bottom": 0.08,
  "left": 0.05,
  "right": 0.05
}
```

用户可以单独修改。

必须允许特殊元素声明：

```json
{
  "allowEdgeOverride": true,
  "allowedEdges": ["top"]
}
```

例如：

- 顶部进度条
- 边框
- HUD
- 全屏 framing

---

# 14. Layout Solver

Layout Solver 不调用 AI。

输入：

- Packaging IR
- Registry Template
- Subject Zone
- Subtitle Zone
- Safe Area
- Edge Insets
- Existing overlays

输出：

```json
{
  "x": 0.12,
  "y": 0.18,
  "width": 0.36,
  "height": 0.12,
  "resolvedZone": "upper-left"
}
```

坐标内部建议全部使用归一化 0~1。

---

# 15. Placement Candidate System

每个 Overlay 先生成多个候选区域：

```text
preferred zone
fallback zone 1
fallback zone 2
fallback zone 3
```

例如：

```text
upper-left
→ upper-right
→ mid-left
→ lower-left
```

候选评分考虑：

```text
人物冲突
字幕冲突
画面边缘
背景复杂度
元素重叠
已有包装
文字可读性
```

最高分通过。

---

# 16. Collision Resolver

检测：

- overlay-overlay
- overlay-subtitle
- overlay-face
- overlay-subject
- overlay-edge
- overlay-safe-zone
- overlay-PiP

处理顺序：

```text
移动
→ 换候选 Zone
→ 缩小
→ 缩短文案显示
→ 换 Registry Template
→ 降级为轻量效果
→ 最终删除该非关键 Overlay
```

不得重新调用 AI。

---

# 17. Fallback Engine

每种效果必须定义 fallback chain。

例如：

```text
hero-center behind
↓ matte unavailable
foreground hero
↓ collision
upper-safe kinetic title
↓ collision
lower-opacity callout
↓
drop
```

V1 必须保证所有效果都有 fallback。

---

# 18. Packaging Validator

原先“AI Packaging QA”改为：

> **Packaging Validator**

完全不调用 AI。

## 18.1 检查内容

### Geometry

- 越界
- 过小
- 过大
- overlap
- edge collision
- subtitle collision
- face collision

### Typography

- overflow
- max lines
- minimum font size
- line height
- unreadable text

### Timing

- start >= 0
- end <= duration
- duration >= minimum
- simultaneous overlay count
- no invalid gaps

### Visual

- opacity
- contrast
- high-density clutter
- foreground/background conflict

### Runtime

- animation seek-safe
- deterministic replay
- missing assets
- unsupported runtime

---

# 19. Snapshot QA

正式完整 Render 之前：

```text
Opening frame
Signature motion frame
Peak frame
Final hold
```

自动生成 snapshot。

长视频额外采样：

```text
25%
50%
75%
```

以及：

```text
每个 Overlay:
start + 10%
middle
end - 10%
```

Validator 对 snapshot 对应布局状态进行检查。

---

# 20. 自动修复

Validator 失败后不调用 AI。

只允许规则型修复。

示例：

```text
overflow
→ font-size -5%
→ line wrap
→ template compact mode
```

```text
face collision
→ move zone
→ alternate alignment
→ foreground/behind fallback
```

```text
subtitle collision
→ lift overlay
→ switch left/right
→ compact template
```

---

# 21. Timeline Compiler

将 Packaging IR 编译为最终 timeline。

建议中间层：

```text
Packaging IR
↓
Resolved Overlay Plan
↓
Runtime Timeline
↓
GSAP / CSS / Shader
```

最终渲染层禁止直接读取 AI 原始 JSON。

---

# 22. Runtime 技术路线

V1：

```text
GSAP
CSS
SVG
Canvas
```

V1.5：

```text
WebGL Shader
```

V2：

```text
Lottie
Three.js
```

原则：

> 不要因为 HyperFrames 支持多个 Runtime 就一次性全部照搬。

先优先保证：

- seek
- pause
- scrub
- frame deterministic
- export deterministic

---

# 23. Shader Transition

可参考 HyperFrames shader transition 架构。

V1.5 建议支持：

```text
whip-pan
light-leak
glitch
cinematic-zoom
flash-through-white
chromatic-split
ripple
cross-warp
```

必须支持：

```text
transition cache
dirty invalidation
preview cache
```

编辑某一 Scene 时只让相邻 Transition Cache 失效。

---

# 24. 透明通道导出

CueCut 必须支持：

## MP4

```text
H.264 / H.265
No Alpha
```

## WebM

```text
VP9
Alpha
```

## MOV

```text
ProRes 4444
True Alpha
```

## PNG Sequence

```text
RGBA PNG
```

适用场景：

- Premiere
- Resolve
- Final Cut
- After Effects
- 二次包装
- CueCut 动效素材导出

---

# 25. Preview 与 Render 分离

预览不得每次走最终 Render。

推荐：

```text
Browser / Canvas Preview
↓
Snapshot Validation
↓
Final Render
```

Final Render 只在：

- 用户主动导出
- 自动工作流最终一步

发生。

---

# 26. 用户可修改而不重新调用 AI 的参数

AI 生成后，以下修改不得触发重新调用 AI：

```text
更换主题
更换模板
颜色
字体
字幕样式
边缘安全区
人物避让距离
动效速度
强度
透明度
9:16 / 16:9 / 4:5
模板候选
MP4 / WebM / MOV
```

原则：

> Packaging IR 保存“创意意图”，不是“像素实现”。

---

# 27. 修改比例后的重排

当用户从：

```text
9:16 → 16:9
```

程序执行：

```text
读取原 Packaging IR
↓
重新 Registry Resolve
↓
重新 Layout Solve
↓
重新 Collision Resolve
↓
重新 Compile
```

不得重新调用 AI。

---

# 28. 用户手动修改后状态

需要区分：

```text
AI Intent
Resolved State
User Override
```

例如：

```json
{
  "aiIntent": {
    "preferredZone": "upper-left"
  },
  "resolvedState": {
    "zone": "upper-right"
  },
  "userOverride": {
    "locked": true,
    "zone": "mid-left"
  }
}
```

用户锁定后程序不得自动移动。

---

# 29. 数据结构持久化

项目目录建议：

```text
project/
├── source/
│   ├── video.mp4
│   └── transcript.srt
├── analysis/
│   ├── metadata.json
│   ├── subjects.json
│   ├── safe-zones.json
│   ├── beats.json
│   └── audio-envelope.json
├── ai/
│   └── packaging-plan.json
├── resolved/
│   └── resolved-plan.json
├── snapshots/
├── renders/
└── project.json
```

---

# 30. HyperFrames 可借鉴/迁移边界

## 30.1 建议重点借鉴

### 架构

- shot-plan IR
- Registry
- Block
- Motion Vocabulary
- deterministic timeline
- snapshot QA
- transparent render
- shader transition cache
- talking-head recut 思路
- subject matte / embedded graphics

## 30.2 可研究代码复用

重点单独评估：

```text
producer
shader-transitions
render pipeline
transparent alpha
frame capture
distributed rendering
```

## 30.3 不建议照搬

```text
多轮 AI Director
Builder AI
AI Repair
多 Agent 反复生成
所有 Runtime 一次性引入
```

---

# 31. 许可证要求

HyperFrames 根仓库当前为 Apache-2.0。

开发必须执行：

1. 对具体要迁移的文件逐项检查 License
2. 第三方 dependency 单独检查
3. Registry 中素材/字体/品牌 UI 单独检查
4. 社交平台品牌 Logo、界面元素不得默认视为可商业分发资产
5. 保留 Apache NOTICE / attribution 要求
6. 不复制许可证不明确资产
7. 迁移记录写入：

```text
THIRD_PARTY_NOTICES.md
```

---

# 32. MVP 范围

## V1

必须完成：

- Single-Pass AI
- Packaging IR
- Registry
- Registry Resolver
- Motion DSL
- Subject Avoid
- Foreground
- Edge Insets
- Layout Solver
- Collision Resolver
- Fallback
- Validator
- Snapshot QA
- MP4
- WebM Alpha
- 用户修改不重新 AI

---

# 33. V1.5

增加：

- Subject Matte
- Behind Subject
- Hero Center
- MOV ProRes 4444
- PNG Sequence
- Shader Transition
- Preview Cache

---

# 34. V2

增加：

- Lottie
- Three.js
- Advanced Shader
- 3D
- Asset Fusion
- Advanced Auto Theme
- Distributed Render
- Cloud Render

---

# 35. 开发顺序

建议 Codex 严格按以下顺序：

```text
Task 01
定义 Packaging IR Schema

Task 02
Registry Manifest Schema

Task 03
Motion DSL

Task 04
Registry Resolver

Task 05
Safe Zone + Edge Insets

Task 06
Subject Spatial Model

Task 07
Layout Solver

Task 08
Collision Resolver

Task 09
Fallback Engine

Task 10
Timeline Compiler

Task 11
Packaging Validator

Task 12
Snapshot QA

Task 13
Preview

Task 14
MP4/WebM Render

Task 15
Subject Matte

Task 16
MOV Alpha

Task 17
Shader Transitions

Task 18
完整 Single-Pass AI 接入
```

注意：

> AI 接入故意放最后。

先把整个确定性执行层做好，再接 AI。

否则会出现 AI JSON 不稳定、底层能力未固定的问题。

---

# 36. AI Prompt Contract

AI 系统提示词必须明确：

```text
你是 CueCut Packaging Director。

你只能做一次完整视频包装规划。

你不得输出：
- HTML
- CSS
- GSAP
- shader
- 像素坐标
- 最终模板 ID

你只能输出符合 CueCut Packaging IR Schema 的合法 JSON。

你的职责：
1. 阅读完整 transcript
2. 理解语义结构
3. 找出真正值得视觉强调的位置
4. 控制包装密度
5. 避免每句话都加效果
6. 优先语义驱动而不是固定间隔
7. 输出动效 category
8. 输出 motion intent
9. 输出 placement intent
10. 输出 subject relation
11. 输出 importance
12. 输出完整 timeline
```

---

# 37. AI 包装密度策略

支持：

```text
low
medium
high
auto
```

Auto 根据：

```text
视频时长
信息密度
数字数量
新观点数量
句子速度
语气高潮
章节结构
```

决定。

禁止：

```text
每 N 秒强制一个包装
```

---

# 38. 推荐默认密度

```text
< 60 秒
6~10 秒 / 有意义包装

60 秒~3 分钟
8~15 秒

3~10 分钟
12~25 秒
```

但最终由 AI 结合语义决定。

---

# 39. 关键包装原则

AI 必须区分：

```text
ordinary
important
hero
```

Hero 必须稀缺。

禁止：

```text
连续多个 hero
每句话都 kinetic text
所有文字都 behind subject
```

---

# 40. 性能目标

## Preview

1080p 项目：

```text
首次打开 < 3s
Scrub 可交互
普通动效预览 ≥ 30fps
```

## Layout

单 Overlay Resolve：

```text
< 10ms
```

## Validator

100 overlays：

```text
< 500ms
```

以上先作为工程目标，不作为 V1 发布硬阻塞。

---

# 41. 稳定性要求

同一：

```text
Packaging IR
+
Registry Version
+
Engine Version
+
Seed
```

必须得到相同结果。

即：

```text
Deterministic Render
```

---

# 42. Seed

所有随机效果必须：

```json
{
  "seed": 12345
}
```

禁止 runtime 使用不可控：

```text
Math.random()
```

除非由 seed RNG 替代。

---

# 43. 测试要求

## Unit

```text
Registry Resolver
Layout Solver
Collision
Safe Zone
Motion DSL
Fallback
Validator
```

## Golden Tests

固定输入：

```text
IR + Registry + Seed
```

输出：

```text
关键帧截图
```

用于视觉回归。

## Export

必须测试：

```text
MP4
WebM Alpha
MOV Alpha
PNG RGBA
```

---

# 44. 必测视频类型

```text
9:16 单人口播
16:9 单人口播
人物靠左
人物靠右
人物居中
高亮背景
暗背景
字幕在底部
人物快速移动
多场景切换
无人物
```

---

# 45. 非功能性要求

- AI API 失败后不得导致项目无法手动编辑
- Packaging IR 必须本地持久化
- 无网状态下已生成项目仍能重新 Render
- 用户修改主题不得消耗 AI Token
- 用户更换画幅不得消耗 AI Token
- 用户重导出不得消耗 AI Token

---

# 46. 错误处理

AI JSON 无效：

```text
JSON Schema repair parser
↓
仍失败
↓
此次生成失败
```

注意：

> 不允许自动再次调用 AI 来修 JSON。

如果产品未来需要“自动重试 AI”，必须作为单独计费/设置项，不属于本 PRD 默认行为。

---

# 47. UI 要求

自动包装生成页展示：

```text
生成 AI 包装
```

点击后：

```text
分析视频
↓
一次 AI 生成
↓
生成包装
↓
自动排版
↓
自动检查
↓
可编辑
```

用户不需要感知底层多模块。

---

# 48. UI 高级设置

```text
包装密度
动效强度
人物避让距离
允许人物后方文字
顶部安全区
底部安全区
左侧安全区
右侧安全区
最大同时包装数量
动画速度
默认主题
```

---

# 49. 可观测性

每次生成保存：

```json
{
  "aiCallCount": 1,
  "model": "...",
  "analysisVersion": "...",
  "registryVersion": "...",
  "engineVersion": "...",
  "validatorRepairs": []
}
```

必须能够验证：

```text
一个项目自动包装到底调用了几次 AI。
```

---

# 50. 核心埋点

```text
ai_generate_success
ir_validation_fail
registry_fallback
layout_fallback
collision_repair
overlay_dropped
render_success
render_fail
export_alpha
manual_override
```

---

# 51. V1 验收标准

满足以下全部条件才算完成：

1. 一条 60 秒口播视频仅调用一次生成式 AI
2. AI 输出完整 Packaging IR
3. 后续流程无需 AI
4. 至少支持 8 类包装
5. 至少支持 30 个 Registry Effect
6. 人物 Avoid 可工作
7. 四边安全区可独立设置
8. 字幕冲突自动处理
9. Overlay 之间自动碰撞处理
10. Layout 失败能 fallback
11. Validator 能自动修复常见问题
12. 用户换模板不重新 AI
13. 用户换画幅不重新 AI
14. 用户修改安全区不重新 AI
15. 能导出 MP4
16. 能导出透明 WebM
17. 同一项目重复 Render 结果稳定
18. AI 调用计数日志明确为 1

---

# 52. V1.5 验收标准

增加：

1. 人物 Matte
2. Behind Subject
3. Hero Center
4. MOV ProRes 4444 Alpha
5. PNG RGBA
6. Shader Transition
7. Preview Cache
8. 关键帧视觉回归测试

---

# 53. Codex 开发约束

Codex 在实现过程中必须遵循：

1. 不得擅自增加多轮 AI 调用
2. 不得把 AI 引入 QA
3. 不得把 AI 引入 Collision Resolver
4. 不得把 AI 引入 Layout
5. 不得让 AI 输出最终模板 ID 成为强依赖
6. 不得让 AI 输出像素坐标作为最终布局
7. 不得将 Render 和 AI 强绑定
8. 不得使用无 Seed 随机
9. 不得跳过 Schema Validation
10. 不得直接复制许可证不明确的 HyperFrames 素材

---

# 54. 建议代码目录

```text
src/
├── analysis/
├── ai/
│   └── packaging-director/
├── packaging-ir/
├── registry/
├── motion/
├── layout/
├── subject/
├── collision/
├── fallback/
├── validator/
├── timeline/
├── preview/
├── render/
├── export/
└── telemetry/
```

---

# 55. 架构红线

以下情况视为架构退化：

```text
QA 失败 → 再问 AI
布局失败 → 再问 AI
模板失败 → 再问 AI
更换比例 → 再问 AI
修改主题 → 再问 AI
重新导出 → 再问 AI
```

正确方式：

```text
QA 失败
↓
Deterministic Repair
```

---

# 56. 最终定义

CueCut AI 动效包装的核心不是：

> AI 每一步都参与。

而是：

> **AI 只做一次真正需要“创意理解”的工作。**

然后把所有可以工程化的部分全部工程化：

```text
AI
只负责：
WHAT + WHY

CueCut Engine
负责：
WHICH + WHERE + HOW + RENDER
```

即：

```text
AI：
这里应该突出一个核心数据

CueCut：
具体用哪个模板
放哪里
多大
避开谁
如何动画
如何 fallback
如何 QA
如何导出
```

---

# 57. 最终目标

完成本 PRD 后，CueCut 应具备：

```text
一次 AI
↓
完整视频包装计划
↓
无限次本地编辑
↓
无限次换主题
↓
无限次换画幅
↓
无限次重新排版
↓
无限次重新导出
```

并且后续全部不需要再次调用生成式 AI。

这将作为 CueCut 动效包装引擎后续所有版本的基础架构。
