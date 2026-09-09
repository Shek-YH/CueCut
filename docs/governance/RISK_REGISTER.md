# CueCut Risk Register｜Talking-Head Effects Phase

**Updated:** 2026-09-08

| ID | Risk | Impact | Mitigation | Owner | Status |
|---|---|---|---|---|---|
| RISK-EFX-001 | 当前 Canvas 仍是占位矩形，不能证明正式动效 | High | R03 以共享 frame model 重写 renderer，并由 R90 检查 Preview/Canvas parity | R03/R90 | OPEN |
| RISK-EFX-002 | 第三方源码依赖 `motion/react`、Tailwind alias，原样复制会编译失败/引入重复 runtime | High | R01 建本地 Adapter；只保留 MIT 来源与必要源码证据 | R01/R06 | CONTROLLED |
| RISK-EFX-003 | 旧 effect ID 可能进入项目/历史工程 | High | R02 全仓引用/运行时注册/持久化扫描；无证据不删除，必要时 deprecated adapter | R02 | OPEN |
| RISK-EFX-004 | 中文字形拆分/换行和 9:16 溢出 | High | frame model 统一测量与 clamp；覆盖 4/8/16/24 字和双画幅测试 | R03/R07 | OPEN |
| RISK-EFX-005 | UI Preview 成功但 Export 不一致 | High | Export 只消费统一 renderer/ExportPlan；host render evidence 单列 Real vs Synthetic | R05/R90 | OPEN |
| RISK-EFX-006 | MIT notice 或来源文件遗漏 | Medium | 解压后 checksum/source/license ledger；R06 独立检查 | R06 | OPEN |
| RISK-EFX-007 | 用户要求的 Alpha MOV 下游验证需要外部应用 | Medium | 本地生成先完成；WI-022 再请求用户在 CapCut/Jianying 中做一次操作 | R00 | WAITING_FOR_USER_LATER |
| RISK-EFX-008 | 运行时引入远程 CDN/在线字体/网络依赖 | High | 静态依赖扫描和 R90 门禁；代码不读取网络资源 | R01/R90 | CONTROLLED |
