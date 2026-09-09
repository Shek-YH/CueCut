# WI-015｜Old Effect Delete Plan

状态：`READY_FOR_REVIEW / NO DELETION`

## 扫描命令与摘要

扫描根为 `src tests docs`；文件过滤为 `*.ts, *.tsx, *.json, *.md, *.html`，排除图片、视频、`dist`、`node_modules`、`renders` 和 `测试素材与api/**`。已执行的核心命令：

```powershell
rg -n -i --glob '*.ts' --glob '*.tsx' --glob '*.json' --glob '*.md' --glob '*.html' -e 'effectId|motionId' src tests docs
rg -n -i --glob '*.ts' --glob '*.tsx' --glob '*.json' --glob '*.md' --glob '*.html' -e 'registry|import|project|timeline|renderer|export|preset' src tests docs
rg -n -i --glob '*.ts' --glob '*.tsx' --glob '*.json' --glob '*.md' --glob '*.html' -e 'emphasis-marker|underline-highlight|title-pop-in|number-stat-card|quote-callout|pointer|lower-third|chapter-divider|subtitle-decoration|particle-accent|ring-a|ring-b|ring-c|fx-ring|fx-quote|fx-compare' src tests docs
```

按关键词统计的命中文件数快照：

| keyword | files with matches |
|---|---:|
| `effectId` | 19 |
| `motionId` | 14 |
| `registry` | 37 |
| `import` | 96 |
| `project` | 70 |
| `timeline` | 33 |
| `renderer` | 30 |
| `export` | 85 |
| `preset` | 9 |

这些是命中文件数，不是 effect 数量，也不代表每个命中都是生产引用。

## 关键证据

- `src/effects/registry.ts:16-29` 定义 13 个 registry candidate。
- `src/server/generationRoute.ts:10,120,254` 将 `effectRegistry` 映射为 Director 生产候选索引；因此 registry candidate 不能按 test-only 处理。
- `src/project/fixtures.ts:80-82` 建立 `fx-ring`、`fx-quote`、`fx-compare` concrete instances。
- `src/app/App.tsx:39-41,190-197` 显示/编辑 `ring-a/b/c`；`src/editor/canvas/CanvasStage.tsx:113` 对 `fx-ring` 有专门分支。
- `src/editor/layers/LayersPanel.tsx:9-13`、`src/editor/timeline/Timeline.tsx:151-167`、`src/render/canvasRenderer.ts:7-19` 通过 concrete effect 实例驱动图层、时间轴和 renderer。
- `src/export/exporter.ts` 与 `src/export/ffmpeg.ts` 使用统一 renderer/export contract，未发现按旧 candidate 名称删除的安全边界。
- `tests/effects/registry.test.ts`、`tests/motions/*.test.ts`、`tests/project/*.test.ts`、`tests/render/renderer.test.ts`、编辑器/E2E 测试均覆盖现有 ID 或 registry contract。

## 决策清单

| 范围 | 决策 | 原因 |
|---|---|---|
| 10 个旧静态 candidate：`emphasis-marker`、`underline-highlight`、`title-pop-in`、`number-stat-card`、`quote-callout`、`pointer`、`lower-third`、`chapter-divider`、`subtitle-decoration`、`particle-accent` | KEEP | 至少仍通过 `effectRegistry -> generationRoute` 进入生产候选索引；尚无完整无引用证明 |
| `numeric:ring-a/b/c` | KEEP | UI、fixture、Variant migration、store/preferences 测试存在直接证据 |
| `fx-ring`、`fx-quote`、`fx-compare` | KEEP | 项目实例、Canvas/Layers/Timeline/Renderer 与测试链路存在直接证据 |
| legacy motion IDs（如 `spring-in`、`scale-fade-out`、`pop`、`soft-slide` 等） | KEEP | 由 fixture、App、Director validator、motion registry/runtime 和测试引用；本 WI 不改 motion registry/runtime |

本轮删除数：`0`。迁移数：`0`。没有执行任何删除命令。

## 未完成项

用户中断后未继续做第二遍逐命中核验、未将完整 `rg` 输出固化为独立 raw artifact，也未运行 focused/full test；这些事项在 `docs/handoffs/WI-015.md` 标为阻塞。保守策略是保持全部 KEEP。
