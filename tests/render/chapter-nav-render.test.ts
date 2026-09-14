import { describe, expect, it, vi } from 'vitest';
import { createCanvasRenderer } from '../../src/render/canvasRenderer';
import { createFixtureProject } from '../../src/project/fixtures';
import type { ProjectComposition } from '../../src/project/schema';

function navProject(visible = true): ProjectComposition {
  const project = createFixtureProject();
  project.project.durationSec = 100;
  project.effects = [];
  project.subtitles = [];
  project.chapters = [
    { id: 'c1', title: '开篇', startSec: 0, endSec: 40 },
    { id: 'c2', title: '正文', startSec: 40, endSec: 80 },
  ];
  project.project.chapterNav = { visible, position: 'top', showProgress: true };
  return project;
}

function stubContext() {
  const fillStyles: string[] = [];
  const context = {
    canvas: { width: 1920, height: 1080 },
    fillStyle: '',
    globalAlpha: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'top',
    filter: 'none',
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 10 })),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
  // 记录每次 fillText 时生效的 fillStyle：不能在对象字面量里自引用 context
  const recorder = context as unknown as { fillStyle: string; fillText: { mockImplementation: (fn: () => void) => void } };
  recorder.fillText.mockImplementation(() => { fillStyles.push(String(recorder.fillStyle)); });
  return { context, fillStyles };
}

describe('chapter navigation canvas rendering', () => {
  it('draws the active chapter title in accent color when nav is visible', () => {
    const project = navProject(true);
    const { context, fillStyles } = stubContext();
    createCanvasRenderer(project).renderFrame(10, context);

    expect(context.fillText).toHaveBeenCalledWith('开篇', expect.any(Number), expect.any(Number));
    // 默认无 themePalette 时 accent = defaultThemePalette.method
    expect(fillStyles).toContain('#3B82F6');
  });

  it('draws no chapter text when nav is hidden', () => {
    const project = navProject(false);
    const { context } = stubContext();
    createCanvasRenderer(project).renderFrame(10, context);

    expect(context.fillText).not.toHaveBeenCalled();
  });
});
