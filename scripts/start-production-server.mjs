import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const directory = path.resolve('dist-server');
const files = await fs.readdir(directory);
const entry = files.find((file) => /^productionHost\.(js|mjs)$/.test(file));
if (!entry) throw new Error('Production host bundle is missing; run pnpm build first');
const module = await import(pathToFileURL(path.join(directory, entry)).href);
await module.startProductionServer();
console.log('CueCut production host listening');
