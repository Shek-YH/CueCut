import path from 'node:path';
import { now, readJson, updateProjectTimestamp, updateRuntimeTimestamp, writeJsonAtomic, appendEvent } from 'file:///C:/Users/Administrator/.codex/skills/ai-autonomous-project-ledger-skill/scripts/ledger-utils.mjs';

const root = path.resolve(process.argv[2] || process.cwd());
const file = path.join(root, '.ai-ledger/extensions/requirements.json');
const document = readJson(file, null);
const quotes = {
  'REQ-SP-001': '每个视频项目的自动包装流程原则上只允许执行一次生成式 AI 调用。',
  'REQ-SP-002': 'Analysis Engine',
  'REQ-SP-003': 'Packaging IR',
  'REQ-SP-004': '数据结构持久化',
  'REQ-SP-005': 'Registry 系统',
  'REQ-SP-006': '至少支持 8 类包装',
  'REQ-SP-007': 'Registry Resolver',
  'REQ-SP-008': 'CueCut Motion DSL',
  'REQ-SP-009': 'Edge Safe Area',
  'REQ-SP-010': 'Subject Spatial System',
  'REQ-SP-011': 'Layout Solver',
  'REQ-SP-012': 'Collision Resolver',
  'REQ-SP-013': 'Fallback Engine',
  'REQ-SP-014': 'Packaging Validator',
  'REQ-SP-015': 'Snapshot QA',
  'REQ-SP-016': 'Timeline Compiler',
  'REQ-SP-017': 'Preview 与 Render 分离',
  'REQ-SP-018': '透明通道导出',
  'REQ-SP-019': '用户可修改而不重新调用 AI 的参数',
  'REQ-SP-020': '用户手动修改后状态',
  'REQ-SP-021': '稳定性要求',
  'REQ-SP-022': '错误处理',
  'REQ-SP-023': '核心埋点',
};
const timestamp = now();
document.requirements = document.requirements.map((requirement) => quotes[requirement.requirementId] ? { ...requirement, source: { ...requirement.source, quote: quotes[requirement.requirementId] }, updatedAt: timestamp } : requirement);
document.updatedAt = timestamp;
writeJsonAtomic(file, document);
updateProjectTimestamp(root);
updateRuntimeTimestamp(root);
appendEvent(root, { type: 'REQUIREMENT_UPDATED', scope: 'single-pass-fidelity-quotes' });
console.log(JSON.stringify({ updated: Object.keys(quotes).length }, null, 2));
