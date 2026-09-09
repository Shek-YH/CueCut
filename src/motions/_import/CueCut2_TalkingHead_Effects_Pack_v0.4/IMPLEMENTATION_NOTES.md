# CueCut v0.4 实装说明

## P0 实装

推荐优先：
1. KaraokeCaption
2. HighlightSwipe
3. MarkerUnderline
4. KeywordPop
5. PointerArrow
6. SpotlightBox

这 6 个对口播视频体感提升最大。

## Karaoke 与字幕系统

不要把 KaraokeCaption 做成普通 Overlay 卡片。

它最好与现有字幕系统建立一层统一接口：

```text
Caption Track
  -> Caption Segment
      -> Word / Character Cue
          -> Karaoke Visual
```

后续 AI 不需要“选择每个字幕是否用 karaoke”。

可以由 Visual Director 决定：
- 当前视频字幕模式
- 哪些关键词额外强调
- karaoke intensity

## Pointer / Spotlight

这类动效必须和未来 Layout / UI target / object detection 分开。

AI 应输出：
- placementIntent
- target region
- target semantic

不要让 LLM 直接算最终像素。

## FocusZoom

`CueCutFocusZoom` 是 wrapper 型能力。

它适合：
- 截图
- 屏幕录制
- 图片
- UI demo

不要默认对真人脸部大幅 zoom。

## Emoji

EmojiPop / ReactionBadge 只适合：
- 轻松口播
- 小红书/抖音/短视频
- 情绪化内容

Visual Director 应能整体禁止 Emoji，以适配专业/商务风。

## Rough Notation

Magic UI Highlighter 和 Rough Notation 适合做设计/算法参考。
若 Codex 想直接依赖 rough-notation，必须先验证：
- 导出 renderer 中 DOM API 是否可用
- getTotalLength 是否稳定
- seek 时能否精确恢复状态
- CSS animation 是否 deterministic

默认优先采用本包的 progress-driven SVG 原生实现。
