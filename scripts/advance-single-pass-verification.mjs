import path from 'node:path';
import { appendEvent, now, readJson, updateRuntimeTimestamp, writeJsonAtomic } from 'file:///C:/Users/Administrator/.codex/skills/ai-autonomous-project-ledger-skill/scripts/ledger-utils.mjs';

const root = path.resolve(process.argv[2] || process.cwd());
const file = path.join(root, '.ai-ledger/project.json');
const project = readJson(file, null);
if (!project) throw new Error('Project ledger missing');
const timestamp = now();
project.phases = project.phases.map((phase) => {
  if (phase.id === 'single-pass-architecture' || phase.id === 'single-pass-v1-deterministic') return { ...phase, status: 'COMPLETED', progress: 100, completedAt: phase.completedAt || timestamp };
  if (phase.id === 'single-pass-v1-integration') return { ...phase, status: 'IN_PROGRESS', progress: 70, completedAt: null };
  if (phase.id === 'single-pass-v1-verification') return { ...phase, status: 'IN_PROGRESS', progress: 10, completedAt: null };
  return phase;
});
project.currentPhase = 'single-pass-v1-verification';
project.status = 'IN_PROGRESS';
project.updatedAt = timestamp;
writeJsonAtomic(file, project);
updateRuntimeTimestamp(root);
appendEvent(root, { type: 'VERIFIER_PHASE_STARTED', phaseId: 'single-pass-v1-verification', reason: 'Builder implementation and gates are ready for independent review; WebM/UI remain open.' });
console.log(JSON.stringify({ currentPhase: project.currentPhase, status: project.status }, null, 2));
