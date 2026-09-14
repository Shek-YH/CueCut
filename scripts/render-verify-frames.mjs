// 复用真实包装 plan 渲染多帧，导出「编辑器 canvas 路径」与「导出 RGBA 路径」两套 PNG 到 renders/verify/。
// 直接运行： node scripts/render-verify-frames.mjs
// 底层通过 vitest 用例产出 PNG（避免重复搭建 TS 运行环境）。
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(import.meta.url);
const root = resolve(here, '..');
const vitest = resolve(root, 'node_modules', 'vitest', 'vitest.mjs');

const result = spawnSync(process.execPath, [vitest, 'run', 'tests/export/verify-frames.test.ts'], {
  cwd: root,
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
