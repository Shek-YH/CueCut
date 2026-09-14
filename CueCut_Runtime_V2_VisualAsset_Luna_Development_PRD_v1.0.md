# CueCut Runtime V2 + Visual Asset Layer
## Codex Luna 开发 PRD v1.0

> 用途：直接交给 Codex 执行开发。  
> 执行模型假设：GPT-5.6 Luna / 同级偏快模型。  
> 编写原则：减少推断空间、缩小单次改动范围、明确 Source of Truth、逐 Work Item 验收。  
> 当前审查基线：`main` 曾审查到 `328122a737324be16c71d71dfbf17aadc77523c2`。如果仓库已经前进，必须以当前最新代码为准做增量审计，**不得 reset、不得覆盖用户新改动**。

---

# 0. 本 PRD 的使用方式

本 PRD 不是“设计建议”，而是本轮 CueCut Runtime Integration Repair + Visual Asset Layer 的开发规格。

Codex 必须：

1. 完整读取本 PRD；
2. 先做只读差异审计；
3. 识别当前代码与本文审查基线之间的变化；
4. 按本文 Work Item 顺序执行；
5. 一次只进入一个 Work Item；
6. 每个 Work Item 必须满足自己的测试和体验验收后才能进入下一项；
7. 不得以“Build PASS”代替产品验收；
8. 不得为了方便重写整个项目；
9. 不得擅自更换 UI 结构；
10. 不得破坏 CueCut 的“一次 Packaging Director LLM 调用”核心契约。

如果当前代码已经实现某项：
- 不重复重写；
- 先验证验收条件；
- 验收通过则记录为 `ALREADY_SATISFIED`；
- 验收不通过只修缺口。

---

# 1. 产品背景

CueCut 的核心不是通用视频剪辑，而是：

```text
Import video
→ SRT / media analysis
→ AI Visual Packaging Director
→ local deterministic resolve / layout / motion compile
→ automatically enter Workspace
→ human fine-tune
→ export
```

产品核心体验：

> 用户只点击一次「生成 AI 包装」，AI 理解整段视频并给出完整、可编辑、可解释的视觉包装初稿；用户随后只做本地微调，不需要反复调用 LLM。

本轮新增第二个重要能力：

> 对于原生文字、数字、箭头、简单图表无法很好表达的视觉概念，Director 可以声明 `VisualAssetIntent`。CueCut 在 Director 之后以本地确定性流程把多个视觉组件打成透明 PNG Atlas，调用图像生成器生成，再自动切片、绑定到 Workspace，并交由 CueCut Motion Runtime 驱动。

---

# 2. 当前真实问题与根因

本章节来自对当前 CueCut 代码的实际审查。Codex 不得跳过这些根因，只做表面 UI 修补。

## 2.1 不同 Pack Effect 在 Workspace 看起来高度相同

当前现象：

- 用户在 Effect Library 选择不同动效；
- Preview/Workspace 中实际差异非常小；
- 多个 effect 最终像同一种通用卡片。

根因：

1. Pack catalog / registry 有很多 effect metadata；
2. 但 Workspace 没有真正按每个 Pack Effect 调用独立 renderer；
3. 多个 effect 被压缩成少数 `visualKind`：
   - metric
   - chart
   - list
   - quote
   - highlight
   - badge
   - text
4. Effect Lab Preview 同样主要渲染 generic preview；
5. Export renderer 也有自己的 generic Canvas 绘制逻辑。

结果：

```text
Effect A
Effect B
Effect C
→ different metadata
→ same generic rendering family
→ user sees almost the same visual
```

### 本轮必须解决

建立统一：

```text
EffectTemplateRegistry
+
Canonical RuntimeItem
+
Shared Render Spec / Renderer Registry
```

Workspace / Effect Lab / Export 必须消费同一个 canonical effect rendering contract。

---

## 2.2 Motion Compiler 已经很丰富，但最终被降级

当前已有 Motion Intent 包含：

```text
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
scale_pulse
shake
glow
color_shift
underline_sweep
highlight_sweep
counter
bar_fill
scribble
...
```

但是 apply 阶段又把它们压成：

```text
fade
soft-slide
pop
fly-left
scale-fade-out
```

所以 AI 即使选对了 motion，最终视觉也没有真正执行。

### 本轮必须解决

最终 Project/Runtime 不能只保存粗粒度旧 motion ID。

必须把：

```text
Packaging MotionIntent
→ compileMotionIntent()
→ CompiledMotion
→ Canonical RuntimeItem.motion
→ Workspace
→ Export
```

完整贯通。

---

## 2.3 translate 已计算，但 Workspace / Export 丢失

当前 scene evaluation 已计算：

```text
translateX
translateY
```

但 Workspace transform 主要只有：

```text
scale()
rotate()
```

没有正确应用 translate。

Export Canvas 同样没有完整叠加 runtime translate。

直接后果：

- slide_left/right/top/bottom 看不到真实位移；
- fly / bounce 等移动型 motion 失真；
- enter / exit 方向没有真实区别。

### P0 验收

四个方向 slide 必须肉眼明显不同。

---

## 2.4 “所有包装都在同一个位置”部分是当前规则设计造成

当前 resolver/layout：

- 多数 overlay 使用相同默认尺寸；
- sequential overlay 甚至存在“可以复用同一主轴位置”的测试规则；
- 真正的 subject / face / subtitle spatial data 在主流程中没有接入；
- 所以同一个 zone 会反复胜出。

### 本轮不是“随机位置”

目标是：

```text
语义匹配
+ 主体避让
+ 字幕避让
+ 边缘安全
+ 模板尺寸
+ 视觉平衡
+ 最近使用位置惩罚
```

综合评分。

不得简单 random。

---

## 2.5 AI 重点提取问题不能只靠继续加 Prompt

当前 Director Prompt 已经有：

- chapter
- section
- visualValue
- visualUnit
- templateQuery
- sourceSubtitleIds
- selectionReason
- 禁止整段抄 SRT
- 低价值内容过滤

但本地缺少“语义证据校验”。

### 本轮目标

Director 仍然只调用一次，但输出更可验证：

```text
KeyClaim
Evidence
VisualWorthiness
VisualUnit
TemplateQuery
VisualAssetIntent
```

本地 validator 验证：

- sourceSubtitleIds 是否存在；
- evidenceText 是否真的来自对应字幕；
- 数字/比例是否有来源；
- quote 是否有来源；
- 是否重复相邻 visual unit；
- 是否退化成“包装重点”；
- visualValue 是否达阈值。

---

## 2.6 Effect Lab 的 Draft 机制本身正确，但体验不完整

当前：

```text
clone draft
→ Effect Lab local preview
→ Apply
→ write Project
```

这条 undo/transaction 思路正确。

问题是：

- Lab preview 不是完整真实 renderer；
- 不同 effect 看起来仍相近；
- Workspace 不显示同一份真实 runtime；
- enter/exit 无法和真实 effect 一起预览。

### 本轮目标

保留 Draft 事务语义，但 Preview 使用真实 Shared Renderer。

---

## 2.7 Video import 存在确定性风险

历史代码审查发现：

- Playback clock 曾以非 0 时间初始化；
- import 新视频时没有始终 pause + reset 0；
- metadata ready 与浏览器 `<video>` 真正可播放混在一起；
- ffprobe 成功不代表浏览器 codec 一定支持；
- 缺少完整 `loadeddata / canplay / error / stalled / waiting` 状态。

### 本轮目标

拆开：

```text
Probe State
Browser Playback State
```

用户看到 `Video Ready` 必须来自浏览器真正可以显示帧，而不是只来自 FFprobe。

---

# 3. 不可改变的核心产品契约

## 3.1 一次 Packaging Director LLM

一次「生成 AI 包装」：

```text
必要时 ASR
→ Packaging Director LLM exactly 1 call
→ local deterministic processing
→ optional image generation
→ Workspace
```

禁止：

```text
Director call #1
→ AI 修 JSON
→ AI 重新选模板
→ AI 再分析风格
→ AI 再规划资产
```

必须保留 one-call guard。

注意：

- ASR 不算 Packaging Director LLM；
- 图像生成器不算 Packaging Director LLM；
- 图像生成器不得重新读取整段 SRT 自己做语义规划；
- Atlas retry 可以重试图像生成失败，但不能重新调用 Packaging Director。

---

## 3.2 原生 Renderer 优先

以下内容默认禁止生图：

```text
plain text
kinetic text
number
percentage
counter
step number
arrow
line
box
simple bar chart
simple progress
underline
highlight
basic UI card
```

优先生图：

```text
character
person-like illustration
robot
object
product-like object
complex conceptual metaphor
3D object
clay object
editorial illustration
mini-scene
special decorative object
```

---

## 3.3 PNG 只负责“长什么样”

禁止把：

- 最终位置；
- 时间轴；
- motion；
- entrance；
- exit；
- camera movement

烘焙在 Atlas 中。

结构必须是：

```text
Visual Asset
+ Layout
+ Motion
+ Timeline
+ SFX
+ zIndex
```

---

## 3.4 UI 不得擅自重设计

继续沿用当前 CueCut 最新 UI Prototype / 当前正式 UI 作为视觉与布局 Source of Truth。

允许：
- 修 bug；
- 增加必要状态；
- 增加 Visual Asset 设置区；
- 增加错误/加载/Provider 状态。

禁止：
- 改一级导航；
- 重做 Workspace 信息架构；
- 把 Effect Lab 改成完全不同流程；
- 因“更现代”擅自改变现有布局。

---

# 4. 本轮目标

## P0

1. Video Preview Reliability；
2. Canonical RuntimeItem；
3. EffectTemplateRegistry / TransitionMotionRegistry 分离；
4. Shared Effect Renderer；
5. CompiledMotion end-to-end；
6. translate/enter/exit 真正渲染；
7. Effect Lab 真实 Draft Preview；
8. Visual Asset Schema + Planner；
9. Atlas Planner + Prompt + Splitter + Manifest + QA；
10. Visual Asset Provider/Secret Settings；
11. Visual Asset 自动绑定 Workspace；
12. Layout diversity + spatial wiring；
13. KeyClaim / Evidence grounding validator；
14. Packaging Validator 接入主链路；
15. Visual Contract / E2E / CI 基线。

## P1

1. Reference image style-only conditioning；
2. Asset reuse cache；
3. subject/face 更完整空间分析；
4. image quality scoring/retry；
5. 更完整 semantic effect catalog；
6. 视觉资产 Inspector 高级编辑；
7. 长视频资产预算策略。

---

# 5. 非目标

本轮不做：

- 通用 NLE 重构；
- 云端账号系统；
- 协作编辑；
- 多用户；
- 插件市场；
- 重新设计整个 CueCut；
- 复制 Remotion 源码；
- 复制任何竞品 Effect/Prompt/Schema/UI；
- 再造第二个 AI Director；
- 让图片生成器取代 Effect Renderer；
- 用大量 PNG 替代原生 vector/text motion。

---

# 6. Target Architecture

```text
Video
  ↓
ASR / Transcript
  ↓
Packaging Director (ONE LLM CALL)
  ↓
PackagingPlan
  ├─ chapters
  ├─ sections
  ├─ KeyClaims / Evidence
  ├─ visualUnits
  ├─ templateQuery
  ├─ placementIntent
  ├─ motionIntent
  └─ content.assetRequest?
         ↓
Local deterministic pipeline
  ├─ Semantic Grounding Validator
  ├─ Canonical Effect Catalog Resolver
  ├─ Visual Asset Planner
  │    ├─ filter native-renderable
  │    ├─ dedupe
  │    ├─ budget
  │    └─ atlas plan
  ├─ Layout Solver
  ├─ Motion Compiler
  ├─ Packaging Validator
  └─ Canonical Runtime Compiler
         ↓
Canonical RuntimeItem[]
         ↓
Shared Runtime
  ├─ Workspace Renderer
  ├─ Effect Lab Renderer
  └─ Export Renderer
```

---

# 7. Canonical RuntimeItem

建议新建：

```text
src/runtime/
  schema.ts
  compiler.ts
  evaluate.ts
  rendererRegistry.ts
  types.ts
```

建议类型：

```ts
type CanonicalRuntimeItem = {
  runtimeId: string
  sourceEffectId: string
  segmentId: string

  template: {
    effectTemplateId: string
    rendererId: string
    familyId: string
    variantId: string
  }

  content: Record<string, unknown>

  asset?: {
    assetId: string
    source: 'generated' | 'imported' | 'builtin'
    projectAssetRef: string
    trimmedRef?: string
  }

  layout: {
    nx: number
    ny: number
    nw: number
    nh: number
    anchor: string
    zone?: string
    zIndex: number
  }

  time: {
    startSec: number
    endSec: number
  }

  motion: CompiledMotion

  appearance: {
    accent: string
    theme: 'dark' | 'light'
    opacity?: number
  }

  sfx?: {
    sfxId: string
    offsetSec: number
    gain: number
  }

  provenance: {
    sourceSubtitleIds: string[]
    keyClaim?: string
    evidenceText?: string
    selectionReason?: string
  }
}
```

## 7.1 规则

- Project Domain 可以继续保存可编辑配置；
- RuntimeItem 是 renderer 输入；
- Workspace / Lab / Export 不得各自重新解释 Effect；
- 只允许 runtime compiler 把 Project → Runtime；
- 不允许 CanvasStage 自己重新猜模板视觉。

---

# 8. Registry 拆分

当前 motion/effect 概念混合，需要拆成四个 Registry：

```text
EffectTemplateRegistry
TransitionMotionRegistry
ContentAnimationRegistry
SfxRegistry
```

## 8.1 EffectTemplateRegistry

负责：

- visual structure；
- rendererId；
- content slots；
- semantic roles；
- visual intents；
- tags；
- default dimensions；
- min/max dimensions；
- anchor preferences；
- supported aspect ratios；
- native vs visual-asset capable；
- accessibility / text capacity。

示例：

```ts
{
  effectTemplateId: 'pack:stat-orbit-card',
  rendererId: 'stat-orbit-card',
  semanticRoles: ['evidence'],
  visualIntents: ['show-number', 'show-growth'],
  contentSlots: ['value', 'label'],
  layout: {
    defaultSize: [0.30, 0.16],
    minSize: [0.22, 0.12],
    maxSize: [0.44, 0.28],
    preferredZones: ['upper-right', 'lower-right']
  }
}
```

## 8.2 TransitionMotionRegistry

只放：

```text
enter
exit
transition
```

不得出现 Pack Effect ID。

## 8.3 ContentAnimationRegistry

只放：

```text
counter
bar_fill
word_reveal
typewriter
underline_sweep
highlight_sweep
...
```

---

# 9. Shared Renderer

目标：

```text
effect renderer definition
        ↓
RenderSpec
   ├─ DOM/React preview
   └─ Canvas/export primitives
```

如果某些 effect 暂时无法完全共享 DOM 和 Canvas 实现，仍必须共享：

- template semantics；
- layout；
- typography；
- primitives；
- motion state；
- visual parameters。

不得继续维护三套互相无关的“看起来差不多”实现。

## 9.1 Renderer Contract

```ts
interface EffectRendererDefinition {
  rendererId: string
  validateContent(content): Result
  createRenderSpec(input): EffectRenderSpec
}
```

`EffectRenderSpec` 建议由有限 primitives 组成：

```text
group
panel
text
number
icon
line
bar
ring
image
badge
list
chart
mask
```

这样：

- Workspace React renderer；
- Lab React renderer；
- Export Canvas renderer；

可以消费同一 spec。

---

# 10. Motion Runtime V2

## 10.1 Motion 编译链

必须唯一：

```text
motionIntent
→ compileMotionIntent
→ CompiledMotion
→ evaluateMotion(time)
→ MotionFrame
→ renderer
```

禁止 apply 阶段重新把 motion ID 降级为旧 `fade/pop`。

## 10.2 MotionFrame 至少包含

```ts
{
  opacity: number
  translateX: number
  translateY: number
  scaleX: number
  scaleY: number
  rotation: number
  blur: number
  clipProgress?: number
  emphasisProgress?: number
}
```

## 10.3 Transform 顺序

Workspace 和 Export 必须一致：

```text
translate(layout origin)
→ translate(runtime motion)
→ rotate
→ scale
```

统一 transform origin。

## 10.4 P0 Motion 验收矩阵

必须自动/人工验证：

```text
fade_in
slide_left
slide_right
slide_top
slide_bottom
scale_grow
scale_punch
wipe_left
wipe_right
fade_out
slide_out_left
slide_out_right
slide_out_bottom
scale_out
```

特别要求：

- `slide_left` 从左进入；
- `slide_right` 从右进入；
- `slide_top` 从上进入；
- `slide_bottom` 从下进入；
- `slide_out_right` 不能变成 fly-left；
- Workspace 与 Export 同时间点 transform 一致。

---

# 11. Effect Lab V2

保留：

```text
Project
→ clone EffectDraft
→ edit draft
→ Cancel / Apply
```

但是 Preview 改成：

```text
EffectDraft
→ Runtime Compiler
→ Shared Renderer
```

## 11.1 用户体验

选择不同 Effect Variant：

- 中央 Preview 立即变化；
- 不写主 Project；
- enter + content + exit 可以连续预览；
- “只看入场”；
- “只看出场”；
- “重播”；
- 调色立即 preview；
- Motion 改动立即 preview；
- SFX 选择本地 preview；
- Apply 后 Workspace 显示必须与 Lab 最终 Preview 一致；
- Cancel 后 Workspace 完全不变。

## 11.2 测试不能只检查元素 visible

必须增加：

```text
Effect A render signature != Effect B render signature
```

至少选择 5 个结构不同模板进行测试。

---

# 12. Visual Asset Layer

建议新增：

```text
src/visual-assets/
  schema.ts
  styles.ts
  planner.ts
  nativeEligibility.ts
  dedupe.ts
  atlasPlanner.ts
  atlasPrompt.ts
  splitter.ts
  manifest.ts
  qa.ts
  cache.ts
  index.ts
```

服务器：

```text
src/server/
  visualAssetRoute.ts
  visualAssetProvider.ts
```

---

# 13. VisualAssetRequest Schema

```ts
type VisualAssetRequest = {
  needed: boolean
  assetId: string
  displayName: string
  kind:
    | 'character'
    | 'object'
    | 'product-object'
    | 'concept-metaphor'
    | '3d-object'
    | 'illustration'
    | 'mini-scene'
    | 'decorative-object'

  description: string
  semanticTags: string[]
  importance: 'hero' | 'normal' | 'small'
}
```

## 13.1 assetId

Regex：

```text
^[a-z][a-z0-9_]*$
```

必须：

- stable；
- snake_case；
- 不含时间戳；
- 不含随机 UUID；
- 相同语义优先复用。

---

# 14. Packaging Director 增量输出

仍然只调用一次 Director。

对于 VisualUnit，可选：

```json
{
  "content": {
    "text": "AI 助手开始自动执行",
    "assetRequest": {
      "needed": true,
      "assetId": "ai_robot_assistant",
      "displayName": "AI Robot Assistant",
      "kind": "character",
      "description": "friendly futuristic AI robot assistant, isolated full body",
      "semanticTags": ["ai", "assistant", "robot"],
      "importance": "hero"
    }
  }
}
```

## 14.1 Prompt 硬规则

加入：

> 只有无法由 CueCut 原生文字/数字/线条/箭头/简单图表/UI Renderer 良好表达，并且确实能提升理解或视觉表现时，才能申请 raster asset。

禁止：

- 为字幕全文生图；
- 为单个数字生图；
- 为箭头生图；
- 为简单 icon 生图；
- 为简单 progress 生图；
- 为基础卡片背景生图。

---

# 15. KeyClaim / Evidence Grounding

为了改善重点提取，每个有视觉价值的 visual unit 应至少可追溯：

```ts
{
  keyClaim: string
  evidenceText: string
  sourceSubtitleIds: string[]
  importance: number
  semanticRole: string
  recommendedVisualForm: string
  selectionReason: string
}
```

可以把 `keyClaim/evidenceText` 放进 visualUnit 或 provenance metadata，具体 schema 以最小迁移成本决定，但必须有 canonical 存储位置。

## 15.1 Local Grounding Validator

不再调 AI。

检查：

1. `sourceSubtitleIds` 全存在；
2. evidenceText 与来源字幕 normalized text 有实质重叠；
3. 数字/百分比必须在来源中出现；
4. quote 必须有来源；
5. `keyClaim` 不能等于：
   - 包装重点
   - highlight
   - key point
   - 重点
6. 相邻 units 的 normalized claim similarity 过高时警告/去重；
7. low visualValue 丢弃；
8. 不允许空 visual unit。

验证失败分级：

```text
FATAL
→ 不进入 Workspace

WARN
→ 可以进入，但记录 diagnostics
```

不得 AI retry。

---

# 16. Visual Asset Planner

输入：

```text
PackagingPlan
```

输出：

```text
VisualAssetCandidate[]
```

规则：

1. 扫描 visualUnits + executable timeline；
2. 读取 `content.assetRequest`；
3. `needed !== true` 忽略；
4. 继承 `sourceSubtitleIds`；
5. native-eligible 内容拒绝进入 image pipeline；
6. 相同 assetId 合并；
7. 相同 semantic fingerprint 合并；
8. hero > normal > small；
9. 默认单视频预算 `12`；
10. 用户可配置；
11. 超预算时保留最高重要度与覆盖面；
12. 不得因为“多样性”删掉关键语义资产。

## 16.1 semantic fingerprint

建议：

```text
normalize(kind)
+ normalize(description)
+ sorted semanticTags
+ styleId
```

不需要 embedding 服务。

---

# 17. 内置 Styles

保留六套：

```text
tech_neon_3d
clean_flat
glass_ui
clay_3d
editorial_paper
minimal_line
```

每个 style 是本地结构：

```ts
{
  id
  displayName
  promptPrefix
  material
  lighting
  palette
  outline
  depth
  prohibitedTraits
}
```

不得为了 style 再调 LLM。

---

# 18. Atlas Planner

规则冻结：

```text
maxCellsPerAtlas = 25
maxGrid = 5
grid = ceil(sqrt(assetCountForPage))
```

示例：

```text
1 -> 1x1
2-4 -> 2x2
5-9 -> 3x3
10-16 -> 4x4
17-25 -> 5x5
26 -> 5x5 + 1x1
```

其中 18 个资产：

```text
5x5
18 assigned cells
7 unused transparent cells
```

Slot 顺序：

```text
row-major
```

必须在生图前冻结 mapping：

```text
slot 0 = asset A
slot 1 = asset B
...
```

切图阶段禁止 OCR/视觉识别重新判断哪个对象在哪格。

---

# 19. Atlas Prompt

必须包含：

```text
strict transparent asset atlas
exact N x N equal square cells
one independent subject per assigned cell
transparent background with real alpha
at least 15% transparent gutter on all four sides of every subject
no visible grid lines
no text
no numbers
no watermark
no logo
no frame labels
no cross-cell shadows
no cross-cell glow
no cross-cell particles
no smoke/trails crossing cell boundaries
consistent rendering language across all assigned cells
unused cells fully transparent
```

Reference Image 模式额外：

```text
reference image is style-only
do not copy identity
do not copy logo
do not copy text
do not copy brand
do not copy exact composition
```

---

# 20. Atlas Splitter

必须确定性执行。

流程：

```text
decode image
→ if width != height: center-crop to square
→ crop dimension to divisible by grid
→ exact grid slicing
→ assigned cells only
→ alpha bbox detection
→ padded trim
→ square PNG
→ trimmed PNG
→ QA
```

输出两份：

```text
asset_id.square.png
asset_id.trimmed.png
```

## 20.1 QA Fail

以下不得标成功：

- assigned cell alpha 全空；
- bbox 小于合理阈值；
- subject touching cell edge；
- decode fail；
- image dimensions invalid；
- manifest mapping 缺失。

---

# 21. Visual Asset Manifest

建议：

```json
{
  "schema": "cuecut.visual-assets/1",
  "styleId": "tech_neon_3d",
  "atlases": [],
  "assets": [
    {
      "assetId": "ai_robot_assistant",
      "displayName": "AI Robot Assistant",
      "kind": "character",
      "description": "...",
      "semanticTags": ["ai", "assistant"],
      "importance": "hero",
      "sourceSubtitleIds": ["s12", "s13"],
      "sourceAtlasId": "atlas-1",
      "row": 0,
      "col": 0,
      "squareRef": "...",
      "trimmedRef": "...",
      "contentBBox": {},
      "qa": {
        "passed": true,
        "warnings": []
      }
    }
  ]
}
```

---

# 22. Project Asset Storage

不得长期依赖浏览器 Object URL 作为项目真实资产引用。

需要建立 project asset abstraction：

```text
ProjectAssetRef
```

至少支持：

```text
generated visual asset
imported image
future built-in asset
```

如果当前 CueCut 仍是 Web-first demo，可以先采用：

```text
runtime Blob/ObjectURL
+
serializable metadata reference
```

但必须：
- 明确生命周期；
- revoke；
- 不能把临时 URL 当成长期 project persistence contract。

---

# 23. Visual Asset Provider

Settings 增加：

```text
Visual Asset Generation

Provider:
- Disabled
- OpenAI-compatible
- Custom

Endpoint
Model
API Key
Default Style
Max Assets Per Video
Max Assets Per Atlas = 25
Reference Image Conditioning:
- Auto
- On
- Off
```

## 23.1 Secret

API Key：

- 只进入 server secret store；
- 前端只返回 configured bool；
- 不写 Project；
- 不写 `.ai-ledger`；
- 不写日志；
- 不写 manifest；
- 不进入错误消息。

---

# 24. Image Generation Failure Strategy

图片失败不能让整个 AI Packaging 失败。

状态：

```text
native packaging = success
visual asset job = pending / failed / retryable
```

Workspace 可先显示：

```text
asset placeholder
```

但必须明确是 placeholder，不得悄悄换成不相关图片。

允许：

```text
retry same Atlas image generation
```

禁止：

```text
call Packaging Director again
call another LLM to redesign prompt
```

---

# 25. Reference Image Mode

P1。

优先方案：

```text
reference image
→ directly passed to image provider as style-only conditioning
```

不得单独调用 LLM 做 style analysis。

如果未来 Packaging Director 支持 multimodal，可以：

```text
SRT + reference image
→ same one Director call
```

仍然保持 one-call。

---

# 26. Layout Solver V2

## 26.1 输入

真实空间上下文：

```text
subjectRects
faceRects
subtitleRects
safeZones
edgeInsets
recentPlacementHistory
template dimensions
preferredZones
```

当前如果主体/脸检测暂时不可用：
- 允许空数组；
- 但接口必须真实贯通；
- 不能在 UI/日志声称“已避让人脸”。

## 26.2 Score

建议：

```text
score =
  semanticZoneScore
+ templateFitScore
+ visualBalanceScore
+ continuityScore
- subjectCollisionPenalty
- faceCollisionPenalty
- subtitleCollisionPenalty
- edgePenalty
- recentZonePenalty
- sameZoneStreakPenalty
```

不得 random 作为主逻辑。

## 26.3 最近位置惩罚

维护最近 N 个 placement。

目标：

- 允许连续语义需要时复用；
- 但 10 个顺序 overlay 不应全部机械固定同一个 zone。

P0 人工验收建议：

```text
10 个 sequential effects
→ 在没有强语义限制的情况下至少出现 3 个 distinct zones
```

这不是硬编码 random quota，而是测试最终体验。

---

# 27. 模板尺寸

禁止所有 effect 固定：

```text
0.36 x 0.12
```

每个模板 catalog 提供：

```text
default width/height
min width/height
max width/height
autoHeight?
aspect behavior
preferred zones
```

例如：

```text
quote card ≠ metric orb ≠ checklist ≠ badge
```

---

# 28. Spatial Analysis Wiring

当前主链路不能继续永远：

```text
subjects: []
faces: []
safeZones: []
```

P0 最低要求：

- subtitle rect 从真实 subtitle settings / canvas 计算；
- edgeInsets 从用户配置/plan 传入 resolver；
- subject/face interface 贯通；
- 如果当前检测器没有实现，状态必须为 unavailable。

P1：
- 抽 1-2 帧或关键帧识别人脸/主体；
- 生成 normalized rect；
- 应用用户可调 padding，默认 10%。

---

# 29. Video Preview Reliability

## 29.1 Import Reset

导入新视频立即：

```text
pause
set clock time = 0
replace source
reset browser playback state
```

metadata 更新后再次 clamp，但不要跳到旧时间。

## 29.2 状态拆分

```ts
probeState:
  idle | probing | ready | error

browserPlaybackState:
  idle
  | loading-metadata
  | metadata-ready
  | loading-data
  | can-play
  | waiting
  | stalled
  | error
```

`Generate AI Packaging` 可以要求 probe ready。

但 UI 的“视频预览可用”必须要求：

```text
browserPlaybackState == can-play
or readyState sufficient
```

## 29.3 Video Events

至少处理：

```text
loadedmetadata
loadeddata
canplay
timeupdate
waiting
stalled
error
```

## 29.4 Browser Codec Unsupported

FFprobe success + `<video>` fail：

显示可行动错误：

```text
浏览器无法解码该视频编码
```

P1 可增加：

```text
H.264/AAC preview proxy
```

不得只显示空白 Canvas。

---

# 30. Packaging Validator 主链路

已有 validator 必须接入真实 generate flow。

推荐：

```text
plan
→ grounding validation
→ resolve
→ compile runtime
→ packaging validator
→ apply
```

如果可以本地 repair：

- clamp；
- collision alternate zone；
- safe size；
- invalid optional SFX removal；

可 deterministic repair。

禁止 AI repair。

---

# 31. Canonical Effect Catalog

AI 请求和 Resolver 必须使用同一个 catalog source。

禁止：

```text
AI sees effectRegistry
Resolver uses another unrelated packagingEffectCatalog
```

建议：

```text
CanonicalPackagingCatalog
```

然后：

```text
Director request view = derive(CanonicalPackagingCatalog)
Resolver = CanonicalPackagingCatalog
Lab = CanonicalPackagingCatalog
```

AI 仍然不能发明具体 effectId，优先输出 templateQuery。

---

# 32. Effect Diversity

禁止全局 hard exclude 所有已用 effect。

改成 soft score：

```text
semantic match
+ content slot compatibility
+ template fit
+ role match
- recent use penalty
```

允许最佳 effect 在 cooldown 后重复。

原则：

> 语义正确 > 机械不重复。

---

# 33. Workspace

Visual Asset 生成成功后：

- 自动进入 Workspace；
- 不需要用户再点一次 Apply；
- 可选择；
- 可移动；
- 可缩放；
- 可调 opacity；
- 可替换；
- 显示 assetId；
- 显示来源字幕；
- 参与同一 Timeline；
- 使用 CompiledMotion；
- 避让规则一致；
- Export 一致。

Effect 与 Image Asset 可以共享 selection/inspector 框架，但不能强行假装二者 content schema 一样。

---

# 34. Export

Workspace 与 Export 至少共享：

```text
Canonical RuntimeItem
EffectRenderSpec
MotionFrame
Layout
Typography decisions
Visual Asset refs
```

Visual parity 测试必须检测：
- position；
- translate；
- scale；
- opacity；
- effect structural differences；
- image asset placement。

---

# 35. API

建议新增：

## `POST /api/generate-visual-assets`

输入：

```json
{
  "styleId": "tech_neon_3d",
  "atlasPlans": [],
  "referenceImage": null
}
```

服务器职责：

- 从 secret store 获取 provider key；
- 调用配置 provider；
- 返回图像 bytes / result；
- 不重新解释 SRT。

如果 Atlas 图片较大，允许逐 page 请求，而不是一次超大 JSON。

## Settings

扩展现有 `/api/settings`：

GET：
```json
{
  "bailianApiKeyConfigured": true,
  "visualAssetApiKeyConfigured": false,
  "visualAssetProvider": "disabled"
}
```

POST 更新时：
- secret 与非 secret 配置分离；
- 不返回 secret 值。

---

# 36. 数据迁移

如果扩展 Project schema：

- 使用 schema version；
- 旧项目必须可以 load；
- 新字段 default；
- 不允许因为没有 asset 字段导致旧 project 解析失败。

新增 runtime schema 不一定要求马上写入 Project persistence；优先保持 runtime 派生。

---

# 37. Error Model

统一错误至少包含：

```text
code
userMessage
technicalMessage
retryable
stage
```

stage：

```text
video-probe
video-playback
transcription
director
grounding
resolver
layout
motion-compile
visual-asset-plan
visual-asset-generation
visual-asset-split
runtime-compile
render
export
```

UI 不显示 API key、原始 provider payload、敏感路径。

---

# 38. Diagnostics

AI Packaging 完成后建议记录：

```text
Director aiCallCount
repaired locally?
selected visual units
rejected low-value units
grounding warnings
resolved effect template
selection score summary
placement score summary
asset requested?
asset reused?
atlas page
motion compiled?
validator warnings
```

这对于以后调 AI 效果非常重要。

---

# 39. Testing Strategy

## 39.1 Unit

至少：

```text
motion compiler
motion evaluator
runtime compiler
effect renderer definitions
visual asset native eligibility
asset dedupe
atlas grid planner
slot mapping
alpha bbox trim
manifest
grounding validator
layout scoring
video state reducer
```

## 39.2 Integration

```text
PackagingPlan
→ Resolver
→ Runtime Compiler
→ Renderer

PackagingPlan + assetRequest
→ Asset Planner
→ Atlas Plan
→ synthetic atlas
→ Splitter
→ Manifest
→ Runtime asset binding
```

图像 unit/integration 使用 synthetic atlas，不消耗生图额度。

## 39.3 Visual Contract Tests

必须新增，不允许只比较内部对象。

### VC-01 Different Effect Structures

选 5 个结构不同 Pack Effects：

```text
render signature must differ
```

### VC-02 Motion Translation

在 t0 / t25 / t50 / t100：

```text
slide_left x changes
slide_right x changes opposite direction
```

### VC-03 Workspace / Export parity

固定 Project + fixed time：

比较：
- box；
- transform；
- opacity；
- content signature。

### VC-04 Atlas

synthetic transparent 4x4：
- exact 16 cells；
- deterministic mapping；
- trim bbox expected；
- unused cell skipped。

---

# 40. Real E2E

至少准备：

```text
5s MP4
30s MP4
vertical 9:16 MP4
horizontal 16:9 MP4
one unsupported-browser-codec sample if legally available
one SRT with numbers
one SRT with quote
one SRT with ordered process
one SRT with raster-worthy robot/object concept
```

真实验收：

```text
import
→ first frame visible at 0s
→ generate packaging
→ exactly 1 Director LLM call
→ native effects
→ optional atlas image generation
→ Workspace
→ Lab edit
→ Apply
→ export
```

---

# 41. CI

当前仓库如果仍无 GitHub Actions，增加基础 CI：

```text
typecheck
unit tests
build
browser E2E
visual contract tests
```

图像生成真实 API 不进入普通 CI。

CI 使用 synthetic fixture。

---

# 42. Security / Privacy

禁止：

- 把 API key 输出到 console；
- 存入 Project；
- 存入 manifest；
- 存入 .ai-ledger；
- 把用户视频上传到未批准第三方；
- reference image 未告知即上传；
- 自动启用收费 Provider。

外部调用必须有明确 provider setting。

---

# 43. IP / License

CueCut 商业化。

禁止读取/复制竞品：

- source code；
- prompt；
- schema；
- UI implementation；
- fixture；
- copyrighted asset。

Remotion 等项目最多用于理解通用 motion design/engineering idea；本项目代码必须独立实现。

新增依赖记录：
- name；
- version；
- license；
- commercial allowed；
- redistribution；
- NOTICE；
- binary/font/media implications。

---

# 44. Performance Targets

P0 不是追求极限 benchmark，但必须避免明显退化。

目标：

- Workspace 拖拽不因 Visual Asset metadata 明显卡顿；
- paused scrub 能稳定显示；
- 同屏若干 effect 不重复创建昂贵对象；
- Object URL 生命周期正确；
- atlas split 不阻塞 UI：大图优先 worker/off-main-thread，如果当前结构不允许则记录 P1；
- Runtime compile 是 deterministic local operation。

---

# 45. Work Item 执行规则（专为 Luna）

Luna 不允许一次执行整份 PRD。

每个 Work Item 必须：

1. 读取本项依赖；
2. 只读检查相关文件；
3. 写 5-15 行 Implementation Note；
4. 先补失败测试；
5. 最小实现；
6. 跑本项测试；
7. 跑回归命令；
8. 检查 diff；
9. 写 Evidence；
10. 完成才进入下一项。

如果一个 Work Item 实际触及：
- 超过 2 个主要子系统，或
- 超过约 10-12 个 production files，

先拆成子项，不要硬做。

禁止“大重构顺便全部修”。

---

# 46. Work Items

---

## WI-00｜Baseline / Source of Truth / Safety Snapshot

### Goal
建立当前真实基线，确认仓库是否已经前进。

### Read
- package.json
- current app entry
- project schema/store
- packaging AI
- resolver/layout
- motion compiler/timeline
- CanvasStage
- export renderer
- tests

### Required output
`docs/runtime-v2/00_BASELINE.md`

必须写：
- current HEAD；
- dirty files；
- existing tests；
- relevant code map；
- 本 PRD 中哪些问题已被后续提交修复；
- 哪些仍存在。

### Forbidden
- reset
- clean
- stash user changes
- rewrite code

### Acceptance
baseline commands 能运行并记录 exit code。

---

## WI-01｜Video Preview Reliability

### Goal
新导入视频 0s 首帧稳定可见，错误状态可诊断。

### Primary files
优先限定：
- playback clock
- App video import
- CanvasStage video element
- media tests

### Implement
- initial currentTime 0；
- import pause + setTime(0)；
- probe/browser state split；
- video events；
- actionable error；
- no fake ready.

### Tests
- import resets old current time；
- loadedmetadata does not jump to stale time；
- loadeddata/canplay sets playback ready；
- error state surfaced；
- 5s fixture starts at 0.

### Acceptance
5s/30s 视频导入后，无需点击 timeline 即能看到首帧。

---

## WI-02｜Registry Concept Split

### Goal
Effect Template 与 Transition Motion 不再混在一个 registry 语义里。

### Implement
引入：
- EffectTemplateRegistry
- TransitionMotionRegistry
- ContentAnimationRegistry

优先兼容旧 API adapter，避免一次改全项目。

### Acceptance
Pack Effect ID 不再被 runtime 当 transition motion hash 成 fade/slide/scale。

---

## WI-03｜Canonical RuntimeItem

### Goal
建立唯一 Project → Runtime 编译层。

### Implement
- runtime schema/types；
- compiler；
- provenance；
- no rendering yet.

### Tests
fixed project → deterministic runtime item。

### Acceptance
Workspace/Export 后续可以只消费 runtime，而不读各自私有解释逻辑。

---

## WI-04｜CompiledMotion End-to-End

### Goal
不再在 apply 阶段把 motion 降级。

### Implement
- RuntimeItem.motion = compiled；
- evaluate；
- translate 真正进入 MotionFrame；
- preserve enter/emphasis/exit.

### Tests
四方向 slide；
slide_out_right；
scale；
fade。

### Acceptance
肉眼与测试都证明方向不同。

---

## WI-05｜Shared Render Spec + First 5 Real Pack Effects

### Goal
先打通 5 个结构明显不同 effect，不要一次迁移全部 Pack。

### Select
例如：
- stat
- checklist/list
- quote
- chart/progress
- highlight/callout

以当前 catalog 实际存在为准。

### Implement
- renderer registry；
- render spec；
- Workspace render；
- Lab render；
- Export render。

### Acceptance
5 个 effect 可明显区分，Lab/Workspace/Export 同源。

---

## WI-06｜Effect Lab Runtime Draft Preview

### Goal
真实 Draft preview。

### Implement
- clone draft 保留；
- preview compiler；
- shared renderer；
- enter/exit replay；
- Apply one transaction；
- Cancel no project mutation。

### Acceptance
选择不同 variant 立即变化；Apply 后 Workspace 与最后 Preview 一致。

---

## WI-07｜Template Layout Metadata

### Goal
去掉所有模板同尺寸。

### Implement
catalog 增加：
- default size
- min/max
- preferred zones
- autoHeight/aspect behavior

### Acceptance
quote/stat/list 至少三个模板默认几何明显不同。

---

## WI-08｜Layout Solver V2

### Goal
位置不再机械固定。

### Implement
- recent zone penalty；
- same zone streak；
- subtitle rect；
- edge inset；
- template size；
- spatial interface。

### Acceptance
无强约束测试场景 10 sequential items 至少形成合理多区分布；不得 random-only。

---

## WI-09｜Grounding Validator

### Goal
解决“重点提取看起来不靠谱”的本地可验证部分。

### Implement
- keyClaim/evidence provenance；
- source id existence；
- number grounding；
- quote grounding；
- placeholder rejection；
- duplicate warning。

### Acceptance
构造错误 AI 输出时，validator 能阻止虚构数字/空泛重点进入 runtime。

---

## WI-10｜Canonical Packaging Catalog

### Goal
AI 所见与 Resolver 所用同源。

### Implement
- one catalog；
- derive director view；
- resolver uses same source；
- soft diversity penalty。

### Acceptance
不存在 AI catalog 与 resolver catalog 对不上。

---

## WI-11｜Visual Asset Schema + Native Eligibility + Planner

### Goal
接入 VisualAssetIntent，但暂不调用真实图片 Provider。

### Implement
- schema；
- six styles；
- native eligibility；
- candidate planner；
- dedupe；
- budget；
- stable id。

### Tests
- text rejected；
- number rejected；
- robot accepted；
- duplicate robot merged；
- sourceSubtitleIds retained；
- budget deterministic。

### Acceptance
给固定 PackagingPlan 输出固定 candidates。

---

## WI-12｜Atlas Planner + Prompt + Synthetic Splitter

### Goal
全部 deterministic。

### Implement
- 1..25 grid；
- 26+ pages；
- row-major；
- 15% gutter prompt；
- splitter；
- alpha bbox；
- square + trimmed；
- manifest；
- QA。

### Tests
必须用 synthetic PNG，不调用真实 image generation。

### Acceptance
- 18 → 5x5 with 7 unused；
- 26 → 25 + 1；
- slot mapping exact；
- transparent empty assigned cell fail。

---

## WI-13｜Visual Asset Provider + Settings + Secret Store

### Goal
可配置生图，不泄露 secret。

### Implement
- provider abstraction；
- settings；
- secret；
- API route；
- disabled mode；
- retryable errors。

### Acceptance
Provider Disabled 时 AI Packaging 正常完成；secret 从不返回前端。

---

## WI-14｜One-click Packaging Integration

### Goal
完整合并进现有按钮。

### Pipeline
```text
transcript
→ one Director call
→ grounding
→ effect resolve
→ asset plan
→ optional atlas generation
→ split / manifest
→ layout
→ motion compile
→ validator
→ runtime
→ workspace
```

### Critical assertion
`aiCallCount === 1`

### Acceptance
不能新增第二个 LLM request。

---

## WI-15｜Workspace Visual Asset Renderer

### Goal
生成资产真正进入 Workspace。

### Implement
- image primitive；
- project asset ref；
- selection；
- resize/move；
- opacity；
- timeline；
- motion；
- inspector minimum fields。

### Acceptance
robot PNG 可以 slide from right + exit right，不是静态贴图。

---

## WI-16｜Packaging Validator Mainline

### Goal
已有 validator 不再闲置。

### Implement
接入 main flow，并输出 diagnostics。

### Acceptance
严重 overlap/invalid timing 能拦截或 deterministic repair。

---

## WI-17｜Visual Contract Tests

### Goal
防止再次“测试绿了但用户看起来全一样”。

### Must cover
- 5 effect structural difference；
- translate motion；
- Lab vs Workspace；
- Workspace vs Export；
- asset placement；
- video first frame。

---

## WI-18｜CI / Final Golden E2E

### Goal
形成稳定回归门。

### Commands
以项目当前 scripts 为准，至少：
- typecheck/lint
- test
- build
- e2e
- visual contracts

### Golden flow
真实视频：
```text
Import
→ 0s frame
→ Generate
→ 1 Director call
→ native + optional generated assets
→ Workspace
→ Lab
→ Apply
→ Export
```

---

# 47. Work Item 完成模板

每项结束必须记录：

```text
Work Item:
Status:
Goal:
Files changed:
Files intentionally not changed:
Tests added:
Commands run + exit code:
Acceptance criteria:
Visual/manual evidence:
Known limitations:
Regression risk:
Rollback:
Next executable Work Item:
```

禁止只写：
> 已完成 / tests passed。

---

# 48. Codex 不得自行做的决定

以下必须保守处理：

1. 更换主要框架；
2. 删除现有 Effect Library；
3. 改 Project schema 主版本；
4. 改 UI 一级结构；
5. 上传用户视频到新第三方；
6. 新增收费 API；
7. 新增许可证风险依赖；
8. 破坏 one Director call；
9. 自动 push / force push；
10. 删除用户 dirty files。

只有真正需要账号、Key、真实媒体或产品取舍时才找用户。

---

# 49. 资源请求策略

不要第一轮就向用户索取所有东西。

先使用：
- synthetic fixtures；
- 当前 tests；
- 本地合法 sample。

真正到真实 Provider/E2E 时才请求：

```text
Visual Asset Provider credential
approved real video
optional reference image
```

API Key 不要让用户贴进聊天；要求用户在产品 Settings 或本地 secret 环境配置。

---

# 50. 最终验收矩阵

## A. Video
- [ ] 新视频从 0s 开始
- [ ] 首帧可见
- [ ] browser codec error 可见
- [ ] probe ready 不冒充 playback ready

## B. Effect Rendering
- [ ] 5+ pack effects 结构明显不同
- [ ] Lab 与 Workspace 一致
- [ ] Workspace 与 Export 同源
- [ ] selected variant Apply 后真实变化

## C. Motion
- [ ] left/right/top/bottom 方向正确
- [ ] enter + exit 都可见
- [ ] translate 不丢失
- [ ] slide_out_right 方向正确

## D. Layout
- [ ] 不再所有卡同尺寸
- [ ] subtitle safe
- [ ] edge inset
- [ ] recent-zone diversity
- [ ] subject/face 能力状态真实

## E. AI Semantics
- [ ] keyClaim 有来源
- [ ] 数字可追溯
- [ ] quote 可追溯
- [ ] 不出现 generic “包装重点”
- [ ] low-value 内容不过度包装
- [ ] effect semantic suitability 优先于机械多样性

## F. Visual Assets
- [ ] native-renderable 不生图
- [ ] raster-worthy 才申请
- [ ] 1-25 one atlas page
- [ ] 26 = 25 + 1
- [ ] 18 = 5x5 + 7 transparent unused
- [ ] row-major deterministic
- [ ] square + trimmed
- [ ] manifest
- [ ] QA
- [ ] sourceSubtitleIds retained
- [ ] asset reuse
- [ ] Provider disabled graceful fallback

## G. One-call Contract
- [ ] Packaging Director exactly one LLM call
- [ ] no AI JSON repair
- [ ] no second AI style analysis
- [ ] image generation execution does not reinterpret SRT

## H. Security / Commercial
- [ ] API key secret only
- [ ] no unapproved upload
- [ ] dependencies license reviewed
- [ ] no competitor code/schema/prompt/assets copied

## I. Regression
- [ ] unit pass
- [ ] build pass
- [ ] E2E pass
- [ ] visual contracts pass
- [ ] Golden flow pass

---

# 51. Definition of Done

本轮只有满足以下条件才可以称为完成：

```text
P0 Work Items verified
+
Golden E2E passes
+
one-call contract proven
+
5+ structurally different pack effects proven
+
real motion translate proven
+
Visual Asset synthetic pipeline proven
+
at least one configured-provider real asset generation smoke test
  OR explicitly recorded WAITING_USER for credential
+
Workspace / Lab / Export parity evidence
+
no P0 security / license blocker
```

如果还缺 Provider Key：
- 可以把实现标记为 code-complete；
- 不能把真实生图链路标记为 real-E2E complete。

---

# 52. 最终开发原则

CueCut 本轮不是“继续堆更多 Effect”。

优先级固定：

```text
1. Runtime 正确
2. Renderer 统一
3. Motion 真正执行
4. Video 稳定
5. AI 语义可验证
6. Layout 真正智能
7. Visual Asset Layer
8. 更多模板数量
```

如果底层 Runtime 仍然把不同模板压成相同 generic card，那么增加 100 个 Effect 也没有价值。

如果 Motion translate 仍然没有进入最终 renderer，那么增加更多 entrance/exit ID 也没有价值。

如果 AI 重点没有 evidence grounding，那么继续加 Prompt 规则只会越来越长。

本 PRD 的最终目标是把 CueCut 从：

```text
“有很多元数据，但最终看起来差不多”
```

升级为：

```text
“AI 只规划一次，本地 Runtime 确定性地把语义、模板、位置、运动和视觉资产真正执行出来”
```
