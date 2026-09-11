import path from 'node:path';
import { appendEvent, now, readJson, updateRuntimeTimestamp, writeJsonAtomic } from 'file:///C:/Users/Administrator/.codex/skills/ai-autonomous-project-ledger-skill/scripts/ledger-utils.mjs';

const root = path.resolve(process.argv[2] || process.cwd());
const file = path.join(root, '.ai-ledger/project.json');
const project = readJson(file, null);
if (!project) throw new Error('Project ledger missing');
const timestamp = now();
project.status = 'WAITING_REVIEW';
project.currentPhase = 'single-pass-v1-verification';
project.updatedAt = timestamp;
project.phases = project.phases.map((phase) => phase.id === 'single-pass-v1-verification' ? { ...phase, status: 'WAITING_REVIEW', progress: 90, completedAt: null } : phase);
writeJsonAtomic(file, project);
updateRuntimeTimestamp(root);
appendEvent(root, { type: 'WAITING_REVIEW', phaseId: 'single-pass-v1-verification', reason: 'Implementation complete; independent verifier and external real-world acceptance remain.' });
console.log(JSON.stringify({ status: project.status, currentPhase: project.currentPhase }, null, 2));
