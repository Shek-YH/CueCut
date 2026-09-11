# CueCut Realtime Chroma Capture Export PRD

> 项目代号：Realtime Chroma Capture Export
> 中文名称：极速抠像导出 / 实时抠像导出
> 项目：CueCut
> 文档版本：V1.0
> 文档用途：供 Codex / AI Autonomous Project Ledger 执行开发
> 当前阶段：P0 技术验证优先
> 优先级：P0
> 核心原则：独立新增、可验证、可回退、不破坏现有导出链路

---

# 0. Codex 执行总指令

本 PRD 的第一目标不是一次性完成全部功能，而是验证一条新的 CueCut 导出技术路线：

**让 CueCut 动效按正常时间轴实时播放，同时把独立的纯净播放窗口实时捕获并录制成带色度背景的普通视频，以剪映 / CapCut 色度抠像代替透明 Alpha 视频。**

必须严格遵守：

1. 不得破坏现有 Alpha MOV / ProRes 4444 / 当前 Export 功能。
2. 不得为了本功能大规模重构 CueCut。
3. P0 阶段不得引入 Windows Native Capture。
4. P0 阶段不得强制实现 WebCodecs。
5. P0 阶段不得因 MP4/H.264 支持问题阻塞技术验证。
6. 如运行环境只能稳定输出 WebM，P0 可以先输出 WebM。
7. 不读取、不复制、不迁移 LosslessCut、Overlay Studio 或其他竞品源码。
8. 可以使用 Electron、Chromium、Web API、FFmpeg 等公开标准能力。
9. 必须对现有仓库先做结构扫描，再决定文件落点。
10. 本 PRD 中给出的目录只是推荐结构，不允许为了符合 PRD 而强行重构项目。
11. 每完成一个阶段必须运行真实测试，不得只依赖单元测试。
12. 如果 P0 核心验收失败，应停止继续开发 P1/P2，而不是堆更多功能掩盖根本问题。
13. 所有实验性能力必须能够被 Feature Flag 关闭。
14. 所有临时文件、失败文件、日志必须可追踪、可清理。
15. 不得向用户显示一个已经掉帧或严重不同步的文件为“成功导出”。

---

# 1. 项目背景

CueCut 当前已经具备或正在开发：

- Timeline
- 动效系统
- Overlay / Motion
- 文本动画
- 图片素材
- 视频素材
- Alpha 透明视频导出
- 普通视频导出
- ProRes 4444 MOV 等专业导出路径

当前透明视频导出的主要问题之一：

**透明 Alpha 导出通常需要逐帧渲染和高成本编码，导出速度远低于实时播放速度。**

例如：

```text
60 秒动效

传统 Alpha Render
↓
逐帧 Render
↓
编码
↓
可能需要数分钟
```

但 CueCut 本身在预览状态通常已经可以：

```text
60 秒 Timeline
↓
实时播放 60 秒
```

因此提出新的导出路线：

```text
CueCut 实时播放
+
纯色背景
+
独立 Capture Scene
+
实时录制
↓
普通视频
↓
剪映 / CapCut 色度抠像
```

目标：

```text
60 秒内容
≈
60 秒左右完成导出
```

而不是数分钟。

---

# 2. 产品定位

本功能不是现有 Alpha Export 的替代品。

最终产品定位：

## CueCut Export Modes

### 模式 A

```text
极速抠像
Realtime Chroma Capture
```

特点：

- 导出速度接近实时
- 普通视频
- 通过剪映 / CapCut 色度抠像去背景
- 适合大多数实心 UI 动效
- 不适合严重半透明、Glow、Blur 等素材

---

### 模式 B

```text
专业透明
Alpha Export
```

特点：

- 真透明
- 高质量
- 支持复杂透明度
- 支持 Glow / Blur / 半透明
- 导出较慢

---

### 模式 C

```text
普通视频
Normal Export
```

特点：

- 最终成片输出
- 无透明需求

---

# 3. 产品核心目标

Realtime Chroma Capture 必须回答以下问题：

1. CueCut 能否稳定创建一个纯净播放场景？
2. Capture Scene 能否与真实 Timeline 完全同步？
3. 1920×1080 30FPS 能否稳定实时捕获？
4. 是否能做到 0 掉帧？
5. 是否能准确控制第一帧？
6. 是否能准确控制最后一帧？
7. 长时间录制是否出现 Timeline Drift？
8. 输出能否被剪映 / CapCut 正常导入？
9. 抠像后文字、卡片、图形边缘是否可接受？
10. 相比 Alpha MOV，速度提升是否足够显著？

---

# 4. P0 成功定义

P0 成功不等于：

```text
代码可以运行
```

P0 成功必须满足：

```text
真实 CueCut Timeline
+
1920×1080
+
30 FPS
+
固定色度背景
+
实时播放
+
实时捕获
+
自动开始
+
自动停止
+
可输出媒体文件
+
时间轴同步
+
无明显掉帧
```

并取得 Benchmark 数据。

---

# 5. P0 非目标

以下全部不属于 P0：

- 不做完整正式 UI
- 不做 GPU Native Encoder
- 不做 Windows.Graphics.Capture
- 不做复杂色度自动推荐
- 不做复杂 AI 分析
- 不做用户自定义大量 Export Preset
- 不做完整兼容性评分
- 不做所有平台
- 不强求 macOS
- 不强求 Linux
- 不重写整个 Timeline Engine
- 不重写现有 Alpha Export
- 不做超过实时速度导出
- 不做 2× / 4× Capture
- 不做云端 Render
- 不做分布式 Export
- 不强求音频录制
- 不强求 4K
- 不强求 60FPS
- 不为代码“漂亮”进行无关重构

---

# 6. 系统总体架构

推荐抽象：

```text
                           CueCut
                             │
                      Export Planner
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼

 Realtime Capture       Alpha Export       Normal Export
 极速抠像                  专业透明             普通成片

          │
          ▼

  Capture Controller

          │
    ┌─────┼───────────┐
    │     │           │
    ▼     ▼           ▼

 Scene   Clock       Recorder
 Host    Sync        Backend

          │
          ▼

 Health Monitor

          │
          ▼

 Finalizer

          │
          ▼

 Validator

          │
          ▼

 Output
```

---

# 7. 代码结构原则

现有仓库扫描完成后，根据当前工程结构落地。

推荐但不强制：

```text
src/
└─ export/
   ├─ realtime/
   │  ├─ RealtimeCaptureController.ts
   │  ├─ CaptureSceneHost.ts
   │  ├─ CaptureClock.ts
   │  ├─ CaptureStateMachine.ts
   │  ├─ CaptureHealthMonitor.ts
   │  ├─ CaptureTypes.ts
   │  ├─ CaptureLogger.ts
   │  ├─ ChromaBackground.ts
   │  │
   │  └─ backends/
   │     ├─ CaptureBackend.ts
   │     └─ ElectronWindowCaptureBackend.ts
   │
   └─ finalizer/
      ├─ CaptureFinalizer.ts
      └─ OutputValidator.ts
```

如果 CueCut 已有：

```text
ExportService
TimelineController
PreviewRenderer
RenderScene
MediaService
```

优先复用。

禁止为了套目录而产生：

- 重复 Renderer
- 重复 Timeline
- 重复 Project Store
- 重复 Asset Loader

---

# 8. 核心设计：Capture Scene

必须创建：

```text
Capture Scene
```

这是一个独立于主编辑器 UI 的纯播放场景。

它不应该包含：

- 编辑工具栏
- Timeline UI
- 鼠标
- Selection Box
- Resize Handle
- Safe Area
- 辅助线
- Debug 信息
- FPS 面板
- 播放按钮
- Timeline Controls
- Tooltip
- Context Menu
- 任何编辑 UI

只允许：

```text
Chroma Background
+
CueCut Actual Visual Content
```

---

# 9. Capture Scene 数据来源

Capture Scene 不维护第二套项目。

必须读取同一份 Project State：

```text
Project State
     │
     ├── Editor Scene
     │
     └── Capture Scene
```

共享：

- timeline
- tracks
- layers
- motion parameters
- assets
- text
- fonts
- transforms
- opacity
- position
- scale
- rotation
- timing
- image
- video
- SVG
- effect configuration
- scene dimensions
- project FPS

Capture Scene 必须是：

```text
read-only
```

---

# 10. Capture BrowserWindow

Electron 环境下 P0 首选：

```text
BrowserWindow
```

专门作为 Capture Window。

推荐属性：

```text
width = exportWidth
height = exportHeight

frame = false
resizable = false

show = false / off-screen strategy
```

需要根据实际 Electron 捕获行为验证：

- 隐藏窗口是否还能稳定捕获
- 最小化是否影响 Capture
- 被其他窗口覆盖是否影响
- 是否必须显示在屏幕
- GPU 合成状态

如果隐藏窗口不能可靠捕获：

允许：

```text
显示到用户不可干扰位置
```

但不得直接覆盖用户操作。

需要记录最终策略。

---

# 11. P0 默认参数

固定参数：

```text
Resolution:
1920×1080

FPS:
30

Background:
#00FF00

Audio:
OFF

Duration:
Timeline Duration

Container:
自动探测

Quality:
高
```

优先不做大量配置。

---

# 12. Capture Backend 抽象

必须定义接口，避免未来绑定单一实现。

建议：

```ts
interface CaptureBackend {
  prepare(options): Promise<void>;

  start(): Promise<void>;

  getStats(): CaptureBackendStats;

  stop(): Promise<CaptureResult>;

  cancel(): Promise<void>;

  dispose(): Promise<void>;
}
```

---

# 13. P0 Capture Backend

第一实现：

```text
ElectronWindowCaptureBackend
```

基本流程：

```text
Capture BrowserWindow
↓
Media Source ID
↓
MediaStream
↓
MediaRecorder
↓
File
```

如现有 Electron 架构更适合其他方式，可调整。

但不得为了 P0 引入复杂 Native Module。

---

# 14. MediaRecorder 编码策略

运行时必须探测：

```text
MediaRecorder.isTypeSupported()
```

建议候选顺序：

```text
video/mp4;codecs=avc1
video/mp4
video/webm;codecs=h264
video/webm;codecs=vp9
video/webm;codecs=vp8
video/webm
```

实际字符串由 Chromium 能力决定。

必须：

```text
Feature Detection
```

禁止硬编码假定当前平台一定支持 H.264 MP4。

---

# 15. P0 Container 原则

如果：

```text
MP4
```

能可靠产生：

优先 MP4。

如果：

```text
MP4 不支持
```

但：

```text
WebM 可以稳定 Capture
```

P0：

允许输出 WebM。

因为 P0 重点是验证：

- Timeline
- FPS
- Capture
- Drift
- Quality
- Real-time Performance

而不是为 MP4 封装阻塞项目。

---

# 16. Export State Machine

必须实现显式状态机。

禁止到处：

```text
boolean isRecording
boolean isReady
boolean playing
```

拼凑流程。

推荐：

```text
IDLE
↓
PREPARING
↓
LOADING_ASSETS
↓
WARMING_UP
↓
RECORDER_ARMED
↓
TIMELINE_ARMED
↓
CAPTURING
↓
PLAYING
↓
END_PENDING
↓
STOPPING
↓
FINALIZING
↓
VALIDATING
↓
SUCCESS
```

错误：

```text
FAILED
```

取消：

```text
CANCELLED
```

---

# 17. PREPARING

工作：

- 创建 Capture Window
- 创建 Capture Scene
- 建立 Project State 连接
- 设置分辨率
- 设置 FPS
- 设置背景颜色
- 禁用编辑功能
- 初始化日志
- 创建 Job ID

状态输出：

```text
Preparing realtime capture...
```

---

# 18. LOADING_ASSETS

必须确认：

- 图片完成 decode
- fonts loaded
- SVG ready
- video metadata loaded
- video first frame ready
- animation resources ready

建议 timeout。

例如：

```text
ASSET_LOAD_TIMEOUT
```

资产加载失败：

```text
FAILED
```

不得继续导出一个缺素材文件。

---

# 19. WARMING_UP

目的：

防止第一次 Render：

- shader compile
- font render
- browser layout
- image decode
- GPU initialization

影响第一帧。

流程：

```text
Timeline = 0
↓
Render Frame 0
↓
等待 RAF
↓
再 Render
↓
等待场景稳定
```

可设置：

```text
warmupFrames = 2~5
```

最终 Benchmark 后调整。

---

# 20. RECORDER_ARMED

Recorder 进入 Ready 状态。

必须确保：

```text
MediaStream Ready
MediaRecorder Ready
File Sink Ready
```

但：

```text
Timeline
```

仍停在：

```text
0
```

---

# 21. TIMELINE_ARMED

设置：

```text
Timeline Position = 0
```

所有 Motion：

```text
time = 0
```

然后明确绘制第一帧。

---

# 22. CAPTURING

顺序必须：

```text
Recorder START
↓
下一帧同步点
↓
Timeline START
```

而不是：

```text
Timeline START
↓
Recorder START
```

目标：

避免首帧缺失。

---

# 23. PLAYING

所有时间计算应该尽量由统一：

```text
CaptureClock
```

驱动。

不要出现：

```text
CSS 时间
视频时间
Timeline 时间
Recorder 时间
setTimeout 时间
```

互相完全独立。

---

# 24. CaptureClock

目标：

建立统一逻辑时间。

推荐：

```text
captureStart = performance.now()
```

然后：

```text
timelineTime =
performance.now() - captureStart
```

或者复用 CueCut 当前已经稳定的 Timeline Clock。

原则：

```text
one authoritative timeline clock
```

---

# 25. Timeline Drift

定义：

```text
drift =
actual timeline time
-
expected capture time
```

必须持续记录：

```text
maxDrift
averageDrift
finalDrift
```

P0 目标：

```text
≤ 1 frame
```

30FPS：

```text
1 frame = 33.333 ms
```

---

# 26. END_PENDING

Timeline 达到：

```text
duration
```

后不能马上 Recorder Stop。

必须：

```text
Timeline = duration
↓
Render Final Frame
↓
等待 RAF / Commit
↓
确认最终画面已进入 Capture
↓
Stop Recorder
```

目标：

避免最后一帧丢失。

---

# 27. STOPPING

工作：

```text
stop recorder
flush chunks
wait dataavailable
final blob
```

必须避免：

```text
stop()
↓
立即关闭 Window
```

导致尾部丢数据。

---

# 28. FINALIZING

负责：

- 组装文件
- 保存临时媒体
- container finalization
- metadata
- optional remux

原则：

如果只是容器或 metadata：

优先：

```text
stream copy
```

避免再次编码。

---

# 29. VALIDATING

至少验证：

- 文件存在
- size > 0
- duration 合理
- 文件可读
- container 合理
- captured duration
- expected duration
- frame stats
- dropped frame
- capture error

不得只检查：

```text
file exists
```

---

# 30. 临时文件机制

禁止边录直接写：

```text
final-output.mp4
```

推荐：

```text
CueCut Temp
└─ realtime-capture
   └─ <job-id>
      ├─ capture.tmp
      ├─ capture.webm
      ├─ export-state.json
      └─ capture.log
```

成功：

```text
validate
↓
atomic move / rename
↓
final output
```

失败：

- 标记失败
- 清理损坏输出
- Debug 模式保留日志
- 正式模式按策略清理 temp

---

# 31. Job 数据模型

建议：

```ts
interface RealtimeCaptureJob {
  jobId: string;

  projectId?: string;

  outputPath: string;

  width: number;
  height: number;

  fps: number;

  durationMs: number;

  chromaColor: string;

  state: CaptureState;

  startedAt?: number;
  endedAt?: number;

  error?: CaptureError;
}
```

---

# 32. Capture Result

建议：

```ts
interface CaptureResult {
  success: boolean;

  outputPath?: string;

  container?: string;
  codec?: string;

  width: number;
  height: number;
  fps: number;

  expectedDurationMs: number;
  actualDurationMs: number;

  expectedFrames: number;
  observedFrames?: number;

  droppedFrames?: number;

  maxTimelineDriftMs?: number;

  wallClockMs: number;

  fileSizeBytes?: number;

  warnings: CaptureWarning[];
}
```

---

# 33. Capture Health Monitor

必须实现：

```text
CaptureHealthMonitor
```

P0 至少记录：

- expected FPS
- actual FPS estimate
- expected frame count
- observed frame count
- dropped frame estimate
- timeline drift
- wall clock
- recording duration
- timeline duration
- file size
- errors
- warnings

---

# 34. 掉帧定义

P0 可使用近似算法。

例如：

```text
expectedFrameInterval =
1000 / FPS
```

每次动画更新检查：

```text
delta
```

如果：

```text
delta > 1.5 × expectedFrameInterval
```

记：

```text
potentialDroppedFrame
```

注意：

这只是应用侧估计。

如果底层 API 能提供真实 Capture Frame Stats：

优先使用真实值。

---

# 35. Capture 健康等级

建议：

```text
HEALTHY
WARNING
FAILED
```

例如：

## HEALTHY

```text
Dropped Frame = 0
Drift <= 1 frame
Duration Difference <= 1 frame
```

## WARNING

```text
Dropped Frames <= 少量
Drift > 1 frame
```

## FAILED

```text
明显掉帧
严重 duration mismatch
Recorder error
file invalid
```

---

# 36. 严禁错误成功

禁止出现：

```text
捕获 60 秒
实际只输出 53 秒

→ Export Success
```

应该：

```text
Capture validation failed
```

然后：

```text
FAILED
```

---

# 37. 用户取消

即使 P0 只是开发入口，也必须支持：

```text
cancel
```

取消流程：

```text
stop timeline
↓
stop recorder
↓
flush
↓
close capture window
↓
dispose stream
↓
delete incomplete media
↓
state = CANCELLED
```

不能残留：

- BrowserWindow
- MediaStream
- Timer
- EventListener
- Temp handle

---

# 38. Background

P0 固定：

```text
#00FF00
```

确保整个 Scene：

```text
opaque
```

不要输出透明背景。

---

# 39. P1 Background Presets

P1/P2 再加入：

```text
Green
#00FF00

Blue
#0000FF

Magenta
#FF00FF

Custom
```

---

# 40. 为什么不做纯绿色唯一方案

如果动效本身存在：

```text
green
```

剪映抠像会损坏内容。

因此正式版需要：

```text
Chroma Color Selector
```

但 P0 先用绿色验证技术。

---

# 41. P4 Chroma Eligibility Analyzer

后续实现：

```text
ChromaEligibilityAnalyzer
```

扫描项目。

重点属性：

```text
opacity
blur
filter
drop-shadow
box-shadow
text-shadow
mix-blend-mode
backdrop-filter
semi-transparent image
gradient alpha
particle
glow
motion blur
```

---

# 42. 风险评级

建议：

| 类型 | 风险 |
|---|---|
| 实心文字 | Low |
| 实心 SVG | Low |
| 实心卡片 | Low |
| 箭头 | Low |
| 进度条 | Low |
| JPG | Low |
| 实心 PNG | Low |
| box-shadow | Medium |
| text-shadow | Medium |
| 半透明 PNG | Medium |
| opacity < 1 | High |
| blur | High |
| glow | High |
| backdrop-filter | High |
| blend mode | High |
| soft particle | High |
| smoke | High |
| motion blur | High |

---

# 43. Eligibility Score

未来：

```text
0–100
```

例如：

```text
93

非常适合极速抠像
```

```text
72

可以使用，部分效果可能受损
```

```text
45

不建议极速抠像，请使用透明 Alpha
```

---

# 44. H.264 抠像风险

正式测试必须重点检查：

```text
chroma subsampling
```

特别：

```text
4:2:0
```

可能导致绿色背景与白色文字边缘产生：

- green spill
- fuzzy edge
- halo

因此不能只测试：

```text
视频能播放
```

还要测试：

```text
剪映抠像后
```

---

# 45. Bitrate Benchmark

如果最终为 H.264：

1080P 30：

```text
15 Mbps
25 Mbps
40 Mbps
```

1080P 60：

```text
25 Mbps
40 Mbps
60 Mbps
```

不是正式默认值。

用于 Benchmark。

最终依据：

```text
Edge Quality
+
File Size
+
Encoder Performance
```

决定。

---

# 46. P0 Benchmark Test Set

必须建立固定测试项目。

---

## Test A — Basic UI Motion

包含：

- Text
- Card
- Arrow
- Progress Bar

目的：

```text
基础稳定性
```

时长：

```text
10 seconds
```

---

## Test B — Fast Motion

包含：

- slide
- scale
- spring
- fast position movement
- easing

目的：

```text
检查高速动画掉帧
```

---

## Test C — Complex DOM

包含：

- 多文本
- 多卡片
- SVG
- 多图层

目的：

```text
Chromium DOM 压力
```

---

## Test D — Images

包含：

- PNG
- JPG
- Screenshot
- Icon

目的：

```text
Asset Decode
```

---

## Test E — Chroma Risk

包含：

- blur
- glow
- opacity
- shadow

目的：

```text
与 Alpha MOV 质量比较
```

---

## Test F — Long Duration

至少：

```text
5 min
```

后续：

```text
10 min
```

检查：

- drift
- memory
- recorder stability
- long capture
- encoder stability

---

# 47. Benchmark Metrics

必须输出：

```text
Project duration
Export wall-clock time
Realtime ratio

Expected frames
Actual / estimated frames
Dropped frames

Average FPS
Minimum FPS if available

Max timeline drift
Final drift

Output codec
Container
Bitrate if available
File size

CPU if easily available
Memory usage
```

---

# 48. Realtime Ratio

定义：

```text
realtimeRatio =
wallClockExportDuration
/
timelineDuration
```

例如：

```text
60 秒项目
63 秒完成

ratio = 1.05×
```

目标：

```text
≈ 1.0×
```

允许初始化增加少量固定时间。

---

# 49. P0 验收指标

## 必须

```text
1920×1080
30 FPS
```

---

## 时间

```text
10 秒内容：

约 10 秒
+
初始化
```

```text
60 秒内容：

约 60 秒
+
初始化
```

---

## FPS

目标：

```text
30 FPS stable
```

---

## 掉帧

目标：

```text
0
```

P0 最大验收：

```text
不能出现明显肉眼掉帧
```

---

## Timeline Drift

```text
≤ 1 frame
```

即 30FPS：

```text
≤33.333ms
```

---

## 首帧

```text
≤1 frame error
```

---

## 尾帧

```text
≤1 frame error
```

---

## UI 污染

必须：

```text
0
```

禁止出现：

- Toolbar
- Timeline
- Cursor
- Selection
- Safe area
- Debug

---

# 50. P0 最重要的人工验收

必须人工执行：

```text
导出
↓
导入剪映 / CapCut
↓
色度抠图
↓
观察边缘
```

测试：

- 白色文字
- 小字体
- 边缘锐利 SVG
- 圆角卡片
- 箭头
- Icon
- 阴影
- Blur
- Glow

---

# 51. 与 Alpha MOV 对比

使用同一个 CueCut Project：

```text
Realtime Chroma
vs
Alpha MOV
```

比较：

| Metric | Alpha MOV | Realtime |
|---|---:|---:|
| Export Time | | |
| File Size | | |
| CPU | | |
| Memory | | |
| Visual Quality | | |
| Edge Quality | | |
| Timeline Accuracy | | |
| Ease of Use | | |

---

# 52. P0 Go / No-Go Gate

只有满足：

```text
1080P30 稳定
+
接近实时
+
Timeline Drift 合格
+
无严重掉帧
+
剪映抠像可接受
```

才进入：

```text
P1
```

如果：

```text
严重掉帧
```

先优化 Capture。

如果：

```text
Capture 稳定但 Chroma 质量完全不可接受
```

应重新评估路线。

禁止直接进入正式产品开发。

---

# 53. P1：真实项目全面接入

目标：

让：

```text
Editor Preview
```

和：

```text
Capture Scene
```

输出一致。

必须覆盖：

- Motion Effect
- Text
- SVG
- Image
- Position
- Scale
- Rotation
- Opacity
- Mask（如有）
- Timeline In/Out
- Layer Z-Index

---

# 54. P2：正式 Export Pipeline

正式加入：

```text
Export Planner
```

内部选择：

```text
Realtime Chroma
Alpha
Normal
```

---

# 55. Export Preset

未来：

```ts
type ExportMode =
  | "realtime-chroma"
  | "alpha"
  | "normal";
```

---

# 56. 正式 UI

建议：

```text
导出
```

新增：

# 极速抠像

说明：

```text
以接近实时速度导出普通视频。
适合在剪映 / CapCut 使用色度抠像。
```

---

# 57. 正式 UI 配置

```text
分辨率

1920×1080
```

```text
帧率

30
60
```

```text
抠像背景

自动
绿色
蓝色
洋红
自定义
```

```text
质量

标准
高质量
```

---

# 58. Export Progress

正式 UI：

```text
正在极速导出

00:27 / 01:00

████████████░░░

Capture FPS:
30.0

Dropped Frames:
0

Status:
正常
```

---

# 59. Warning UI

例如：

```text
当前项目包含半透明效果：

• Glow
• Blur
• Shadow

色度抠像可能导致边缘损失。

[继续极速导出]

[切换专业透明导出]
```

---

# 60. 自动 Chroma Color 推荐

未来对项目所有主要颜色进行扫描。

候选：

```text
#00FF00
#0000FF
#FF00FF
#00FFFF
```

计算：

```text
color distance
```

选择与前景：

```text
最大差异
```

的颜色。

---

# 61. Color Scan

至少检查：

- text color
- fill
- background
- SVG fill
- SVG stroke
- asset dominant colors（后期）

P0 不做。

---

# 62. Encoder V2

如果 MediaRecorder 不够稳定：

升级：

```text
WebCodecs
```

架构：

```text
Capture Frames
↓
VideoFrame
↓
VideoEncoder
↓
H.264
↓
MP4 Mux
```

---

# 63. Hardware Encoding

未来尝试：

```text
hardwareAcceleration:
prefer-hardware
```

目标：

支持：

- Intel
- NVIDIA
- AMD

但必须：

```text
feature detection
```

不能假设 GPU 一定可用。

---

# 64. Windows Native Capture

仅在 Electron Capture 证明存在瓶颈时才考虑。

未来：

```text
Windows.Graphics.Capture
+
D3D11
+
Hardware Encoder
```

目的：

- 更稳定 Capture
- 更低 CPU
- 更低 copy
- GPU path

不属于 V1。

---

# 65. Canvas Capture Backend

如果未来 CueCut Render Engine 高度 Canvas 化：

可以加入：

```text
CanvasCaptureBackend
```

例如：

```text
canvas.captureStream()
```

Backend interface 保持一致。

---

# 66. Fast-than-Realtime Future

V2/V3 研究：

```text
2× Timeline
+
60 FPS Capture
↓
重新映射为 30FPS
```

实现：

```text
60秒
≈
30秒
```

未来甚至：

```text
4×
```

但严禁 P0 实现。

---

# 67. Logging

每一个 Capture Job 必须日志化。

至少：

```text
jobId
project
resolution
fps
duration
mime type
codec
capture backend
state transitions
timestamps
warnings
errors
drift
dropped frames
output
```

---

# 68. 日志示例

```text
[RealtimeCapture]

job=abc123

PREPARING
1920x1080@30

LOADING_ASSETS

WARMING_UP

RECORDER_ARMED

CAPTURE_START

TIMELINE_START

duration=10000

TIMELINE_END

CAPTURE_STOP

VALIDATING

expected=10.000s
actual=10.021s

expectedFrames=300
estimatedFrames=300

droppedFrames=0

maxDrift=12ms

SUCCESS
```

---

# 69. Error Codes

建议统一：

```text
CAPTURE_WINDOW_CREATE_FAILED

CAPTURE_SOURCE_NOT_FOUND

MEDIA_STREAM_FAILED

MEDIA_RECORDER_UNSUPPORTED

MEDIA_RECORDER_START_FAILED

ASSET_LOAD_TIMEOUT

TIMELINE_START_FAILED

CAPTURE_DROPPED_FRAMES

CAPTURE_DRIFT_EXCEEDED

OUTPUT_WRITE_FAILED

OUTPUT_INVALID

CAPTURE_CANCELLED
```

---

# 70. Error Message

开发日志：

```text
technical message
```

正式 UI：

```text
human friendly message
```

禁止直接显示：

```text
DOMException...
```

---

# 71. Feature Flag

P0 必须放在：

```text
realtimeChromaCapture
```

Feature Flag 下。

默认行为根据开发阶段决定：

开发：

```text
true
```

正式生产：

在验证前：

```text
false
```

---

# 72. Debug Entry

P0 可使用：

```text
Developer Menu
```

例如：

```text
Experimental
→ Realtime Chroma Capture
```

而不是马上放正式 Export UI。

---

# 73. Debug Panel

允许展示：

```text
FPS
Drift
State
Dropped Frames
Mime
Codec
File Size
```

注意：

Debug Panel 不得进入 Capture Scene。

---

# 74. 资源释放

每次：

```text
success
failure
cancel
```

都必须执行：

```text
MediaStreamTrack.stop()

Recorder cleanup

RAF cancel

Timer clear

Event listener remove

Capture Window close

Object URL revoke

file handle close
```

---

# 75. Memory Leak 测试

循环执行：

```text
10 次
```

10 秒 Capture。

观察：

```text
memory
```

不能线性增长。

---

# 76. Crash Recovery

如果应用异常退出：

Temp 目录可能存在：

```text
unfinished job
```

下次启动：

允许：

```text
cleanup stale capture temp
```

P0 可简单实现 TTL 清理。

---

# 77. 文件命名

建议：

```text
<ProjectName>_Chroma_<timestamp>.mp4
```

或 WebM：

```text
<ProjectName>_Chroma_<timestamp>.webm
```

禁止覆盖已有文件，除非用户确认。

---

# 78. P0 开发步骤

Codex 必须按顺序执行。

---

## Step 1

仓库审查。

定位：

- Electron main
- renderer
- BrowserWindow 创建
- Project Store
- Timeline
- Preview Renderer
- Export
- Media
- Asset Loader

输出：

```text
P0_ARCHITECTURE_NOTES.md
```

记录复用点。

---

## Step 2

建立 Realtime Capture 模块骨架。

只创建必要文件。

---

## Step 3

创建 Capture BrowserWindow。

验证：

```text
1920×1080
绿色背景
```

---

## Step 4

让 Capture Window 加载真实 CueCut Scene。

先不录制。

人工比较：

```text
Editor
vs
Capture Scene
```

---

## Step 5

接入真实 Timeline。

验证：

```text
play
pause
seek 0
duration
```

---

## Step 6

实现 MediaStream Capture。

---

## Step 7

实现 MediaRecorder。

---

## Step 8

实现 State Machine。

---

## Step 9

实现精确 Start / Stop。

---

## Step 10

实现 Health Monitor。

---

## Step 11

实现 Temp File。

---

## Step 12

实现 Output Validator。

---

## Step 13

完成 Basic Benchmark。

---

## Step 14

完成 60 秒测试。

---

## Step 15

完成剪映人工色度抠像测试。

---

## Step 16

形成：

```text
P0_REALTIME_CAPTURE_REPORT.md
```

---

# 79. P0_REALTIME_CAPTURE_REPORT.md

必须包含：

# Environment

```text
OS
CPU
GPU
RAM
Electron
Chromium
```

---

# Capture Backend

```text
implementation
codec
container
```

---

# Test Results

```text
10s
60s
```

---

# Metrics

```text
FPS
Dropped Frames
Drift
Wall Time
File Size
```

---

# Chroma Test

```text
CapCut / 剪映

Text Edge:
Pass / Fail

SVG:
Pass / Fail

Card:
Pass / Fail

Glow:
Pass / Fail
```

---

# Recommendation

只能：

```text
GO
```

或：

```text
NO-GO
```

或：

```text
GO WITH CONDITIONS
```

---

# 80. P0 自动测试

尽可能增加：

- State Machine test
- CaptureClock test
- Duration validation
- Drift calculation
- error cleanup
- cancel cleanup
- temp file handling

但不要为了单元测试模拟整个 MediaRecorder。

真实媒体验证优先。

---

# 81. P0 手动测试清单

必须逐项：

- [ ] Capture Window 正常创建
- [ ] Capture Scene 无编辑器 UI
- [ ] 背景纯绿色
- [ ] Timeline 从 0 开始
- [ ] 第一帧存在
- [ ] Timeline 自动播放
- [ ] Timeline 正确结束
- [ ] 最后一帧存在
- [ ] Recorder 自动停止
- [ ] 文件成功写入
- [ ] 文件可播放
- [ ] 1080P 正确
- [ ] FPS 基本正确
- [ ] 无明显掉帧
- [ ] 无明显漂移
- [ ] 取消正常
- [ ] 失败不留损坏正式文件
- [ ] Capture Window 正确释放
- [ ] 连续导出不泄漏
- [ ] 原 Alpha Export 不受影响

---

# 82. Regression

必须确认：

```text
Existing Alpha Export
```

可以正常使用。

```text
Normal Export
```

可以正常使用。

```text
Preview
```

可以正常使用。

```text
Editor Timeline
```

没有被 Capture Clock 改坏。

---

# 83. 禁止共享全局 Timeline 导致副作用

如果主 Editor 正在打开：

Realtime Capture 不应该导致：

```text
编辑器 Timeline 自动跳动
```

除非现有架构本身就是一个共享 Timeline。

理想情况：

```text
Capture playback instance
```

拥有自己的：

```text
playback clock
```

但读取同一 Project State。

---

# 84. 数据一致性

开始 Export 时：

建议建立：

```text
Project Snapshot
```

防止用户导出期间改：

- Timeline
- Text
- Layer
- Timing

导致 Capture 中途数据变化。

P0 如果现有系统不好做 Snapshot：

至少在 Capture 时：

```text
锁定项目修改
```

或：

```text
复制当前 serializable project state
```

---

# 85. Asset Mutation

不能导出一半时：

```text
用户删除 Asset
```

导致文件异常。

正式方案：

```text
Export Snapshot
```

优先。

---

# 86. 视频素材同步

如果 Capture Scene 内有 Video Element：

必须确认：

```text
video time
```

与：

```text
Timeline
```

同步。

不能只：

```text
video.play()
```

完全自由播放。

后续可能需要：

```text
timeline-driven video sync
```

P0 Basic Benchmark 可以暂不包含复杂视频素材。

---

# 87. CSS Animation 风险

如果 CueCut Motion Engine 使用原生 CSS Animation：

检查：

```text
animation clock
```

是否与 Timeline 严格一致。

如果不一致：

优先使用当前 CueCut Timeline 驱动的 Motion State。

禁止为了 Capture 创建第二套 Motion Engine。

---

# 88. Fonts

Capture 开始之前必须：

```text
document.fonts.ready
```

或当前框架等效机制。

避免首帧：

```text
fallback font
```

然后切换字体。

---

# 89. Images

图片必须：

```text
decode()
```

优先提前完成。

否则第一秒可能出现：

```text
blank
→
image
```

---

# 90. Capture Resolution

必须锁：

```text
logical scene dimensions
```

和：

```text
output dimensions
```

不要被：

- Windows DPI
- display scaling
- BrowserWindow scaling
- devicePixelRatio

意外改变。

---

# 91. DPI Test

Windows：

测试：

```text
100%
125%
150%
```

至少确认 Capture 分辨率仍然：

```text
1920×1080
```

而不是受桌面 DPI 影响。

---

# 92. Window Occlusion

测试：

- Capture Window 被主窗口覆盖
- Capture Window 在屏幕外
- Capture Window hidden
- Capture Window minimized

确定 Electron Capture 的实际稳定工作模式。

把结果写入：

```text
P0_REALTIME_CAPTURE_REPORT.md
```

---

# 93. 主显示器之外测试

如果用户多显示器：

Capture 不应该依赖主显示器分辨率。

P0 如暂不支持：

记录为限制。

---

# 94. Performance

避免 Capture Scene 内：

- devtools
- debug overlay
- React strict debug behavior
- 不必要 observers
- 不必要 editor event listeners

目标：

最轻播放状态。

---

# 95. 用户界面正式文案建议

功能名：

```text
极速抠像
```

副标题：

```text
接近实时速度导出，适合剪映/CapCut 色度抠像
```

不要把核心产品文案写成：

```text
录屏导出
```

底层虽然使用 Capture 技术，但产品语义：

```text
Realtime Export
```

---

# 96. 与 Alpha Export 的推荐逻辑

以后：

```text
Project
↓
Chroma Analyzer
```

如果：

```text
Low Risk
```

推荐：

```text
极速抠像
```

如果：

```text
High Risk
```

推荐：

```text
专业透明
```

---

# 97. 最终产品体验

用户不需要理解：

- MediaRecorder
- H.264
- WebM
- Alpha
- 4:2:0

产品应该只告诉用户：

```text
极速
```

或：

```text
专业透明
```

并给风险提示。

---

# 98. 后续 Phase Roadmap

## P0

技术验证。

---

## P1

真实 Timeline 全量兼容。

---

## P2

正式 Export Pipeline。

---

## P3

正式 UI。

---

## P4

Chroma Compatibility Analyzer。

---

## P5

WebCodecs / Hardware Encoder。

---

## P6

Windows Native Capture。

---

## P7

Fast-than-Realtime。

---

# 99. P0 Definition of Done

以下全部满足才算完成：

- [ ] 独立 Realtime Capture 模块
- [ ] 不破坏现有 Alpha Export
- [ ] Capture BrowserWindow
- [ ] 真实 CueCut Scene
- [ ] 1920×1080
- [ ] 30FPS
- [ ] 固定绿色背景
- [ ] Timeline 自动开始
- [ ] Recorder 自动开始
- [ ] Recorder 与 Timeline 同步
- [ ] Timeline 自动结束
- [ ] Recorder 自动结束
- [ ] 输出媒体文件
- [ ] 首帧正确
- [ ] 尾帧正确
- [ ] Drift 记录
- [ ] Dropped Frames 记录
- [ ] Temp File
- [ ] Validator
- [ ] Cancel
- [ ] Cleanup
- [ ] 10秒真实 Benchmark
- [ ] 60秒真实 Benchmark
- [ ] 剪映/CapCut 人工抠像测试
- [ ] Alpha Export Regression
- [ ] P0_REALTIME_CAPTURE_REPORT.md
- [ ] GO / NO-GO 结论

---

# 100. AI Autonomous Project Ledger 使用要求

如果本项目通过 AI Autonomous Project Ledger Skill 执行：

建议角色：

```text
R01 — Architecture
R02 — Electron Capture
R03 — Timeline / Motion Sync
R04 — Media Recording
R05 — Quality / Benchmark
R06 — Regression / QA
```

---

# 101. 角色职责

## R01 Architecture

负责：

- Repo architecture scan
- integration point
- module boundaries
- avoid unnecessary refactor

---

## R02 Electron Capture

负责：

- BrowserWindow
- MediaSource
- MediaStream
- window lifecycle

---

## R03 Timeline

负责：

- CaptureClock
- first frame
- last frame
- drift

---

## R04 Media

负责：

- MediaRecorder
- codec detection
- file output
- finalizer

---

## R05 Quality

负责：

- health monitor
- benchmarks
- chroma test

---

## R06 QA

负责：

- regression
- cleanup
- cancel
- long-duration test

---

# 102. Codex 必须向用户索取的真实测试条件

规划结束以后，如果缺失，可向用户提出一次素材需求。

可以请求：

```text
1. 一个 10 秒 CueCut Basic Motion Project

2. 一个 60 秒真实口播动效 Project

3. 包含：
   Text
   Card
   Arrow
   SVG
   PNG

4. 一个包含：
   Glow
   Blur
   Shadow
   Opacity
   的高风险测试 Project

5. 用户用于剪映/CapCut 抠像的真实测试环境
```

如果已有项目数据，不重复索取。

---

# 103. 禁止事项

本开发过程中禁止：

- 修改现有 Alpha Export 核心行为
- 删除现有 Export
- 将实验 Feature 默认强制给所有用户
- 大规模 UI 重构
- 大规模 Timeline 重构
- 大规模 Motion Engine 重构
- 为 P0 编写 Windows Native Module
- 为 P0 做 AI Chroma Analyzer
- 为 P0 强做 4K
- 为 P0 强做 60FPS
- 为 P0 强做音频
- 为 P0 强做 MP4
- 发现 WebM 可行却因 MP4 暂不可用判定 Capture 技术失败
- 仅用假数据宣称完成
- 仅靠单元测试宣称完成
- 没有真实媒体文件就关闭任务
- 有严重掉帧仍标记 SUCCESS
- 有严重 Timeline Drift 仍标记 SUCCESS

---

# 104. 关键工程原则

整个功能优先级如下：

```text
正确播放
>
正确同步
>
稳定 Capture
>
零掉帧
>
可靠输出
>
抠像质量
>
MP4
>
UI
>
高级优化
```

不要反过来。

---

# 105. 最终判定逻辑

## GO

如果：

```text
1080P30 stable

≈1× realtime

Dropped frame ≈ 0

Timeline drift <=1 frame

Cutout quality acceptable
```

继续 P1。

---

## GO WITH CONDITIONS

例如：

```text
Capture stable

但 MP4 暂不可用

WebM stable
```

仍可以进入下一阶段，同时单独解决 Container。

---

## NO-GO

如果：

```text
长时间 Capture 大量掉帧
```

或者：

```text
Timeline 无法可靠同步
```

或者：

```text
普通编码视频色度抠图质量完全不可接受
```

停止产品化，输出原因。

---

# 106. 项目完成后的预期架构

最终目标：

```text
                         CueCut
                           │
                    Export Planner
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │

       ▼                   ▼                   ▼

Realtime Chroma       Alpha Export        Normal Export

       │
       ▼

Chroma Eligibility
Analyzer

       │

    Suitable?

  ┌────┴─────┐
  │          │
 YES         NO
  │          │
  │          └─────────→ Recommend Alpha
  │
  ▼

Capture Scene

  │
  ▼

Capture Backend

  │
  ├─ Electron Window
  │
  ├─ Canvas
  │
  └─ Native Windows
       Future

  │
  ▼

Encoder

  │
  ├─ MediaRecorder
  ├─ WebCodecs
  └─ Native GPU
       Future

  │
  ▼

Health Monitor

  │
  ▼

Finalizer

  │
  ▼

Validator

  │
  ▼

MP4 / Media File

  │
  ▼

剪映 / CapCut
色度抠像
```

---

# 107. Codex 第一轮最终任务

现在不要直接执行整个 Roadmap。

第一轮只执行：

# P0 — Realtime Chroma Capture Proof of Concept

必须实现：

```text
真实 CueCut Timeline

+

真实 CueCut Motion

+

1920×1080

+

30FPS

+

#00FF00 背景

+

独立 Capture Scene

+

自动播放

+

自动录制

+

自动结束

+

文件输出

+

FPS 统计

+

Dropped Frame 统计

+

Timeline Drift 统计

+

Wall-clock Export Time

+

Output Validation
```

然后：

```text
同一项目
```

分别运行：

```text
Alpha MOV
```

和：

```text
Realtime Chroma Capture
```

形成真实 Benchmark。

---

# 108. 第一轮交付物

Codex 完成后必须提供：

```text
1.
P0_ARCHITECTURE_NOTES.md
```

```text
2.
Realtime Capture POC Source Code
```

```text
3.
P0_REALTIME_CAPTURE_REPORT.md
```

```text
4.
10 秒 Capture 输出
```

```text
5.
60 秒 Capture 输出
```

```text
6.
Benchmark 数据
```

```text
7.
Regression Test 结果
```

```text
8.
Known Issues
```

```text
9.
GO / NO-GO Recommendation
```

---

# 109. 最终要求

Codex 不应以：

```text
“代码已经写完”
```

作为项目完成标准。

本阶段完成标准只有一个：

> **证明 CueCut 的 Realtime Chroma Capture 在真实 CueCut 动效、真实 Timeline、真实导出环境下，可以稳定接近实时输出，并取得足够好的剪映 / CapCut 抠像结果。**

没有：

```text
真实媒体文件
+
真实 Benchmark
+
真实质量验证
```

本项目不得标记：

```text
DONE
```

---

# END OF PRD
