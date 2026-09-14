# CueCut Runtime Preflight + External Packaging Bundle
## Codex 开发 PRD v1.0

> 目标：解决未配置主模型 API Key 时生成流程卡住的问题，并允许外部 Skill 生成包装 JSON 与配套素材后直接载入 CueCut。
>
> 本文是执行规格，不是设计建议。Codex 必须按 Work Item 顺序逐项实现、逐项验证，不得一次性重写整个项目。

---

## 1. 背景与问题

CueCut 当前的 AI 生成流程在 API Key 未配置时，可能已经进入异步生成状态，之后才在服务端发现配置缺失，导致界面长时间停留在“生成中”。

同时，未来可能存在独立 Skill：

```text
视频 / SRT / 用户素材
    ↓
外部 Skill
    ↓
CueCut Packaging JSON + 图片素材
```

此时 CueCut 不应强制再次调用大模型或生图模型，而应支持：

```text
载入外部 JSON
→ 校验
→ 绑定素材
→ 本地 Runtime 编译
→ Workspace
→ 用户微调
→ Export
```

---

## 2. 产品目标

### P0

1. 用户点击生成前，明确判断主模型是否配置；
2. 主模型未配置时立即阻止生成并给出设置入口；
3. 生图模型属于可选能力；
4. 生图模型未配置、超时或失败时，原生文字/数字/动效包装仍可继续完成；
5. 所有外部模型请求必须有明确超时和可诊断错误；
6. 支持外部 Skill 生成的 Packaging JSON 导入；
7. 支持 JSON 与配套图片素材绑定；
8. 外部 JSON 导入不依赖任何模型 API Key；
9. 外部包装数据必须经过 schema、素材、时间轴和 Runtime 校验；
10. 保持 Packaging Director 一次调用契约，不因导入功能新增第二个 Director。

### P1

1. 支持 `.cuecut-bundle` 压缩包；
2. 支持素材 hash 校验；
3. 支持外部 Skill 导入报告；
4. 支持重新链接缺失素材；
5. 支持导入历史记录和最近使用的外部包。

---

## 3. 非目标

本 PRD 不做：

- 重写 CueCut 编辑器；
- 更换 React、Vite 或现有 Runtime 架构；
- 新增云端账号系统；
- 将 API Key 暴露到浏览器或 Project JSON；
- 自动上传用户视频到外部 Skill；
- 为外部 JSON 再调用 AI 修复 JSON；
- 用生图模型替代原生文字、数字、箭头和简单图表渲染；
- 自动启用收费 Provider；
- 自动提交、推送或部署。

---

## 4. 术语与模型边界

本文将用户所说的“识图大模型”统一定义为 `Director Model`：负责理解视频、字幕和上下文，并生成 `PackagingPlan`。

### 4.1 必选能力：Director Model

负责：

- 视频/音频分析后的语义理解；
- 重点提取；
- VisualUnit 选择；
- Effect Template 选择；
- Motion Intent 选择；
- VisualAssetIntent 声明。

当前默认配置来源：

```text
项目根目录 .env
model=qwen3.8-flash
```

主模型 API Key 可以来自：

1. CueCut 私密 Secret Store；
2. 项目根目录 `.env`；
3. 其他已批准的本地服务端配置。

### 4.2 可选能力：Visual Asset Provider

负责：

- 角色、机器人、复杂物体、概念隐喻、3D 对象等 raster asset 生成。

它不是主流程的必选条件。

### 4.3 关键规则

| 条件 | 业务行为 |
|---|---|
| Director Key 缺失 | 阻止 AI 生成 |
| Director Model 缺失 | 阻止 AI 生成 |
| 生图 Provider 关闭 | 正常完成原生包装 |
| 生图 Provider 配置不完整 | 跳过生图，显示警告 |
| 生图 Provider 请求失败 | 跳过生图，显示警告 |
| 外部 Project JSON | 不需要任何模型 Key |
| 外部 Plan JSON | 不需要任何模型 Key |

---

## 5. 总体业务流程

### 5.1 AI 生成流程

```text
用户点击“开始生成”
        ↓
客户端 Preflight
        ↓
主模型未配置？──是──→ BLOCKED + 打开设置提示
        │
        否
        ↓
服务端再次 Preflight
        ↓
ASR / Transcript
        ↓
Packaging Director：严格 1 次调用
        ↓
Grounding / Plan / Layout / Motion Runtime
        ↓
是否存在 VisualAssetIntent？
        ├─ 否 → Workspace
        ├─ 生图未配置 → WARNING → 原生包装 → Workspace
        └─ 已配置 → 尝试生图
                    ├─ 成功 → 绑定素材 → Workspace
                    └─ 失败 → WARNING → 原生包装 → Workspace
```

### 5.2 外部 JSON 流程

```text
用户点击“载入包装 JSON”
        ↓
读取本地 JSON
        ↓
解析并校验 Bundle Schema
        ↓
判断 mode
        ├─ plan
        │   └─ Grounding → Resolve → Layout → Motion Compile → Bind Assets
        └─ project
            └─ Project Schema → Bind Assets → Runtime Compile
        ↓
缺失素材检查
        ↓
Workspace
```

外部导入流程禁止调用 Director、ASR 或生图 Provider。

---

## 6. Preflight 设计

### 6.1 新增接口

新增：

```http
GET /api/runtime-capabilities
```

返回：

```ts
type RuntimeCapabilities = {
  ok: true
  director: {
    configured: boolean
    verified: boolean
    model: string | null
    source: 'secret-store' | 'env' | 'none'
    reason?: string
  }
  visualAssets: {
    mode: 'ready' | 'disabled' | 'misconfigured'
    provider: 'disabled' | 'openai-compatible' | 'custom'
    model: string | null
    reason?: string
  }
}
```

### 6.2 配置检查规则

```ts
director.configured = Boolean(apiKey && model)

visualAssets.mode = provider === 'disabled'
  ? 'disabled'
  : apiKey && endpoint && model
    ? 'ready'
    : 'misconfigured'
```

`configured` 只表示本地配置存在，不能冒充远程 API 已验证。

`verified` 只有在明确执行轻量 Provider 验证后才能为 `true`。默认不为了 Preflight 自动消费 API 额度。

### 6.3 客户端规则

生成按钮的执行顺序必须是：

```ts
setGenerationState('preflight')
const capability = await getRuntimeCapabilities()

if (!capability.director.configured) {
  setGenerationState('blocked')
  setGenerationError('请先在设置中配置主模型 API Key 和模型')
  return
}

setGenerationState('generating')
```

生成按钮在 `preflight`、`generating` 状态禁用。

### 6.4 服务端规则

服务端必须在执行 ffmpeg、ASR 或 Director 请求前再次检查：

```ts
if (!capabilities.director.configured) {
  return 409 JSON {
    error: 'DIRECTOR_PROVIDER_NOT_CONFIGURED',
    message: '主模型 API Key 或模型未配置'
  }
}
```

服务端检查不能只依赖客户端，因为客户端状态可能过期或被绕过。

### 6.5 HTTP 状态

| 情况 | HTTP |
|---|---:|
| 配置正常 | 200 |
| 主模型未配置 | 409 |
| 外部生图未配置 | 不阻止主流程 |
| 外部 Provider 超时 | 502，若为可选步骤则转 warning |
| JSON 无效 | 400 |
| JSON 结构合法但素材缺失 | 200 + partial |

---

## 7. 生成状态机

```ts
type GenerationStatus =
  | 'idle'
  | 'preflight'
  | 'blocked'
  | 'generating'
  | 'completed'
  | 'completed-with-warnings'
  | 'partial'
  | 'failed'
```

状态转移：

```text
idle
 └─ preflight
     ├─ blocked
     └─ generating
         ├─ completed
         ├─ completed-with-warnings
         ├─ partial
         └─ failed
```

### 7.1 用户可见文案

主模型未配置：

```text
无法开始生成：请先配置阿里云百炼 API Key 和主模型。
```

生图服务未配置：

```text
视觉资产生图服务未配置，已跳过生图；原生文字和动效仍会继续生成。
```

生图失败：

```text
视觉资产生成失败，已回退到原生包装。
```

所有错误都必须结束 loading 状态，不能只写日志。

---

## 8. 外部 Packaging Bundle 契约

### 8.1 顶层 Schema

```ts
type CueCutPackagingBundle = {
  schema: 'cuecut.packaging-bundle'
  version: 1
  mode: 'plan' | 'project'
  bundleId?: string
  createdAt?: string
  generator?: {
    name: string
    version?: string
  }
  project?: ExternalProjectMetadata
  packagingPlan?: PackagingPlan
  composition?: ProjectComposition
  assets: ExternalAssetEntry[]
  transcript?: TranscriptSegment[]
  warnings?: string[]
}
```

### 8.2 模式约束

当 `mode === 'plan'`：

- 必须存在 `packagingPlan`；
- 可以存在 `project`；
- 不要求 `composition`；
- CueCut 负责本地 Resolve、Layout、Motion Compile。

当 `mode === 'project'`：

- 必须存在 `composition`；
- `composition` 必须通过现有 Project Schema；
- 不再调用 AI；
- 可以不存在 `packagingPlan`。

### 8.3 外部项目元数据

```ts
type ExternalProjectMetadata = {
  projectId: string
  durationSec: number
  fps: number
  canvasWidth: number
  canvasHeight: number
  aspectRatio: string
  sourceFileName?: string
}
```

### 8.4 素材条目

```ts
type ExternalAssetEntry = {
  assetId: string
  fileName: string
  kind: 'generated' | 'imported' | 'builtin'
  mimeType?: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml'
  required: boolean
  sha256?: string
  sourceSubtitleIds?: string[]
  projectAssetRef?: string
}
```

约束：

- `assetId` 必须符合 `^[a-z][a-z0-9_]*$`；
- `fileName` 只能是文件名，不允许绝对路径；
- 禁止 `..`、盘符、UNC 路径和远程 URL；
- 素材通过用户本地文件选择绑定；
- JSON 不得包含 API Key。

---

## 9. 外部 JSON 导入 UX

### 9.1 第一版入口

在现有顶部操作区增加：

```text
载入包装 JSON
```

允许用户选择：

1. 一个 Bundle JSON；
2. 零个或多个配套图片素材。

素材按照 `fileName` 和 `assetId` 匹配，不按照绝对路径匹配。

### 9.2 导入结果

成功：

```text
已载入外部包装：12 个包装项，8 个素材已绑定。
```

部分成功：

```text
包装已载入，但有 2 个必需素材缺失，当前不可导出。
```

失败：

```text
无法载入包装 JSON：文件结构不符合 CueCut Bundle v1。
```

### 9.3 缺失素材规则

| 素材状态 | 行为 |
|---|---|
| optional 缺失 | 使用占位符，记录 warning，可继续编辑和导出 |
| required 缺失 | 显示缺失状态，可进入 Workspace，但禁止导出 |
| fileName 不匹配 | 视为缺失 |
| hash 不匹配 | 视为缺失并提示重新选择 |
| 不支持格式 | 拒绝绑定 |

不得静默删除缺失的视觉资产。

---

## 10. 导入后的本地处理

### 10.1 Plan 模式

```ts
validateBundleSchema(bundle)
validateGrounding(bundle.packagingPlan)
const resolved = resolvePackagingPlan(bundle.packagingPlan)
const bound = bindExternalAssets(resolved, selectedFiles, bundle.assets)
const project = applyResolvedPackagingToProject(baseProject, bound)
const runtime = compileProjectToRuntime(project)
validateRuntime(runtime)
store.replaceComposition(project)
```

### 10.2 Project 模式

```ts
validateBundleSchema(bundle)
const project = projectCompositionSchema.parse(bundle.composition)
const bound = bindExternalAssets(project, selectedFiles, bundle.assets)
const runtime = compileProjectToRuntime(bound.project)
validateRuntime(runtime)
store.replaceComposition(bound.project)
```

### 10.3 禁止行为

导入流程禁止：

- 自动调用 `/api/generate-packaging`；
- 自动调用 `/api/generate-effects`；
- 自动调用 `/api/generate-visual-assets`；
- 自动把 JSON 发送到第三方；
- 自动执行 JSON 中的脚本或 URL；
- 直接信任 JSON 中的文件路径。

---

## 11. API Key 与安全要求

### 11.1 Secret

以下字段只能进入服务端 Secret Store：

```text
bailianApiKey
visualAssetApiKey
```

禁止写入：

- 浏览器 localStorage；
- Project JSON；
- Packaging Bundle；
- Atlas manifest；
- 前端响应正文；
- 日志；
- 错误堆栈；
- `.ai-ledger`。

### 11.2 Public Settings

前端只能获得：

```ts
{
  bailianApiKeyConfigured: boolean
  visualAssetApiKeyConfigured: boolean
  visualAssetProvider: string
  visualAssetEndpoint: string
  visualAssetModel: string
}
```

不返回 Key 原文、长度、前缀或 hash。

### 11.3 外部请求

所有第三方请求必须：

- 使用服务端 Secret Store 中的 Key；
- 具备 30 秒默认超时；
- 检查 HTTP 状态；
- 限制错误消息长度；
- 不把请求体中的视频或完整 SRT 发送给生图 Provider；
- 生图 Provider 只接收已冻结的 VisualAssetCandidate/Atlas 计划。

---

## 12. 推荐代码结构

### 12.1 Server

```text
src/server/
  runtimeCapabilities.ts
  runtimeCapabilitiesRoute.ts
  generationPreflight.ts
  externalBundleRoute.ts
  externalBundleValidator.ts
  visualAssetProvider.ts
  settingsRoute.ts
  secretStore.ts
```

### 12.2 Client

```text
src/app/
  App.tsx
  settings/
    ProviderSettings.tsx
  import/
    PackagingBundleImporter.tsx
```

如果现有项目结构不适合，不得为了形式强行新增目录；可使用现有文件，但职责必须保持清晰。

### 12.3 Shared

```text
src/contracts/
  runtimeCapabilities.ts
  packagingBundle.ts
```

Bundle Schema 必须由客户端和服务端共享同一份定义，不能各写一套近似结构。

---

## 13. Work Items

严格一次只执行一个 Work Item。

### WI-00｜Baseline 与安全快照

读取：

- 当前 `package.json`；
- 当前 App 入口；
- 当前 Settings Route；
- 当前 Generation Route；
- 当前 Visual Asset Provider；
- 当前 Project/Runtime Schema；
- 当前测试与脏文件。

输出：

```text
docs/evidence/preflight-external-bundle-WI-00.md
```

不得 reset、clean、stash 或覆盖用户修改。

### WI-01｜Runtime Capabilities 查询

实现：

- `GET /api/runtime-capabilities`；
- Director 配置判断；
- Visual Asset 配置判断；
- Secret 不回显。

测试：

- Key 缺失返回 configured=false；
- `.env` Key 存在返回 configured=true；
- 生图未配置时 mode=misconfigured 或 disabled；
- 响应不含 Key 原文。

### WI-02｜生成前客户端 Preflight

实现：

- 生成按钮先调用 capabilities；
- 主模型未配置立即 blocked；
- 错误状态可见；
- 不进入无穷 loading。

测试：

- 未配置主模型时不会调用生成接口；
- 设置错误文案可见；
- 按钮从 preflight 正确回到可操作状态。

### WI-03｜服务端二次 Preflight 与超时

实现：

- Generation/Packaging Route 二次检查；
- Director 请求超时；
- 外部请求错误映射；
- 失败时清理临时资源。

测试：

- 绕过客户端直接请求也返回 409；
- Provider 超时不会永久 pending；
- 错误响应不泄露 Secret。

### WI-04｜Visual Asset Optional Fallback

实现：

- 未配置生图时跳过生图；
- 生图失败时继续 native packaging；
- warnings/diagnostics 可见；
- 不新增 Director 调用。

测试：

- 生图未配置时主流程完成；
- 生图 500/timeout 时主流程完成；
- Director call count 仍为 1。

### WI-05｜External Bundle Schema

实现：

- `CueCutPackagingBundle` schema；
- plan/project mode；
- asset entry schema；
- 路径与 URL 安全校验。

测试：

- 合法 plan 通过；
- 合法 project 通过；
- 缺 schema/version 拒绝；
- 绝对路径、远程 URL、`..` 拒绝；
- API Key 字段拒绝。

### WI-06｜External JSON Import

实现：

- “载入包装 JSON”入口；
- 本地 JSON 读取；
- plan 模式本地 Runtime 编译；
- project 模式直接校验载入；
- 不调用任何 AI API。

测试：

- import plan 后能进入 Workspace；
- import project 后能进入 Workspace；
- import 过程 API call count=0；
- 非法 JSON 给出可理解错误。

### WI-07｜Asset Binding 与 Partial 状态

实现：

- 多文件素材选择；
- assetId/fileName 匹配；
- optional/required 规则；
- 缺失素材 diagnostics；
- required 缺失时阻止导出。

测试：

- 素材正确绑定；
- optional 缺失可继续；
- required 缺失进入 partial；
- hash 不匹配拒绝绑定。

### WI-08｜`.cuecut-bundle` P1

仅在 P0 完成后实现：

- bundle manifest；
- JSON 与 assets 打包；
- 解包校验；
- 版本迁移边界。

### WI-09｜Contract / Golden E2E

覆盖：

1. 主模型未配置 → 立即阻止；
2. 主模型已配置、生图未配置 → 正常完成并显示 warning；
3. 主模型和生图都配置 → 尝试生图；
4. 生图失败 → native fallback；
5. 外部 plan JSON → 无模型调用进入 Workspace；
6. 外部 project JSON → 无模型调用进入 Workspace；
7. 缺失 required asset → partial 且禁止导出；
8. Director call count 始终符合契约。

---

## 14. 测试要求

### 14.1 单元测试

必须覆盖：

- capability resolver；
- `.env`/Secret Store 配置优先级；
- visual asset optional fallback；
- Bundle schema；
- path safety；
- asset binding；
- partial state；
- timeout；
- error mapping。

### 14.2 集成测试

必须验证：

- 客户端 preflight → 生成接口顺序；
- 服务端二次 preflight；
- 主模型一次调用；
- 生图失败不拖垮 native packaging；
- 外部导入不触发 AI API。

### 14.3 E2E 测试

必须使用真实可见 UI 断言：

- 未配置时用户看到阻断提示；
- 设置表单可以打开；
- 生图未配置时主流程完成；
- 外部 JSON 入口可见；
- 导入后 Workspace 内容发生变化；
- required 素材缺失时导出按钮不可用。

禁止只检查内部对象相等来替代用户体验验收。

---

## 15. Acceptance Matrix

### A. 主模型

- [ ] 生成前检查 API Key；
- [ ] 生成前检查模型名；
- [ ] 缺失时不上传视频、不调用 ASR、不调用 Director；
- [ ] 设置提示明确；
- [ ] 服务端有二次检查；
- [ ] 请求不会永久 pending。

### B. 生图模型

- [ ] Provider 默认关闭；
- [ ] 未配置时 native packaging 正常完成；
- [ ] 生图失败时 native packaging 正常完成；
- [ ] warning 可见；
- [ ] 生图不重新解释 SRT；
- [ ] 不新增 Director 调用。

### C. 外部 JSON

- [ ] `cuecut.packaging-bundle` schema 校验；
- [ ] 支持 `plan`；
- [ ] 支持 `project`；
- [ ] 导入不调用模型；
- [ ] 导入不调用生图；
- [ ] 不执行 JSON 中脚本；
- [ ] 不信任绝对路径和远程 URL。

### D. 素材

- [ ] assetId 稳定且符合 snake_case；
- [ ] fileName 安全；
- [ ] 可以绑定 PNG/JPEG/WebP/SVG；
- [ ] optional 缺失可继续；
- [ ] required 缺失进入 partial；
- [ ] required 缺失禁止导出；
- [ ] hash 不匹配有提示。

### E. 安全

- [ ] API Key 只在服务端；
- [ ] API Key 不出现在响应正文；
- [ ] API Key 不进 JSON；
- [ ] API Key 不进日志；
- [ ] API Key 不进 ledger；
- [ ] `.env` 不纳入 Git；
- [ ] 不自动向第三方上传私有视频。

### F. Runtime 一致性

- [ ] 外部 plan 经过同一 Runtime Compiler；
- [ ] 外部 project 经过 Project Schema；
- [ ] Workspace 使用 Canonical RuntimeItem；
- [ ] Export 使用同一 Runtime 语义；
- [ ] 未绕过现有 one-call guard。

---

## 16. Definition of Done

本 PRD 的 P0 只有满足以下条件才可标记完成：

```text
主模型未配置时能在生成前明确阻止
+
生图模型未配置或失败时 native packaging 仍能完成
+
所有外部请求有超时
+
外部 plan/project JSON 均可校验并导入
+
配套素材可以绑定
+
缺失素材状态可见
+
required 缺失时导出被阻止
+
外部导入不触发任何 AI API
+
Director 一次调用契约保持不变
+
单测、集成测试、E2E 通过
+
没有 Secret 泄露
```

如果真实 Provider 没有配置：

- 可以标记代码和 synthetic tests 完成；
- 不得标记真实生图 E2E 完成；
- 必须将状态记录为 `WAITING_USER`，并写明缺少 Provider Key/Endpoint。

---

## 17. Codex 执行纪律

每个 Work Item 必须按以下顺序执行：

```text
A. Read-only inspect
B. 写 Implementation Note
C. 先补失败测试
D. 确认测试按预期失败
E. 最小实现
F. 运行本项测试
G. 运行回归测试
H. 检查 diff 与 Secret
I. 写 Evidence
J. 只有验收通过才进入下一项
```

禁止：

- 一次实现整个 PRD；
- 用 Build PASS 代替产品验收；
- 以 optional 生图失败阻塞 native packaging；
- 以 optional 生图未配置阻塞外部 JSON 导入；
- 擅自修改一级 UI 结构；
- reset、clean、stash 用户改动；
- 自动 push、部署或发布。

下一步执行入口：

```text
WI-00 Baseline → WI-01 Capabilities → WI-02 Client Preflight
```
