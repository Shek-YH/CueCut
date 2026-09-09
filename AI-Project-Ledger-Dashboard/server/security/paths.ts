import path from "node:path";

export const ALLOWED_LEDGER_FILES = [
  "project.json",
  "tasks.json",
  "roles.json",
  "sessions.json",
  "artifacts.json",
  "events.jsonl",
  "runtime.json",
] as const;

export type AllowedLedgerFile = (typeof ALLOWED_LEDGER_FILES)[number];

export const SENSITIVE_PATH_TOKENS = [
  "credentials",
  "token",
  "cookie",
  "password",
  "ssh",
  "secret",
] as const;

export const SECRET_DENYLIST = SENSITIVE_PATH_TOKENS;

function normalizedSegments(filePath: string): string[] {
  return filePath.replaceAll("\\", "/").split("/").filter(Boolean);
}

function isAbsolutePath(filePath: string): boolean {
  return (
    path.isAbsolute(filePath) ||
    path.posix.isAbsolute(filePath) ||
    path.win32.isAbsolute(filePath) ||
    path.win32.parse(filePath).root !== ""
  );
}

export function isSensitivePath(filePath: string): boolean {
  return normalizedSegments(filePath).some((segment) => {
    const lowerSegment = segment.toLowerCase();
    return (
      lowerSegment === ".env" ||
      lowerSegment.startsWith(".env.") ||
      SENSITIVE_PATH_TOKENS.some((token) => lowerSegment.includes(token))
    );
  });
}

export function isAllowedLedgerFile(fileName: string): fileName is AllowedLedgerFile {
  if (fileName.includes("/") || fileName.includes("\\")) {
    return false;
  }
  return (ALLOWED_LEDGER_FILES as readonly string[]).includes(fileName);
}

export function assertAllowedLedgerFile(
  fileName: string,
): asserts fileName is AllowedLedgerFile {
  if (!isAllowedLedgerFile(fileName)) {
    throw new Error(`Ledger file is not allowlisted: ${fileName}`);
  }
}

function isPathContained(projectRoot: string, candidatePath: string): boolean {
  const relativePath = path.relative(projectRoot, candidatePath);
  return (
    relativePath === "" ||
    (relativePath !== ".." &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath))
  );
}

export function resolveContainedArtifactPath(
  projectRoot: string,
  artifactPath: string,
): string {
  if (artifactPath.trim() === "") {
    throw new Error("Artifact path must not be empty");
  }
  if (isAbsolutePath(artifactPath)) {
    throw new Error("Artifact path must be relative");
  }
  if (normalizedSegments(artifactPath).includes("..")) {
    throw new Error("Artifact path traversal is not allowed");
  }
  if (isSensitivePath(artifactPath)) {
    throw new Error("Artifact path is sensitive and cannot be opened");
  }

  const resolvedRoot = path.resolve(projectRoot);
  const resolvedArtifact = path.resolve(resolvedRoot, artifactPath);
  if (!isPathContained(resolvedRoot, resolvedArtifact)) {
    throw new Error("Artifact path must remain contained under the project root");
  }
  return resolvedArtifact;
}

export const assertArtifactPathContained = resolveContainedArtifactPath;
