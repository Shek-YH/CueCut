# 改造记录 01 — 动效渲染保真 + LLM 硬约束（P0 批次）

- 日期：2026-09-13
- 依据：`docs/ref-analysis/动效包装参考分析-01/02/03`（三条对标视频归纳出的病因链）
- 备份：`.workbuddy/tmp/backup-20260913-142128/`（恢复用；`.workbuddy/tmp/LAST_BACKUP.txt` 记录了路径）
- 状态：已实施 + 独立复验通过；**未提交 git**（工作区另有用户 44 个未提交 WIP 文件，未触碰）

---

## 一、改了什么

| # | 文件 | 改动 | 对应病因 |
|---|---|---|---|
| 1 | `src/motions/runtime.ts` | 删除 `packProfileId()`（`hash % 4` 四档降级），改为按 `packCatalog` 的 `motionCategory` **语义选型**；新增 `easeValue()` 缓动表（back/power2/power3/expo/sine 等）；`evaluateCompiledMotion()` 增加 `phaseOverride` 并消费语义关键帧 | 87 个动效导出后长一个样 |
| 2 | `src/render/scene.ts` | `SceneItem` 增 optional 语义字段并透传；`active` 相位不再写死 fade，改用 `compiled.emphasis` | 常驻卡的 glow/pulse 永不生效 |
| 3 | `src/render/canvasRenderer.ts` | `clipProgress` 左起裁剪展开、`revealProgress` 打字机、`glow` 卡片阴影、`progress` 驱动 chart/highlight；**全部文本统一加阴影**（`rgba(0,0,0,0.55)`/blur 6/offsetY 2） | 渲染层零 clip/glow/shadow；文字压视频不可读 |
| 4 | `src/export/renderer.ts` | `clipProgress` 影响卡片像素填充、`progress` 影响柱状高度；**修复 BUG**：`drawGlyphs` 未接收卡片裁剪矩形导致导出漏字，同时补上 `revealProgress` | 预览/导出不一致 |
| 5 | `src/packaging-ai/prompt.ts` | 追加 5 条硬约束：kind 白名单（真实枚举）、严格 SRT 时间绑定+禁止无序重叠、禁止创作、禁止塞满+字数上限（主卡≤18/单条≤24）、输出前自检 | LLM 自由发挥、乱造卡片 |
| 6 | `src/packaging-ai/service.ts` | 补 `kindFor()` 护栏：非法 kind 降级为安全 category（原先 `:411` 直接信任 LLM 字符串） | 同上 |
| 7 | 新增测试 | `tests/motions/runtime-semantics.test.ts`、`tests/render/scene-semantics.test.ts`、`tests/export/clip-reveal.test.ts` | 回归保护 |

### 语义选型最终表（`src/motions/runtime.ts`）
| 依据 | 映射 |
|---|---|
| `motionCategory` | Fade→fade、Scale→scale、Pop→pop、Slide→slide、ListStagger→stagger、Ticker→ticker |
| family∈{Progress,Gauge,Percentage,Ranking,Delta} | 强制 ticker（`progress = eased t`，opacity/scale 恒 1） |
| family∈{Alert,AttentionBurst} | pop，入场过冲 1.12 |
| family∈{FocusReticle,CircleFocus} | scale + `glow = sin(πt)` |
| slide/stagger 方向 | 优先 `semanticTags` 的 left/right/top/bottom；否则按 family 表（Flow/Timeline/Steps/Checklist/Ranking/Delta/BeforeAfter/Versus/ProsCons 水平左进，其余垂直上进） |
| 缺失/未知 category | fade（安全兜底，**非哈希**） |

---

## 二、验证证据（独立验证者，非实现者自述）

| 项 | 证据 |
|---|---|
| 类型检查 | `pnpm lint`（`tsc -b --noEmit`）EXIT 0 |
| 测试 | 全量 **133 文件通过 / 4 跳过，439 测试通过 / 0 失败**（跳过项为真实网络/媒体测试） |
| 四档降级消失 | `src/` 无 `packProfileId`/`hash % 4`；87 个 pack 动效全部可求值（0 抛错、0 死动效）；**不同帧形态数由 ≤4 → 9** |
| 形态分布 | Fade 28条/3形态、ListStagger 8/2、Pop 18/2、Scale 18/1、Slide 11/1、Ticker 4/1（全部 progress 驱动） |
| 导出像素端到端 | 两个不同类别动效渲染 buffer 相差 133,734 字节（不再相同）；`clipProgress=0.5` 左半有内容、右半 0 像素 |
| BUG 修复验证 | `clipProgress=0` + 文本：修复前 708 个残留像素 → **修复后 0** |
| 边界 | 未知 ease 不抛错；emphasis 时长 0 不除零；20 动效 × 2 role × 5 进度点无 NaN/Infinity |

> 注：并发跑多个 vitest 实例会争抢 `test-results/` 清理路径，产生 `portable-export.test.ts` 清理步骤的假失败；串行复跑即消失。

---

## 三、已知遗留（下一步）

| 优先级 | 事项 | 说明 |
|---|---|---|
| P0 | **章节导航条 / 章节标签动效族** | 01/02 号视频验证的 retention 第一组件，CueCut 目前完全没有该系统层 |
| P1 | **全片 `ThemePalette` 语义色** | 红=问题/绿=收益/蓝=方法/金=结果，全片一致；现在动效各自为政 |
| P1 | 弹卡三版式 + 数据面板四版式定死 | 大数字KPI / 对比双bar / 趋势箭头 / 多列行动卡 |
| P2 | 导出侧 `glow` | 点阵字 + 像素 buffer 无阴影能力，已留 `TODO(motion-fidelity)` |
| P2 | 卡片库裁剪 | 从 87 种里选 6–8 种对标精调，其余标 legacy（竞品"5–6 种精调"路线） |
| P2 | catalog 修正 | `cuecut-attention-burst`（Fade→pop）、`cuecut-circle-focus`/`cuecut-focus-reticle`（Fade→scale+glow）3 条的 `motionCategory` 与真实形态不符，建议改对 |
