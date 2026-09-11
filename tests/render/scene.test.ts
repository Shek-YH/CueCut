import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { evaluateSceneAtTime } from '../../src/render/scene';

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
});
