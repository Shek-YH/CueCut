import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ProjectRegistry,
  addProjectToRegistry,
  removeProjectFromRegistry,
} from "../../server/registry/index.js";

describe("Dashboard project registry", () => {
  it("adds and removes only Dashboard configuration", () => {
    const workspaceRoot = mkdtempSync(join(tmpdir(), "registry-"));
    const projectRoot = join(workspaceRoot, "user-project");
    const registryPath = join(workspaceRoot, "dashboard-projects.json");
    writeFileSync(projectRoot, "user project marker\n");

    addProjectToRegistry(registryPath, {
      projectId: "project-001",
      rootPath: projectRoot,
      addedAt: "2026-09-08T18:00:00.000Z",
    });
    expect(JSON.parse(readFileSync(registryPath, "utf8"))).toEqual({
      projects: [
        {
          projectId: "project-001",
          rootPath: projectRoot,
          addedAt: "2026-09-08T18:00:00.000Z",
        },
      ],
    });
    expect(readFileSync(projectRoot, "utf8")).toBe("user project marker\n");

    expect(removeProjectFromRegistry(registryPath, "project-001")).toBe(true);
    expect(existsSync(projectRoot)).toBe(true);
    expect(readFileSync(projectRoot, "utf8")).toBe("user project marker\n");
    expect(JSON.parse(readFileSync(registryPath, "utf8"))).toEqual({ projects: [] });
  });

  it("does not duplicate a project already registered", () => {
    const workspaceRoot = mkdtempSync(join(tmpdir(), "registry-dedupe-"));
    const registryPath = join(workspaceRoot, "dashboard-projects.json");
    const registry = new ProjectRegistry(registryPath);
    const entry = {
      projectId: "project-001",
      rootPath: join(workspaceRoot, "project"),
      addedAt: "2026-09-08T18:00:00.000Z",
    };

    registry.add(entry);
    registry.add(entry);

    expect(registry.list()).toEqual([entry]);
  });
});
