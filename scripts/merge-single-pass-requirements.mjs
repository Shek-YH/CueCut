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
const project = readJson(path.join(ledger, 'project.json'), null);
const requirements = readJson(path.join(projectRoot, 'docs/single-pass-packaging/requirements.v1.json'), null);
const current = readJson(path.join(ledger, 'extensions/requirements.json'), null);
const tasksDoc = readJson(path.join(ledger, 'tasks.json'), null);
if (!project?.projectId || !requirements?.requirements || !current?.requirements || !tasksDoc?.tasks) throw new Error('Ledger or requirements input is incomplete');
if (path.resolve(project.rootPath) !== projectRoot) throw new Error('Project root binding mismatch');

const known = new Set(current.requirements.map((item) => item.requirementId));
const timestamp = now();
const added = requirements.requirements.filter((item) => !known.has(item.requirementId)).map((item) => ({ ...item, projectId: project.projectId, updatedAt: timestamp }));
current.requirements = [...current.requirements, ...added];
current.projectId = project.projectId;
current.updatedAt = timestamp;

const linked = new Map();
for (const requirement of [...current.requirements]) {
  for (const taskId of requirement.implementationTasks || []) {
    const list = linked.get(taskId) || [];
    list.push(requirement.requirementId);
    linked.set(taskId, list);
  }
}
tasksDoc.tasks = tasksDoc.tasks.map((task) => linked.has(task.id) ? { ...task, requirementIds: [...new Set(linked.get(task.id))], updatedAt: timestamp } : task);
tasksDoc.updatedAt = timestamp;

writeJsonAtomic(path.join(ledger, 'tasks.json'), tasksDoc);
writeJsonAtomic(path.join(ledger, 'extensions/requirements.json'), current);
updateProjectTimestamp(projectRoot);
updateRuntimeTimestamp(projectRoot);
for (const requirement of added) appendEvent(projectRoot, { type: 'REQUIREMENT_CREATED', requirementId: requirement.requirementId, implementationTasks: requirement.implementationTasks });
appendEvent(projectRoot, { type: 'REQUIREMENT_EXTRACTION_COMPLETED', source: 'CueCut_Single_Pass_AI_Packaging_Engine_PRD_V1.0.md', added: added.length });

console.log(JSON.stringify({ projectId: project.projectId, added: added.map((item) => item.requirementId), total: current.requirements.length }, null, 2));
