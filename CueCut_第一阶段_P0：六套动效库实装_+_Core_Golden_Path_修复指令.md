# CueCut 第一阶段 P0 修复执行指令

## 0. 项目位置

本地项目：

```text
F:\CCPJ\CueCut3
```

GitHub：

```text
https://github.com/Shek-YH/CueCut
```

重点目录：

```text
F:\CCPJ\CueCut3\src\motions
```

该目录目前还有 **6 个动效库 ZIP 压缩包尚未正式实装**。

本轮必须：

```text
先处理全部 6 个动效库
→ 固定 Motion/Effect Runtime Contract
→ 再进行 Core Golden Path P0 修复
```

不要反过来。

---

# 1. 总体执行原则

调用：

```text
AI_Autonomous_Project_Ledger_Skill_v1
```

继续沿用现有：

```text
02_MASTER_LEDGER.md
03_CORE_GOLDEN_PATH.md
docs/work-items/**
docs/governance/**
docs/evidence/**
```

不要建立第二套重复台账。

本轮执行分为：

```text
PHASE 0
真实动效库正式实装

↓

PHASE 1
Production Host + Canonical Project Model

↓

PHASE 2
Unified Scene / Motion Renderer

↓

PHASE 3
Canonical Timeline

↓

PHASE 4
Actual Export

↓

PHASE 5
Tests / Real Media / Ledger Verification
```

---

# 2. 当前项目状态修正

当前项目不得视为：

```text
COMPLETED
DONE
ACCEPTED
```

当前状态应为：

```text
IN_PROGRESS
NOT_RELEASE_READY
```

原因包括：

```text
六个动效库尚未实装
真实 Export 未闭环
统一 Renderer 未闭环
Timeline 仍有假数据
字幕未进入 canonical project
Production Host 未建立
真实最终验收未完成
```

---

# ==========================================
# PHASE 0｜六套真实动效库正式实装
# ==========================================

这是本轮第一优先级。

在完成 PHASE 0 Gate 前：

**不要开始大规模 Renderer / Timeline / Export 重构。**

---

# 3. 扫描 src/motions 下所有 ZIP

首先执行：

```powershell
Get-ChildItem F:\CCPJ\CueCut3\src\motions -Recurse -Filter *.zip
```

或等价方式。

自动识别所有尚未实装的 ZIP。

预期：

```text
6 个
```

但不要硬编码文件名。

生成：

```text
docs/audit/MOTION_PACK_INVENTORY.md
```

记录：

| Pack | ZIP Path | Size | SHA256 | Source | License | Categories | Status |
|---|---|---:|---|---|---|---|---|

必须为全部 ZIP 计算：

```text
SHA256
```

---

# 4. 不允许“直接解压即完成”

每个 ZIP 必须经过：

```text
ZIP
↓
Inventory
↓
License / Provenance
↓
Source Audit
↓
Dependency Audit
↓
Category Classification
↓
Runtime Compatibility
↓
Adapter
↓
Registry
↓
Preview
↓
Tests
↓
Formal Install
```

全部完成后才叫：

```text
INSTALLED
```

---

# 5. Import Staging

优先沿用当前项目已有：

```text
src/motions/_import
```

作为：

```text
staging / source reference
```

不要把未经审查的 ZIP 内容直接混入正式 runtime。

如果压缩包尚未解压：

按：

```text
src/motions/_import/<pack-slug>/
```

分类解压。

ZIP 原文件可以保留到安装和验收完成。

之后再决定是否移至：

```text
archive/
```

或删除。

不要提前删除源 ZIP。

---

# 6. 安全解压

解压必须防止：

```text
Zip Slip
../
absolute paths
unexpected executable
symlink escape
```

禁止自动执行 ZIP 中：

```text
.js
.ps1
.bat
.cmd
.exe
.sh
postinstall
```

ZIP 只是素材/源码来源。

不得运行来源包里的任意脚本。

---

# 7. License / Commercial Use Gate

CueCut 最终商业化。

正式进入 registry 的素材必须满足：

优先：

```text
CC0
MIT
Apache-2.0
BSD-2-Clause
BSD-3-Clause
CC-BY-4.0
```

禁止正式注册：

```text
Unknown License
Personal Use Only
Non Commercial
No Redistribution
No Modification
Unverified Copy
```

对于每个 Pack：

记录：

```text
provider
source
sourceUrl（如已有）
author
license
license file
licenseRef
imported files
checksum
```

如果无法确认授权：

```text
QUARANTINED_LICENSE
```

不要为了完成“6/6”而强行接入。

最终要求：

**六个 ZIP 全部都必须被处理。**

每一个最终只能是：

```text
FORMALLY_INSTALLED
```

或：

```text
QUARANTINED_<REASON>
```

不允许：

```text
UNREVIEWED
UNKNOWN
```

---

# 8. 禁止竞品代码污染

不得读取、复制、迁移或参考：

```text
Overlay Studio
LosslessCut
Olive
其他竞品
```

的：

```text
source code
schema
prompt
fixture
asset
UI implementation
```

本轮只使用这 6 个已经提供的正式来源包以及项目自身代码。

---

# 9. 禁止远程运行时

正式 Motion 不得依赖：

```text
remote JS
CDN
remote font
remote CSS
network runtime
iframe
remote image dependency
```

所有正式运行所需内容必须：

```text
local
deterministic
offline-capable
```

---

# 10. 动效统一分类体系

不要简单按照 ZIP 文件夹名字分类。

使用 CueCut 自己的语义体系。

至少建立：

## Semantic Intent

```text
Emphasis
Keyword
Number
Metric
Percentage
Steps
List
Comparison
Warning
Question
Quote
Knowledge
Transition
Summary
CTA
Conclusion
Progress
Pointer
LowerThird
Decoration
```

## Visual Expression

```text
Text
Highlight
Underline
Marker
Badge
Callout
Number
Counter
Progress
Chart
List
Steps
Checklist
Arrow
Pointer
Quote
Card
LowerThird
Icon
Particle
MotionLayer
```

## Motion Category

```text
Fade
Slide
Scale
Zoom
Pop
Spring
Blur
Rotate
Flip
Bounce
Swing
Morph
Scramble
Ticker
ListStagger
Group
```

---

# 11. 正式 Motion Definition

每个正式 motion/effect 至少应可以描述：

```ts
id
displayName
category
semanticTags
visualTags

adapterId

supportedAspectRatios

durationRangeSec
role

supportedStyles
supportedMotions

timingCapabilities
layoutCapabilities

defaultProps

useCases
avoidCases

source
sourceRef
license
licenseRef
```

继续使用项目当前 Registry / Adapter 架构。

不要另起一套。

---

# 12. Effect 与 Motion 必须分层

不要把：

```text
Effect
Motion
```

混成同一个概念。

建议保持：

```text
EffectDefinition
= 视觉表达是什么

MotionDefinition
= 怎么进入 / 怎么离开 / 怎么运动
```

EffectInstance：

```text
EffectDefinition
+
content
+
layout
+
appearance
+
timing
+
enter motion
+
exit motion
+
sfx
```

---

# 13. Adapter Gate

外部素材不能直接成为 CueCut runtime。

必须通过：

```text
CueCut Adapter
```

转为项目自己的参数模型。

优先复用现有：

```text
src/motions/adapters
motionAdapterRegistry
```

不要直接让 UI import 第三方组件。

Adapter 必须保证：

```text
deterministic
local
serializable props
frame-evaluable
no hidden network state
```

---

# 14. Registry → Runtime 一致性

当前项目已有问题：

某些 Motion：

```text
Registry 有
Runtime 没实现
```

例如历史上：

```text
spin-360
spin-720
shrink
spin-out
soft-slide
scale-in
```

本轮全部修正。

建立自动测试：

```text
for every registered motion:
    compatible runtime/adapter exists
    evaluation succeeds
    no silent unknown fallback
```

正式 invariant：

```text
REGISTERED
=
RENDERABLE
```

---

# 15. Runtime 不允许 Silent Fallback

未知 motion：

开发模式：

```text
throw / explicit warning
```

生产模式：

可以：

```text
safe fallback
```

但必须：

```text
diagnostic log
```

绝对禁止未知 ID 默默显示成：

```text
opacity 1
scale 1
```

然后测试还 PASS。

---

# 16. 六套动效的正式安装结果

最终整理成：

```text
src/motions/
├─ adapters/
├─ licenses/
├─ registry.ts
├─ runtime.ts
├─ format.ts
├─ preview.tsx
├─ _import/
└─ ...
```

如果现有项目已经有正式结构：

**沿用现有结构，不为整洁而重写目录。**

关键是：

```text
_import = 来源
registry = 正式可用列表
adapter = 转换
runtime = 执行
```

---

# 17. 删除旧 Test / Demo Motion

完成全部新 Motion 注册、测试和 UI 接入后：

扫描：

```text
demo
sample
fake
placeholder
test-only
old-motion
legacy prototype
```

正式 App 中不可继续作为默认真实素材。

注意：

不要误删：

```text
test fixture
unit fixture
```

测试目录中的 fixture 可以继续存在。

删除的是：

```text
production runtime fake content
```

---

# 18. Effect Library 改成 Registry Driven

当前 Effect Lab 存在硬编码：

```text
ring-a
ring-b
ring-c
Number A
Number B
motion button arrays
```

本轮必须开始替换。

UI 数据来源：

```text
effectRegistry
motionRegistry
```

架构：

```text
Registry
↓
Category
↓
Family
↓
Variant
↓
Compatible Motion
↓
Effect Lab
```

六套动效实装后：

用户必须能在：

```text
动效库
```

真实浏览这些正式注册素材。

---

# 19. 动效预览

每个正式 Motion 至少有：

```text
thumbnail / preview state
```

优先：

```text
runtime-generated preview
```

而不是为每个 motion 强制存大视频。

动效库要避免：

```text
一次性运行全部动画
一次性 mount 全部 heavyweight preview
```

使用：

```text
lazy preview
preview on hover
viewport rendering
virtual list
```

---

# 20. PHASE 0 测试

必须新增/升级：

```text
tests/motions/**
tests/effects/**
```

至少覆盖：

```text
6 packs processed
licenses valid
registry IDs unique
adapter exists
runtime exists
30fps deterministic
9:16
16:9
Chinese content
English content
serialization
unknown motion handling
```

---

# 21. PHASE 0 Gate

只有达到：

```text
ALL_6_PACKS_PROCESSED
LICENSE_GATE_PASS_OR_QUARANTINED
REGISTRY_VALID
ADAPTER_VALID
RUNTIME_VALID
UI_VISIBLE
TEST_PASS
```

才允许开始 PHASE 1。

记录 Evidence：

```text
docs/evidence/MOTION_PACK_INSTALLATION.md
```

---

# ==========================================
# PHASE 1｜Production Host
# ==========================================

# 22. 修复开发环境 Host 假闭环

当前 Node 能力：

```text
src/server/generationRoute.ts
```

已经存在：

```text
FFmpeg
FFprobe
File IO
Bailian ASR
Director
```

这是好的。

但现在通过：

```text
vite.config.ts
configureServer()
```

提供。

这只属于：

```text
Development Host
```

不是 Production Host。

---

# 23. 建立正式 Host Boundary

最终：

```text
React UI
↓
Host Bridge/API
↓
FFmpeg / FFprobe / Files / AI
```

如果项目既定为 Windows Desktop：

选择项目已批准的：

```text
Electron
```

或其他已有批准方案。

不要无理由换栈。

如果当前第一阶段仍采用：

```text
Browser + Local Node
```

则增加正式：

```text
production server entry
```

确保：

```text
pnpm build
```

后 `/api/generate-effects` 仍然可以运行。

Vite middleware 只作为：

```text
dev adapter
```

---

# 24. Media Probe

真实视频 metadata：

统一走：

```text
ffprobe
```

至少获取：

```text
duration
width
height
codec
r_frame_rate
avg_frame_rate
audio stream
```

禁止继续：

```text
HTMLVideo metadata
+
project.fps
```

假装得到真实 fps。

必须正确处理：

```text
30
29.97
59.94
60
```

VFR 要明确策略。

---

# ==========================================
# PHASE 2｜Canonical Project Model
# ==========================================

# 25. 字幕进入 ProjectComposition

当前问题：

```text
SRT = React local state
```

修复为：

```text
ProjectComposition.subtitles[]
```

至少：

```ts
{
  id,
  startSec,
  endSec,
  text
}
```

以下全部读写同一份：

```text
SRT panel
Timeline
Preview
Save
Reload
Export
Director
```

---

# 26. 删除正式 App 假字幕

删除：

```text
SrtQuickPanel.initialItems
```

正式运行中的自动 fallback。

新导入真实视频：

```text
subtitles = []
```

而不是：

```text
字幕1
字幕2
字幕3
```

Demo 数据只允许：

```text
fixtures
tests
stories
```

---

# 27. Canonical Timeline Model

至少统一：

```text
VIDEO
SUBTITLE
EFFECT
SFX
```

不要在 JSX 中硬编码 clip。

每个 Timeline item 必须来自：

```text
ProjectComposition
```

支持本阶段：

```text
move
trim
delete
duplicate
undo
redo
```

---

# 28. Project Persistence

实现：

```text
Create
Save
Close
Open
Continue
```

保存：

```text
media reference
subtitles
effects
motion
sfx
timing
layout
appearance
project settings
```

加入：

```text
schemaVersion
```

和 migration。

---

# ==========================================
# PHASE 3｜Unified Scene Renderer
# ==========================================

# 29. 建立唯一 Scene Evaluation

必须形成：

```text
ProjectComposition
↓
evaluateSceneAtTime()
↓
SceneFrame
```

SceneFrame 至少描述：

```text
content
visibility
layout
opacity
translate
scale
rotation
blur
appearance
zIndex
```

---

# 30. Preview 与 Export 共用

架构：

```text
ProjectComposition
      ↓
SceneFrame
    ↙      ↘
DOM Preview  Export Renderer
```

不允许：

```text
CSS 动画一套
Canvas 一套
FFmpeg 一套
```

---

# 31. 修复 Canvas Renderer Placeholder

当前只画彩色矩形的 renderer 必须升级。

至少支持：

```text
Text
Number
List
MotionLayer
```

以及当前六套动效正式实装后纳入 P0 的分类。

Canvas Renderer 必须真正渲染：

```text
content
layout
motion
appearance
alpha
```

不能只验证：

```text
activeEffectIds
```

---

# 32. Workspace 使用真实 Motion Runtime

当前 CanvasStage 的 Effect 不能继续只是：

```text
active/off
```

必须应用：

```text
enter
active
exit
```

实时 SceneFrame。

---

# ==========================================
# PHASE 4｜Actual Export
# ==========================================

# 33. 导出按钮必须真正工作

当前：

```text
导出
```

按钮未接执行。

建立：

```text
ExportController
```

至少：

```text
start
progress
cancel
success
failure
```

---

# 34. Full Video MP4

用户：

```text
点击导出
```

真实执行：

```text
ProjectComposition
↓
Scene Renderer
↓
Rendered Overlay
↓
FFmpeg
↓
MP4
```

必须产生：

```text
真实文件
```

而不是：

```text
ExportPlan
FFmpeg args
```

---

# 35. Transparent MOV

按照现有 PRD：

```text
ProRes 4444
alpha
```

实现本地输出。

如果代码和 FFprobe PASS，但尚未用户放入剪映/CapCut：

状态只能：

```text
IMPLEMENTED
TESTED
WAITING_FOR_USER
```

不能：

```text
ACCEPTED
```

---

# 36. Export Progress / Cancel

至少状态：

```text
Preparing
Rendering
Encoding
Finalizing
Done
Failed
Cancelled
```

Cancel 必须：

```text
kill child process
delete temp output
release renderer
restore UI
```

---

# 37. Export 验证

Export 完成后自动执行：

```text
ffprobe output
```

检查：

```text
file exists
video stream
duration
resolution
fps
audio stream if expected
```

不能只凭：

```text
exit code 0
```

判定最终 PASS。

---

# ==========================================
# PHASE 5｜真实测试
# ==========================================

# 38. Portable Test Fixture

建立一个项目内可自动生成的小测试视频：

```text
5~10 sec
color background
test tone
30fps
```

不要提交用户私人真实视频。

---

# 39. Export E2E

自动生成：

```text
video
+
1 subtitle
+
2~3 real installed motions
+
1 SFX if ready
```

执行：

```text
MP4 export
```

再：

```text
ffprobe
```

PASS。

---

# 40. Preview / Export Parity

在：

```text
1s
3s
5s
```

验证：

```text
visible effect
position
text
number
opacity
scale
motion phase
```

不要只比较 active IDs。

---

# 41. Real Local Media

当前已有本机素材路径：

```text
F:\CCPJ\CueCut3\测试素材与api
```

如果真实文件仍存在：

直接使用。

至少：

```text
16:9
9:16
```

验证：

```text
import
probe
play
seek
SRT/ASR
motion
timeline
export
```

---

# 42. 移除测试中的机器路径硬编码

当前 Playwright：

```text
F:/CCPJ/CueCut3/...
```

只保留给：

```text
optional real-media tests
```

默认测试必须 portable。

使用环境变量，例如：

```text
CUECUT_REAL_MEDIA_16_9
CUECUT_REAL_MEDIA_9_16
```

---

# ==========================================
# PHASE 6｜Ledger Gate 修复
# ==========================================

# 43. Parent Completion Gate

规则：

```text
任意 P0 descendant 未完成
→ Parent != COMPLETED
```

```text
Required Real Test 未 PASS
→ Parent != ACCEPTED
```

---

# 44. READY 不等于 PASS

当前：

```text
REAL_TEST_READINESS.md
```

必须继续明确：

```text
READY
=
测试资源已具备
```

不是：

```text
PASS
```

状态建议：

```text
NOT_READY
READY
RUNNING
PASS
FAIL
BLOCKED
WAITING_FOR_USER
```

---

# 45. ACCEPTED Gate

P0 Work Item 必须：

```text
implementation evidence
+
automated tests
+
required real test
+
independent verifier
```

全部满足。

单纯：

```text
review.verdict == PASS
```

不够。

---

# ==========================================
# PHASE 7｜P1，P0 完成后再做
# ==========================================

# 46. 四边安全区

从：

```text
safeMargin: number
```

升级：

```ts
safeMargins: {
  top,
  right,
  bottom,
  left
}
```

兼容旧项目：

```text
number
→
four equal values
```

---

# 47. Face Avoidance

真实：

```text
face bbox
```

扩张默认：

```text
10%
```

允许用户调整。

同时支持：

```text
subject zones
face zones
subtitle reserved
edge safe zones
user locked zones
```

---

# 48. LearnView 假统计

在没有真实学习数据库前：

删除/隐藏：

```text
23 有效导出
EXPORT CONFIRMED
17 samples
...
```

显示：

```text
暂无真实学习样本
```

或明确：

```text
DEMO DATA
```

---

# ==========================================
# 执行顺序
# ==========================================

必须按照：

```text
01 Inventory 6 ZIPs
02 License + provenance audit
03 Extract to staging
04 Categorize
05 Adapter implementation
06 Registry installation
07 Runtime parity
08 Effect Library integration
09 Motion installation tests
10 PHASE 0 Gate

11 Production Host
12 Media Probe
13 Canonical Subtitles
14 Canonical Timeline
15 Project Persistence
16 Unified SceneFrame
17 Workspace Renderer
18 Export Renderer
19 Actual MP4 Export
20 Transparent MOV
21 Portable Tests
22 Real Media Tests
23 Ledger Gate Correction
24 R90 Verification
25 Commit + Push
```

不要先做：

```text
CSS polish
UI animation polish
LearnView
face detector
```

除非 P0 全部完成。

---

# 49. Git 提交

开始：

```bash
git status
git log -5 --oneline
```

不得覆盖用户未提交修改。

建议 commits：

```text
feat(motions): install and normalize remaining motion packs
fix(motions): enforce registry runtime parity
refactor(effects): make effect library registry-driven
feat(host): establish production media host
refactor(project): canonicalize subtitles and timeline data
feat(project): add project persistence
feat(render): introduce unified deterministic scene frames
feat(export): implement actual local video export
test(e2e): add portable render and export fixtures
fix(ledger): enforce real-test acceptance gates
```

---

# 50. 不要一次提交“大杂烩”

每个逻辑阶段单独 commit。

全部完成后：

```text
git push
```

---

# 51. 自动化检查

至少运行：

```bash
pnpm lint
pnpm test --run
pnpm build
pnpm test:e2e
pnpm workflow:check
pnpm workflow:golden
pnpm workflow:readiness
```

以及新增的：

```text
motion pack audit
registry parity
portable export
real media export
ffprobe validation
```

---

# 52. 本轮最终 Evidence

生成：

```text
docs/audit/MOTION_PACK_INVENTORY.md
docs/audit/MOTION_PACK_INSTALL_REPORT.md
docs/audit/CUECUT_P0_IMPLEMENTATION_REPORT.md
docs/audit/CUECUT_RELEASE_READINESS_REPORT.md
```

---

# 53. 最终输出必须报告

```text
6 ZIP discovered
6 ZIP processed

Motion packs formally installed
Motion packs quarantined
Reasons

Formal Effect count
Formal Motion count
Runtime-capable count
Registry/runtime mismatch count

P0 found
P0 closed
P0 remaining

Tests passed
Tests failed

Real 16:9 result
Real 9:16 result

MP4 actual export result
Transparent MOV result

Preview/export parity

Remaining Product Owner validations

Final commit SHA
Current project status
```

---

# 54. 用户介入规则

能自动做的：

不要问用户。

只有真正遇到：

```text
API credential unavailable
license cannot be verified
private media unavailable
CapCut/Jianying downstream manual acceptance
irreversible destructive operation
product direction ambiguity
```

才询问。

并且一次性列出所有需要用户处理的事项。

---

# 55. 最终完成规则

完成六套 Motion 实装：

不代表项目完成。

代码写完：

不代表项目完成。

Test green：

也不代表项目完成。

只有：

```text
Motion Packs Installed
+
Canonical Project
+
Unified Renderer
+
Actual Export
+
Portable Tests
+
Real Media Verification
+
R90 PASS
```

才允许：

```text
RELEASE_CANDIDATE
```

只有真正需要 Product Owner 的最终人工验收完成：

才：

```text
ACCEPTED
```

---

# 56. 立即开始

现在先进入：

```text
PHASE 0
```

扫描：

```text
F:\CCPJ\CueCut3\src\motions
```

中的全部 ZIP。

不要只报告文件名。

直接完成：

```text
Inventory
→ Audit
→ Extract
→ Categorize
→ Adapter
→ Registry
→ Runtime
→ UI
→ Tests
→ Evidence
```

六套全部处理完成后，自动继续：

```text
PHASE 1 → PHASE 5
```

不要停下来等待我确认。

除非出现真正需要 Product Owner 解决的 blocker。