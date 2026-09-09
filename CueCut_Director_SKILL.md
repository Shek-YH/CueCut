---
name: cuecut-director
description: CueCut 首次自动编排 Skill。输入已完成的 SRT、视频上下文、Effect/Motion/SFX 候选能力与用户偏好，在一次大模型调用中输出固定格式的 CueCut Composition 文件。AI 负责整条视频的动效模板、进出场、颜色、首选坐标、时间和音效初稿；后续用户在 Workspace 本地微调，不再次调用大模型。
---

# CueCut Director Skill

## 0. 设计目标

CueCut 的正常创作流程只允许一次“导演级”大语言模型调用：

```text
Video
→ ASR / SRT（非 LLM Director）
→ Local Context Builder
→ ONE CueCut Director Call
→ cuecut-composition.json
→ Local Validator / Layout Solver
→ Workspace
→ Human Fine-tune
→ Export
→ Local Preference Learning
```

这个 Skill 只负责 **Director Call**。

它不负责：
- ASR；
- 渲染；
- Timeline 手工修改；
- 导出；
- 用户每次微调时重新请求 AI；
- 在生成后再发第二次 LLM 请求“修 JSON”。

---

# 1. 必须输入

调用前由 CueCut 本地 Context Builder 准备一个 `DirectorInput`。

必须包含：

## 1.1 Project
- projectId
- durationSec
- fps
- canvasWidth / canvasHeight
- aspectRatio
- platformHint（可空）
- contentStyleHint（可空）

## 1.2 Transcript
按顺序提供 SRT segment：
- id
- startSec
- endSec
- text

## 1.3 Visual Context
- subjectZones
- faceZones
- subtitleReservedZone
- safeMargins
- optionalSceneHints

所有坐标统一使用 0~1 归一化坐标。

## 1.4 Effect Capability Index
只提供本次候选，不把整个海量库塞给模型。

每个候选：
- familyId
- variantId
- displayName
- semanticTags
- contentSlots
- supportedAspectRatios
- recommendedDuration
- minDuration
- maxDuration
- visualWeight
- specialCapabilities

## 1.5 Motion Capability Index
每个候选：
- motionId
- role: enter | exit | both
- category
- intensity
- durationRange
- tags
- supportsDirection
- supportsRotation
- recommendedEffectFamilies

## 1.6 SFX Capability Index
每个候选：
- sfxId
- intentCategory
- stylePack
- durationSec
- tags
- isFavorite
- usageScore

## 1.7 Preference Profile
由 CueCut 本地自进化引擎生成，不要求本 Skill 自己学习。

可能包含：
- densityPreference
- preferredFamilies
- dislikedFamilies
- variantWeights
- motionWeights
- colorPreferences
- coordinateProfiles
- subjectRelativeProfiles
- sfxIntentWeights
- favoriteSfxIds
- maxConcurrentFx
- motionIntensityPreference
- evidenceConfidence

---

# 2. 本地候选召回必须先于 AI

如果库中未来存在几百个 Effect、几十个 Motion、几千个 SFX，不允许全部塞给模型。

Local Retriever 先根据：
- SRT 关键词；
- 语义分类器；
- effect semantic tags；
- 用户收藏；
- 历史偏好；
- aspect ratio；
- 当前人物位置；

召回：
- 每个语义段 3~8 个 Effect Variant；
- 3~6 个 Enter Motion；
- 3~6 个 Exit Motion；
- 3~8 个 SFX；
再交给 Skill。

模型只能在候选集合中选择。

---

# 3. Director 内部思考步骤

输出前必须按以下顺序完成，但不要把思考过程写进输出文件。

## Step A — 全片结构理解
先理解整条视频：
- 主题；
- 叙事走向；
- 开头钩子；
- 关键观点；
- 数字；
- 对比；
- 步骤；
- 结论；
- 节奏变化。

## Step B — 语义段划分
不能机械“一条 SRT = 一个动效”。

把相邻字幕归并为更高层语义段：
- hook
- claim
- evidence
- comparison
- statistic
- list
- step
- quote
- definition
- transition
- conclusion
- neutral

每个语义段必须有 start/end，并引用原始 SRT ids。

## Step C — 判断是否需要视觉表达
不是每段都必须有动效。

给每段一个：
- importance 0~1
- motionNeed 0~1
- sfxNeed 0~1

允许 `noEffect=true`。

## Step D — 选择 Effect Family / Variant
只允许从输入的 Effect Capability Index 选择。

先按“语义表达能力”选 Family，再选 Variant。
优先考虑：
1. 与当前语义最匹配；
2. 用户历史接受度；
3. 同片多样性；
4. 避免连续重复；
5. 当前画幅；
6. 卡片视觉重量。

## Step E — 选择 Enter / Exit Motion
AI 第一次就必须决定进出场，而不是默认全部 Fade。

Motion 要与内容强度匹配。

示例逻辑：
- 普通说明：fade / soft slide / small scale
- 数字重点：pop / spring / odometer-friendly
- 强对比：directional slide / split
- 强钩子：punch / spin-scale（谨慎）
- 科技内容：digital / perspective（低频）
- 长时间常驻：进入明显、退出克制

禁止：
- 全片大量使用 360/720 度旋转；
- 每张卡都强弹跳；
- 相邻卡使用完全相同的高强度 Motion；
- 普通信息使用爆炸性动效。

## Step F — 颜色方案
AI 第一次同时生成颜色。

必须：
- 先确定全片 palette；
- 再决定段/卡的 accent；
- 保证文字对比度；
- 优先使用用户历史偏好；
- 如果 Effect Variant 有品牌默认色，不强行覆盖全部内部颜色。

## Step G — 首选 Layout
输出的是 **preferred coordinate**，不是最终合法坐标。

AI 根据：
- subjectZones；
- safeMargins；
- subtitleReservedZone；
- 用户 coordinate profile；
为每张卡给出：
- nx
- ny
- nw / scale
- anchor
- preferredSide
- relationToSubject

最终碰撞规避由本地 Layout Solver 处理。

## Step H — SFX
同一次调用决定 SFX。

SFX 选择顺序：
1. 语义用途匹配；
2. 用户收藏（仅在匹配时加权，不强制）；
3. 用户历史偏好；
4. 风格一致；
5. 避免过密。

必须控制：
- minimumGap；
- 同时响多个 SFX；
- 连续重复相同文件；
- 过高音量。

## Step I — 全局复核
输出前检查：
- 动效密度；
- Motion 多样性；
- SFX 密度；
- 颜色一致；
- 时间是否合法；
- 同屏并发数量；
- 是否过度动画化；
- 是否存在 Registry 外 ID。

---

# 4. 固定输出文件

只输出一个 JSON 对象，不要 Markdown，不要解释文字。

文件语义名：

`<project>-cuecut-composition.json`

Schema 标识：

`cuecut.composition/1`

示例结构：

```json
{
  "schema": "cuecut.composition/1",
  "project": {
    "projectId": "demo",
    "durationSec": 30,
    "palette": {
      "background": "#10141c",
      "primary": "#7868ff",
      "accent": "#39d5bd",
      "text": "#ffffff"
    }
  },
  "segments": [
    {
      "segmentId": "seg_001",
      "sourceSubtitleIds": ["s_001", "s_002"],
      "startSec": 2.2,
      "endSec": 7.8,
      "intent": "claim",
      "importance": 0.82
    }
  ],
  "effects": [
    {
      "effectId": "fx_001",
      "segmentId": "seg_001",
      "familyId": "quote",
      "variantId": "quote_b",
      "time": {
        "startSec": 2.4,
        "endSec": 7.6
      },
      "content": {
        "headline": "先把需求聊清楚",
        "supporting": "再让 AI 真正执行"
      },
      "layout": {
        "nx": 0.10,
        "ny": 0.16,
        "scale": 0.94,
        "anchor": "top-left",
        "relationToSubject": "left"
      },
      "appearance": {
        "accent": "#7868ff",
        "theme": "dark"
      },
      "motion": {
        "enter": {
          "motionId": "slide-left-spring",
          "durationSec": 0.52,
          "intensity": 0.55
        },
        "exit": {
          "motionId": "scale-fade-out",
          "durationSec": 0.32,
          "intensity": 0.35
        }
      },
      "sfx": {
        "sfxId": "soft-pop-03",
        "offsetSec": 0.06,
        "gain": 0.70
      }
    }
  ],
  "soundEvents": [],
  "directorMeta": {
    "densityTargetPerMin": 9,
    "maxConcurrentFx": 3,
    "notes": []
  }
}
```

字段名属于 CueCut 自己的独立 Schema。

---

# 5. 硬约束

## 5.1 Registry
- `familyId + variantId` 必须来自 Effect candidates。
- `motionId` 必须来自 Motion candidates。
- `sfxId` 必须来自 SFX candidates。
- 不允许创造不存在的资源。

## 5.2 时间
- 所有时间在 0~durationSec。
- end > start。
- Effect duration 必须符合 Variant min/max。
- Enter + Exit 时长不能吃掉主体可见时长。

## 5.3 内容
- 卡片内容是“对口播的视觉提炼”，不是把整句字幕机械复制上屏。
- 数字/单位必须忠于 SRT。
- 不允许凭空补事实。

## 5.4 AI 调用次数
- 正常生成只调用一次 Director。
- 失败不得自动二次调用 LLM。
- 使用 Structured Output / JSON Schema 约束。
- 语法修复、ID fallback、范围 clamp 只能由本地代码完成。

---

# 6. 本地后处理

AI 输出后：

```text
JSON Parse
→ Schema Validate
→ Registry Validate
→ Time Clamp
→ Layout Solver
→ Collision Solver
→ Project Import
```

如果 AI 给出一个不可用的候选：
- 不重新请求 AI；
- 使用同语义段本地候选排名第 2 的有效项；
- 记录 warning。

---

# 7. 手工微调阶段

进入 Workspace 后：
- 不显示“AI 重新生成”作为常规按钮；
- 用户自由修改 Effect Variant、Motion、Color、SFX、Timing、Layout；
- Effect Lab 只编辑 Preview Draft；
- 点击“应用”才 Commit 到 Project；
- 所有操作可 Undo。

---

# 8. 自进化

正常工作流不增加新的远程 LLM 调用。

导出时本地保存：

```text
initialDirectorComposition
finalComposition
editEvents
```

Preference Engine 本地统计：
- coordinate delta；
- scale；
- variant acceptance；
- motion replacement；
- color replacement；
- sfx replacement；
- delete rate；
- manual additions；
- timing delta。

形成下一期 `Preference Profile`。

规则：
- 一次行为不是偏好；
- 重复样本才提升 confidence；
- Context 必须包含 aspectRatio / family / subjectPosition / contentType；
- 用户收藏的 SFX 作为弱正偏好；
- 用户明确锁定的选择作为强正偏好。

---

# 9. Skill 与硬规则分离

不要把所有产品约束都写进长 Prompt。

三层：

```text
Skill
= 导演任务与决策原则

JSON Schema
= 输出结构硬约束

Local Validator
= 工程合法性

Preference Profile
= 用户个性
```

这样 Skill 不会越来越长，也更适合后续升级。

---

# 10. 版本策略

Skill 自己版本：

`cuecut-director/1.x`

Composition Schema：

`cuecut.composition/1`

Effect Registry / Motion Registry / SFX Registry 独立版本。

任何 Registry 增删都不要求修改 Skill 正文，只需要 Context Builder 重新生成 Capability Index。
