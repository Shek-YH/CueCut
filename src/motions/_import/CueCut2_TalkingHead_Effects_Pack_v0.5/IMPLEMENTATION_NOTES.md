# v0.5 实装建议

## P0
优先实装：
1. CursorClick
2. KeyboardShortcut
3. ClipboardAction
4. TransferAction
5. NotificationToast
6. AIProcessingBadge
7. IconPop

这几种对 AI 软件教程类视频价值最高。

## 交互动效不是交互 UI

视频里的：
- CursorClick
- MouseClick
- KeyboardShortcut

是“视觉说明层”，不是用户真的在视频画面里操作。

Timeline 必须能够精准控制：
- cursor arrival
- click frame
- ripple frame
- completion state

## 社交 CTA

Like / Follow / Subscribe 不应在所有视频自动插入。

Visual Director / 用户设置应提供：
- enableSocialCTA
- preferredAction
- maxPerVideo
- allowedScenes

避免 AI 每隔几十秒就弹 CTA。

## AI 微动效

AISpark 和 AIProcessingBadge 适合：
- 模型开始处理
- Agent 执行
- AI 生成完成

不要凡是出现“AI”两个字都使用 AISpark。

## Notification

NotificationToast 可以与未来真实 UI screenshot/recording 组合，但默认视觉必须保持“通用”，不要模仿具体操作系统或商业软件的通知 UI。
