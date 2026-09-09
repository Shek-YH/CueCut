# CueCut3 口播动效库实装与旧测试动效清理 PRD
版本：v1.0  
目标执行器：Codex + `AI_Autonomous_Project_Ledger_Skill_v1`  
项目根目录：`F:\CCPJ\CueCut3`  
动效压缩包：`F:\CCPJ\CueCut3\src\motions\CueCut2_TalkingHead_Effects_Pack_v0.1.zip`

---

## 0. 执行总指令

请在 `F:\CCPJ\CueCut3` 项目中调用 `AI_Autonomous_Project_Ledger_Skill_v1`，进入“自主项目台账模式”，由 AI 自主分析项目、设定角色、拆分任务、执行开发、测试、验收和记录，直到本 PRD 中定义的目标全部完成。

执行过程中遵守以下原则：

1. **先分析、后修改**，禁止直接盲删旧代码。
2. **旧的测试/演示/占位动效需要删除**，但不得误删仍被生产功能、时间轴、导出、预览或用户工程引用的正式动效。
3. 对存在不确定性的旧动效，必须先完成引用扫描和运行时依赖分析，再决定删除、迁移或保留。
4. 新动效必须真正接入 CueCut3 的现有动效库、预览、参数编辑、时间轴、渲染链路，而不是仅解压到目录。
5. 不允许引入远程 CDN、在线字体、远程 JS、运行时网络依赖。
6. 第三方开源代码必须保留原许可证与版权声明，并建立清晰的第三方来源台账。
7. 新动效必须支持中文口播场景，并优先适配 9:16，同时兼容 16:9。
8. 不允许为了“接进去”而破坏现有渲染架构；若压缩包代码和当前架构不一致，应做适配层，而不是强行改写整个项目。
9. 所有删除、迁移、新增、依赖变更必须在项目台账中记录。
10. 每完成一个阶段，进行静态检查 + 本地预览 + 最小真实渲染测试。
11. 如遇到必须由用户配合的事项，例如需要登录、提供真实视频/SRT、提供 API、确认 UI 风格，才向用户请求协助；其他任务自主完成。
12. 最终必须给出完整的变更清单、删除清单、保留清单、测试结果和后续 TODO。

---

# 1. 项目背景

CueCut3 当前动效库存在两个主要问题：

- 动效数量太少；
- 现有部分测试动效视觉质量差，不适合正式产品。

现在已经准备第一批开源口播动效素材包：

`F:\CCPJ\CueCut3\src\motions\CueCut2_TalkingHead_Effects_Pack_v0.1.zip`

该素材包优先覆盖：

- 文字强调；
- 数字与指标；
- 列表/步骤；
- 基础 Motion Preset；

内部包含经过筛选的开源实现、许可证、语义分类文档和接入建议。

本阶段目标不是一次性完成 CueCut3 的最终 AI 动效导演系统，而是先完成：

> **清理旧测试动效 + 实装第一批高质量真实动效 + 建立可继续扩充的标准目录和注册方式。**

后续再基于真实动效库继续完成：

- Effect Manifest；
- Semantic Effect Family；
- Scene Planner；
- Effect Retriever；
- AI 自动选动效；
- SRT 元素级时间对齐；
- Visual Director；
- Layout / 避障；
- Overlay Linter。

---

# 2. 本期目标

## 2.1 核心目标

完成以下工作：

1. 盘点 CueCut3 当前全部动效；
2. 找出旧测试/演示/占位动效；
3. 安全删除不再需要的旧测试动效；
4. 解压并分析新动效包；
5. 将新动效按 CueCut3 当前项目架构实装；
6. 建立清晰的动效分类目录；
7. 将新动效接入动效库 UI；
8. 将新动效接入预览；
9. 将新动效接入参数系统；
10. 将新动效接入时间轴/渲染链路；
11. 保留第三方许可证；
12. 完成 9:16 / 16:9 基础测试；
13. 建立后续扩库需要使用的索引/注册能力；
14. 输出完整开发台账和验收报告。

---

# 3. 非目标

本阶段暂时不要求完成：

- 完整 AI Scene Planner；
- AI 自动根据整篇 SRT 选动效；
- Effect RAG；
- 人脸避障；
- 自动布局；
- Visual Director；
- 全量 30~50 个 Semantic Family；
- RingMetric / Gauge / Ranking 等第二批尚未入库的动效；
- 复杂商业化模板商城；
- 云端动效下载系统。

但是本阶段的目录和注册结构必须为这些能力预留扩展空间。

---

# 4. 第一阶段：项目现状审计

## 4.1 扫描范围

重点检查：

- `src/motions`
- `src/effects`
- `src/overlays`
- `src/components`
- `src/features`
- 动效面板
- 动效预览
- Timeline
- Renderer
- Export
- Effect Registry
- Schema
- fixture
- demo
- story
- mock
- test
- playground

具体目录必须以实际项目为准。

---

## 4.2 对当前动效建立盘点表

至少记录：

| 字段 | 说明 |
|---|---|
| effectId | 当前动效唯一 ID |
| name | 名称 |
| path | 文件路径 |
| category | 当前分类 |
| productionUsed | 是否生产链路使用 |
| uiVisible | 是否在动效库展示 |
| timelineUsed | 是否被时间轴引用 |
| rendererUsed | 是否被渲染器引用 |
| exportUsed | 是否影响导出 |
| testOnly | 是否仅测试 |
| visualQuality | good / acceptable / poor |
| action | keep / migrate / delete |
| reason | 原因 |

输出：

`docs/effect-migration/EFFECT_LIBRARY_AUDIT.md`

---

# 5. 旧测试动效删除规则

## 5.1 应优先删除

满足以下情况之一，且确认没有生产引用：

- 文件名包含：
  - test
  - demo
  - sample
  - example
  - mock
  - placeholder
  - temp
  - dev
- 明确位于：
  - test/
  - demo/
  - samples/
  - playground/
  - fixtures/
- 仅用于过去的动效验证；
- 在正式动效库中展示但明显属于临时样例；
- 没有实际 renderer 注册；
- 没有实际 timeline / project schema 引用；
- 无用户历史工程兼容需求；
- 视觉质量明显不符合产品要求，且没有正式功能依赖。

---

## 5.2 禁止直接删除

以下情况必须谨慎：

- 被正式 effect registry 注册；
- 被现有用户项目 JSON / schema 引用；
- 被 renderer / exporter 使用；
- 被 preset / template 使用；
- 被旧工程兼容层使用；
- ID 已经进入持久化数据；
- 删除后可能导致旧工程打开报错。

如果存在兼容风险：

优先方案：

`旧 Effect ID -> Deprecated Adapter -> 新 Effect`

而不是直接让旧工程崩溃。

---

## 5.3 删除前必须完成

- 全仓引用搜索；
- TypeScript import 搜索；
- effectId 搜索；
- JSON / schema 搜索；
- 时间轴数据结构搜索；
- renderer 注册搜索；
- preview registry 搜索；
- preset 搜索。

输出：

`docs/effect-migration/OLD_EFFECT_DELETE_PLAN.md`

---

# 6. 新动效包处理

目标文件：

`F:\CCPJ\CueCut3\src\motions\CueCut2_TalkingHead_Effects_Pack_v0.1.zip`

---

## 6.1 解压规则

不要直接在生产目录中散落解压。

推荐先解压到临时研究目录：

```text
src/motions/_import/
└─ CueCut2_TalkingHead_Effects_Pack_v0.1/
```

完成分析以后，再将需要的源文件迁移到正式目录。

实装完成后：

- 可以删除 `_import` 临时目录；
- 原始 zip 可以保留；
- 第三方许可证必须保留。

---

# 7. 新动效正式目录建议

最终目录请结合现有项目结构决定。

若项目当前没有成熟标准，建议采用：

```text
src/motions/
├─ core/
│  ├─ types/
│  ├─ registry/
│  ├─ renderer/
│  └─ utils/
│
├─ semantic/
│  ├─ text-emphasis/
│  ├─ numbers-metrics/
│  ├─ list-steps/
│  └─ motion-presets/
│
├─ third-party/
│  ├─ motion-primitives/
│  └─ magicui/
│
├─ licenses/
│  ├─ motion-primitives-LICENSE.md
│  └─ magicui-LICENSE.md
│
└─ index.ts
```

如果 CueCut3 已经有成熟的 effect / motion 目录，则必须优先遵循项目原有约定。

---

# 8. 第一批需要实装的动效

## 8.1 Text Emphasis

来源：

Motion Primitives / Magic UI

目标效果：

- TextMorph
- TextRoll
- TextScramble
- TextShimmer
- AnimatedShinyText

映射到 CueCut3 的语义类别：

```text
KeyPoint
Keyword
Quote
Definition
Term
Warning
Question
Conclusion
```

注意：

这些是 Motion / Primitive，不应该直接等于最终 Semantic Effect。

例如：

`TextShimmer`

未来可被多个语义卡使用：

- KeyPoint
- Keyword
- ProductName
- ToolName
- PriceHighlight

---

## 8.2 Numbers & Metrics

实装：

- AnimatedNumber
- NumberTicker

未来语义映射：

- BigNumber
- Percentage
- Delta
- Price
- Progress
- Metric

参数至少支持：

```ts
value
startValue
decimalPlaces
direction
delay
duration
prefix
suffix
fontSize
fontWeight
align
```

如果原组件不支持 prefix / suffix，应在 CueCut3 Adapter 层补齐。

---

## 8.3 List & Steps

实装：

- AnimatedList
- AnimatedGroup

未来语义：

- BulletList
- Steps
- Checklist
- FeatureList
- Tips

特别要求：

不要把 `AnimatedList` 直接当作 Checklist 最终实现。

应该先实现可复用底层：

```text
ListMotion
↓
Checklist
Steps
FeatureList
Tips
```

---

## 8.4 Motion Presets

至少提供：

- fade
- slide
- scale
- blur
- blur-slide
- zoom
- flip
- bounce
- rotate
- swing

这些应作为：

`Motion Layer`

而不是十个独立 Semantic Effect。

---

# 9. 第三方组件适配要求

压缩包中的代码可能包含：

```ts
@/lib/utils
motion/react
Tailwind class
React hooks
```

Codex 必须先检查 CueCut3：

- React 版本；
- Motion / Framer Motion 版本；
- Tailwind 版本；
- `cn()` 是否存在；
- tsconfig path alias；
- bundler；
- renderer 环境；
- SSR / client component 限制。

禁止直接复制后留下编译错误。

---

# 10. 推荐新增 CueCut Adapter 层

不要让第三方组件直接散落在产品业务层。

建议：

```text
Third Party Component
        ↓
CueCut Motion Adapter
        ↓
CueCut Effect Registry
        ↓
Editor UI
        ↓
Timeline
        ↓
Renderer
```

例如：

```ts
CueCutNumberTicker
CueCutTextMorph
CueCutTextRoll
CueCutTextScramble
CueCutAnimatedList
```

Adapter 负责：

- CueCut 参数格式；
- 默认样式；
- Timeline timing；
- 尺寸；
- 视频分辨率；
-中文适配；
-字体适配；
-颜色变量；
-安全值；
-渲染触发。

---

# 11. Effect Registry

如果项目已经存在 Registry：

必须接入现有 Registry。

如果没有：

建立最小 Registry。

建议结构：

```ts
type CueCutMotionDefinition = {
  id: string
  name: string
  category: string
  component: React.ComponentType<any>
  defaultProps: Record<string, unknown>
  supportedAspectRatios?: string[]
  source?: string
  license?: string
}
```

本期先不要一次完成未来完整 Manifest。

但是字段必须允许后续扩展：

```ts
semanticTags
useCases
avoidCases
timingCapabilities
layoutCapabilities
supportedStyles
supportedMotions
```

---

# 12. 动效库 UI 实装

新动效必须在 CueCut3 动效选择面板中可见。

建议一级分类：

```text
文字强调
数字指标
列表步骤
基础运动
```

每个动效至少展示：

- 名称；
- 预览；
- 简短用途；
- 分类；
- 标签。

---

# 13. 动效预览

每个新动效必须有实时预览。

预览文本建议覆盖：

### 中文

```text
这是一个重要结论
92.4%
增长 36%
第一步 打开设置
第二步 复制 API Key
```

### 英文

```text
AI Workflow
92.4%
Step One
Important
```

---

# 14. 参数面板

根据实际动效能力展示参数。

基础统一参数建议：

```text
start
duration
position
scale
opacity
fontSize
fontWeight
textColor
accentColor
backgroundColor
```

文字动效：

```text
text
splitBy
speed
stagger
delay
```

数字：

```text
value
startValue
decimalPlaces
prefix
suffix
direction
```

列表：

```text
items[]
itemDelay
itemGap
alignment
```

---

# 15. 时间轴

所有实装动效必须能够：

- 添加到 Timeline；
- 修改 start；
- 修改 duration；
- 拖动位置；
- 删除；
- 复制；
- 预览；
- 导出。

不能只在动效库 Demo 中播放。

---

# 16. Renderer

必须确认：

编辑器 Preview 和最终导出的 Renderer 行为一致。

检查：

- 动画开始时间；
- 动画结束时间；
- duration；
- FPS；
- requestAnimationFrame；
- Motion spring；
- deterministic rendering。

如果 CueCut3 导出体系不适合直接使用实时 Spring：

必须实现：

- deterministic spring；
- frame-based mapping；
- 或 export adapter。

不允许编辑器看起来正常但最终导出错位。

---

# 17. 中文适配

至少验证：

- 4 字；
- 8 字；
- 16 字；
- 24 字；
- 中文 + 数字；
- 中文 + 英文；
- 中文标点。

尤其检查：

- TextRoll；
- TextMorph；
- TextScramble；
- TextShimmer。

避免：

- 汉字被拆错；
- 字间距异常；
- 中文乱码；
- emoji 崩溃；
- 行高异常。

---

# 18. 画幅适配

至少：

## 9:16

```text
1080 x 1920
```

## 16:9

```text
1920 x 1080
```

验证：

- 不溢出；
- 不切边；
- 自动换行合理；
- 字号可读；
- 列表不超出画面；
- 数字指标不超范围。

---

# 19. 第三方许可证

必须保留：

- Motion Primitives MIT License；
- Magic UI MIT License。

推荐目录：

```text
src/motions/licenses/
```

同时增加：

`docs/THIRD_PARTY_MOTIONS.md`

记录：

| Source | URL | License | Files Used | Modified |
|---|---|---|---|---|

---

# 20. 依赖管理

如果当前项目已经安装：

```text
motion
```

则复用当前版本。

若使用：

```text
framer-motion
```

但组件使用：

```text
motion/react
```

需要评估：

- 是否升级；
- 是否 Adapter；
- 是否统一版本。

禁止同时盲目引入多个重复 Motion Runtime。

---

# 21. 视觉重构原则

第三方组件不要求 1:1 保持原样。

可以：

- 修改 spacing；
- 调整字号；
- 统一圆角；
- 统一 shadow；
- 统一 timing；
- 统一 easing；
- 统一默认色；
- 优化深色模式；
- 优化视频画面可读性。

但是必须保留原许可证。

目标：

> 让这些组件最终像 CueCut3 自己的动效系统，而不是第三方 UI 拼盘。

---

# 22. 第一批默认视觉规范

如果 CueCut3 已有设计系统，则优先使用现有设计系统。

否则默认：

```text
Style:
Minimal Tech

Motion:
Fast / Clean / Low-noise

入场:
250~500ms

强调:
400~900ms

出场:
200~400ms

列表 stagger:
80~250ms

Spring:
避免过度弹跳
```

原则：

- 不花哨；
- 不廉价；
- 不过度 neon；
- 不大量 blur；
- 不使用网页 hover 交互作为视频主动画；
- 适合真人口播。

---

# 23. 测试场景

至少建立以下 Demo Scene：

## Scene 01：金句

```text
AI 真正值钱的不是回答，而是替你完成任务。
```

测试：

- TextMorph
- TextRoll
- TextShimmer

---

## Scene 02：数字

```text
效率提升了 92.4%
```

测试：

- AnimatedNumber
- NumberTicker

---

## Scene 03：流程

```text
第一步：打开设置
第二步：复制 API Key
第三步：粘贴到 Codex
```

测试：

- AnimatedList
- AnimatedGroup

---

## Scene 04：关键词

```text
真正重要的是：自动化。
```

测试：

- TextScramble
- TextShimmer

---

# 24. 测试要求

至少执行：

- TypeScript typecheck；
- lint；
- build；
- editor preview；
- timeline preview；
- export / render；
- 9:16；
- 16:9；
- 中文；
- 英文；
- 30fps；
- 项目现有默认 FPS。

---

# 25. 删除回归测试

旧测试动效删除以后：

必须确认：

- 项目正常启动；
- 动效面板无 broken entry；
- timeline 不报错；
- renderer 不报错；
- export 不报错；
- preset 不丢失；
- 旧工程若存在兼容需求可正常打开。

---

# 26. 项目台账建议角色

`AI_Autonomous_Project_Ledger_Skill_v1` 可以根据实际情况自主调整，但至少建议包含：

## R01 — Motion Architecture

负责：

- 项目动效架构分析；
- Registry；
- Adapter；
- Schema；
- 目录规范。

---

## R02 — Motion UX / Visual

负责：

- 动效视觉质量；
- 口播适配；
- 9:16；
- 参数默认值；
- 预览。

---

## R03 — Timeline / Renderer

负责：

- Timeline；
- Preview；
- Export；
- deterministic animation。

---

## R04 — Migration / Cleanup

负责：

- 旧动效盘点；
- 删除；
- deprecated compatibility；
- 引用扫描。

---

## R05 — QA

负责：

- typecheck；
- lint；
- build；
- preview；
- render；
- regression。

---

## R06 — License / Compliance

负责：

- 第三方 LICENSE；
- 来源登记；
- 商业化合规记录。

---

# 27. 台账文件建议

由 Skill 自主生成，至少包含：

```text
00_PROJECT_ENTRY.md
01_ROLES_AND_RESPONSIBILITIES.md
02_CURRENT_STATE_AUDIT.md
03_EFFECT_LIBRARY_AUDIT.md
04_OLD_EFFECT_DELETE_PLAN.md
05_NEW_EFFECT_IMPORT_PLAN.md
06_MOTION_ARCHITECTURE.md
07_IMPLEMENTATION_LOG.md
08_TEST_PLAN.md
09_TEST_RESULTS.md
10_LICENSE_AUDIT.md
11_FINAL_ACCEPTANCE.md
12_FOLLOW_UP_TODO.md
```

如果 Skill 有自己的命名规范，以 Skill 为准。

---

# 28. 完成定义 Definition of Done

只有同时满足以下条件才算完成：

### 旧动效

- 已盘点；
- 旧测试动效已删除；
- 无误删；
- 无 broken import；
- 无 broken registry。

### 新动效

- zip 已解压分析；
- 精选文件已迁入正式目录；
- 第三方 License 已保存；
- 已接入 Registry；
- 已出现在动效库；
- 可以实时预览；
- 参数可编辑；
- 可以加到 Timeline；
- 可以正常渲染；
- 可以正常导出。

### 质量

- TypeScript 通过；
- Build 通过；
- Lint 无新增严重错误；
- 9:16 通过；
- 16:9 通过；
- 中文通过；
- 英文通过。

### 文档

- Migration Audit 完成；
- License Audit 完成；
- Test Report 完成；
- Final Acceptance 完成。

---

# 29. 本期验收清单

最终至少能看到：

## 文字类

- Morph；
- Roll；
- Scramble；
- Shimmer；
- Shiny Text。

## 数字类

- Animated Number；
- Number Ticker。

## 列表类

- Animated List。

## Motion

- fade；
- slide；
- scale；
- blur；
- zoom；
- flip；
- bounce；
- rotate；
- swing。

---

# 30. 后续阶段

本次实装完成以后，下一阶段进入：

## Phase 2

补齐真实高级 Semantic Effects：

- Checklist；
- StepTimeline；
- RingMetric；
- Gauge；
- Progress；
- Ranking；
- Comparison；
- ProsCons；
- Timeline；
- Flow；
- Quote Card；
- Tool Card；
- Product Card。

---

## Phase 3

建立：

`Effect Capability Manifest`

---

## Phase 4

建立：

`Semantic Effect Routing`

---

## Phase 5

建立：

`Scene Planner`

流程：

```text
完整 SRT
↓
整体理解
↓
章节
↓
Scene
↓
语义归纳
↓
判断是否需要视觉化
↓
Semantic Family
↓
Effect Retriever
↓
具体 Effect
↓
参数
↓
时间轴
```

禁止退回到：

`逐句 SRT -> 关键词匹配 -> 随机动效`

---

## Phase 6

实现：

`Element-Level Cue Timing`

例如：

```text
12.1s 打开设置
15.3s 找到 API
21.6s 复制 Key
27.0s 粘贴 Codex
```

每一个列表项根据真实 SRT cue 出现。

---

## Phase 7

Visual Director：

控制整片：

- Motion Energy；
- Skin；
- Typography；
- Accent；
- Density；
- 主辅风格。

---

# 31. Codex 最终输出要求

任务完成后，不要只回复“已完成”。

必须输出：

1. 删除了哪些旧动效；
2. 为什么删除；
3. 保留了哪些旧动效；
4. 新增了哪些动效；
5. 每个动效所在文件；
6. Registry 修改位置；
7. Timeline 修改位置；
8. Renderer 修改位置；
9. 新增/修改依赖；
10. License 文件位置；
11. Typecheck 结果；
12. Build 结果；
13. Render 测试结果；
14. 9:16 测试结果；
15. 16:9 测试结果；
16. 已知问题；
17. 下一阶段 TODO。

---

# 32. 给 Codex 的启动命令式提示

请从现在开始调用 `AI_Autonomous_Project_Ledger_Skill_v1` 执行本 PRD。

项目：

`F:\CCPJ\CueCut3`

素材包：

`F:\CCPJ\CueCut3\src\motions\CueCut2_TalkingHead_Effects_Pack_v0.1.zip`

你需要自主完成：

`项目分析 -> 建立台账 -> 角色分工 -> 旧动效盘点 -> 删除旧测试动效 -> 解压新动效 -> License 审核 -> 架构适配 -> Registry -> UI -> Preview -> Timeline -> Renderer -> Export -> QA -> 验收`

除非出现必须由用户处理的问题，否则不要中途停止等待确认。

遇到实现路径不确定时：

优先阅读项目现有架构、类型、Registry、Renderer 和测试代码，自主选择与现有工程最一致的实现。

不得为了快速完成而：

- 只解压文件；
- 只复制源码；
- 留下未使用文件；
- 留下 broken import；
- 仅制作 Demo；
- 跳过 Timeline；
- 跳过 Renderer；
- 跳过 Export；
- 跳过测试；
- 跳过 License。

最终目标是：

> 第一批新动效真正成为 CueCut3 可以实际使用、编辑、预览、加入时间轴并导出的正式动效能力。

