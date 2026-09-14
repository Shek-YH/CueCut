# WI-16｜Packaging Validator Mainline

**Status:** COMPLETED  
**Goal:** 在 resolve/apply 之间接入现有 Packaging Validator，阻止 invalid timing/edge/overlap/typography/runtime 数据进入 Project。

## Contract

- **Why now:** validator 已存在但此前只作为闲置模块，主生成按钮没有门禁。
- **Dependencies:** WI-15 completed。
- **Primary files:** `src/packaging/validateResolved.ts`、`src/app/App.tsx`、validator tests。
- **Allowed scope:** resolved overlay → ValidatableOverlay adapter, validation gate before store mutation。
- **Non-goals:** 不做 AI repair、不改 validator issue taxonomy、不改 UI architecture。
- **Invariants:** deterministic; fatal validation prevents Project mutation; native path does not depend on visual provider。
- **Implementation steps:** invalid resolved plan test → adapter → App gate → regression。
- **Tests/commands:** validateResolved/App/packaging/validator tests、`pnpm lint`、`git diff --check`。
- **User-visible acceptance:** invalid resolved plan is rejected before Workspace update; valid plan continues to Workspace。
- **Failure handling:** error is surfaced through existing packaging error state; no secret/provider payload is included。
- **Rollback:** revert WI-16 files/tests/contract/evidence/ledger records only。

