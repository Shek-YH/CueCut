# CueCut Project Discovery｜Talking-Head Effects Phase

**Date:** 2026-09-08  
**Gate:** G1 — Project Understanding

## Verified project facts

- 项目根目录：`F:\CCPJ\CueCut3`，Git 仓库已存在但尚无提交；当前用户文件全部视为保留资产。
- 技术栈：React 19、TypeScript 7、Vite 8、Vitest、Playwright、Zod、pnpm 11；通过 `package.json` 验证。
- 当前源码已有 canonical project schema/store、Effect Registry、Motion Registry/Runtime、CanvasStage、Timeline、Canvas renderer、FFmpeg plan 和 Effect Lab 草稿流。
- 当前 `src/motions` 仅有 `registry.ts`、`runtime.ts` 和指定 14.7KB zip；旧运行时是少量简化状态求值，Canvas renderer 仍绘制占位色块，未真正渲染新动效。
- 指定 zip 顶层包含：5 个文字动效源码、2 个数字动效源码、AnimatedList、AnimatedGroup、许可证、集成指南、语义分类和来源元数据。
- 当前代码没有 `motion`/`framer-motion` 依赖；因此正式适配优先采用项目本地确定性 runtime，不能把第三方 `motion/react` import 原样带入生产 bundle。
- `src/effects/registry.ts` 当前已有 10 个外部候选资产和 numeric ring/旧 family，不能直接当作本期 zip 的文字/数字/列表正式实现。
- V4 原型是 UI Source of Truth；不得擅自重设计四项主导航、Edit 三栏、Effect Lab 三栏和底部 Timeline。
- `graphify . --code-only --no-viz` 已生成结构分析：851 nodes、1174 edges、47 communities；非代码语义抽取因无 LLM API key 跳过，不阻塞。

## Existing asset and reference boundary

- `CueCut3_TalkingHead_Effects_Implementation_PRD_v1.0.md` 是本期最高产品规格。
- `CueCut_V2_0_Codex_PRD.md`、`CueCut_Director_SKILL.md`、V4 prototype 负责既有产品/Director/UI 约束。
- zip 内来源为 Motion Primitives（MIT）与 Magic UI（MIT）；原文许可证必须保留。
- `测试素材与api` 中视频和 `.env` 均为本地测试资产，禁止加入证据原文或提交。

## Bootstrap / toolchain

- `pnpm build`、`pnpm test --run`、`pnpm test:e2e`、`pnpm lint` 已在 package scripts 中声明。
- `dist/`、`node_modules/`、`test-results/`、`renders/` 视为可重建/生成目录，不参与生产动效迁移。
- Docker 不适合本期 host-native media/Canvas acceptance，沿用 `DOCKER_MODE=none`。

## Discovery decisions

1. 先做 R02 审计、zip `_import` 解压和许可证登记，再让 R01 建正式 adapter。
2. 不升级 React、不引入重复 Motion runtime；以不依赖远程网络的本地 adapter/runtime 满足 Preview 与 Export。
3. 保留现有旧 registry family，除非引用扫描证明某个测试/演示项可以安全删除；不得为了满足“删除”而误删生产候选。
