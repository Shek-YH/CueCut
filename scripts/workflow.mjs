import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const workItemsDir = path.join(root, 'docs', 'work-items');
const graphPath = path.join(root, 'docs', 'governance', 'WORK_ITEM_GRAPH.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadItems() {
  return fs.readdirSync(workItemsDir)
    .filter((name) => /^WI-\d+\.json$/.test(name))
    .sort()
    .map((name) => readJson(path.join(workItemsDir, name)));
}

function validate(items, graph) {
  const errors = [];
  const ids = new Set(items.map((item) => item.id));
  const roles = new Set(['R00', 'R01', 'R02', 'R03', 'R04', 'R05', 'R06', 'R07', 'R90']);

  if (new Set(items.map((item) => item.id)).size !== items.length) errors.push('duplicate work item id');
  for (const item of items) {
    if (!roles.has(item.owner) || !roles.has(item.verifier) || !roles.has(item.orchestrator)) errors.push(`${item.id}: unknown role`);
    if (item.owner === item.verifier) errors.push(`${item.id}: owner and verifier must differ`);
    for (const dependency of item.dependencies ?? []) if (!ids.has(dependency)) errors.push(`${item.id}: missing dependency ${dependency}`);
    if (item.status === 'IN_PROGRESS' && !item.execution?.executionRef) errors.push(`${item.id}: IN_PROGRESS needs executionRef`);
    if (item.status === 'READY_FOR_REVIEW' && !item.evidence?.length) errors.push(`${item.id}: READY_FOR_REVIEW needs evidence`);
    if (item.status === 'VERIFIED' && item.review?.verdict !== 'PASS') errors.push(`${item.id}: VERIFIED needs verifier PASS`);
    if (item.status === 'ACCEPTED' && item.review?.verdict !== 'PASS') errors.push(`${item.id}: ACCEPTED needs VERIFIED review`);
    if (item.review?.executionRef && item.execution?.executionRef && item.review.executionRef === item.execution.executionRef) errors.push(`${item.id}: verifier executionRef must differ`);
  }

  const graphIds = new Set((graph.nodes ?? []).map((node) => node.id));
  for (const id of ids) if (!graphIds.has(id)) errors.push(`graph missing ${id}`);
  const edges = new Map(items.map((item) => [item.id, item.dependencies ?? []]));
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) { errors.push(`dependency cycle at ${id}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of edges.get(id) ?? []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of ids) visit(id);
  return errors;
}

function readyQueue(items) {
  const accepted = new Set(items.filter((item) => ['VERIFIED', 'ACCEPTED'].includes(item.status)).map((item) => item.id));
  return items.filter((item) => item.status === 'TODO' && (item.dependencies ?? []).every((id) => accepted.has(id))).map((item) => item.id);
}

function printCheck() {
  const items = loadItems();
  const graph = readJson(graphPath);
  const errors = validate(items, graph);
  const inProgress = items.filter((item) => item.status === 'IN_PROGRESS').map((item) => item.id);
  const queue = readyQueue(items);
  console.log(errors.length ? 'WORKFLOW_CHECK: FAIL' : 'WORKFLOW_CHECK: PASS');
  console.log(`IN_PROGRESS: ${inProgress.length ? inProgress.join(', ') : 'none'}`);
  console.log(`READY_QUEUE: ${queue.length ? queue.join(', ') : 'none'}`);
  if (errors.length) for (const error of errors) console.log(`ERROR: ${error}`);
  process.exitCode = errors.length ? 1 : 0;
}

function printNext() {
  const items = loadItems();
  const queue = readyQueue(items);
  console.log(`NEXT: ${queue.length ? queue.join(', ') : 'none'}`);
}

function printGolden() {
  const items = loadItems();
  for (const step of ['GP-01', 'GP-02', 'GP-03', 'GP-04', 'GP-05', 'GP-06', 'GP-07', 'GP-08']) {
    const related = items.filter((item) => item.goldenPathImpact?.includes(step));
    console.log(`${step}: ${related.map((item) => `${item.id}=${item.status}`).join(', ') || 'untracked'}`);
  }
}

function printReadiness() {
  const file = path.join(root, 'docs', 'governance', 'REAL_TEST_READINESS.md');
  const text = fs.readFileSync(file, 'utf8');
  console.log(text.split('\n').filter((line) => /\| (READY|WAITING_FOR_USER|BLOCKED) \|/.test(line)).join('\n') || 'READINESS: no unresolved rows');
}

const command = process.argv[2] ?? 'check';
if (command === 'check') printCheck();
else if (command === 'next') printNext();
else if (command === 'golden') printGolden();
else if (command === 'readiness') printReadiness();
else {
  console.error(`Unknown workflow command: ${command}`);
  process.exitCode = 2;
}
