import path from 'node:path';
import {
  appendEvent,
  now,
  readJson,
  updateProjectTimestamp,
  updateRuntimeTimestamp,
  writeJsonAtomic,
} from 'file:///C:/Users/Administrator/.codex/skills/ai-autonomous-project-ledger-skill/scripts/ledger-utils.mjs';

const projectRoot = path.resolve(process.argv[2] || process.cwd());
const ledger = path.join(projectRoot, '.ai-ledger');
const requirementsFile = path.join(ledger, 'extensions/requirements.json');
const tasksDocument = readJson(path.join(ledger, 'tasks.json'), null);
const requirementsDocument = readJson(requirementsFile, null);
if (!tasksDocument?.tasks || !requirementsDocument?.requirements) throw new Error('Ledger extensions are incomplete');
const completed = new Map(tasksDocument.tasks.map((task) => [task.id, task]));
const timestamp = now();
const implemented = [];
requirementsDocument.requirements = requirementsDocument.requirements.map((requirement) => {
  if (!requirement.requirementId.startsWith('REQ-SP-')) return requirement;
  const tasks = (requirement.implementationTasks || []).map((id) => completed.get(id)).filter(Boolean);
  const allComplete = tasks.length > 0 && tasks.every((task) => task.status === 'COMPLETED' && Number(task.progress) === 100);
  if (!allComplete) return requirement;
  const evidence = [...new Set(tasks.flatMap((task) => task.evidence || []))];
  implemented.push(requirement.requirementId);
  return {
    ...requirement,
    verificationStatus: 'IMPLEMENTED_NOT_VERIFIED',
    codeEvidence: evidence.filter((item) => item.startsWith('src/')),
    testEvidence: ['pnpm test --run', 'pnpm lint', 'pnpm build'],
    artifactEvidence: ['docs/single-pass-packaging/EXECUTION_LOG.md'],
    updatedAt: timestamp,
  };
});
requirementsDocument.updatedAt = timestamp;

writeJsonAtomic(requirementsFile, requirementsDocument);
updateProjectTimestamp(projectRoot);
updateRuntimeTimestamp(projectRoot);
for (const requirementId of implemented) appendEvent(projectRoot, { type: 'REQUIREMENT_IMPLEMENTED', requirementId });
console.log(JSON.stringify({ implemented, total: requirementsDocument.requirements.filter((item) => item.requirementId.startsWith('REQ-SP-')).length }, null, 2));
