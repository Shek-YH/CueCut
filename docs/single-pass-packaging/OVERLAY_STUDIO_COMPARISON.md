# Overlay Studio 编排对比与 CueCut 改进结论

## 结论

CueCut 当前效果差，主要是编排逻辑和运行时表达同时存在缺口，不能只归因于动效库：

1. AI 目前输出的是“卡片时间线”，没有强制先做章节、语义段、证据类型和段内节奏，因此容易逐句生成同类卡。
2. `resolvePackagingPlan` 只保留通用 `category/content/layout/motion`，没有保留章节、字幕来源、卡片序号、卡内 cadence 和已讲内容的 dim/让位关系。
3. `canvasRenderer` 和 `CanvasStage` 主要按 `text/number/list` 画通用矩形；不同 pack 的 visualTags 没有对应到不同的视觉组件，所以候选效果再多，最终预览仍然像同一张卡换标题。

## 对方做得好的地方

参考文件：

- `F:\Program Files (x86)\overlay-studio\.agents\skills\overlay-fx-generator\SKILL.md`
- `F:\Program Files (x86)\overlay-studio\.agents\skills\overlay-fx-generator\我的偏好.default.md`
- `F:\CCPJ\CueCut3\renders\生成物\STATUS.md`
- `F:\CCPJ\CueCut3\renders\生成物\jj-overlay.json`

对方的关键不是 JSON 字段更多，而是生成前后有一套稳定的“语义编排协议”：

| 环节 | Overlay Studio 做法 | CueCut 原来的缺口 |
| --- | --- | --- |
| 输入治理 | 先读 STATUS、偏好表和卡片库 | 只把分析结果和候选库交给 Director |
| 内容组织 | 章节 → 10-30 秒语义段 → 段内元素 | 没有 chapter/section 强约束 |
| 选卡依据 | 论点/证据类型决定数据卡、对比卡、步骤卡、引用卡 | category 较宽，容易回落到 callout/headline |
| 视觉层级 | 证据和图形优先，纯文字最后 | prompt 没有禁止字幕复述的硬约束 |
| 节奏 | `stepMs/staggerMs/shiftAtMs/countMs` 按 SRT 实际时长计算 | IR 没有卡内 cadence 字段 |
| 结构 | `seg` 共线、章节条常驻、同段统一收法 | 解析后只剩平面 overlay |
| 多样性 | 相邻 kind 不重复、段内最多一张主卡、段落留白 | 只有排除已用 effectId，缺少语义多样性约束 |
| 质量门 | 导入前 lint，检查占位文案、时长、素材、重复、留白 | 主要做 schema 验证，视觉编排质量不可见 |
| 运行时 | 每个 kind 使用实际组件和默认参数预览 | pack 最终大多走 generic canvas/card |

`jj-overlay.json` 的 38 张卡说明了这种方法的结果：11 种视觉 kind、6 个主要章节边界、较长的语义段、13 张 punch pill 之外仍有数据/流程/引用/对比等形态，并且卡面内容是从字幕提炼出来的词块或证据，不是简单复制每条字幕。

## 已吸收的 CueCut 改动

本轮先吸收最小但高收益的部分，保持“一次 AI 调用”不变：

- Packaging IR timeline item 增加 `chapterId`、`sectionId`、`sourceSubtitleIds`、`sequence`、`semanticRole`、`evidenceType`、`cadence` 和 `dimAtSec` 可选字段。
- Director prompt 明确要求先分章节和语义段，再选证据形态；要求内容短于口播、避免逐字幕贴纸、按真实时长计算段内 cadence，并保留来源关系。
- 本地 repair 继续兼容旧 JSON，不增加第二次 AI 调用；旧格式会补上稳定的 `sequence`，已有新字段会原样保留。

## 后续实现顺序

1. 把 `chapterId/sectionId/sequence/cadence` 贯穿 resolve → runtime timeline → ProjectComposition，避免解析后丢失。
2. 给 pack-effect 建立按视觉族的 runtime renderer：metric/chart、list/steps、quote/lower-third、alert/callout、highlight/pointer 分别绘制，而不是统一矩形。
3. 在一次调用后的本地 validator 增加质量诊断：连续同类、完整字幕复述、过多同位、无证据的数字、超过 30 秒无新动作；诊断结果进入 UI，而不是静默生成。
4. 用 `jj` 这类真实素材做一轮前后对照：关注“卡片数量”之外的章节完整性、视觉种类、字幕复述率、同位冲突率和用户需要手改的比例。

## 判断标准

- 如果 JSON 已经有不同 `semanticRole/evidenceType/sectionId`，但预览仍是同一种矩形，问题在 runtime renderer。
- 如果 JSON 本身连续是同一 category、没有章节和证据字段，问题在 Director 编排。
- 如果两者都正确但画面仍乱，问题在 layout solver 的避人、同段共线和时间碰撞策略。
