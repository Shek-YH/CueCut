# v0.6 实装建议

## P0
优先：
1. BrowserWindow
2. TerminalPanel
3. CommandLine
4. CodeBlock
5. CodeHighlight
6. ScreenRecordingFrame
7. LowerThird
8. ChapterMarker

## 组合渲染

这是第一次强烈建议 CueCut 开始支持“Effect Composition”：

```text
Container Effect
  + Content Asset
  + Callout Effect
```

例如：
- BrowserWindow + Screenshot
- BrowserWindow + SpotlightBox + PointerArrow
- CodeBlock + CodeHighlight
- LaptopMockup + ScreenRecordingFrame

不要为了每一种组合复制一个新组件。

## Code tokenization

如果引入 Shiki：
- tokenization 不进入逐帧 renderer 热路径
- 缓存 `{text,color,fontStyle}` token
- Effect JSON 保存 code + language + theme 或缓存 ID
- 导出只消费确定性的 token model

## Terminal

当前 TerminalPanel 不是 xterm emulator。
如果只是视频视觉化，这是优势：更轻、更可控。

未来需要 ANSI terminal replay 时再考虑 xterm.js。

## Lower Third

LowerThird 应进入 Visual Director 的全片身份模板，而不是 AI 每次随意换样式。

可配置：
- speakerIdentityEnabled
- firstAppearanceOnly
- repeatAfterMinutes
- alignment based on face position
