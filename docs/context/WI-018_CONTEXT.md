# Context Packet｜WI-018

**Role:** R04 Effect Library UX / Inspector  
**Work Item:** `WI-018` — Effect library, Preview Draft and inspector  
**Current GP:** GP-04；依赖 WI-016/WI-017。

## Goal

在不重设计 V4 原型的前提下，将已注册能力展示到动效库/Effect Lab：文字强调、数字指标、列表步骤、基础运动四类；每项显示名称、用途、标签、预览。Preview 真实使用当前 effect 内容和画幅。参数 common/text/number/list 可编辑。Variant/Motion/Color/Number/List 改动只进入 draft；Cancel 不改主项目；Apply 仅一个 Store Undo transaction。

## Allowed / forbidden

允许：`src/app/App.tsx`、`src/editor/effect-library/**`、`src/editor/inspector/**`、`src/app/layout.css`、相关 tests 与本 WI docs。禁止 `src/motions/**`、`src/render/**`、`src/export/**`、`src/project/schema.ts`；不要修改 V4 的四项导航、Edit 三栏、Effect Lab 三栏和底部 Timeline 信息架构。

## Source / acceptance

PRD §12–14、§21–22；V4 prototype；WI-016/WI-017 contracts；现有 ProjectStore draft/apply API。实现者不得自行标 VERIFIED/ACCEPTED。测试需先 RED；重点验证 registry 全量可见、预览重播、参数保存、Apply/Cancel/Undo、中文/英文内容和 9:16/16:9 视觉不溢出。无 AI call、无远程依赖。
