# CueCut3 Talking-Head Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将指定的 CueCut2 Talking-Head Effects Pack 适配为 CueCut3 的正式动效能力，覆盖注册、UI 选择、实时预览、参数编辑、时间轴、确定性渲染、导出和 QA，同时清理无生产引用的旧测试动效。

**Architecture:** 保留 CueCut3 现有 canonical Project Store 和 `cuecut.composition/1` 数据契约。第三方源码只作为带许可证的导入参考；正式运行时通过 CueCut Motion Adapter 统一输出 DOM/CSS 预览和 frame-based Canvas renderer，Registry 同时提供 UI 能力索引与导出能力索引。删除动作先由引用扫描和回归测试证明安全。

**Tech Stack:** React 19, TypeScript 7, Vite 8, Vitest, Playwright, Zod, Canvas 2D, host-native FFmpeg.

---

### Task 1: 建立本期治理、Golden Path 和真实测试台账

**Files:**
- Create: `00_PROJECT_ENTRY.md`
- Create: `01_ROLES_AND_RESPONSIBILITIES.md`
- Create: `02_MASTER_LEDGER.md`
- Create: `03_CORE_GOLDEN_PATH.md`
- Create: `docs/governance/MULTI_AGENT_PREFLIGHT.md`
- Create: `docs/governance/ROLE_PLAN.md`
- Create: `docs/governance/WORK_ITEM_GRAPH.json`
- Create: `docs/governance/REAL_TEST_RESOURCE_REQUEST.md`
- Create: `docs/governance/RISK_REGISTER.md`
- Create: `docs/work-items/WI-015` through `WI-022` JSON files

- [ ] 记录主 PRD、V2 PRD、Director Skill、V4 UI Prototype 和本地素材包的 Source of Truth 优先级。
- [ ] 记录 Preflight executionRef、角色边界、DAG、Real Test readiness 和仍需用户协作的外部验证。
- [ ] 为每个 Work Item 指定唯一 owner、独立 verifier、允许路径、证据路径和后继动作。

### Task 2: 盘点并安全迁移旧动效与新素材

**Files:**
- Create: `docs/effect-migration/EFFECT_LIBRARY_AUDIT.md`
- Create: `docs/effect-migration/OLD_EFFECT_DELETE_PLAN.md`
- Create: `docs/effect-migration/NEW_EFFECT_IMPORT_PLAN.md`
- Create: `docs/THIRD_PARTY_MOTIONS.md`
- Create: `src/motions/_import/CueCut2_TalkingHead_Effects_Pack_v0.1/`
- Create: `src/motions/licenses/motion-primitives-LICENCE.md`
- Create: `src/motions/licenses/magicui-LICENSE.md`
- Test: `tests/motions/import-audit.test.ts`

- [ ] 在不改生产注册的前提下解压 zip 到 `_import` 并记录 checksum、来源、许可证和选用文件。
- [ ] 搜索 effectId、motionId、registry、timeline、renderer、export、fixture、demo、mock 和测试引用。
- [ ] 只有确认无生产引用的旧测试动效才删除；当前无旧测试动效满足安全删除条件时，记录 `KEEP` 而不是制造删除。

### Task 3: 建立 CueCut Motion Adapter、Registry 和参数契约

**Files:**
- Modify: `src/motions/registry.ts`
- Modify: `src/motions/runtime.ts`
- Modify: `src/effects/registry.ts`
- Create: `src/motions/adapters.ts`
- Create: `src/motions/format.ts`
- Test: `tests/motions/registry.test.ts`
- Test: `tests/motions/runtime.test.ts`
- Test: `tests/motions/adapters.test.ts`

- [ ] 注册 5 个文字、2 个数字、2 个列表/组动效和 10 个 motion layer preset，保留现有旧 ID 的兼容条目。
- [ ] 将统一参数 `start/duration/position/scale/opacity/fontSize/fontWeight/textColor/accentColor/backgroundColor` 与文字、数字、列表专属参数落入 adapter contract。
- [ ] 用纯本地、可按时间求值的函数替代实时 spring/随机 timer，确保同一 `frame + props` 得到同一结果。
- [ ] 先写测试并观察新能力测试在实现前失败，再实现最小行为。

### Task 4: 让 Canvas Preview 和导出 Renderer 使用同一动效求值

**Files:**
- Modify: `src/render/types.ts`
- Modify: `src/render/canvasRenderer.ts`
- Modify: `src/editor/canvas/CanvasStage.tsx`
- Create: `src/motions/preview.tsx`
- Test: `tests/render/renderer.test.ts`
- Test: `tests/editor/canvas-effects.test.tsx`

- [ ] Preview 根据当前时间、effect start/end、enter/exit duration 和 adapter render model 输出真实文字/数字/列表，而不是旧的占位色块。
- [ ] Renderer 在 30fps、9:16、16:9 下按同一 frame-based model 输出确定性 Canvas 帧，保留视频 Layer 0。
- [ ] 中文 4/8/16/24 字、中文数字英文混排和中文标点都走同一测量/换行路径。

### Task 5: 动效库 UI、Preview Draft 和参数 Inspector

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/editor/inspector/Inspector.tsx`
- Modify: `src/app/layout.css`
- Create: `src/editor/effect-library/EffectLibrary.tsx`
- Create: `src/editor/effect-library/EffectPreview.tsx`
- Test: `tests/editor/effect-library.test.tsx`
- Test: `tests/editor/inspector-effects.test.tsx`
- Test: `tests/app/effects-flow.test.tsx`

- [ ] 动效库按文字强调、数字指标、列表步骤、基础运动分类，显示名称、用途、标签和实时预览。
- [ ] Effect Lab 只编辑 draft；Variant、Motion、颜色、数字 prefix/suffix、列表 itemDelay/itemGap 只有 Apply 才写入 Project Store。
- [ ] Apply 产生一个 Undo transaction，Cancel/浏览不污染主项目。

### Task 6: Timeline、Renderer 和 Export 集成

**Files:**
- Modify: `src/editor/timeline/Timeline.tsx`
- Modify: `src/export/exporter.ts`
- Modify: `src/export/ffmpeg.ts`
- Modify: `src/project/store.ts`
- Test: `tests/editor/timeline/timeMath.test.ts`
- Test: `tests/export/exporter.test.ts`
- Test: `tests/export/ffmpeg.test.ts`
- Test: `tests/render/renderer.test.ts`

- [ ] 所有正式动效可添加、移动、trim、复制、删除并与 playhead 解耦；Timeline 文本和样式来自 Registry。
- [ ] ExportPlan/FFmpeg 命令显式使用统一 render runtime，支持完整视频和透明 MOV 计划，不把浏览器 DOM 当成导出证据。
- [ ] 建立最小本地 render/export fixture，记录 9:16、16:9、30fps 和现有默认 FPS 的证据。

### Task 7: 独立验证、回归与最终验收材料

**Files:**
- Create: `docs/context/WI-015_CONTEXT.md` through `WI-022_CONTEXT.md`
- Create: `docs/handoffs/WI-015.md` through `WI-022.md`
- Create: `docs/evidence/WI-015.md` through `WI-022.md`
- Create: `docs/FINAL_ACCEPTANCE.md`
- Create: `docs/TEST_RESULTS.md`
- Create: `docs/IMPLEMENTATION_LOG.md`
- Test: `tests/e2e/effects-vertical-slice.spec.ts`

- [ ] 每个实现 Work Item 由不同 executionRef 的 R90 verifier 检查 Scope、功能、Regression、Real/Synthetic 分层、UI fidelity、License/IP 和数据出站。
- [ ] 运行 typecheck、lint、build、完整 Vitest、Playwright、9:16/16:9 预览和最小 render/export。
- [ ] 只在所有 P0 具备 Evidence、独立 verifier PASS、真实关键链路完成后进入用户最终 Product/Release Acceptance。
