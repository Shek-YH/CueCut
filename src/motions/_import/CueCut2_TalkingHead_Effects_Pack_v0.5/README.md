# CueCut2 Talking-Head Effects Pack v0.5

本批重点：**图标 / 标签 / 社交动作 / 状态 / 通知 / 教程交互 / AI 微动效**。

## 新增 17 个 CueCut 原生候选

### Icon / Badge / Tag
- CueCutIconPop
- CueCutBadgePulse
- CueCutTagChips

### Social Action
- CueCutSocialAction
- CueCutEngagementStack

### Status / Notification
- CueCutNotificationToast
- CueCutStatusStamp

### Loading / Progress
- CueCutLoadingDots
- CueCutProgressSteps

### Cursor / Mouse
- CueCutCursorClick
- CueCutMouseClick

### Keyboard
- CueCutKeyboardShortcut

### Clipboard / File / Link
- CueCutClipboardAction
- CueCutTransferAction
- CueCutLinkReveal

### AI
- CueCutAISpark
- CueCutAIProcessingBadge

## 适用场景

这一批尤其适合 AI 工具教程口播：

- “点击这里”
- “按 Ctrl + Shift + P”
- “复制 API Key”
- “粘贴到这里”
- “下载完成”
- “AI 正在处理”
- “任务执行成功”
- “关注 / 点赞 / 订阅”
- “这个链接我放在简介里”

## 商业化与品牌风险

SocialAction 使用的是通用 Like / Follow / Subscribe 语义，不使用具体平台 Logo 或模仿某个平台完整 UI。

后续如果用户要使用抖音 / YouTube / 小红书等具体品牌视觉，需要单独处理品牌资产和商标使用规则，不要把平台 Logo 作为 CueCut 内置通用模板默认资产。

## Icon strategy

本包内置 `CueCutIcon.tsx` 小型通用 SVG 图标集，不要求额外图标运行时。

如果 CueCut3 已经使用 Lucide，可以由 Codex把 IconName 映射到现有 Lucide 组件，不必重复维护两套图标。
