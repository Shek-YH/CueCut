# Independent Verifier Context｜WI-015

## Role / Work Item

R90｜Independent Verifier；`WI-015` Audit, import and cleanup evidence。此 execution 必须独立于 R02 implementation executionRef `01a081fd-9c72-77b1-94fa-6bb56ad36cae`，只返回 `PASS` 或 `NEEDS_CHANGES`。

## Golden Path / scope

核验 GP-01/GP-02：zip 是否按安全路径解压、license 是否 byte-equal、候选/实例和 legacy motion 是否有引用依据、旧测试动效是否应删除、Evidence 是否诚实区分静态审计与测试。

## Read-only allowed facts

读取 PRD、本期 `docs/governance`、`docs/effect-migration/**`、`docs/THIRD_PARTY_MOTIONS.md`、`src/motions/_import/**`、`src/motions/licenses/**`、`src/effects/registry.ts`、`src/motions/registry.ts`、`src/motions/runtime.ts`、`src/project/**`、`src/editor/**`、`src/render/**`、`src/export/**`、`tests/**`。可写仅限 `docs/evidence/WI-015-VERIFIER.md`、`docs/handoffs/WI-015-VERIFIER.md`，不得修改生产源码、zip、license 或原有 owner evidence。

## Required checks

1. 独立执行 SHA-256、zip entry/path 安全检查、解压文件计数与 license hash/byte comparison；第三方来源 canonical 文件是 `docs/THIRD_PARTY_MOTIONS.md`，`docs/effect-migration/THIRD_PARTY_MOTIONS.md` 只是指针。
2. 独立执行多类 `rg` 引用扫描，确认 R02 的 KEEP/0 删除结论是否安全；检查没有删除动作。
3. 运行 `pnpm test --run tests/motions tests/effects` 和 `pnpm workflow:check`（如脚本可用）。
4. 检查无 secret/media/network runtime 变更。

## Verdict

PASS 仅在所有核心检查通过且缺陷为零；否则 NEEDS_CHANGES，明确文件/命令/缺口。不要做后续实现，不要标 ACCEPTED。
