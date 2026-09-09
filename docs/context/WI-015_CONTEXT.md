# Context Packet｜WI-015

## Role

R02｜Migration / Import / Cleanup。你不是唯一操作者；当前项目可能有并行 agent，请不要回退他人改动，不要修改未授权路径。

## Work Item

`WI-015` — Audit, import and cleanup evidence；当前状态 `TODO`，完成后只能交付 `READY_FOR_REVIEW`。

## Goal

严格按 `CueCut3_TalkingHead_Effects_Implementation_PRD_v1.0.md` 完成动效库现状盘点、旧动效引用审计、指定 zip 的安全解压与来源登记。不要实现新的生产 runtime，不要把 Demo/源码复制到业务目录冒充完成。

## Dependencies

无。项目当前已存在 React/Vite/TypeScript 编辑器、旧 Motion Registry/Runtime、Canvas/Timeline/Export 和现有 docs；本期 PRD 是最高规则。

## Core Golden Path Snapshot

`GP-01` 项目/动效库盘点 → `GP-02` 解压新包并完成 License/迁移证据。你的输出必须让后续 R01 能安全设计正式 adapter。

## Current GP Step

`GP-01`、`GP-02`。

## Source of Truth

- `CueCut3_TalkingHead_Effects_Implementation_PRD_v1.0.md`
- `00_PROJECT_ENTRY.md`
- `03_CORE_GOLDEN_PATH.md`
- `src/motions/CueCut2_TalkingHead_Effects_Pack_v0.1.zip`
- zip 内 `README.md`、`INTEGRATION_GUIDE.md`、`SOURCE_METADATA.json`、`SEMANTIC_EFFECT_TAXONOMY_v0.1.md`、`05_Licenses/*`
- 现有 `src/motions/registry.ts`、`src/motions/runtime.ts`、`src/effects/registry.ts`、`src/render/*`、`src/editor/*`

## Allowed Paths

- `docs/effect-migration/**`
- `docs/THIRD_PARTY_MOTIONS.md`
- `src/motions/_import/**`
- `src/motions/licenses/**`
- `docs/context/WI-015_CONTEXT.md`
- `docs/handoffs/WI-015.md`
- `docs/evidence/WI-015.md`

## Forbidden Paths

- 生产源码：`src/motions/registry.ts`、`src/motions/runtime.ts`、`src/effects/**`、`src/editor/**`、`src/render/**`、`src/export/**`、`src/project/**`
- `package.json`、`pnpm-lock.yaml`
- `.env`、用户媒体、`dist/`、`node_modules/`、`renders/`
- 不得删除已有动效/代码，除非本 Work Item 的静态引用扫描和运行时依赖分析在证据中明确证明安全；若没有可安全删除项，记录 KEEP。

## Acceptance Criteria

1. `EFFECT_LIBRARY_AUDIT.md` 至少包含 effectId/name/path/category、生产/UI/Timeline/Renderer/Export 引用、testOnly、visualQuality、action、reason。
2. `OLD_EFFECT_DELETE_PLAN.md` 记录全仓 `effectId`/`motionId`/registry/import/project/timeline/renderer/export/preset 引用扫描结果；对不确定项不删除。
3. zip 解压到 `src/motions/_import/CueCut2_TalkingHead_Effects_Pack_v0.1/`，不散落到生产目录；保留 5 个文本、2 个数字、AnimatedList、AnimatedGroup、许可证、指南、元数据。
4. `NEW_EFFECT_IMPORT_PLAN.md` 记录 checksum/文件清单/正式使用与仅参考文件。
5. License/来源记录可追溯，不能写入任何 secret。
6. 如果删除旧文件，必须同步记录删除前后验证；优先不删除当前生产候选。

## Required Tests / Evidence

- 用 PowerShell/Tar 记录 zip entry 清单和 SHA-256；用 `rg` 记录引用扫描。
- `tests/motions/import-audit.test.ts` 如需新增，只测试审计 helper 的可重复事实，不测试 shell 输出。
- 运行 `pnpm test --run tests/motions/import-audit.test.ts`（若新增）及现有 Motion/Effect registry tests。
- Evidence 必须区分静态审计与真实运行；当前不需要外部 API/用户登录。

## Real Test Requirements

`RT-EFX-01 local import audit`：本地 zip 与源码许可证事实；不上传文件、不调用网络。

## Security / IP

zip 来源为 Motion Primitives MIT 与 Magic UI MIT；原始 notice 必须原样保留。禁止读取 `测试素材与api/.env`，禁止新增 CDN/在线字体/远程 JS。

## Timeout / Failure Policy

60 分钟内完成。遇到路径/权限/压缩工具问题先记录命令和错误，不要扩大 scope；若发现未知删除风险，保守标记 `BLOCKED` 或 `KEEP`。

## Return Format

返回：`Role/WI`、执行摘要、变更文件、命令与结果、删/留/迁移清单、Evidence 路径、未决风险、建议状态（READY_FOR_REVIEW 或 BLOCKED）。不要声明 VERIFIED/ACCEPTED。
