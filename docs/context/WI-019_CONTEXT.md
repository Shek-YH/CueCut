# Context Packet｜WI-019

**Role:** R05 Timeline / Export Integration  
**Work Item:** `WI-019` — Timeline and export integration  
**Current GP:** GP-05/GP-07；依赖 WI-017。

## Goal

所有正式 effect 都能进入 Timeline，移动、trim、复制、删除、预览，并且 Playhead 与 effect timing 独立。Timeline clip 名称/样式来自 Registry；Store 是唯一状态源。导出计划/FFmpeg 命令必须消费统一 renderer contract，明确 30fps frame mapping、9:16/16:9 和 full-video/transparent-mov，不能把 DOM Demo 当导出。

## Allowed / forbidden

允许：`src/editor/timeline/**`、`src/export/**`、必要的 `src/project/store.ts`、时间轴/导出测试和本 WI docs。禁止 `src/motions/**`、`src/editor/effect-library/**`、`src/app/App.tsx`、`src/effects/registry.ts`、`src/render/**`、package/lock。

## Acceptance

测试先 RED 后 GREEN；clip move/trim 边界、Undo、copy/delete（若已有 command contract）、playhead 解耦和 export plan 必须可复核。真实媒体只做本地 host integration，FFmpeg 可执行性记录但不能声称 CapCut/Jianying 下游已通过。无网络/secret。
