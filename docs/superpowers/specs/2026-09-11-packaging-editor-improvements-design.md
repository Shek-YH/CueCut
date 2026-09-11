# CueCut 包装编排与编辑器体验改进设计

日期：2026-09-11  
状态：方案 A，待用户审阅  
范围：AI 包装编排、时间轴预览、偏好学习、字幕编辑、轨道视觉化

## 1. 背景与目标

当前包装流程已经能完成 SRT、AI 计划、动效库解析和 Composition 写回，但真实使用中仍有六类问题：

1. 点击动效卡后播放头更新了，视频/SceneFrame 没有立即显示有效动效帧。
2. AI 经常把 SRT 原句整段塞进卡片，缺少章节、论点、证据和重点提炼。
3. 用户调整后的结果无法通过一个按钮稳定沉淀为跨项目偏好。
4. 长文字在固定尺寸卡片中溢出。
5. 字幕只有文本编辑，没有显示开关和完整的显示样式控制。
6. 轨道色块中显示 familyId 和长文本，造成视觉噪声。

目标是保持当前 CueCut 的 React、ProjectStore、Packaging IR、动效注册表和导出链路，在中间层补齐语义编排与可编辑状态，让同一段内容支持“持续主卡 + 局部强调卡”的多层结构。

## 2. 非目标

- 不引入完整外部字幕编辑器或替换现有时间轴数据模型。
- 不把 Overlay Studio 代码直接复制进 CueCut；只吸收章节、语义段、证据卡、节奏和 lint 思想。
- 不改变“一次 AI 包装调用”的约束；AI 学习是独立的用户主动操作。
- 不自动覆盖用户锁定的动效、位置或字幕设置。

## 3. 总体数据流

```text
SRT
  → AI 章节总结
  → 10–30 秒语义段
  → 段内元素与字幕来源
  → semanticRole / evidenceType / cadence
  → 动效库匹配与参数化
  → Packaging JSON
  → resolve
  → ProjectComposition
  → DOM 预览 / Canvas 导出
```

AI 返回的结构化计划保留两层信息：

- `chapters[]`：章节标题、时间范围和章节视觉色。
- `sections[]`：论点段、字幕来源、语义角色、证据类型以及段内 `elements[]`。
- `timeline[]`：执行单元，包含具体动效类别、视觉参数、运动参数、位置参数、内容和节奏。

本地归一化继续兼容旧的 `timeline` 和 `type/elements` 格式，并将章节/段落格式转换为合法 Packaging IR，不重试 AI。

## 4. AI 编排规则

### 4.1 章节与段落

- 全片先划分 3–6 个章节。
- 每个语义段通常为 10–30 秒，只表达一个论点。
- `sourceSubtitleIds` 必须来自真实 SRT；缺省时按时间范围自动推导。
- 内容卡的 `endSec` 跟随话题结束，不默认使用全片时长。

### 4.2 语义角色和卡片选择

- `hook`、`quote`、`conclusion`：独立金句/标题卡，优先居中。
- `evidence`：数字、指标、图表或来源卡，优先放右侧。
- `ordered-process`：一张持续流程卡，条目逐个显示。
- `comparison`：左右对照或中间结论卡。
- `pain-point`：短时痛点或裂缝卡，优先放下方。
- 完整 SRT 句子不得直接作为卡面内容；必须提炼成短句、关键词、数字、对照项或条目。

### 4.3 持续主卡与强调层

一个语义段允许一个持续主卡，负责呈现“总结构”；段内其他短卡作为强调层，负责呈现“分观点”。

例如当前 `jj-asr.srt`：

- “怎么用 AI 读书？”单独一张中心金句卡。
- “我从来不用 AI 帮我读书”单独一张中心对比/否定卡。
- “读书的时候是怎么使用 AI 的”单独一张中心段标题卡。
- “4 步”使用一张流程卡，四个条目按真实口播时间逐个出现，段落结束统一退出。
- 流程卡持续期间，可以在其他轨道叠加“知识不是下载式安装”“读书必须有摩擦”等短时强调卡。

### 4.4 节奏

`cadence` 支持：

- `stepMs` / `staggerMs`：均匀的条目节奏。
- `cueOffsetsMs`：每个条目相对于卡片起点的真实时间偏移。
- `emphasisAtMs`：反转或重点句在卡片内的强调时间。

列表内容在写入 Composition 时转换为带 `cue.startSec` 的条目，SceneFrame 按当前时间累积显示，直到卡片结束统一消失。

## 5. 位置、轨道与图层

### 5.1 位置默认值

如果 AI 未显式给出位置，归一化器使用语义默认值：

| 语义 | 位置优先级 |
| --- | --- |
| hook / quote / conclusion | center → upper-left → upper-right |
| evidence / stat / chart | upper-right → lower-right → upper-left |
| ordered-process / progress | upper-left → upper-right → lower-left |
| comparison | mid-left → mid-right → upper-left |
| pain-point | lower-left → lower-right → upper-left |
| 其他 | upper-left → upper-right → lower-left → lower-right |

显式的 AI 位置和用户锁定位置优先于默认值。布局碰撞只对真实时间重叠的卡生效；不重叠的卡可以复用视觉主轴。

### 5.2 轨道

- 轨道按时间区间分配；同时出现的卡进入不同轨道，不同时出现的卡复用轨道。
- 色块内部不显示 familyId、编号或长文本。
- 色块保留 `title`、`aria-label`、hover 操作和复制/删除按钮。
- 颜色按视觉类别区分：金句紫、流程蓝、数据绿、强调橙/红、字幕浅蓝、音效粉色。

## 6. 点击卡片后的有效帧预览

点击图层卡后，统一执行一次 `seekToEffectPreview`：

```text
previewTime = min(endSec - 1/fps, startSec + 5/fps)
```

该操作必须同步更新播放时钟、视频元素 `currentTime` 和 SceneFrame；必要时在一次 animation frame 后重新确认视频 currentTime，避免 `timeupdate` 用旧值覆盖。目标是点击后无需拖动时间轴即可看到动效入场后的有效画面。

## 7. 字幕显示与编辑

在 `ProjectComposition` 中增加可持久化的字幕显示设置：

```text
visible
fontSize
color
strokeColor
strokeWidth
lineHeight
letterSpacing
position
```

字幕面板支持：

- 显示/隐藏切换。
- 文本和时间范围编辑。
- 字号、颜色、描边、行距、字间距和位置调整。
- 当前字幕点击定位。
- SRT 导入/导出。

CanvasStage 和 Canvas 导出使用同一份字幕设置，避免预览和导出不一致。

## 8. 动效卡自适应

- 文本容器必须允许换行，内容区域 `min-width: 0`，长词可断行。
- 根据文本长度、最大行数和卡片宽高计算字号与行高。
- 列表卡优先增加高度或转为逐条布局，不把长文本压缩成单行。
- DOM 和 Canvas 共用文本测量/换行规则。
- 超出安全区域时先缩小内容，再回退到候选布局，不允许静默溢出画布。

## 9. AI 学习偏好

### 9.1 触发

在 Header 的指定位置增加“AI 学习”按钮。按钮只在存在包装基线和当前 Composition 时可用。

### 9.2 输入与输出

点击后比较：

- 包装完成时保存的原始 Composition/Packaging JSON。
- 用户当前调整后的 Composition。

复用 `diffCompositions`，识别模板、位置、动效、颜色、音效、时长、删除和新增偏好。学习结果写入：

```text
%APPDATA%\CueCut3\用户偏好.md
```

所有项目共享；每条结果带来源项目、时间、修改次数和置信度。原始/调整快照保存在同一用户级学习历史目录，避免同一修改重复学习。

下一次 Packaging 请求读取该文件并作为 preferences 传入 Director。用户锁定的偏好不得被自动覆盖。

## 10. 错误处理

- AI 输出仍然只调用一次；解析失败时先做本地 JSON 清理和结构归一化。
- 章节/段落格式、旧 timeline 格式和完整 IR 格式都由同一入口处理。
- schema 错误在服务端记录结构化诊断，UI 显示简短中文原因，不直接把整段 Zod JSON 堆进 Header。
- 缺少素材、时间越界、没有字幕来源或无法匹配动效库时保留明确 warning，并继续处理可恢复项。

## 11. 测试策略

### 单元测试

- 点击卡片跳转到有效预览帧。
- 章节/段落/元素 JSON 归一化。
- 金句、流程、数据、对比的默认位置。
- AI 参数在 normalize → resolve → Composition 中不丢失。
- 四步卡的 `cueOffsetsMs` 转换为逐条 `cue.startSec`。
- 长文本自适应计算和换行。
- 字幕设置 schema、显示状态和样式更新。
- 轨道色块无可见文本且保留可访问名称。
- 偏好 diff、去重、Markdown 写入和用户级文件读取。

### 集成与浏览器测试

- 导入 `jj.mp4` / `jj-asr.srt` 后重新生成包装。
- 确认至少出现独立金句卡、持续流程卡和叠加强调卡。
- 点击图层卡后画面立即显示动效。
- 隐藏字幕、修改字号/颜色/行距并确认画布同步。
- 检查时间轴色块、轨道分层和导出结果。
- 点击 AI 学习后确认 `%APPDATA%\CueCut3\用户偏好.md` 被追加，下一次请求能读取。

## 12. 验收标准

1. 点击卡片后直接显示有效动效帧，不需要拖动时间轴。
2. SRT 内容先被总结为章节和语义段，再生成动效元素。
3. 金句独立成卡、四步结构独立成持续流程卡，条目按真实时间逐个显示。
4. 主卡持续期间允许其他重点卡在不同轨道叠加。
5. 动效位置不再全部固定在同一位置。
6. 长文本不出框，预览与导出表现一致。
7. 字幕支持显示/隐藏、编辑和样式调整。
8. 时间轴只展示清晰的彩色区间块。
9. AI 学习结果写入用户级偏好文件并能影响后续项目。
10. 全量测试、生产构建和真实浏览器验收通过。
