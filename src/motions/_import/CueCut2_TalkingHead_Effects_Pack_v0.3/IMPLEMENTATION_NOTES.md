# v0.3 实装说明

## 1. 原生组件

`01_` 到 `06_` 下的 CueCut 组件是本包为 CueCut3 编写的候选实现。

Codex 应：
1. 对照项目现有 Effect Registry。
2. 建 Adapter / registry entry。
3. 接入 preview / timeline / renderer / export。
4. 根据 CueCut3 当前设计系统调整尺寸、字体、颜色变量。
5. 保持 progress-driven。

## 2. Image path

ToolCard / ProductCard 接受 `iconSrc` / `imageSrc`。

禁止默认填网络 URL。
优先使用：
- 项目素材库
- 用户导入本地素材
- 项目已有 asset URL abstraction

## 3. Alert

AlertCard 提供：
- info
- success
- warning
- error

AI 选择时必须基于语义，而不是因为文案里出现“注意”两个字就必定使用 warning。

## 4. Delta

DeltaMetric 适合：
- 增长
- 降低
- 当前 vs 过去

若文案是 3 个以上数据项排名，应改用 v0.2 RankingBars。

## 5. CauseEffect

只用于存在明确因果关系的两端信息。

若是 3~5 阶段流程，使用 v0.2 FlowSteps / StepTimeline。

## 6. BorderTrail / BorderBeam

第三方参考版本采用实时 Motion 无限循环。
若进入 production：
- 适配为 timeline/frame progress
- 避免不确定循环
- 避免 export 与 preview 不一致
