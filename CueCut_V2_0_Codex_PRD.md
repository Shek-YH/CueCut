# CueCut V2.0 — Codex 开发 PRD
## AI Director Skill + Effect Lab + SFX Favorites + 自进化 + 多轨 Timeline + Fast Export

> 文档用途：直接交给 Codex 做正式工程实现。  
> 状态：产品架构冻结候选版。  
> 产品原则：一次 AI 导演生成，后续人工微调。  
> 商业化要求：Clean-room 独立实现。不得复制 Overlay Studio 的源码、Prompt、Schema、动效组件、素材、CSS 或数据文件。

---

# 1. 产品定位

CueCut 是一个面向口播 / 教程 / AI 工具讲解视频的 AI 动效编辑器。

用户目标不是“从空白开始剪动效”，而是：

```text
导入视频
→ 自动获得一版完整、基本可直接导出的动效方案
→ 用户只修改不满意的部分
→ 导出完整视频或透明动效素材
```

核心理念：

> **Import once → AI direct once → Human fine-tune → Export**

---

# 2. 与常见 AI 编辑器的差异

CueCut 不在每个面板堆“AI优化”“AI重排”“AI换卡”按钮。

正常项目只发生一次 LLM Director 调用：

```text
ASR/SRT
+ Video Context
+ Effect Candidates
+ Motion Candidates
+ SFX Candidates
+ Favorites
+ Preference Profile
         ↓
CueCut Director Skill
         ↓
One LLM Call
         ↓
Composition JSON
```

此后：
- Variant 切换：本地；
- Motion 切换：本地；
- Color：本地；
- Timeline：本地；
- SFX 替换：本地；
- Layout：本地；
- Export：本地。

---

# 3. Clean-room 设计约束

参考市场产品时只提炼通用产品思想。

禁止：
- Copy/Fork Overlay Studio；
- 复制其 Skill Prompt；
- 复制其 JSON Schema；
- 复制其 Effect 组件；
- 复制其卡片命名和默认参数；
- 复制其用户偏好文件；
- 复制其 lint rule 配置；
- 复制 UI/CSS；
- 让 Codex 在实现阶段把该仓库当编码上下文。

CueCut 必须拥有：
- 自己的 Director Skill；
- 自己的 Composition Schema；
- 自己的 Registry；
- 自己的 Effect Assets；
- 自己的 Motion Presets；
- 自己的 Preference Engine。

---

# 4. 从竞品 Skill 研究中吸收的“高层模式”

只采用不依赖具体代码/文案的流程思想：

1. **先做语义段，再选视觉表达**  
   不机械按每句字幕塞一个动效。
2. **生成只能引用真实能力库**  
   AI 不能虚构不存在的 Effect。
3. **硬规则和个人偏好分离**  
   Schema/Validator 解决“不能错”；Preference 解决“像不像用户”。
4. **生成后必须校验**  
   AI 输出不能直接信任。
5. **最终用户修改是高价值反馈**  
   导出时对 Initial/Final 做 Diff，形成下一期偏好。
6. **局部用户手调结果应优先于自动规则**  
   用户明确改过/锁定的对象不应被后台自动改回。

CueCut 对这些模式进一步升级：
- 一次调用同时生成 Effect / Variant / Motion / Color / Layout / SFX；
- Diff 学习自动触发，不需要用户额外说“学一下”；
- 坐标使用归一化 + 相对人物坐标；
- Preference Engine 默认不依赖额外 LLM。

---

# 5. 用户主流程

## 5.1 Home

用户：
1. 拖入视频；
2. 可选择“自动”或项目预设；
3. CueCut 开始准备项目。

状态：

```text
读取视频        ✓
提取音频        ✓
ASR            ✓
生成 SRT        ✓
视觉上下文分析   ✓
候选资源召回     ✓
AI Director      ●  仅一次
Composition校验 ○
进入Workspace   ○
```

完成后自动进入 Workspace。

---

# 6. AI Director Skill

Skill 文件：
`skills/cuecut-director/SKILL.md`

完整独立规格见同包 `CueCut_Director_SKILL.md`。

## 6.1 输入
- Video metadata
- SRT
- Face/Subject zones
- Safe margins
- Effect Capability Index
- Motion Capability Index
- SFX Capability Index
- Favorites
- Preference Profile

## 6.2 一次输出
固定：
`cuecut.composition/1`

AI 必须一次决定：
- 哪些语义段需要动效；
- Effect Family；
- Variant；
- start/end；
- 内容槽；
- preferred normalized coordinate；
- scale；
- enter motion；
- exit motion；
- enter/exit duration；
- color/theme；
- SFX；
- SFX offset/gain；
- 全片密度策略。

---

# 7. Context Builder

在调用 LLM 前，本地先准备上下文。

## 7.1 SRT Semantic Pre-index
可以使用轻量本地规则/embedding/小分类器：
- number
- comparison
- list
- quote
- step
- definition
- emphasis
- transition

用途只为候选召回，不做最终导演决定。

## 7.2 Registry Retriever
不把完整库塞入 Prompt。

每段只召回：
- Effect 3~8
- Enter Motion 3~6
- Exit Motion 3~6
- SFX 3~8

用户收藏 SFX 在语义匹配时加权。

---

# 8. Composition Schema

建议：

```text
ProjectComposition
├─ schema
├─ project
├─ segments[]
├─ effects[]
├─ soundEvents[]
└─ directorMeta
```

Effect：

```text
EffectInstance
├─ effectId
├─ segmentId
├─ familyId
├─ variantId
├─ time
├─ content
├─ layout
├─ appearance
├─ motion
├─ sfx
├─ userFlags
└─ variantStateCache
```

---

# 9. Effect Registry

目录建议：

```text
effects/
├─ registry.ts
├─ families/
│  ├─ quote/
│  ├─ numeric/
│  ├─ comparison/
│  ├─ steps/
│  ├─ progress/
│  ├─ callout/
│  └─ tutorial/
```

每个 Effect Definition：
- familyId
- variantId
- displayName
- semanticTags
- contentContract
- specialSchema
- defaultStyle
- min/max duration
- supported ratio
- recommended motion categories
- recommended sfx intents

---

# 10. Family Content Contract

Variant 无损迁移的基础。

例如 numeric family：

```text
label
value
unit
description
maximum
decimals
```

A/B/C 都使用同一 Family Content。

A → B 时保留：
- content
- time
- normalized transform
- common style
- motion
- sfx
- layer
- locks

Special 字段：
- 同名兼容自动迁移；
- 不兼容写入 `variantStateCache`；
- 切回旧 Variant 恢复。

---

# 11. Motion Registry

Effect 与 Motion 必须解耦。

```text
Effect Variant
+
Enter Motion
+
Exit Motion
```

初始类别：

## Basic
- fade
- scale
- pop
- soft-slide

## Direction
- slide-left
- slide-right
- slide-up
- slide-down
- fly-left
- fly-right
- fly-up
- fly-down

## Spring
- spring-in
- overshoot
- bounce-in

## Rotation
- rotate-90
- rotate-180
- spin-360
- spin-720-scale

## Perspective
- flip-x
- flip-y
- perspective-left/right

## Special
- puff
- vanish
- twister
- space-zoom

技术候选优先研究 MIT 动画库，但最终 Motion Preset 要统一映射到 CueCut Render Runtime。

---

# 12. Workspace 信息架构

一级导航最终：

```text
编辑
动效库
音效库
自进化
```

删除独立“字幕”一级导航。

---

# 13. 编辑页

Desktop：

```text
Nav
│
├─ 左区：Layers + SRT 双栏
├─ 中区：Canvas
└─ 右区：Inspector

底部：
Multi-track Timeline
```

## 13.1 Layers
- FX layer
- SFX
- Subtitle
- Video Layer 0

视频永远：
- z0
- locked
- 不能置顶

## 13.2 SRT Quick Panel
- 分段
- 点击 seek
- inline edit
- 当前段高亮
- 关联 FX
- 局部“重新编排本段”不作为常规 LLM 功能；V2 先保留为未来入口或隐藏
- 可展开完整 SRT 管理，但不占一级导航

---

# 14. Canvas

Effect 都是 Effect Card。

必须支持：
- 点击选择
- 拖动 X/Y
- 四角 resize
- scale
- rotation
- opacity
- color
- layer
- alignment guides
- safe zone
- face avoidance

坐标：
- 保存 normalized X/Y/W/H
- 可选 relative-to-subject

---

# 15. Timeline

轨道：

```text
FX N
...
FX 1
SFX
SUB
VIDEO
```

## 15.1 Playhead 与 Effect 完全解耦

```text
拖 Playhead
→ 只改 PlaybackClock

拖 Effect Clip
→ 只改 start/end

拖 Trim Handle
→ 只改 duration
```

红线不跟着 Effect 动。

## 15.2 Professional UX
- Scrub
- Zoom 50~500%
- Fit
- Ctrl/Cmd + Wheel Zoom
- Shift + Wheel Pan
- Middle drag Pan
- Shift multi-select
- Snap subtitle/FX/playhead/whole second
- Alt disable snap
- Frame precise time
- Track height

---

# 16. Inspector

选中 Effect 后：

## 上部 — Special
该 Variant 专属参数。

例如 Ring Metric：
- value
- maximum
- decimals
- unit
- ring thickness
- fill direction

## 下部 — Common
- content
- timing
- appearance
- layout
- motion
- sfx
- layer

---

# 17. 动效库重新定义为 Effect Lab

不是普通图库。

进入时接收：
`sourceEffectInstance`

创建：
`previewDraft`

未点击 Apply 前绝不能修改主 Project。

---

# 18. Effect Lab UI

三栏：

```text
┌────────────┬──────────────────────┬───────────────┐
│模板/Variant│  当前真实内容实时预览 │ Draft Controls│
└────────────┴──────────────────────┴───────────────┘
```

## 18.1 左栏
- Current AI Choice
- Same-family variants
- Other compatible families（低优先）
- Search
- semantic tags

## 18.2 中栏
必须使用当前 Effect 的真实：
- 文案
- 数字
- 单位
- layout ratio
- 当前 color

支持：
- Replay
- Loop Preview
- Enter only
- Exit only
- Full cycle

## 18.3 右栏
显示 AI 初始选择，并允许本地替换：

### Template
- Variant

### Enter
- preset
- direction
- duration
- easing/spring
- intensity
- rotation

### Exit
同上

### Color
- primary
- accent
- text
- background mode

### SFX
- current AI choice
- favorites shortcut
- replace
- volume
- offset

底部：
- Reset to AI Choice
- Cancel
- Apply

---

# 19. Effect Lab Apply

`Apply`：
- 比较 source/draft
- 生成一个 Undo transaction
- commit
- Timeline/Canvas/Inspector 刷新

`Cancel`：
- 丢弃 Draft

浏览模板、Motion、Color 不能污染 Undo。

---

# 20. 音效库

一级导航保留“音效库”。

## 20.1 双维分类

### Intent
- Emphasis
- Transition
- Data
- Impact
- Notification
- Riser
- Exit/Downer
- Digital
- Glitch
- Click/Snap
- Playful
- Ambient

### Style Pack
- Minimal
- Soft
- Glass
- Studio
- Mechanical
- Digital
- Sci-Fi
- Cinematic
- Organic
- Playful

---

# 21. 音效收藏

P0。

每个 SFX 有：
- Favorite star
- favoriteAt

音效库顶部入口：

```text
AI 推荐
★ 收藏
最近使用
全部
```

“收藏”显示所有用户收藏音效。

AI Director：
- 收藏只作为加权；
- 不允许为使用收藏而牺牲语义匹配。

用户可：
- preview
- favorite/unfavorite
- add at playhead
- replace current SFX
- drag to timeline

---

# 22. SFX Registry

每项：
- sfxId
- title
- intentCategory
- stylePack
- tags
- duration
- loudness metadata
- license metadata
- local file path
- favorite
- usage stats

商业化素材必须可明确再分发。

---

# 23. 自进化

一级模块。

正常工作流不再调用第二次大模型。

## 23.1 三层 Memory

### A. Semantic Preference
数值偏好：
- X/Y
- scale
- density
- motion intensity
- favorite families
- SFX intent

### B. Episodic Memory
保存成功项目摘要：
- context
- AI initial
- final
- edit diff
- export confirmed

下一期 Context Builder 检索相似案例形成 Preference Profile。

### C. Procedural Rules
本地规则：
- “9:16 数字类优先右上”
- “普通解释少用强旋转”
- “Studio SFX 权重高”

V2.0 先用结构化规则统计生成，不依赖 LLM Prompt Rewrite。

---

# 24. Preference Evidence

每条偏好：

```text
key
value
context
confidence
sampleCount
positiveCount
negativeCount
lastSeen
sourceProjectIds
```

原则：
- 单样本不升级为强偏好；
- Confidence 随一致重复上升；
- 冲突样本衰减；
- Context 必须区分画幅/人物位置/内容类型。

---

# 25. Export Learning

导出是“样本确认”。

保存：
- initialDirectorComposition
- finalComposition
- editEventLog

Diff：
- move
- resize
- variant
- motion
- color
- sfx
- timing
- delete
- add
- lock

用户可关闭：
`本项目参与学习`

---

# 26. Layout Solver

AI 只给理想坐标。

本地解决：
- canvas edge
- safe margin
- face
- subject
- subtitle
- FX collision

优先级：

```text
locked
>
manual
>
high importance AI
>
normal AI
```

用户强制重叠后允许保留 Manual Override。

---

# 27. Home ASR

ASR 与 LLM Director 分开。

推荐结构：

```text
Video
→ Audio Extract
→ Speech Model
→ SRT
→ Director
```

“只调用一次 AI”在产品语义上指：
**只调用一次大语言模型 Director**。

---

# 28. 校验系统

Director 输出后不二次请求 AI。

Local Validator：
- JSON Schema
- Registry IDs
- time range
- duration
- content contract
- motion compatibility
- SFX existence
- normalized coordinate
- concurrent FX
- missing segment

修复策略：
- clamp 数值
- 无效候选 fallback 本地排名
- warning
- 严重 schema fail 则阻止导入并保存原始响应用于调试

---

# 29. Renderer

最终 Effect 不应只存在 React DOM。

推荐：

```text
Project State
→ Effect Runtime
→ Canvas/WebGL/WebGPU Render Surface
```

React：
- UI chrome
- Timeline
- Inspector
- Library

Render Surface：
- preview
- frame-at-time
- fast export
- chroma capture
- alpha

---

# 30. Export

四种：

## A 完整视频
WebCodecs / hardware encode 优先。

## B Chroma Capture
实时绿色/蓝色/洋红背景录制，≈ 视频时长。

## C Stacked Alpha
RGB + Alpha Matte 快速中间格式。

## D Transparent MOV
RGB + Alpha dual stream
→ alphamerge
→ ProRes 4444

旧 screenshot → PNG sequence 只保留 fallback。

---

# 31. 项目状态管理

唯一 Canonical Project Store。

禁止：
- Canvas 一份数据
- Timeline 一份数据
- JSON 一份数据

全部：

```text
Project Store
```

UI interaction draft 只在拖动/Effect Lab Preview 时临时存在。

---

# 32. Undo/Redo

Transaction：
- Canvas drag = 1
- Timeline drag = 1
- Trim = 1
- Effect Lab Apply = 1
- SFX replace = 1

Scrub/Playhead：
- 不进 Undo

---

# 33. 首次加载稳定性

保留 LayoutCoordinator：

- ResizeObserver
- double requestAnimationFrame
- document.fonts.ready
- pageshow
- visibilitychange
- window resize

禁止依赖用户点击 Zoom 才完成首次 layout。

---

# 34. 推荐前端架构

候选：
- React + TypeScript
- Zustand 或等价轻量 Store
- Zod/JSON Schema
- Canvas runtime（技术调研后定）
- WebCodecs
- FFmpeg native/WASM 按部署形态
- Mediabunny 可评估
- Motion/Anime.js 仅用于编辑器预览或 Motion 逻辑参考，最终需要映射 Render Runtime

---

# 35. 推荐目录

```text
src/
├─ app/
├─ project/
├─ media/
├─ playback/
├─ subtitles/
├─ director/
│  ├─ context-builder/
│  ├─ candidate-retriever/
│  ├─ skill/
│  ├─ schema/
│  └─ validator/
├─ effects/
│  ├─ registry/
│  ├─ families/
│  └─ migration/
├─ motions/
│  ├─ registry/
│  └─ presets/
├─ sfx/
│  ├─ registry/
│  ├─ favorites/
│  └─ library/
├─ editor/
│  ├─ canvas/
│  ├─ timeline/
│  ├─ inspector/
│  └─ effect-lab/
├─ layout/
├─ preferences/
├─ render/
└─ export/
```

---

# 36. P0

## Home
- 导入视频
- ASR
- SRT
- 一次 Director
- 自动导入 Workspace

## Director
- 固定 Skill
- Structured Output
- Effect/Motion/SFX candidates
- Palette
- Layout
- Local Validator

## Edit
- Layers + SRT
- Canvas Card edit
- Inspector
- Multi-track Timeline
- independent playhead
- zoom/scrub/drag/trim

## Effect Lab
- real content preview
- variant preview
- enter/exit preview
- color preview
- sfx preview
- Apply/Cancel

## SFX
- categories
- style packs
- favorites
- recent
- AI recommended
- preview/add/replace

## Export
- Full video
- Transparent MOV

---

# 37. P1

- Chroma capture
- Stacked Alpha
- advanced motion presets
- multi-select timeline
- SFX drag-drop
- coordinate heatmap
- episodic similarity retrieval
- preference explainability
- full subtitle expand mode

---

# 38. 开发顺序

## Milestone 1
Project Store + PlaybackClock + Video + Timeline skeleton.

## Milestone 2
Effect Registry + Card renderer + Inspector + Canvas edit.

## Milestone 3
Motion Registry + Motion Preview Runtime.

## Milestone 4
SFX Registry + Favorites + SFX Track.

## Milestone 5
ASR + SRT + Context Builder.

## Milestone 6
CueCut Director Skill + Composition Schema + Validator.

## Milestone 7
Effect Lab Preview Draft + Apply transaction.

## Milestone 8
Layout Solver + face/safe-zone.

## Milestone 9
Full video + Alpha MOV render.

## Milestone 10
Preference Diff + coordinate/variant/motion/sfx learning.

---

# 39. 关键验收测试

1. 导入 3 分钟口播，Director 仅产生一次 LLM 请求。
2. 生成文件严格通过 Schema。
3. 所有 Effect/Motion/SFX IDs 都来自 Registry。
4. AI 初稿已包含进场、出场、颜色和音效。
5. 进入 Workspace 后无需 AI 才能换 Variant/Motion/SFX。
6. Effect Lab 切 10 个预览，主 Workspace 在 Apply 前完全不变。
7. SFX 收藏后在“收藏”入口出现。
8. 下一项目 Director input 中能看到 favorite hint。
9. 拖 Effect Clip 时 Playhead 不移动。
10. 拖 Playhead 时 Effect timing 不变。
11. 导出后产生 Initial/Final Diff。
12. 同一坐标偏好重复多次后 confidence 上升。
13. 导出 Transparent MOV 可在剪映上层正确叠加。
14. 首次打开 Workspace 不需要点 Zoom 修复布局。

---

# 40. 成功指标

核心产品指标：

## AI First Draft Acceptance
用户最终未删除的 AI Effect 比例。

## Manual Edit Distance
Initial → Final 修改量。

## Coordinate Error
AI preferred coordinate → final coordinate。

## Variant Retention
AI Variant 保留率。

## Motion Retention
AI Enter/Exit 保留率。

## SFX Retention
AI SFX 保留率。

长期目标：
随着项目数增加，上述保留率上升、Manual Edit Distance 下降。

---

# 41. 最终产品红线

1. **只导入视频即可开始。**
2. **一次 Director LLM 调用完成整条视频初稿。**
3. **Effect / Motion / Color / Layout / SFX 一次生成。**
4. **生成后全部可本地手改。**
5. **视频永远最底层。**
6. **允许多 FX 同时出现。**
7. **同 Family Variant 无损迁移。**
8. **Playhead 与 Effect Timing 完全独立。**
9. **Effect Lab 必须 Preview Draft → Apply。**
10. **音效库必须有收藏。**
11. **导出必须有完整视频 + Alpha MOV。**
12. **最终导出反向驱动自进化。**
