# WI-015｜Effect Library Audit

状态：`READY_FOR_REVIEW`

本表是静态审计，不是视觉质量验收。`src/effects/registry.ts` 的候选项使用 `familyId:variantId` 作为可追溯的候选 `effectId`；项目实例另外使用 `fx-*` ID。未读取用户视频、`.env` 或 `测试素材与api/**` 内容。

## Registry candidates

| effectId | name | path | category | Production | UI | Timeline | Renderer | Export | testOnly | visualQuality | action | reason |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `emphasis-marker:asterisk` | Asterisk Emphasis Marker | `src/effects/registry.ts:17` | text emphasis | YES：被 `generationRoute` 候选索引消费 | 无直接 UI 注册证据 | 无精确 candidate ID | 无精确 candidate ID | 通用 renderer/export | NO | acceptable* | KEEP | 仍在生产候选索引中，不能仅因来源路径看似测试素材而删除 |
| `underline-highlight:highlighter` | Highlighter Accent | `src/effects/registry.ts:18` | text emphasis | YES：候选索引 | 无直接 UI 注册证据 | 无精确 candidate ID | 无精确 candidate ID | 通用 renderer/export | NO | acceptable* | KEEP | 没有充分的无生产引用证据 |
| `title-pop-in:card-heading` | Card Heading Pop-in | `src/effects/registry.ts:19` | title emphasis | YES：候选索引；另被 `spring-in` 推荐 | 无直接 UI 注册证据 | 无精确 candidate ID | 无精确 candidate ID | 通用 renderer/export | NO | acceptable* | KEEP | AI 候选和 motion compatibility 仍引用 |
| `number-stat-card:bar-chart-line` | Stat Card Bar Accent | `src/effects/registry.ts:20` | number/metric | YES：候选索引 | 无直接 UI 注册证据 | 无精确 candidate ID | 无精确 candidate ID | 通用 renderer/export | NO | acceptable* | KEEP | 生产候选索引仍可返回该项 |
| `quote-callout:quote` | Quote Callout Accent | `src/effects/registry.ts:21` | quote/callout | YES：候选索引 | 无直接 UI 注册证据 | 无精确 candidate ID | 无精确 candidate ID | 通用 renderer/export | NO | acceptable* | KEEP | 候选项仍存在，且 quote 语义仍在生产链路使用 |
| `pointer:cursor` | Cursor Pointer | `src/effects/registry.ts:22` | pointer | YES：候选索引 | 无直接 UI 注册证据 | 无精确 candidate ID | 无精确 candidate ID | 通用 renderer/export | NO | acceptable* | KEEP | 不能把未验证的 pointer 兼容风险当作删除依据 |
| `lower-third:layout-text-window` | Layout Lower Third | `src/effects/registry.ts:23` | lower third | YES：候选索引 | 无直接 UI 注册证据 | 无精确 candidate ID | 无精确 candidate ID | 通用 renderer/export | NO | acceptable* | KEEP | 候选索引与现有 lower-third motion 关系仍存在 |
| `chapter-divider:dash` | Chapter Divider Line | `src/effects/registry.ts:24` | divider | YES：候选索引 | 无直接 UI 注册证据 | 无精确 candidate ID | 无精确 candidate ID | 通用 renderer/export | NO | acceptable* | KEEP | 无充分无引用证据 |
| `subtitle-decoration:chat` | Subtitle Chat Decoration | `src/effects/registry.ts:25` | subtitle decoration | YES：候选索引 | 无直接 UI 注册证据 | 无精确 candidate ID | 无精确 candidate ID | 通用 renderer/export | NO | acceptable* | KEEP | 字幕相关持久化/渲染边界尚未完成独立验证 |
| `particle-accent:sparkles` | Sparkles Accent | `src/effects/registry.ts:26` | accent | YES：候选索引 | 无直接 UI 注册证据 | 无精确 candidate ID | 无精确 candidate ID | 通用 renderer/export | NO | acceptable* | KEEP | 没有完成可删除结论所需的完整运行时分析 |
| `numeric:ring-a` | 指标环 A | `src/effects/registry.ts:27` | numbers/metrics | YES：候选索引；fixture 使用 | YES：App Variant/UI | 通用 `project.effects`；实例为 `fx-ring` | YES：numeric/`fx-ring` | 通用 renderer/export | NO | acceptable* | KEEP | 被 fixture、编辑器、时间轴、renderer 和测试直接引用 |
| `numeric:ring-b` | 指标环 B | `src/effects/registry.ts:28` | numbers/metrics | YES：候选索引 | YES：App Variant/UI | 无独立实例；可由 draft 迁移 | 无精确 renderer ID | 通用 renderer/export | NO | acceptable* | KEEP | 被 Variant UI、迁移测试、store/preferences 测试引用 |
| `numeric:ring-c` | 指标环 C | `src/effects/registry.ts:29` | numbers/metrics | YES：候选索引 | YES：App Variant/UI | 无独立实例；可由 draft 迁移 | 无精确 renderer ID | 通用 renderer/export | NO | acceptable* | KEEP | 被 Variant UI 和 store 测试引用 |

`* acceptable` 仅表示静态审计占位，WI-015 没有运行视觉 QA，不能作为正式质量结论。

## Concrete project instances

| effectId | family/variant | production/UI/Timeline/Renderer evidence | action |
|---|---|---|---|
| `fx-ring` | `numeric:ring-a` | `src/project/fixtures.ts:80`；App/Canvas/Layers/Inspector/Timeline；`tests/render/renderer.test.ts`、编辑器和 E2E 测试 | KEEP |
| `fx-quote` | `quote:quote-b` | `src/project/fixtures.ts:81`；Canvas/Layers/Timeline；renderer test 与 app/E2E 断言 | KEEP |
| `fx-compare` | `comparison:compare-a` | `src/project/fixtures.ts:82`；Canvas/Layers/Timeline 通用实例链路 | KEEP |

## 结论

本轮没有任何 effect 满足“充分证明无生产引用”的删除门槛。未删除、未迁移、未修改 `src/effects`、`src/editor`、`src/render`、`src/export` 或项目文件。
