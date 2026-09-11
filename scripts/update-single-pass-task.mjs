import path from 'node:path';
import {
  appendEvent,
  now,
  readJson,
  updateProjectTimestamp,
  updateRuntimeTimestamp,
  writeJsonAtomic,
} from 'file:///C:/Users/Administrator/.codex/skills/ai-autonomous-project-ledger-skill/scripts/ledger-utils.mjs';

const args = process.argv.slice(2);
const projectRoot = path.resolve(args[0] || process.cwd());
const taskId = args[1];
const status = args[2];
const progress = Number(args[3]);
const evidence = args.includes('--evidence') ? args[args.indexOf('--evidence') + 1].split(';').filter(Boolean) : [];
if (!taskId || !status || !Number.isInteger(progress)) throw new Error('Usage: update-single-pass-task.mjs <root> <taskId> <status> <progress> [--evidence path;path]');

const file = path.join(projectRoot, '.ai-ledger/tasks.json');
const document = readJson(file, null);
const task = document?.tasks?.find((item) => item.id === taskId);
if (!task) throw new Error(`Unknown task: ${taskId}`);
if (!['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'WAITING_USER', 'WAITING_REVIEW', 'COMPLETED', 'PAUSED'].includes(status)) throw new Error(`Invalid status: ${status}`);
if (status === 'NOT_STARTED' && progress !== 0) throw new Error('NOT_STARTED requires progress 0');
if (status === 'COMPLETED' && progress !== 100) throw new Error('COMPLETED requires progress 100');
if (status === 'IN_PROGRESS' && (progress < 1 || progress > 99)) throw new Error('IN_PROGRESS requires progress 1..99');
const previous = task.status;
const timestamp = now();
task.status = status;
task.progress = progress;
task.updatedAt = timestamp;
if (evidence.length) task.evidence = [...new Set([...(task.evidence || []), ...evidence])];
if (status === 'COMPLETED') task.completedAt = timestamp;
document.updatedAt = timestamp;

writeJsonAtomic(file, document);
updateProjectTimestamp(projectRoot);
updateRuntimeTimestamp(projectRoot);
appendEvent(projectRoot, { type: 'TASK_UPDATED', taskId, previousStatus: previous, status, progress, evidence });
if (previous !== status) appendEvent(projectRoot, { type: 'TASK_STATUS_CHANGED', taskId, previousStatus: previous, status });
if (progress !== Number(task.previousProgress || 0)) appendEvent(projectRoot, { type: 'TASK_PROGRESS_CHANGED', taskId, progress });
if (status === 'COMPLETED') appendEvent(projectRoot, { type: 'TASK_COMPLETED', taskId });

console.log(JSON.stringify({ taskId, previousStatus: previous, status, progress, evidence }, null, 2));
