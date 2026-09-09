# Context Packet｜WI-017

**Role:** R03 Motion Runtime / Renderer  
**Work Item:** `WI-017` — Deterministic motion preview and renderer  
**Current GP:** GP-04/GP-06；依赖 WI-016。

## Goal

让 Editor Preview 和 Canvas renderer 消费同一个纯函数 frame model。每个 effect 在 start/end 与 enter/exit duration 内按 frame/fps 可重复求值，输出真实文本、数字、列表/运动状态，不能再绘制旧占位矩形。覆盖中文 4/8/16/24 字、中文+数字/英文/标点、30fps、9:16 1080×1920 与 16:9 1920×1080。

## Source / allowed paths

PRD §13、§16–18；WI-016 adapter；`src/render/types.ts`。可改 `src/motions/preview.tsx`、`src/motions/runtime.ts`、`src/render/**`、`src/editor/canvas/CanvasStage.tsx`、`tests/render/**`、`tests/editor/canvas-effects.test.tsx`、本 WI docs。禁止 `src/project/schema.ts`、`src/project/store.ts`、`src/app/App.tsx`、`src/editor/timeline/**`、`src/export/**`、`src/motions/registry.ts`。

## Acceptance / tests

同一 Project+time+canvas 得到相同 render model；DOM Preview 与 Canvas render 的 active effects、geometry、content、opacity/transform 一致；视频仍 z0/locked；不使用浏览器随机数或不可控 spring/timer。先写并观察失败测试，再实现；运行 focused render/editor tests、full Vitest、typecheck/build，并保存 synthetic/local render Evidence。

## Real/security

RT-EFX-03、RT-01、RT-02 是本地 host integration；不上传媒体、不加 CDN/在线字体。发现架构边界不清时回报，不改 schema。
