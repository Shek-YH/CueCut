import chokidar, { type FSWatcher } from "chokidar";
import path from "node:path";
import {
  ALLOWED_LEDGER_FILES,
  isAllowedLedgerFile,
  type AllowedLedgerFile,
} from "../security/paths.js";

export const MIN_DEBOUNCE_MS = 100;
export const MAX_DEBOUNCE_MS = 250;
export const DEFAULT_DEBOUNCE_MS = 150;

export type LedgerWatchChange = {
  event: "add" | "change" | "unlink";
  filePath: string;
  fileName: AllowedLedgerFile;
};

export type LedgerWatcherOptions = {
  debounceMs?: number;
  onError?: (error: Error) => void;
};

export type LedgerWatcher = {
  watchedPaths: string[];
  ready: Promise<void>;
  close: () => Promise<void>;
};

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function watchedLedgerPaths(projectRoot: string): string[] {
  const ledgerRoot = path.join(path.resolve(projectRoot), ".ai-ledger");
  return ALLOWED_LEDGER_FILES.map((fileName) => path.join(ledgerRoot, fileName));
}

export function createLedgerWatcher(
  projectRoot: string,
  onChange: (change: LedgerWatchChange) => void | Promise<void>,
  options: LedgerWatcherOptions = {},
): LedgerWatcher {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  if (
    !Number.isInteger(debounceMs) ||
    debounceMs < MIN_DEBOUNCE_MS ||
    debounceMs > MAX_DEBOUNCE_MS
  ) {
    throw new Error(`debounceMs must be between ${MIN_DEBOUNCE_MS} and ${MAX_DEBOUNCE_MS}`);
  }

  const watchedPaths = watchedLedgerPaths(projectRoot);
  const normalizedPaths = new Map(
    watchedPaths.map((filePath) => [path.normalize(filePath).toLowerCase(), filePath]),
  );
  let timer: NodeJS.Timeout | undefined;
  let closed = false;
  const onError = options.onError ?? (() => undefined);
  const watcher: FSWatcher = chokidar.watch(watchedPaths, {
    ignoreInitial: true,
    persistent: true,
  });

  const ready = new Promise<void>((resolve, reject) => {
    watcher.once("ready", resolve);
    watcher.once("error", (error) => reject(asError(error)));
  });

  watcher.on("error", (error) => onError(asError(error)));
  watcher.on("all", (event, changedPath) => {
    if (closed || (event !== "add" && event !== "change" && event !== "unlink")) {
      return;
    }

    const resolvedPath = path.resolve(changedPath);
    const allowedPath = normalizedPaths.get(resolvedPath.toLowerCase());
    if (!allowedPath) return;

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      const fileName = path.basename(allowedPath);
      if (!isAllowedLedgerFile(fileName)) return;
      void Promise.resolve(onChange({
        event,
        filePath: allowedPath,
        fileName,
      })).catch((error: unknown) => onError(asError(error)));
    }, debounceMs);
  });

  const close = async (): Promise<void> => {
    closed = true;
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    await watcher.close();
  };

  return { watchedPaths, ready, close };
}

export const watchLedger = createLedgerWatcher;
