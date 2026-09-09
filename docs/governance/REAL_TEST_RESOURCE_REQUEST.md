# Real Test Resource Request

本期规划已经完成；动效实现、浏览器 Preview、Timeline 和本地 Renderer 不需要用户额外提供普通 mock 数据，AI 可自行使用 deterministic fixtures。

## 现在就需要

1. 无新增资源。项目内已有 16:9 与 9:16 本地视频、现有 Playwright/Vitest 工具链和指定动效 zip。

## 后续才需要

1. 若要把透明 MOV 标记为真正 Real Downstream E2E，需要用户在本机打开已安装的 CapCut/Jianying，导入测试 MOV 并确认叠加结果；该步骤无法由当前纯代码/浏览器执行器替代。
2. 若要对真实用户视频执行正式导出，需要用户确认该视频可用于本地测试；不会把媒体上传到聊天或第三方。

## 不需要用户提供

- 合成中文/英文文本、数字和列表样例；
- 普通 mock Project/Timeline/Canvas 数据；
- API Key、密码、Cookie 或 Token；本期动效能力不需要外部 API。

## Secrets / privacy

不在聊天中索取或记录任何 secret。现有 `测试素材与api\.env` 不读取、不打印、不提交；真实视频只使用本地路径并遵守 `.gitignore`。

## 调度决策

上述后续资源不阻塞当前 DAG；等到 `WI-022` 时再将 Alpha MOV 下游验证标为 `WAITING_FOR_USER`，其余本地 Golden Path 继续自动推进。
