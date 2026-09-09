# CueCut2 Talking-Head Effects Pack v0.4

本批重点：**字幕高留存 + 关键词强调 + 屏幕指示类动效**。

## 新增 15 个 CueCut 原生候选

### Caption / Karaoke
- CueCutKaraokeCaption
- CueCutCaptionPill

### Text Annotation
- CueCutMarkerUnderline
- CueCutCircleFocus
- CueCutHighlightSwipe
- CueCutBracketCallout

### Keyword Attention
- CueCutKeywordPop
- CueCutAttentionBurst

### Emoji / Reaction
- CueCutEmojiPop
- CueCutReactionBadge

### Callout / Pointer
- CueCutCalloutBubble
- CueCutPointerArrow
- CueCutSpotlightBox

### Focus / Zoom
- CueCutFocusZoom
- CueCutFocusReticle

## 这一批为什么重要

前面的 v0.1-v0.3 解决的是：
- 信息卡
- 数据
- 流程
- 对比
- 工具/产品/价格等结构化表达

v0.4 解决的是口播视频“每 2~5 秒需要一点视觉变化”的问题。

它不应该滥用，而应该服务：
- hook
- keyword
- subtitle beat
- UI tutorial
- emotional emphasis
- attention guidance

## Karaoke Caption

这是本批最重要的组件。

`CueCutKaraokeCaption` 支持每个 word 自带 normalized cue：

```ts
{
  id: "w1",
  text: "自动化",
  cue: { start: 0.30, end: 0.44 }
}
```

未来可以直接从：
- word-level ASR
- SRT 分词
- 字级 timestamp

转换。

如果没有 cue，则使用平均分段 fallback。

## Annotation

MarkerUnderline / CircleFocus / HighlightSwipe 使用 SVG / geometry 直接由 progress 驱动。

优先于网页式 `useInView + CSS animation`，因为 CueCut 需要：
- seek
- pause
- frame export
- deterministic rendering

## Open-source reference

本包保存：
- Magic UI Highlighter
- Rough Notation 参考说明

Magic UI 的 Highlighter 本身使用 Rough Notation，并支持 highlight / underline / box / circle / strike-through / crossed-off / bracket。

CueCut 原生组件没有把 Rough Notation 设为运行时必需依赖，而是借鉴“annotation family”思想，重新实现 frame-driven SVG 版本。
