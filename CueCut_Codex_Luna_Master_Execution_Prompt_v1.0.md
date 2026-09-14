# CueCut — Codex Luna Master Execution Prompt v1.0

你现在要开发当前工作区中的 **CueCut**。

本次不要从零重新规划产品，也不要重新做大范围 GitHub 调研。用户已经完成代码审查和架构决策。你的任务是把指定 PRD 落地。

---

# 1. 必读文件

开始编码前，完整读取：

```text
CueCut_Runtime_V2_VisualAsset_Luna_Development_PRD_v1.0.md
```

如果同时安装了：

```text
$ai-autonomous-project-ledger
```

调用该 Skill，并启用其中的 **Luna Execution Profile**。

同时读取当前仓库：

```text
AGENTS.md
README.md
package.json
src/
tests/
docs/
当前最新 UI Prototype（如果项目内存在）
```

不要要求我重复 PRD 里已经写清楚的需求。

---

# 2. 当前历史审查基线

此前审查过的 main commit：

```text
328122a737324be16c71d71dfbf17aadc77523c2
```

但这只是历史参考。

第一步必须：

```text
git status
git rev-parse HEAD
git branch --show-current
```

如果代码已经更新：

- 以当前代码为准；
- 做增量差异审计；
- 不得 reset；
- 不得 clean；
- 不得 stash 用户修改；
- 不得把仓库强行回退到上述 commit。

---

# 3. 最重要的产品契约

用户只执行一次：

```text
生成 AI 包装
```

主链路必须保持：

```text
导入视频
→ 必要时生成 SRT
→ Packaging Director：严格 1 次 LLM 调用
→ 本地 deterministic resolve / grounding / layout / motion compile
→ 可选 Visual Asset Atlas 图像生成
→ 自动切片 / manifest
→ 自动进入 Workspace
→ 用户本地微调
→ Export
```

注意：

```text
ASR != Packaging Director LLM
image generation != Packaging Director LLM
```

但禁止：

```text
第二次 LLM 修 JSON
第二次 LLM 重选模板
第二次 LLM 分析参考图风格
第二次 LLM 重新读 SRT 规划图片
```

必须保留 one-call guard。

---

# 4. 当前已确认的关键根因

不要重新猜。优先检查这些问题是否仍存在：

1. Pack effects 在 Workspace 被压成少数 generic `visualKind`；
2. Effect Lab preview 也是 generic；
3. Workspace / Lab / Export 三套 renderer 漂移；
4. `compileMotionIntent()` 生成丰富 motion，但 apply 阶段再次降级为 fade/pop/soft-slide；
5. scene 已有 translateX/Y，但 Workspace transform 没有真正应用 translate；
6. Export 同样可能丢 runtime translate；
7. sequential overlays 当前会机械复用相同位置；
8. effect 默认尺寸过度统一；
9. main AI Packaging flow 没有真实接入 subject/face/safe-zone 数据；
10. AI catalog 与 resolver catalog 来源不统一；
11. hard global exclude effect 会牺牲语义匹配；
12. Packaging Validator 存在但没有真正接入主链路；
13. Video probe ready 与 browser playback ready 混在一起；
14. import 新视频必须可靠 pause + reset 0；
15. 现有测试可能“内部对象相等”，但检测不到真实用户看到的视觉错误。

如果其中某项已被后续代码修好：
- 写 Evidence；
- 不要重写。

---

# 5. Luna 执行纪律

你当前使用 Luna，因此禁止一次“大包围式重构”。

每次只执行 PRD 的一个 Work Item。

执行模板：

```text
A. Read-only inspect
B. State exact goal
C. State allowed/primary files
D. Add/adjust failing test
E. Minimal implementation
F. Run focused tests
G. Run regression
H. Inspect diff
I. Write evidence
J. Only then mark complete
```

如果实际发现本项会：
- 同时改 >2 个主要子系统，或
- 需要修改约 >10-12 个 production files，

必须先拆成更小子项。

不要为了“顺便优化”扩大范围。

---

# 6. 执行顺序

严格从：

```text
WI-00
```

开始。

默认依次：

```text
WI-00 Baseline
WI-01 Video Reliability
WI-02 Registry Split
WI-03 Canonical RuntimeItem
WI-04 CompiledMotion End-to-End
WI-05 Shared Renderer + first 5 effects
WI-06 Effect Lab Runtime Draft Preview
WI-07 Template Layout Metadata
WI-08 Layout Solver V2
WI-09 Grounding Validator
WI-10 Canonical Packaging Catalog
WI-11 Visual Asset Planner
WI-12 Atlas Planner/Splitter
WI-13 Provider/Settings/Secrets
WI-14 One-click Integration
WI-15 Workspace Asset Renderer
WI-16 Validator Mainline
WI-17 Visual Contracts
WI-18 CI/Golden E2E
```

如果依赖关系要求微调顺序：
- 可以调整；
- 必须在 ledger/evidence 写原因；
- 不得跳过 P0 根因直接做 UI 表面功能。

---

# 7. UI 规则

当前最新 UI Prototype / 当前正式界面是 UI Source of Truth。

不得因为你觉得“更合理”就重设计。

尤其保持：

```text
Workspace
Timeline
Inspector
Effect Lab
SFX
现有主导航
```

允许新增：
- Provider 设置；
- asset generation state；
- video playback error；
- diagnostics；
- 必要 Inspector fields。

但要融入现有设计语言。

---

# 8. Visual Asset 核心规则

只为真正 raster-worthy 对象生图。

禁止为：

```text
文字
数字
百分比
箭头
线
简单图表
进度条
基础卡片
```

生图。

适合：

```text
人物/角色
机器人
复杂物体
3D 对象
clay 对象
概念隐喻
插画
mini-scene
特殊装饰对象
```

Atlas：

```text
max 5x5
max 25 assets/page
grid = ceil(sqrt(count))
row-major
unused cells transparent
>=15% transparent gutter
```

必须：
- 生图前冻结 slot mapping；
- deterministic split；
- 不得 OCR/AI vision 重新识别 slot；
- 输出 square + trimmed；
- manifest + QA；
- stable assetId；
- sourceSubtitleIds 可追溯。

---

# 9. 参考图规则

Reference image 只作为 style-only。

禁止额外调用 LLM 分析风格。

优先：

```text
reference image
→ image provider conditioning
```

未来 Director 如果支持 multimodal，可以把 reference 并入同一次 Director 调用。

---

# 10. Secret 与外部服务

API Key：

- 只进入 server secret store；
- 不要打印；
- 不写 Project；
- 不写 manifest；
- 不写 `.ai-ledger`；
- 不写日志。

如果真实 Provider 需要用户配置：
- 先把不依赖 Key 的全部代码和 synthetic tests 做完；
- 到真实 smoke test 再标 `WAITING_USER`；
- 不要停掉其他可执行任务。

---

# 11. Git

允许：
- 本地安全 checkpoint commit。

禁止：
- auto push；
- force push；
- reset hard；
- clean；
- 删除用户 dirty changes；
- 大范围格式化无关文件。

每个 checkpoint 前：
- inspect diff；
- 确认没有 secret；
- 只 stage 本 Work Item 文件。

---

# 12. 完成标准

不要告诉我：

> “代码写完了，所以完成。”

必须给出：

```text
Work Item
Files changed
Tests
Commands + exit code
User-visible acceptance
Remaining blockers
Next item
```

最终必须证明：

- Video 0s 首帧；
- 不同 Pack Effect 真正不同；
- translate motion 真正执行；
- enter/exit 与 effect 一起预览；
- Effect Lab Apply 后 Workspace 一致；
- Layout 不再机械同一位置；
- AI claim/evidence 可追溯；
- Visual Asset Atlas deterministic；
- Director aiCallCount == 1；
- Provider 失败不拖垮 native packaging；
- Workspace / Lab / Export parity；
- Golden E2E。

---

# 13. 现在开始

现在不要先问我“是否继续”。

直接：

1. 调用项目台账 Skill（如果已安装）；
2. 完整读取 PRD；
3. 执行 `WI-00`；
4. 只读审计当前仓库；
5. 建立 Source of Truth / Baseline；
6. 跑 baseline test/build；
7. 然后自动进入第一个不受阻塞的实现 Work Item。

只有遇到以下真正需要我操作的情况才找我：

```text
登录
2FA
API Key / Provider 配置
真实私有视频
付费授权
产品决策冲突
```

其他本地工程问题请自行诊断、修复、测试并继续推进。
