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
const projectFile = path.join(ledger, 'project.json');
const tasksFile = path.join(ledger, 'tasks.json');
const rolesFile = path.join(ledger, 'roles.json');

const project = readJson(projectFile, null);
const tasksDoc = readJson(tasksFile, null);
const rolesDoc = readJson(rolesFile, null);
if (!project?.projectId || !tasksDoc?.tasks || !rolesDoc?.roles) throw new Error('Existing Machine Ledger is incomplete');
if (path.resolve(project.rootPath) !== projectRoot) throw new Error('Project root binding mismatch');

const phases = [
  { id: 'single-pass-architecture', name: 'Single-Pass Packaging — Architecture and Requirement Extraction', status: 'IN_PROGRESS', progress: 10, completedAt: null },
  { id: 'single-pass-v1-deterministic', name: 'Single-Pass Packaging — Deterministic V1 Core', status: 'NOT_STARTED', progress: 0, completedAt: null },
  { id: 'single-pass-v1-integration', name: 'Single-Pass Packaging — AI, Preview, Export, and UI Integration', status: 'NOT_STARTED', progress: 0, completedAt: null },
  { id: 'single-pass-v1-verification', name: 'Single-Pass Packaging — Independent Verification and Final Acceptance', status: 'NOT_STARTED', progress: 0, completedAt: null },
];

const roleDefinitions = [
  { id: 'R-SP-ARCH', name: 'Single-Pass Architect', responsibility: 'Packaging IR, deterministic pipeline contracts, HyperFrames boundary, and Core Freeze' },
  { id: 'R-SP-BUILD', name: 'Single-Pass Builder', responsibility: 'V1 implementation inside the frozen packaging contracts' },
  { id: 'R-SP-VERIFY', name: 'Single-Pass Independent Verifier', responsibility: 'Independent PRD fidelity, tests, artifacts, and runtime evidence review' },
];

const definitions = [
  ['single-pass-01-analysis-contract', 'Define deterministic analysis snapshot contract', 'single-pass-architecture', [], 1],
  ['single-pass-02-ir-schema', 'Define and validate Packaging IR schema', 'single-pass-architecture', ['single-pass-01-analysis-contract'], 2],
  ['single-pass-03-persistence', 'Persist analysis, AI plan, and resolved plan atomically', 'single-pass-architecture', ['single-pass-02-ir-schema'], 3],
  ['single-pass-04-registry-manifest', 'Define independent registry manifest schema and license provenance', 'single-pass-v1-deterministic', ['single-pass-02-ir-schema'], 4],
  ['single-pass-05-registry-catalog', 'Build the V1 catalog with eight categories and thirty effects', 'single-pass-v1-deterministic', ['single-pass-04-registry-manifest'], 5],
  ['single-pass-06-registry-resolver', 'Resolve templates with deterministic capability scoring', 'single-pass-v1-deterministic', ['single-pass-05-registry-catalog'], 6],
  ['single-pass-07-motion-dsl', 'Compile the finite Motion DSL with seeded determinism', 'single-pass-v1-deterministic', ['single-pass-02-ir-schema'], 7],
  ['single-pass-08-safe-area', 'Implement independent edge insets and safe-area constraints', 'single-pass-v1-deterministic', ['single-pass-02-ir-schema'], 8],
  ['single-pass-09-subject-spatial', 'Implement subject avoid and foreground relations', 'single-pass-v1-deterministic', ['single-pass-08-safe-area'], 9],
  ['single-pass-10-layout', 'Implement normalized candidate layout solving', 'single-pass-v1-deterministic', ['single-pass-06-registry-resolver', 'single-pass-09-subject-spatial'], 10],
  ['single-pass-11-collision', 'Implement deterministic overlay collision resolution', 'single-pass-v1-deterministic', ['single-pass-10-layout'], 11],
  ['single-pass-12-fallback', 'Implement registry/layout/collision fallback chains', 'single-pass-v1-deterministic', ['single-pass-11-collision'], 12],
  ['single-pass-13-validator', 'Implement Packaging Validator and deterministic repair', 'single-pass-v1-deterministic', ['single-pass-12-fallback'], 13],
  ['single-pass-14-snapshot-qa', 'Implement snapshot checkpoints and pre-render QA', 'single-pass-v1-deterministic', ['single-pass-13-validator'], 14],
  ['single-pass-15-timeline-compiler', 'Compile resolved plans into the runtime timeline', 'single-pass-v1-deterministic', ['single-pass-07-motion-dsl', 'single-pass-14-snapshot-qa'], 15],
  ['single-pass-16-preview-render-separation', 'Separate interactive preview from final render', 'single-pass-v1-integration', ['single-pass-15-timeline-compiler'], 16],
  ['single-pass-17-export', 'Wire MP4 and transparent WebM export capabilities', 'single-pass-v1-integration', ['single-pass-16-preview-render-separation'], 17],
  ['single-pass-18-ai-director', 'Integrate the single-pass Packaging Director AI contract', 'single-pass-v1-integration', ['single-pass-15-timeline-compiler'], 18],
  ['single-pass-19-edit-without-ai', 'Support user edits, aspect changes, and locked overrides without AI', 'single-pass-v1-integration', ['single-pass-18-ai-director', 'single-pass-17-export'], 19],
  ['single-pass-20-determinism', 'Prove repeatable resolution and render inputs', 'single-pass-v1-verification', ['single-pass-19-edit-without-ai'], 20],
  ['single-pass-21-telemetry', 'Record AI call count and required packaging events', 'single-pass-v1-integration', ['single-pass-18-ai-director'], 21],
  ['single-pass-22-ui-flow', 'Expose the generate-packaging flow and advanced settings', 'single-pass-v1-integration', ['single-pass-18-ai-director', 'single-pass-21-telemetry'], 22],
  ['single-pass-23-independent-verification', 'Run V1 fidelity, security, regression, and independent verification gates', 'single-pass-v1-verification', ['single-pass-20-determinism', 'single-pass-22-ui-flow'], 23],
  ['single-pass-24-final-acceptance', 'Prepare final acceptance and safe local checkpoint', 'single-pass-v1-verification', ['single-pass-23-independent-verification'], 24],
];

const existingPhaseIds = new Set((project.phases || []).map((phase) => phase.id));
project.phases = [...(project.phases || []), ...phases.filter((phase) => !existingPhaseIds.has(phase.id))];
project.currentPhase = 'single-pass-architecture';
project.status = 'IN_PROGRESS';
project.updatedAt = now();

const existingRoleIds = new Set((rolesDoc.roles || []).map((role) => role.id));
rolesDoc.roles = [...rolesDoc.roles, ...roleDefinitions.filter((role) => !existingRoleIds.has(role.id))];

const existingTaskIds = new Set(tasksDoc.tasks.map((task) => task.id));
const timestamp = now();
const newTasks = definitions.filter(([id]) => !existingTaskIds.has(id)).map(([id, title, phaseId, dependencies, order]) => ({
  id,
  title,
  phaseId,
  status: 'NOT_STARTED',
  progress: 0,
  owner: id === 'single-pass-23-independent-verification' ? 'R-SP-VERIFY' : id === 'single-pass-24-final-acceptance' ? 'R00' : id.startsWith('single-pass-') && Number(id.match(/-(\d+)-/)?.[1] || 0) <= 2 ? 'R-SP-ARCH' : 'R-SP-BUILD',
  verifier: id === 'single-pass-23-independent-verification' ? 'R-SP-VERIFY' : 'R-SP-VERIFY',
  dependencies,
  requirementIds: [],
  evidence: [],
  executionRef: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  sequence: order,
}));
tasksDoc.tasks = [...tasksDoc.tasks, ...newTasks];
tasksDoc.updatedAt = timestamp;

writeJsonAtomic(projectFile, project);
writeJsonAtomic(rolesFile, rolesDoc);
writeJsonAtomic(tasksFile, tasksDoc);
updateRuntimeTimestamp(projectRoot);
for (const task of newTasks) appendEvent(projectRoot, { type: 'TASK_CREATED', taskId: task.id, phaseId: task.phaseId, owner: task.owner });
for (const role of roleDefinitions.filter((role) => !existingRoleIds.has(role.id))) appendEvent(projectRoot, { type: 'ROLE_CREATED', roleId: role.id, name: role.name });
appendEvent(projectRoot, { type: 'ARCHITECT_PHASE_STARTED', phaseId: 'single-pass-architecture', prd: 'CueCut_Single_Pass_AI_Packaging_Engine_PRD_V1.0.md' });

console.log(JSON.stringify({ projectId: project.projectId, addedPhases: phases.filter((phase) => !existingPhaseIds.has(phase.id)).map((phase) => phase.id), addedRoles: roleDefinitions.filter((role) => !existingRoleIds.has(role.id)).map((role) => role.id), addedTasks: newTasks.map((task) => task.id) }, null, 2));
