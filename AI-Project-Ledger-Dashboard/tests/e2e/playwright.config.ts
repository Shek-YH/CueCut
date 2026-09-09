import { defineConfig } from "@playwright/test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const isolatedAppData = mkdtempSync(path.join(tmpdir(), "wi-012-playwright-appdata-"));
const e2ePort = Number(process.env.E2E_PORT ?? 4173);
const e2eApiPort = Number(process.env.E2E_API_PORT ?? 3100);
process.once("exit", () => rmSync(isolatedAppData, { recursive: true, force: true }));

export default defineConfig({
  testDir: ".",
  testMatch: "dashboard.spec.ts",
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${e2ePort}`,
    headless: true,
  },
  webServer: {
    command: "pnpm dev:all",
    url: `http://127.0.0.1:${e2ePort}`,
    reuseExistingServer: false,
    env: {
      APPDATA: isolatedAppData,
      LEDGER_PROJECT_ROOT: process.cwd(),
      LEDGER_PORT: String(e2eApiPort),
      VITE_PORT: String(e2ePort),
    },
  },
});
