import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";

export type ProjectRegistryEntry = {
  projectId: string;
  rootPath: string;
  addedAt: string;
};

type ProjectRegistryFile = {
  projects: ProjectRegistryEntry[];
};

function emptyRegistry(): ProjectRegistryFile {
  return { projects: [] };
}

function readRegistryFile(path: string): ProjectRegistryFile {
  if (!existsSync(path)) {
    return emptyRegistry();
  }

  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { projects?: unknown }).projects)) {
    throw new Error("Project registry must contain a projects array");
  }
  return parsed as ProjectRegistryFile;
}

function writeRegistryFile(path: string, registry: ProjectRegistryFile): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

export class ProjectRegistry {
  private readonly registryPath: string;

  public constructor(registryPath: string) {
    this.registryPath = resolve(registryPath);
  }

  public list(): ProjectRegistryEntry[] {
    return readRegistryFile(this.registryPath).projects;
  }

  public add(entry: ProjectRegistryEntry): ProjectRegistryEntry {
    const registry = readRegistryFile(this.registryPath);
    const existing = registry.projects.find(
      (project) => project.projectId === entry.projectId || resolve(project.rootPath) === resolve(entry.rootPath),
    );
    if (existing) {
      return existing;
    }

    const normalized = { ...entry, rootPath: resolve(entry.rootPath) };
    registry.projects.push(normalized);
    writeRegistryFile(this.registryPath, registry);
    return normalized;
  }

  public remove(projectId: string): boolean {
    const registry = readRegistryFile(this.registryPath);
    const nextProjects = registry.projects.filter((project) => project.projectId !== projectId);
    if (nextProjects.length === registry.projects.length) {
      return false;
    }

    writeRegistryFile(this.registryPath, { projects: nextProjects });
    return true;
  }
}

export function addProjectToRegistry(
  registryPath: string,
  entry: ProjectRegistryEntry,
): ProjectRegistryEntry {
  return new ProjectRegistry(registryPath).add(entry);
}

export function removeProjectFromRegistry(registryPath: string, projectId: string): boolean {
  return new ProjectRegistry(registryPath).remove(projectId);
}

export function readProjectRegistry(registryPath: string): ProjectRegistryEntry[] {
  return new ProjectRegistry(registryPath).list();
}

export function defaultProjectRegistryPath(): string {
  const configRoot = process.env.APPDATA
    ?? process.env.XDG_CONFIG_HOME
    ?? join(homedir(), ".config");
  return join(configRoot, "AIProjectLedgerDashboard", "projects.json");
}
