import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { packagingPlanSchema, type PackagingPlan } from './schema';

function writeJsonAtomic(file: string, value: unknown): void {
  mkdirSync(dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  renameSync(temporary, file);
}

function readJson<T>(file: string, parse: (value: unknown) => T): T | null {
  try {
    return parse(JSON.parse(readFileSync(file, 'utf8')));
  } catch {
    return null;
  }
}

export function savePackagingPlan(projectRoot: string, plan: PackagingPlan): void {
  const validated = packagingPlanSchema.parse(plan);
  writeJsonAtomic(join(projectRoot, 'ai', 'packaging-plan.json'), validated);
}

export function loadPackagingPlan(projectRoot: string): PackagingPlan | null {
  return readJson(join(projectRoot, 'ai', 'packaging-plan.json'), (value) => packagingPlanSchema.parse(value));
}

export function saveResolvedPackagingPlan(projectRoot: string, plan: unknown): void {
  writeJsonAtomic(join(projectRoot, 'resolved', 'resolved-plan.json'), plan);
}

export function loadResolvedPackagingPlan(projectRoot: string): unknown | null {
  return readJson(join(projectRoot, 'resolved', 'resolved-plan.json'), (value) => value);
}
