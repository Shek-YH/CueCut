import { createServer as createViteServer } from "vite";
import { createLedgerServer } from "../server/index.ts";

const host = "127.0.0.1";
const ledgerPort = Number(process.env.LEDGER_PORT ?? 3100);
const vitePort = Number(process.env.VITE_PORT ?? 4173);
const projectRoot = process.env.LEDGER_PROJECT_ROOT ?? process.cwd();

const ledger = createLedgerServer({ projectRoots: [projectRoot], host, port: ledgerPort });
const ledgerAddress = await ledger.start();
const vite = await createViteServer({
  server: {
    host,
    port: vitePort,
    proxy: {
      "/api": {
        target: ledgerAddress.baseUrl,
        changeOrigin: false,
      },
    },
  },
});
await vite.listen();

console.log(`Dashboard: http://${host}:${vitePort}`);
console.log(`Ledger API: ${ledgerAddress.baseUrl}`);
console.log(`Project root: ${projectRoot}`);

let closing = false;
const close = async () => {
  if (closing) return;
  closing = true;
  await vite.close();
  await ledger.close();
};

process.once("SIGINT", () => void close().finally(() => process.exit(0)));
process.once("SIGTERM", () => void close().finally(() => process.exit(0)));
await new Promise(() => undefined);
