import { createServer, type Server } from 'node:http';
import { promises as fs } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { createGenerationRoute, createHostGenerationRunner, type GenerationRunner } from './generationRoute';
import { createExportRoute, createHostExportRunner, type ExportRouteRunner } from './exportRoute';
import { createProbeRoute, createHostProbeRunner, type ProbeRouteRunner } from './probeRoute';

export interface ProductionHostOptions {
  runner?: GenerationRunner;
  host?: string;
  port?: number;
  projectRoot?: string;
  envPath?: string;
  skillPath?: string;
  ffmpegPath?: string;
  ffprobePath?: string;
  tempRoot?: string;
  fetchImpl?: typeof fetch;
  webRoot?: string;
  exportRunner?: ExportRouteRunner;
  probeRunner?: ProbeRouteRunner;
}

export function createProductionServer(options: ProductionHostOptions = {}): Server {
  const { runner, exportRunner, probeRunner, webRoot = resolve(process.cwd(), 'dist'), host: _host, port: _port, ...runnerOptions } = options;
  const generationRunner = runner ?? createHostGenerationRunner(runnerOptions);
  const generationRoute = createGenerationRoute(generationRunner);
  const exportRoute = createExportRoute(exportRunner ?? createHostExportRunner(runnerOptions));
  const probeRoute = createProbeRoute(probeRunner ?? createHostProbeRunner(runnerOptions));
  return createServer((request, response) => {
    const pathname = request.url?.split('?')[0] ?? '/';
    if (pathname === '/api/export') {
      void exportRoute(request, response);
      return;
    }
    if (pathname === '/api/probe-video') {
      void probeRoute(request, response);
      return;
    }
    if (pathname === '/api/generate-effects') {
      void generationRoute(request, response);
      return;
    }
    void serveStatic(request, response, webRoot);
  });
}

export async function startProductionServer(options: ProductionHostOptions = {}): Promise<Server> {
  const server = createProductionServer(options);
  const port = options.port ?? Number(process.env.CUECUT_PORT ?? 4173);
  const host = options.host ?? process.env.CUECUT_HOST ?? '127.0.0.1';
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  });
  return server;
}

async function serveStatic(request: import('node:http').IncomingMessage, response: import('node:http').ServerResponse, webRoot: string): Promise<void> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.statusCode = 405;
    response.end(JSON.stringify({ error: 'method_not_allowed' }));
    return;
  }
  const root = resolve(webRoot);
  const urlPath = decodeURIComponent(request.url?.split('?')[0] ?? '/');
  const requested = urlPath === '/' ? '/index.html' : urlPath;
  const candidate = resolve(root, '.' + requested);
  const relativePath = relative(root, candidate);
  if (relativePath.startsWith('..') || relativePath.includes('..' + '\\')) {
    response.statusCode = 403;
    response.end('Forbidden');
    return;
  }
  let filePath = candidate;
  try {
    const fileStats = await fs.stat(filePath);
    if (fileStats.isDirectory()) filePath = join(filePath, 'index.html');
  } catch {
    filePath = join(root, 'index.html');
  }
  try {
    const body = await fs.readFile(filePath);
    response.statusCode = 200;
    response.setHeader('Content-Type', contentType(extname(filePath)));
    response.setHeader('Content-Length', body.byteLength);
    if (request.method === 'HEAD') response.end();
    else response.end(body);
  } catch {
    response.statusCode = 404;
    response.end('Not found');
  }
}

function contentType(extension: string): string {
  return ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' } as Record<string, string>)[extension.toLowerCase()] ?? 'application/octet-stream';
}
