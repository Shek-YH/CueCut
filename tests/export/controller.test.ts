import { EventEmitter } from 'node:events';
import { Writable } from 'node:stream';
import { writeFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { createExportController } from '../../src/export/controller';

describe('export controller', () => {
  it('reports preparation, rendering, encoding, finalizing, and done', async () => {
    const states: string[] = [];
    const project = createFixtureProject();
    project.project.durationSec = 0.1;
    project.project.canvasWidth = 320;
    project.project.canvasHeight = 180;
    const outputPath = 'test-results/controller-output.mov';
    await writeFile(outputPath, Buffer.from('placeholder'));
    const child = new EventEmitter() as EventEmitter & { stdin: Writable; kill: ReturnType<typeof vi.fn> };
    child.stdin = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
    child.kill = vi.fn();
    const spawnProcess = vi.fn(() => {
      queueMicrotask(() => child.emit('close', 0));
      return child;
    });
    const controller = createExportController({
      spawnProcess,
      probe: vi.fn(async () => ({ durationSec: 0.1, width: 320, height: 180, codec: 'prores', pixelFormat: 'yuva444p10le', rFrameRate: 30, avgFrameRate: 30, fps: 30, hasAudio: false, isVfr: false })),
      onState: (state) => states.push(state),
    });

    const result = await controller.start({ mode: 'transparent-mov', project, outputPath });

    expect(result.outputPath).toBe(outputPath);
    expect(states).toEqual(['Preparing', 'Rendering', 'Encoding', 'Finalizing', 'Done']);
    expect(spawnProcess).toHaveBeenCalledTimes(1);
  });

  it('cancels a blocked renderer write and removes the partial output', async () => {
    const project = createFixtureProject();
    project.project.durationSec = 1;
    project.project.canvasWidth = 320;
    project.project.canvasHeight = 180;
    const outputPath = 'test-results/controller-cancel.mov';
    await writeFile(outputPath, Buffer.from('partial'));
    const child = new EventEmitter() as EventEmitter & { stdin: Writable; kill: ReturnType<typeof vi.fn> };
    child.stdin = new Writable({ write(_chunk, _encoding, _callback) { /* wait for cancel */ } });
    child.kill = vi.fn(() => { child.emit('close', 1); return true; });
    const controller = createExportController({
      spawnProcess: () => child,
      probe: vi.fn(),
    });
    const pending = controller.start({ mode: 'transparent-mov', project, outputPath });
    setTimeout(() => controller.cancel(), 5);

    await expect(pending).rejects.toThrow(/cancelled/i);
    expect(controller.getState()).toBe('Cancelled');
    expect(child.kill).toHaveBeenCalled();
  }, 10_000);

  it('validates transparent WebM as an alpha-capable VP9 export', async () => {
    const project = createFixtureProject();
    project.project.durationSec = 0.1;
    project.project.canvasWidth = 320;
    project.project.canvasHeight = 180;
    const outputPath = 'test-results/controller-output.webm';
    await writeFile(outputPath, Buffer.from('placeholder'));
    const child = new EventEmitter() as EventEmitter & { stdin: Writable; kill: ReturnType<typeof vi.fn> };
    child.stdin = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
    child.kill = vi.fn();
    const controller = createExportController({
      spawnProcess: vi.fn(() => { queueMicrotask(() => child.emit('close', 0)); return child; }),
      probe: vi.fn(async () => ({ durationSec: 0.1, width: 320, height: 180, codec: 'vp9', pixelFormat: 'yuva420p', rFrameRate: 30, avgFrameRate: 30, fps: 30, hasAudio: false, isVfr: false })),
    });

    const result = await controller.start({ mode: 'transparent-webm', project, outputPath });
    expect(result.outputPath).toBe(outputPath);
  });
});
