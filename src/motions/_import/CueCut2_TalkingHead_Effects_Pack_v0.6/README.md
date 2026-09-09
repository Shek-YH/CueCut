# CueCut2 Talking-Head Effects Pack v0.6

本批重点：**软件界面 / 浏览器 / 终端 / 代码 / 设备展示 / Lower Third / Chapter Marker**。

## 新增 16 个 CueCut 原生候选

### Window Frames
- CueCutBrowserWindow
- CueCutAppWindow
- CueCutDesktopWindow

### Terminal / Command
- CueCutTerminalPanel
- CueCutCommandLine

### Code
- CueCutCodeBlock
- CueCutCodeTyping
- CueCutCodeHighlight

### Device Frames
- CueCutMobileDevice
- CueCutLaptopMockup
- CueCutCameraFrame
- CueCutScreenRecordingFrame

### UI Presentation
- CueCutUICalloutPanel

### Identity
- CueCutLowerThird
- CueCutNamePlate

### Chapter
- CueCutChapterMarker

## 为什么这一批对 CueCut 很重要

你的口播如果大量涉及：
- ChatGPT
- Codex
- Claude
- GitHub
- API
- VS Code
- Terminal
- Vibe Coding
- 浏览器插件
- AI 软件教程

单纯“字幕 + 卡片”是不够的。

v0.6 让 AI 可以把真实截图、屏幕录制、代码、终端命令包装成更稳定的视觉对象。

## 重要架构原则

这些组件是“容器型 / Wrapper 型 Effect”。

例如：

```text
BrowserWindow
  └─ screenshot / screen recording

LaptopMockup
  └─ BrowserWindow
      └─ screenshot

ScreenRecordingFrame
  └─ FocusZoom
      └─ tutorial video
```

AI 不应该只选择一个“漂亮卡片”，而应该能组合视觉节点。

## Code

v0.6 内置轻量 CodeBlock / CodeTyping / CodeHighlight。

复杂语法高亮建议未来接 Shiki：
- 编辑时预计算 token
- renderer 只消费 tokenized lines
- 不要每帧重新高亮

## Device

本包设备框是通用 CueCut 设计，不复制具体品牌设备外观。
