import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { evaluateSceneAtTime } from '../../src/render/scene';
import { sceneItemBox } from '../../src/render/textFit';

describe('deterministic SceneFrame evaluation', () => {
  it('exposes content, layout, appearance, and enter/active/exit phases', () => {
    const project = createFixtureProject();

    const enter = evaluateSceneAtTime(project, 2.2).items.find((item) => item.effectId === 'fx-quote');
    const active = evaluateSceneAtTime(project, 4).items.find((item) => item.effectId === 'fx-quote');
    const exit = evaluateSceneAtTime(project, 7.7).items.find((item) => item.effectId === 'fx-quote');
    const after = evaluateSceneAtTime(project, 8).items.find((item) => item.effectId === 'fx-quote');

    expect(enter).toMatchObject({ phase: 'enter', visible: true, content: { kind: 'text', text: '先把需求聊清楚' } });
    expect(active).toMatchObject({ phase: 'active', visible: true, layout: { nx: 0.07, ny: 0.13 }, appearance: { accent: '#38D4BC' } });
    expect(exit?.opacity).toBeLessThan(1);
    expect(after).toMatchObject({ phase: 'hidden', visible: false, opacity: 0 });
  });

  it('serializes numeric and list content without using DOM state', () => {
    const project = createFixtureProject();
    project.subtitles = [{ id: 's-1', startSec: 5, endSec: 7, text: '字幕导出' }];
    project.effects[0]!.content = { value: 92.4, label: '完成率' };
    project.effects[1]!.content = { items: ['第一步', 'Second step'] };

    const frame = evaluateSceneAtTime(project, 6);

    expect(frame.items.find((item) => item.effectId === 'fx-ring')?.content).toMatchObject({ kind: 'number', value: 92.4 });
    expect(frame.items.find((item) => item.effectId === 'fx-quote')?.content).toMatchObject({ kind: 'list', items: ['第一步', 'Second step'] });
    expect(frame.items.find((item) => item.effectId === 's-1')?.content).toEqual({ kind: 'text', text: '字幕导出' });
  });

  it('preserves pack visual expression tags for renderer-specific drawing', () => {
    const project = createFixtureProject();
    project.effects[0]!.familyId = 'pack-0-2-percentage';
    project.effects[0]!.variantId = 'pack:cuecut-ring-metric';

    const item = evaluateSceneAtTime(project, 6).items.find((entry) => entry.effectId === 'fx-ring');

    expect(item?.visualTags).toEqual(expect.arrayContaining(['Chart', 'Metric']));
  });

  it('prioritizes metric over chart when a ring metric carries both tags', () => {
    const project = createFixtureProject();
    project.effects[0]!.familyId = 'pack-0-2-percentage';
    project.effects[0]!.variantId = 'pack:cuecut-ring-metric';

    const item = evaluateSceneAtTime(project, 6).items.find((entry) => entry.effectId === 'fx-ring');

    expect(item?.visualKind).toBe('metric');
  });

  it('keeps a chart-only effect in the chart visual family', () => {
    const project = createFixtureProject();
    project.effects = [{ ...project.effects[0]!, familyId: 'chart', variantId: 'chart' }];

    const item = evaluateSceneAtTime(project, 6).items[0];

    expect(item?.visualKind).toBe('chart');
  });

  it('keeps list entries available to layout so long steps are not collapsed or discarded', () => {
    const project = createFixtureProject();
    project.effects[1]!.content = {
      items: ['第一步：准备素材并检查画面比例', '第二步：把英文说明拆成可读的多行', '第三步：保留完整内容后导出'],
    };

    const item = evaluateSceneAtTime(project, 6).items.find((entry) => entry.effectId === 'fx-quote');

    expect(item?.visualKind).toBe('text');
    expect(item?.content).toEqual({
      kind: 'list',
      items: ['第一步：准备素材并检查画面比例', '第二步：把英文说明拆成可读的多行', '第三步：保留完整内容后导出'],
    });
  });

  it('clamps a dynamically taller low-position list card inside the canvas', () => {
    const project = createFixtureProject();
    project.effects[1] = { ...project.effects[1]!, familyId: 'list', variantId: 'animated-list', layout: { ...project.effects[1]!.layout, ny: 0.92, nh: 0.06 } };
    project.effects[1]!.content = {
      items: [
        '第一步：准备素材并检查画面比例以及安全区边界',
        '第二步：把很长的英文说明拆成可读的多行内容',
        '第三步：保留完整信息后再导出最终视频',
      ],
    };

    const item = evaluateSceneAtTime(project, 6).items.find((entry) => entry.effectId === 'fx-quote');
    if (!item) throw new Error('List fixture item missing');
    const box = sceneItemBox(item, project.project.canvasWidth, project.project.canvasHeight) as { x: number; y: number; width: number; height: number };

    expect(box.height).toBeGreaterThan(project.effects[1]!.layout.nh * project.project.canvasHeight);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height * item.scale).toBeLessThanOrEqual(project.project.canvasHeight);
    expect(box.y).toBeLessThan(project.effects[1]!.layout.ny * project.project.canvasHeight);
  });

  it('keeps a low list card inside the canvas after scale and translate are applied', () => {
    const project = createFixtureProject();
    project.effects[1] = { ...project.effects[1]!, familyId: 'list', variantId: 'animated-list', layout: { ...project.effects[1]!.layout, ny: 0.9, nh: 0.08 } };
    project.effects[1]!.content = { items: ['第一步：长列表内容在放大并向下平移后仍必须完整留在画布安全区域内', '第二步：继续保留第二条内容'] };

    const item = evaluateSceneAtTime(project, 6).items.find((entry) => entry.effectId === 'fx-quote');
    if (!item) throw new Error('List fixture item missing');
    item.scale = 1.35;
    item.translate = { x: 80, y: 90 };
    const box = sceneItemBox(item, project.project.canvasWidth, project.project.canvasHeight);

    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width * item.scale).toBeLessThanOrEqual(project.project.canvasWidth);
    expect(box.y + box.height * item.scale).toBeLessThanOrEqual(project.project.canvasHeight);
  });
});
