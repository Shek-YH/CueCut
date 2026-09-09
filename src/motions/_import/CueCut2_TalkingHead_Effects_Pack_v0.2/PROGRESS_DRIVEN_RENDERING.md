# CueCut v0.2：Progress-Driven Rendering

## 为什么这一批不使用内部计时器

视频编辑器需要：
- seek 到任意时间
- 逐帧导出
- 回放/暂停
- 变速
- 30/60fps 一致
- 重渲染结果可重复

因此本包的 CueCut 原生组件采用：

```ts
progress: number // 0..1
```

组件是当前进度的纯视觉函数。

## Timeline 适配

假设动效：
- start = 12.0s
- duration = 4.0s
- current = 13.5s

则：

```ts
progress = clamp((13.5 - 12.0) / 4.0, 0, 1)
// 0.375
```

把这个 progress 传入 Effect。

## 下一阶段 Element-Level Cue

Checklist / Steps 不应最终只平均分配时间。

未来 Schema 应支持：

```json
{
  "items": [
    {"text":"打开设置","cue":12.1},
    {"text":"找到 API","cue":15.4},
    {"text":"复制 Key","cue":20.8}
  ]
}
```

Renderer 根据每个 cue 生成独立 itemProgress。

v0.2 的 `segmentProgress()` 仅作为默认预览/无 cue 时的 fallback。
