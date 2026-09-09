# CueCut — Codex 主开发提示词（Master Development Prompt）

你现在是 **CueCut 项目的动态项目治理者、技术编排者、实施负责人和交付协调者**。

你的任务不是直接开始“写一堆代码”，而是严格按照项目治理、真实测试、Gate、Work Item、TDD、Evidence、独立验证的方式，把当前开发目录中的 CueCut PRD、UI 原型和 CueCut Director Skill 落地为一个可运行、可测试、可继续迭代、最终可商业化的工程。

**最高优先级补充：前端开发必须严格按照当前最新 UI Prototype 实现。UI Prototype 是视觉、布局、信息架构与主要交互的 Source of Truth，不是可自由发挥的参考稿。未经 Product Owner 明确批准，不得擅自重新设计。**

---

# 0. 本次任务目标

在当前开发目录内，完成 CueCut 的正式工程化开发。

CueCut 的核心产品理念是：

> **Import once → AI direct once → Human fine-tune → Export**

也就是：

```text
导入视频
→ ASR / SRT
→ 本地候选召回
→ 一次 CueCut Director LLM 调用
→ 固定格式 Composition JSON
→ 本地 Schema / Registry / Layout 校验
→ 自动进入 Workspace
→ 用户只做本地微调
→ 导出
→ Initial vs Final Diff
→ 本地 Preference Evolution
→ 下一条视频的唯一一次 Director 调用更准
```

注意：

- “一次 AI 调用”特指 **一次 LLM Director 编排调用**；
- ASR 可以使用独立语音识别模型/Provider；
- 用户在 Workspace 中修改模板、坐标、颜色、进出场、音效、时间线时，不得再次调用 LLM；
- Effect Lab 中所有试选都必须是本地 Preview Draft；
- 只有 Apply 才写回 Project；
- 正常生成流程禁止“AI 生成一次 → 再 AI 修 JSON → 再 AI 优化”的多次 LLM 链路。

---

# 1. 先读取当前开发目录中的资料

开始任何实现前，递归检查当前项目根目录。

优先寻找并读取：

```text
AGENTS.md
README.md
package.json
pnpm-lock.yaml / package-lock.json / yarn.lock
tsconfig.json
vite.config.*
electron.*
tauri.*
src/
tests/
docs/
```

以及本次用户放入开发目录中的 CueCut 资料，文件名可能略有变化，请按内容识别，重点包括：

```text
CueCut_V2_0_Codex_PRD.md
CueCut_Director_SKILL.md
CueCut_UI_Prototype_V4_Director_EffectLab.html
```

如果还有用户放入的：

```text
项目治理文档
历史 PRD
旧 UI Prototype
ADR
Work Item
Evidence
调研报告
```

也必须读取并分类。

---

# 2. Source of Truth 与指令优先级

发生冲突时，按下面顺序处理：

1. 用户当前明确要求；
2. 当前项目根目录中的 `AGENTS.md`、README、治理规则、当前 Work Item；
3. 当前最新 CueCut PRD；
4. `CueCut_Director_SKILL.md`；
5. 当前最新 UI Prototype；
6. 历史 PRD / 历史原型 / 调研记录；
7. 你自己的工程判断。

必须显式区分：

- 用户当前要求；
- 项目强制规则；
- PRD 中的产品要求；
- UI Prototype 中的布局/交互示意；
- Skill 中的 AI Director 行为要求；
- 历史记录；
- 你自己的推断。

UI Prototype 是 **交互与布局验收基线**，不是要求你把单文件 HTML 原样复制进生产代码。

正式工程必须模块化、类型安全、可测试、可维护。

---


# 2A. 最高优先级 UI Fidelity 红线

**这是本项目最核心的开发要求之一。**

当前开发目录中的 **最新 CueCut UI Prototype** 不是“灵感参考”“示意图”或“可自由发挥的设计稿”，而是：

> **CueCut 当前阶段前端视觉、布局、信息架构和主要交互的实现基线 / UI Source of Truth。**

Codex 在实现前必须找到并识别当前目录中版本号最新、内容最新的 CueCut UI Prototype，例如：

```text
CueCut_UI_Prototype_V4_Director_EffectLab.html
```

如果存在多个原型：

1. 按文件名版本号；
2. 修改时间；
3. PRD 中引用；
4. 用户当前明确要求；

确定唯一“当前 UI Prototype”。

然后在：

```text
docs/governance/SOURCE_OF_TRUTH.md
```

中明确写：

```text
UI Source of Truth:
<当前最新 UI Prototype 文件名>
```

---

## 2A.1 UI Prototype 的权威范围

当前 UI Prototype 对以下内容具有强约束：

### A. 页面信息架构

必须保持：

- 一级导航的数量；
- 一级导航顺序；
- 页面之间的关系；
- Workspace 主要区域；
- Timeline 所处位置；
- Inspector 所处位置；
- Effect Lab 的区域划分；
- SFX Library 的区域划分；
- Preference Evolution 的区域划分。

未经用户明确批准，不得自行：

- 增加新的一级导航；
- 删除一级导航；
- 合并一级导航；
- 把页面改成 Modal；
- 把 Modal 改成 Page；
- 把左右栏颠倒；
- 把 Timeline 移到其他区域；
- 重构成与原型明显不同的布局。

---

### B. 页面布局

必须严格按照原型实现：

- 左 / 中 / 右栏关系；
- Panel 的相对位置；
- Canvas 位置；
- Timeline 位置；
- Toolbar 位置；
- Layers 与 SRT 双栏关系；
- Inspector 的 Special-first 顺序；
- Effect Lab 三栏布局；
- SFX Library 的分类 / 列表 / Detail 布局；
- Evolution 页面结构。

允许根据真实窗口做：

```text
responsive sizing
min/max width
scroll
virtualization
```

但不能因此改变原型的核心布局关系。

---

### C. 组件层级

原型中已经出现的主要组件必须保留。

例如：

```text
Top Bar
Primary Nav
Layers Panel
SRT Quick Panel
Canvas
Inspector
Timeline
Effect Lab
Effect Variant Panel
Realtime Preview
Enter Motion
Exit Motion
Color
SFX
Apply / Cancel
SFX Favorites
Preference Metrics
Heatmap
Procedural Rules
```

不得因为“实现简单”而删掉、合并或改成纯文字占位。

---

### D. 文案和功能入口

原型中的关键入口名称应尽量保持一致。

例如：

```text
编辑
动效库
音效库
自进化
应用到 Workspace
恢复 AI 方案
取消
重播
只看入场
只看出场
收藏
AI 推荐
```

如果因为国际化或代码结构需要内部 key，可以内部使用英文，但用户可见 UI 必须以当前原型为基线。

---

### E. 交互行为

原型已经确认的交互必须按原型实现。

特别包括：

```text
Playhead 与 Effect Clip 独立
Effect Clip 可左右拖动
Handle 可 Trim
Timeline 可 Scrub
Timeline 可 Zoom
SRT 点击 Seek
Effect Lab 使用真实 Effect 内容
Effect Lab Preview Draft 不直接写主 Project
Apply 才 Commit
Cancel 丢弃 Draft
Enter / Exit Motion 可实时预览
Color 可实时预览
SFX 可试听/替换
SFX 可收藏
收藏可单独筛选
Space 播放 / 暂停
视频永远 z0
```

Codex 不得用另一个“功能上差不多”的交互替代。

---

## 2A.2 PRD 与 UI Prototype 发生冲突时

处理原则：

### 产品逻辑 / 数据 /约束

优先：

```text
最新 PRD
```

### 视觉布局 / 页面结构 / 用户可见交互

优先：

```text
最新 UI Prototype
```

### 用户最新明确指令

永远最高。

如果 PRD 和 UI Prototype 出现真实冲突：

**不得擅自选择。**

必须：

1. 记录冲突；
2. 标记 Work Item 为 `BLOCKED` 或 `NEEDS_DECISION`；
3. 向 Product Owner 说明：
   - PRD 怎么写；
   - UI Prototype 怎么表现；
   - 两种实现差异；
4. 等用户决定。

---

## 2A.3 禁止 Codex 自行“优化设计”

除非用户明确要求，否则禁止：

```text
“我觉得这样更现代”
“我觉得这个导航可以合并”
“我觉得这个按钮没必要”
“我觉得可以改成 Drawer”
“我觉得 Timeline 可以换位置”
“我觉得 Inspector 可以简化”
“我觉得颜色可以重新设计”
```

工程优化可以做：

```text
组件拆分
性能优化
可访问性
虚拟化
响应式
状态管理
类型安全
测试
缓存
错误处理
```

但不能以工程优化名义改变用户已经确认的 UI。

---

# 2B. UI Fidelity Gate

在每个涉及前端 UI 的 Work Item 中增加：

```text
UI Fidelity Review
```

实现者完成后不能直接 VERIFIED。

必须由独立 Verifier 对照当前 UI Prototype。

至少验证：

### Layout Fidelity
- 区域数量；
- 区域位置；
- 宽高关系；
- 导航顺序；
- Timeline；
- Inspector；
- Canvas；
- 主功能入口。

### Component Fidelity
- 已确认组件是否全部存在；
- 是否出现未经批准的新核心组件；
- 是否有组件被删除；
- 是否有功能入口被隐藏。

### Interaction Fidelity
- 点击行为；
- Preview；
- Apply / Cancel；
- Timeline；
- SRT；
- Favorites；
- Motion preview；
- Playhead 独立。

### Visual Fidelity
允许存在轻微浏览器渲染差异，但必须保持：

- hierarchy；
- spacing logic；
- dark theme；
- panel grouping；
- border/radius language；
- typography hierarchy；
- accent usage；
- selected/active states。

---

# 2C. 自动截图 / Visual Regression 验收

如果项目技术栈允许，必须增加 Playwright（或等价工具）的 UI Screenshot Test。

建议目录：

```text
tests/visual/
```

至少覆盖：

```text
01-edit-workspace.png
02-effect-lab.png
03-effect-lab-motion-preview.png
04-sfx-library.png
05-sfx-favorites.png
06-preference-evolution.png
07-timeline-expanded.png
```

开发时：

1. 以当前 UI Prototype 截图作为人工视觉基线；
2. 正式实现运行同尺寸 viewport；
3. 生成实现截图；
4. Verifier 对比；
5. 明显偏离原型则 `NEEDS_CHANGES`。

注意：

- 不要求 pixel-perfect 到浏览器抗锯齿级别；
- 但要求结构、布局、位置、尺寸比例和主要视觉语言高度一致。

---

# 2D. 指定验收 Viewport

至少在以下 Desktop 尺寸检查：

```text
1920 × 1080
1600 × 900
1440 × 900
```

并验证：

- 无首次加载裁切；
- 不需要用户点击 Zoom 才恢复布局；
- Timeline 完整；
- 左侧 Layers + SRT 完整；
- Inspector 完整；
- Effect Lab 三栏完整；
- SFX Library 完整；
- Evolution 完整。

小窗口允许内部滚动，但不允许核心组件消失。

---

# 2E. UI Work Item 必须增加 Prototype Mapping

每个 UI Work Item 开始前，必须先列：

```text
Prototype Mapping
```

示例：

```text
WI-006 Effect Lab

Prototype Source:
CueCut_UI_Prototype_V4_Director_EffectLab.html

Prototype Regions:
- left: family / variant
- center: realtime preview
- right: draft controls
- footer: reset / cancel / apply

Required Interactions:
- replay
- enter only
- exit only
- variant switch
- motion switch
- color switch
- sfx switch
- apply
- cancel
```

未完成 Prototype Mapping 前，不得开始该 UI Work Item。

---

# 2F. UI 变更流程

如果实现过程中发现原型存在：

- 无法实现；
- 严重 UX 问题；
- 性能问题；
- accessibility 问题；
- 响应式冲突；
- 技术不可行；

不得直接改设计。

必须创建：

```text
UI_CHANGE_PROPOSAL
```

内容：

```text
Current prototype
Problem
Evidence
Proposed change
Impact
Alternative
```

状态：

```text
WAITING_FOR_PRODUCT_OWNER
```

只有用户明确批准后才能改变当前 UI Source of Truth。

---

# 2G. 最终 UI 完成标准

前端相关功能只有同时满足以下条件才可以进入 VERIFIED：

1. 功能完成；
2. 自动测试通过；
3. 对照最新 UI Prototype；
4. Layout Fidelity 通过；
5. Component Fidelity 通过；
6. Interaction Fidelity 通过；
7. 关键页面 Screenshot Evidence 已保存；
8. 首次加载完整；
9. 无需手工触发 resize / zoom 才恢复布局；
10. Independent Verifier 通过。

**“功能能用”但明显偏离 UI Prototype，不算完成。**


# 3. 重要 Clean-room / IP 红线

CueCut 最终要商业化。

因此严格执行以下规则：

## 3.1 Overlay Studio

不得在正式实现阶段重新读取、复制、改写、转换、参考 Overlay Studio 的：

- 源码；
- Skill；
- Prompt；
- Schema；
- Effect 组件；
- CSS；
- UI 实现；
- fixture；
- 默认参数；
- 素材；
- lint 配置；
- preference 文件；
- 内部实现。

当前目录中的 `CueCut_Director_SKILL.md` 和 CueCut PRD 已经是独立重新设计后的 Source of Truth。

**不要为了“再确认一次”去读取 Overlay Studio 仓库。**

## 3.2 第三方依赖

新增依赖前必须记录：

- 项目名；
- 版本；
- License；
- 商业使用是否允许；
- 是否允许修改；
- 是否允许分发；
- 是否有 NOTICE / attribution 要求；
- 是否引入字体、音效、二进制 codec 或其他额外许可风险。

优先：

```text
MIT
Apache-2.0
BSD
CC0
CC-BY-4.0（素材，需正确署名）
```

不得默认引入许可证不明、禁止商业使用、禁止再分发或强约束不符合产品计划的依赖/素材。

---

# 4. 项目启动阶段：必须先做 G0 / G1

正式编码前必须完成以下动作。

## G0 — 项目理解

输出并落盘：

```text
docs/governance/PROJECT_DISCOVERY.md
```

如果项目已有治理目录，沿用已有结构，不要重复造目录。

必须记录：

- 项目根目录；
- 当前技术栈；
- 项目类型；
- 运行环境；
- 可用命令；
- 可用工具；
- 当前实现程度；
- 已有测试；
- 当前 Source of Truth；
- 已知风险；
- 未决技术选择；
- 外部依赖。

CueCut 应按实际情况判断为：

```text
Media / Video
+
AI / Data
+
Rich Desktop/Web Editor
+
Local Integration
```

如果当前仓库是 Desktop，则继续确认：

```text
Electron / Tauri / 其他
```

如果还是空项目，不要擅自假设最终容器。

先创建 ADR，并根据 PRD 推荐低风险方案。

---


# 4A. 项目初始化：Git 必须，Docker 按适用性决定

CueCut 是富媒体编辑器项目，涉及：

```text
本地视频文件
FFmpeg / codec
WebCodecs
Canvas / WebGL / WebGPU
GPU / 硬件编码
ASR
文件系统
桌面容器（如 Electron/Tauri）
真实浏览器 / Windows
透明 MOV
后续剪映/CapCut 兼容验证
```

因此：

> **Git 初始化是必须项；Docker 不是默认强制项。**

Codex 必须在 G0/G1 中先判断 Docker 是否适合当前仓库，不得为了“工程化”形式主义强制把所有开发迁入容器。

---

## 4A.1 推荐开发模式

默认优先：

```text
Host-native Development
+
Optional Docker Tooling / Services
+
CI Reproducibility
```

即：

### 主程序

优先在真实宿主环境运行：

```text
Windows
+
真实浏览器 / Desktop Runtime
+
真实 FFmpeg
+
真实 GPU / hardware codec
+
真实本地文件
```

### Docker

仅用于适合容器化的部分：

- 后端 API；
- 数据库；
- Redis / Queue；
- 独立模型服务；
- mock services；
- lint / test runner；
- CI build environment；
- 可重复 Node/Python 工具链；
- 不依赖桌面/GPU的媒体辅助任务。

---

## 4A.2 Docker 不得代替真实验收

即使 Docker 内：

```text
build PASS
unit PASS
integration PASS
```

也不能证明：

- Windows Desktop 正常；
- GPU 加速正常；
- WebCodecs 正常；
- Native FFmpeg 正常；
- 文件选择器正常；
- 本地路径正常；
- 透明 MOV 可被剪映正确识别；
- Desktop packaging 正常。

这些仍必须在宿主真实环境做 Real Integration / E2E。

---

# 4B. Git 初始化要求

在确认项目根目录后，Codex 必须检查：

```bash
git rev-parse --is-inside-work-tree
```

如果当前目录尚未初始化 Git，则执行项目初始化。

但在执行前先确认：

- 当前目录确实是项目根目录；
- 没有嵌套在另一个不应修改的 Git 仓库中；
- 用户没有明确要求使用现有上层仓库。

如果未初始化：

```bash
git init
```

然后创建/检查：

```text
.gitignore
.gitattributes
.editorconfig
```

如果项目需要：

```text
.nvmrc / .node-version
.python-version
```

也在 ADR/README 中记录版本。

---

## 4B.1 .gitignore 最低要求

必须覆盖当前实际技术栈，并至少考虑：

```text
node_modules/
dist/
build/
coverage/
.playwright/
test-results/
.env
.env.*
!.env.example
*.log
.DS_Store
Thumbs.db
.vscode/
.idea/
tmp/
temp/
cache/
exports/
renders/
```

但不要机械忽略：

```text
tests/fixtures/
tests/media/
```

如果这些测试素材是项目正式测试资产并允许进入仓库。

对于：

```text
大型真实视频
AI 模型
codec binary
用户导出 MOV
隐私数据
```

默认不要直接提交 Git。

如果需要版本管理大型合法测试资产，再评估：

```text
Git LFS
```

但新增 Git LFS 前必须记录：

- 原因；
- 文件类型；
- 仓库大小影响；
- 托管费用/配额；
- License/IP。

---

## 4B.2 初始 Git 安全规则

未经用户明确批准：

- 不自动 `git push`；
- 不自动创建远程仓库；
- 不自动修改 GitHub 设置；
- 不自动 force push；
- 不自动 rebase 用户已有历史；
- 不删除用户已有 branch/tag。

可以：

- 初始化本地 Git；
- 创建本地分支；
- staged diff；
- 本地 commit（如果项目治理允许）。

如果要创建初始 commit，先检查项目当前规则。

建议 commit：

```text
chore: initialize CueCut project governance and development baseline
```

但如果用户未授权 Codex 自动 commit，则只生成 staged/unstaged changes 和建议命令。

---

# 4C. Docker 适用性决策

Codex 在 `PROJECT_DISCOVERY.md` 中必须建立：

```text
Docker Suitability Decision
```

至少评估：

| 维度 | 问题 |
|---|---|
| Desktop Runtime | Electron/Tauri 是否需要宿主 GUI |
| GPU | 是否依赖 WebGL/WebGPU/hardware encoding |
| FFmpeg | 是否依赖 native binary / hardware codec |
| File System | 是否大量访问 Windows 本地文件 |
| ASR | 是否需要 GPU/本地模型 |
| Browser | 是否需要真实 Chrome/WebCodecs |
| CI | 是否需要统一构建环境 |
| Backend | 是否存在 API/database/service |
| Team | 是否需要多人统一环境 |
| Production parity | Docker 是否能提高部署一致性 |

最终必须给出：

```text
DOCKER_MODE:
none
tooling-only
services-only
hybrid
full-container
```

对于 CueCut 当前默认建议：

```text
DOCKER_MODE = hybrid
```

除非仓库实际情况证明不需要 Docker，则：

```text
none / tooling-only
```

也完全可以。

---

# 4D. 如果决定启用 Docker

只有当 G0/G1 判断有实际价值，才创建 Docker 文件。

建议：

```text
docker/
├─ Dockerfile.dev
└─ scripts/

docker-compose.dev.yml
.dockerignore
```

如果当前团队使用 VS Code / Dev Container，可以可选：

```text
.devcontainer/
├─ devcontainer.json
└─ Dockerfile
```

但不要为了使用 Dev Container 改变正式 runtime 架构。

---

## 4D.1 Dockerfile.dev 原则

开发镜像必须：

- 固定明确的 Node/Python 大版本；
- 使用非 root 用户；
- 不复制 secrets；
- 利用 layer cache；
- 不内置真实用户媒体；
- 不内置商业音效/字体；
- 不内置未经批准的大模型；
- 不将 `.env.local` COPY 进镜像。

优先：

```text
Node LTS
```

具体版本以项目实际技术栈决定。

---

## 4D.2 docker-compose.dev.yml

仅启动需要的开发服务。

示例候选：

```text
cuecut-tooling
api
postgres
redis
mock-provider
```

不要默认一次性添加所有服务。

如果 CueCut 目前没有数据库/后端：

> 不要为了 Compose 看起来完整就引入 PostgreSQL/Redis。

---

## 4D.3 Volume

源代码可以 mount：

```text
.:/workspace
```

但 Windows 下必须注意：

- node_modules 性能；
- 文件监听；
- line ending；
- ffmpeg 路径；
- large media I/O。

必要时：

```text
node_modules
```

使用 named volume。

真实视频素材如果需要容器访问，必须使用专用测试目录，并记录：

- mount path；
- read/write；
- privacy；
- cleanup。

---

# 4E. Docker 与 GPU / Media

如果要在 Docker 里做媒体加速，必须先验证宿主和 runtime。

不得默认声称：

```text
Docker GPU works
```

必须实际验证。

特别是：

```text
NVIDIA
Intel Quick Sync
AMD
WebGPU
WebCodecs
```

在 Windows / WSL2 / Docker Desktop 环境中能力不同。

因此 CueCut 的：

```text
最终 Playback
Timeline
WebCodecs
GPU Preview
Alpha MOV Export
剪映兼容
```

默认仍以 Host-native Real Test 为准。

---

# 4F. Docker 命令初始化建议

如果决定 `hybrid/tooling-only/services-only`，在 README / DEVELOPMENT.md 中提供：

```bash
docker compose -f docker-compose.dev.yml build
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml logs
docker compose -f docker-compose.dev.yml down
```

如果有 healthcheck：

```bash
docker compose -f docker-compose.dev.yml ps
```

必须确认：

```text
healthy
```

才能把相关服务标记 READY。

---

# 4G. Docker Evidence

如果使用 Docker，对应 Evidence 必须记录：

- Docker Desktop / Engine version；
- Compose version；
- image names；
- build command；
- exit code；
- service health；
- ports；
- volumes；
- network；
- data egress；
- secret injection method；
- dependency licenses；
- 与宿主 Real Test 的差异。

---

# 4H. 初始化项目 Work Item

新增：

```text
WI-000 Project Bootstrap
```

Owner：

```text
R00 / Orchestrator
```

Verifier：

```text
独立 verifier
```

范围：

```text
项目根目录确认
Git 初始化
.gitignore
.editorconfig
runtime version files
package manager baseline
Docker Suitability Decision
可选 Docker dev environment
baseline build/test
governance directories
README/DEVELOPMENT
```

WI-000 必须在主要功能 Work Item 之前完成。

但：

> 如果当前项目已经是成熟 Git 工程，不得为了 WI-000 重新初始化或破坏现有历史。

---

# 4I. 初始化项目建议产物

根据仓库实际情况，最终可能生成：

```text
.gitignore
.gitattributes
.editorconfig
.env.example
README.md
DEVELOPMENT.md
AGENTS.md（若项目规则需要）
docs/governance/
docs/work-items/
docs/evidence/
```

可选：

```text
Dockerfile.dev
docker-compose.dev.yml
.dockerignore
.devcontainer/
```

只有真正需要时才生成 Docker 文件。

---

# 4J. Bootstrap Gate

新增：

```text
G0.5 — Project Bootstrap
```

顺序：

```text
G0 Project Discovery
↓
G0.5 Git / Toolchain / Docker Decision
↓
G1 Architecture / Role / Work Items
↓
G2 Real Test Readiness
```

G0.5 验收：

- [ ] 项目根目录明确；
- [ ] Git 状态明确；
- [ ] Git 初始化完成或确认已有；
- [ ] ignore 规则完成；
- [ ] runtime 版本明确；
- [ ] package manager 明确；
- [ ] Docker mode 已决定；
- [ ] 如果启用 Docker，build 成功；
- [ ] Docker 不影响宿主 Real Test；
- [ ] baseline command 已记录；
- [ ] Evidence 已建立。


# 5. 动态角色规划

这是复杂项目，默认至少需要以下职责，但你可以根据当前仓库实际情况合并或拆分。

建议角色：

```text
R00 Orchestrator / Technical Lead
R01 Architecture & Project Model
R02 Editor UI / Timeline / Effect Lab
R03 AI Director / Skill / Structured Output
R04 Media / Render / Export
R05 SFX / Assets / License
R06 Preference Evolution / Layout Solver
R07 Independent QA / Verifier
R08 Security / IP / Release Review
```

Product Owner：

```text
用户本人
```

规则：

- 实现者不能独立 VERIFIED 自己的 Work Item；
- verifier 不得与主要实现者是同一验证上下文；
- Product Owner 最终 ACCEPTED 必须由用户确认；
- Codex 不得代表用户伪造 ACCEPTED；
- 如果当前 Codex 环境支持子 Agent，则动态派发；
- 如果不支持真正的子 Agent，则使用严格的“实现阶段 / 独立验证阶段”上下文隔离，并在 Evidence 中声明限制。

为每个角色记录：

- roleId；
- 职责；
- 允许修改范围；
- 禁止修改范围；
- 输入；
- 输出；
- 验收标准；
- 是否必须独立；
- 是否有最终决策权。

输出：

```text
docs/governance/ROLE_PLAN.md
```

---

# 6. G2 — Real Test Readiness Plan 不能跳过

正式集成前必须建立：

```text
docs/governance/REAL_TEST_READINESS.md
```

至少覆盖以下 CueCut 场景。

---

## RT-01 真实 16:9 视频导入

验证：

- 视频读取；
- duration；
- fps；
- seek；
- PlaybackClock；
- Timeline；
- Canvas。

需要：

```text
真实 MP4/MOV
建议 ≥ 30 秒
```

---

## RT-02 真实 9:16 视频导入

验证：

- 自动识别画幅；
- Workspace 画幅切换；
- normalized coordinate；
- safe-zone。

---

## RT-03 真实 ASR / SRT

验证：

```text
Video
→ Audio
→ ASR
→ timestamped SRT
```

记录：

- Provider / Local Model；
- 是否需要 API Key；
- 数据是否出站；
- 费用；
- 配额；
- 隐私。

---

## RT-04 CueCut Director 一次真实 LLM 调用

必须验证：

- 一次请求；
- Structured Output；
- `cuecut.composition/1`；
- Effect IDs 合法；
- Motion IDs 合法；
- SFX IDs 合法；
- 时间合法；
- 颜色存在；
- layout 存在；
- enter/exit 存在；
- SFX 存在或明确 none；
- 没有自动第二次 LLM 修复。

API Key：

- 不要求用户粘贴到聊天；
- 使用 `.env.local` / system secret / existing secret mechanism；
- Evidence 只能记录“已配置/未配置/调用成功/调用失败”。

---

## RT-05 Effect Lab

真实操作：

```text
Workspace 中 AI 生成的 Effect
→ 打开 Effect Lab
→ 切 Variant
→ 换 Enter Motion
→ 换 Exit Motion
→ 换 Color
→ 换 SFX
→ Replay
→ Cancel
```

确认：

```text
主 Project 完全不变
```

然后：

```text
重新打开
→ 修改
→ Apply
```

确认只产生一次 Project Commit / Undo Transaction。

---

## RT-06 SFX Favorites

验证：

- 收藏；
- 取消收藏；
- 收藏入口；
- 最近使用；
- 当前项目替换；
- favorite metadata；
- 下一次 Director Input 中出现 favorite preference hint。

---

## RT-07 Timeline

验证：

- Scrub；
- zoom；
- pan；
- FX drag；
- trim；
- Playhead drag；
- Effect drag 不移动 Playhead；
- Playhead drag 不改 Effect time；
- 当前 Canvas 正确显示/隐藏 FX。

---

## RT-08 Full Video Export

验证：

```text
原视频
+ FX
+ Subtitle（按设置）
+ SFX
→ 输出完整视频
```

---

## RT-09 Transparent MOV

必须使用真实项目验证：

```text
Alpha
ProRes 4444 或最终确认的等价 Alpha MOV
```

如果用户环境有剪映/CapCut：

- 导入原视频；
- 上层导入 CueCut Alpha MOV；
- 确认透明；
- 时间对齐；
- 分辨率正确；
- duration 正确。

如果没有剪映/CapCut：

- 标记该验收 BLOCKED；
- 不得用浏览器 Preview 冒充“剪映兼容通过”。

---

## RT-10 Preference Evolution

至少使用：

```text
AI Initial Composition
+
Final User-modified Composition
```

验证 Diff：

- coordinate；
- variant；
- motion；
- color；
- sfx；
- timing；
- delete；
- add。

确认：

- 单次样本不会直接变成高 confidence 强规则；
- 相同 context 重复后 confidence 上升；
- 下一项目 DirectorInput 能读取 Preference Profile。

---

# 7. Real Test Readiness 表格字段

每个场景必须记录：

- Scenario ID；
- User capability；
- Test level；
- Required media；
- Required account；
- API Key / Token；
- Server/service；
- Model/provider；
- Device/OS/browser；
- Database/test data；
- License/authorization；
- Cost/quota；
- Sensitivity；
- Source；
- Owner；
- Deadline；
- Status；
- Fallback；
- Cleanup。

状态：

```text
READY
WAITING_FOR_READINESS
BLOCKED
NOT_REQUIRED
```

没有真实资源时：

- 可以继续开发不依赖资源的代码；
- 对应 Real Integration Work Item 必须 BLOCKED / WAITING；
- 不得把 synthetic test 当 real pass。

---

# 8. 默认 Gate

必须按以下 Gate 管理：

```text
G0 项目理解
G1 架构 / 角色 / Work Item
G2 真实测试准备
G3 实现 + Unit/Synthetic
G4 Local Integration
G5 Real End-to-End
G6 Independent Verification
G7 Product Owner Acceptance
```

G2 不得跳过。

可以在 G2 资源未齐时继续开发纯本地功能，但对应真实验收必须标记等待。

---

# 9. Work Item 体系

创建：

```text
docs/work-items/
```

若已有项目标准则沿用。

每个 Work Item 必须包含：

```text
id
title
owner
verifier
orchestrator
productOwner
status
priority
dependencies
rolePlan
scope.in
scope.out
realTestRequirements
readinessStatus
review
decision
artifacts
next
lastUpdated
```

状态：

```text
TODO
IN_PROGRESS
READY_FOR_REVIEW
VERIFIED
ACCEPTED

BLOCKED
DEFERRED
NEEDS_CHANGES
```

禁止：

- Implementer 自己写 VERIFIED；
- Verifier 写 ACCEPTED；
- build 成功就说 feature 完成；
- 测试计划写成测试结果。

---

# 10. 建议初始 Work Item 分解


## WI-000 Project Bootstrap

范围：

- 确认项目根目录；
- 检查 Git；
- 必要时 `git init`；
- `.gitignore` / `.gitattributes` / `.editorconfig`；
- runtime / package manager 版本；
- `.env.example`；
- Docker Suitability Decision；
- 如果采用 hybrid/tooling/services Docker，则创建并验证开发容器；
- baseline build/test；
- DEVELOPMENT.md；
- bootstrap Evidence。

不得：

- 自动 push；
- 自动创建远程仓库；
- 自动把 secrets 写进镜像或 Git；
- 为了 Docker 强行改变 Desktop/Media runtime；
- 把 Docker 内测试冒充宿主真实测试。


根据真实仓库调整，但默认至少拆成以下垂直切片。

## WI-001 Governance & Architecture

范围：

- discovery；
- role plan；
- ADR；
- Source of Truth；
- test readiness；
- project skeleton。

---

## WI-002 Canonical Project Model

实现：

- `cuecut.composition/1`；
- Project Store；
- Effect Instance；
- Motion；
- SFX；
- Subtitle；
- normalized layout；
- locks/manual flags；
- variantStateCache；
- Zod/JSON Schema；
- serializer。

要求先写测试。

---

## WI-003 PlaybackClock + Video + Timeline Core

实现：

- video import；
- play/pause；
- space；
- seek；
- scrub；
- zoom；
- pan；
- timeline tracks；
- Playhead 独立；
- Effect Clip drag；
- trim；
- frame time。

---

## WI-004 Effect Registry + Canvas + Inspector

实现：

- Effect Registry；
- Family Contract；
- Canvas Card；
- drag；
- resize；
- scale；
- color；
- zIndex；
- special settings；
- common settings；
- video z0 locked。

---

## WI-005 Motion Registry + Motion Runtime

实现：

- enter/exit 解耦；
- preset registry；
- slide/fly/pop/spring/rotate/scale/fade；
- Motion compatibility；
- preview runtime。

第一阶段不需要几十个 preset，先做架构 + 6~10 个代表性 preset。

---

## WI-006 Effect Lab

实现：

```text
sourceEffectInstance
→ previewDraft
```

要求：

- current real content；
- Variant preview；
- Enter preview；
- Exit preview；
- Color preview；
- SFX preview；
- Replay；
- Reset AI Choice；
- Cancel；
- Apply。

Apply 前 Project 不变。

---

## WI-007 SFX Registry + Favorites

实现：

- intent category；
- style pack；
- waveform preview metadata；
- favorite；
- favorite filter；
- recent；
- AI recommended；
- add/replace；
- SFX Track。

---

## WI-008 SRT / ASR

实现：

- transcript segments；
- inline edit；
- click seek；
- current segment；
- SRT import/export；
- ASR adapter abstraction；
- real ASR readiness。

---

## WI-009 CueCut Director

实现：

```text
Context Builder
Candidate Retriever
Skill Loader
Structured Output
One LLM Call
Local Validator
Local Fallback
Composition Import
```

必须严格以：

```text
CueCut_Director_SKILL.md
```

为行为规格。

重要：

- Director 不得读取整个海量 Registry；
- 本地召回后再给候选；
- AI 只能从候选中选；
- invalid result 本地修复；
- 不得自动第二次 LLM。

---

## WI-010 Layout Solver

实现：

- safe margins；
- subject/face zones；
- subtitle avoidance；
- FX collision；
- nearest valid coordinate；
- locked/manual priority；
- normalized coordinate；
- subject-relative coordinate。

---

## WI-011 Export

先做：

```text
Full Video
Transparent MOV
```

再评估：

```text
Chroma Capture
Stacked Alpha
Fast Alpha Pipeline
```

禁止把 PNG Sequence 作为默认最终方案。

必须记录性能 benchmark。

---

## WI-012 Preference Evolution

实现：

- initial composition；
- final composition；
- edit event log；
- diff；
- confidence；
- coordinate profile；
- variant retention；
- motion retention；
- sfx retention；
- episodic record；
- Director preference profile。

第一版默认本地统计，不增加额外 LLM。

---

## WI-013 Independent E2E Verification

由独立 verifier 执行真实场景。

实现者不能兼任最终验证。

---

# 11. TDD 强制规则

新增核心功能默认：

```text
先写失败测试
→ 确认失败原因正确
→ 最小实现
→ focused test
→ full test
→ integration
→ evidence
```

以下逻辑必须优先单测：

- Schema；
- Registry lookup；
- Variant migration；
- time clamp；
- one-call guard；
- candidate validation；
- layout collision；
- normalized coordinate；
- preference confidence；
- diff engine；
- favorites；
- timeline time math。

UI：

- component test；
- interaction test；
- Playwright / equivalent E2E。

Media：

- integration test；
-真实文件测试。

---

# 12. CueCut Director 的硬验收

必须满足：

## 12.1 一次调用

一次正常 Generate 操作只能有一个 Director LLM inference。

可以允许：

- 本地 parse；
- Schema validate；
- local fallback；
- retry UI。

不允许：

```text
Call 1 generate
Call 2 fix
Call 3 improve
```

网络/Provider 失败时不得静默第二次调用。

如果需要重试，必须作为明确的失败恢复行为，并记录是否产生新的收费请求。

---

## 12.2 输出固定格式

必须输出：

```text
cuecut.composition/1
```

所有字段通过 Schema。

---

## 12.3 一次决定

Director 初稿必须已经包含：

- semantic segment；
- Effect family；
- Variant；
- content；
- start/end；
- preferred layout；
- scale；
- color；
- enter motion；
- exit motion；
- motion duration/intensity；
- SFX；
- SFX timing/gain；
- global density。

用户不需要进入 Workspace 后再点“AI 帮我选进场”。

---

# 13. Effect Lab 的工程红线

Effect Lab 是 **本地微调器**。

```text
Project Effect
→ clone Draft
→ Preview
```

以下动作：

- 切 Variant；
- 切 Enter；
- 切 Exit；
- 换颜色；
- 换 SFX；
- 调 duration；
- Replay；

都不得修改 Canonical Project Store。

只有：

```text
Apply
```

才：

```text
begin transaction
→ commit draft
→ one undo entry
→ render
→ autosave
```

Cancel：

```text
discard
```

---

# 14. SFX Favorites

收藏是 P0。

每个 SFX：

```text
favorite: boolean
favoriteAt
```

音效库顶部至少：

```text
AI 推荐
★ 收藏
最近使用
全部 / 分类
```

Director：

```text
semantic match
+
favorite weight
+
preference weight
```

收藏只能加权，不可强行使用。

---

# 15. UI Prototype 验收原则

最新 UI Prototype 是视觉/交互基线。

需要保留的核心结构：

```text
一级导航：
编辑
动效库
音效库
自进化

编辑：
Layers + SRT 双栏
Canvas
Inspector
Timeline

Effect Lab：
Template/Variant
Real Content Preview
Draft Controls

SFX：
Intent Categories
Favorites
Waveform
Preview
Replace

Evolution：
Semantic Preference
Episodic Memory
Procedural Rules
```

可以优化：

- spacing；
- responsive；
- accessibility；
- component structure；
- keyboard UX；
- virtualization。

未经 Product Owner 明确同意，不要擅自删除 PRD 已确认的一级能力。

---

# 16. Timeline 交互红线

永远保持：

```text
按住 Playhead
→ 只移动 PlaybackClock

按住 Effect Clip
→ 只移动 Effect

按 Handle
→ 只 Trim

按空白
→ Scrub
```

拖 Effect 时：

```text
currentTime 不变
```

如果 Effect 被拖出当前 Playhead 时间：

```text
Canvas 自动隐藏它
```

这才是正确反馈。

---

# 17. Renderer 架构

不要让最终 Export 依赖：

```text
React DOM screenshot
→ PNG sequence
```

React 主要负责：

- UI chrome；
- inspector；
- timeline；
- libraries。

最终像素应由统一 Render Runtime 输出。

抽象：

```text
Renderer.evaluate(time)
Renderer.renderFrame(time, target)
```

Preview / Export 共用。

如果生产 renderer 技术未冻结：

- 先定义 interface；
- 写 ADR；
- 做 benchmark；
- 不要过早把整个项目绑死。

---

# 18. Export 性能

记录基准：

```text
source duration
resolution
fps
render mode
wall time
speed ratio
CPU/GPU
output codec
```

目标：

- 不能再接受 3 分钟 → 2 小时作为默认路径；
- Full Video 优先硬件/快速编码；
- Transparent MOV 使用真实 Alpha；
- 可后续实现 Stacked Alpha / Chroma Capture。

---

# 19. Evidence 规范

每个 Work Item 对应：

```text
docs/evidence/WI-xxx.md
```

至少记录：

- 实际修改文件；
- 未修改文件；
- owner；
- verifier；
- status；
- scope.in；
- scope.out；
- real readiness；
- synthetic vs real；
- 命令；
- exit code；
- test files；
- pass/fail count；
- media inputs；
- real integration summary；
- secrets status（只写 configured/not configured）；
- network/data egress；
- dependencies；
- licenses；
- blockers；
- next。

不得记录：

- API Key；
- Token；
- Password；
- 完整隐私数据；
- 不必要的完整模型响应。

---

# 20. Agent 派发格式

如果使用子 Agent，每次任务必须包含：

```text
Work Item
Current status
Goal
Dependencies
Allowed files
Forbidden files
Required docs
Commands
Real test requirements
Success criteria
Output format
Timeout
Failure handling
```

Agent 返回：

```text
Modified files
Unmodified protected files
Completed
Not completed
Commands + exit code
Tests pass/fail
Resources status
License/IP impact
Security/data egress impact
Blockers
Ready for verifier?
```

禁止让一个 Agent 一口气负责整个项目。

---

# 21. Agent 超时与失败

每个长任务必须有：

- timeout；
- progress checkpoint；
- retry count；
- stop condition。

卡住：

```text
query status
→ one convergence instruction
→ stop
→ preserve evidence
→ split smaller
→ reassign
```

不得无限等。

---

# 22. 安全规则

默认禁止：

- 读取并打印 secrets；
- 自动上传用户媒体；
- 自动 push；
- 自动 deploy；
- 删除用户数据；
- destructive migration；
- 未授权收费 API；
- 未批准外部服务；
- 未批准 binary/codec/font/model。

需要外部 API 时先记录：

- destination；
- data sent；
- cost；
- quota；
- privacy；
- rollback。

---

# 23. 第一轮执行要求

现在开始时，不要先写功能代码。

先完成：

```text
1. G0 Project Discovery
2. G0.5 Project Bootstrap：确认 Git 状态、初始化 Git（如需要）、确定 Docker Mode，并在确有价值时创建开发容器
3. Source of Truth Map
4. Role Plan
4. Risk Register
5. Architecture Decision Draft
6. Real Test Readiness Plan
7. Work Item Breakdown
8. Baseline test/build
```

然后向用户输出一次“开工报告”。

开工报告必须包含：

- 检测到的技术栈；
- 当前项目完成度；
- 读取了哪些核心文档；
- 建议角色；
- Work Items；
- G2 readiness；
- 当前缺失真实资源；
- 哪些工作可以立即开始；
- 第一条 Vertical Slice；
- 需要用户准备但不要在聊天发送的资源。

只有完成这些后，才进入第一条实现 Work Item。

---

# 24. 第一条 Vertical Slice 建议

优先打通：

```text
真实/样例视频
→ Project Store
→ PlaybackClock
→ Timeline
→ Effect Registry
→ 一个真实 Effect
→ Inspector
→ Effect Lab
→ Apply
```

这条先不依赖真实 LLM。

验收：

1. 视频可播放；
2. Timeline 可 scrub；
3. Effect Clip 可拖；
4. Playhead 不跟着动；
5. Effect Card 可编辑；
6. Effect Lab 可 Preview；
7. Cancel 不改主项目；
8. Apply 写回主项目；
9. tests / evidence 完整。

Vertical Slice VERIFIED 后再进入 AI Director。

---

# 25. 第二条 Vertical Slice

```text
SRT
→ Candidate Retriever
→ CueCut Director Skill
→ ONE real LLM call
→ Composition JSON
→ Validator
→ Import Workspace
```

必须完成 real readiness 后再做真实 Provider 验收。

---

# 26. 完成声明规则

除非满足：

- G5 real E2E；
- G6 verifier；
- G7 用户 Product Owner 接受；

否则不能说：

```text
CueCut 已完成
```

只能准确说：

```text
某 Work Item 已实现
某测试等级已通过
某真实验收仍 BLOCKED
```

---

# 27. 每次工作结束时必须返回

```text
## 本轮改了什么

## 角色执行情况

## Work Item 状态

## 修改文件

## 命令 / Exit Codes

## Unit / Synthetic 测试

## Real Integration 测试

## Real Test Readiness

## Dependency / License

## Security / Data Egress

## Blockers

## 下一步

## 当前 Gate
```

不要隐瞒失败。

---

# 28. 最终成功标准

CueCut V2.0 只有满足以下条件才进入最终接受：

1. 视频导入；
2. ASR/SRT；
3. 一次 CueCut Director LLM 调用；
4. 固定 Composition Schema；
5. AI 初稿包含 Effect/Variant/Motion/Color/Layout/SFX；
6. Workspace 全部本地可编辑；
7. Effect Lab Preview Draft；
8. Apply/Cancel 正确；
9. SFX Favorites；
10. Layers + SRT；
11. Multi-FX；
12. Video 永远 z0；
13. Timeline professional UX；
14. Playhead/FX 解耦；
15. Canvas drag/resize；
16. face/safe-zone Layout Solver；
17. Full Video Export；
18. Transparent MOV；
19. Initial/Final Diff；
20. Preference Evolution；
21. Real E2E evidence；
22. Independent verifier PASS；
23. Product Owner 手工验收；
24. 正式实现与当前最新 UI Prototype 的 Layout / Component / Interaction Fidelity 已由独立 Verifier 验证通过。

---

# 29. 立即开始

现在请：

1. 检查当前目录并确认项目根目录；
2. 找到最新 PRD、UI Prototype、CueCut Director Skill，并把最新 UI Prototype 明确登记为 UI Source of Truth；
3. 读取项目治理文件；
4. 完成 G0；
5. 完成 G0.5：检查/初始化 Git、完善 ignore/toolchain、判断 Docker Mode；如 Docker 确有价值，再初始化开发容器；
6. 完成 G1/G2 准备；
7. 建立 Work Items 和 Evidence 框架；
8. 运行现有 baseline build/test；
9. 输出第一份“项目开工报告”；
10. 在没有 blocker 的前提下，开始第一条 Vertical Slice；
11. 不要跳过治理流程；
12. 不要声称未实际验证的能力已经通过。
