import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { createProjectStore } from '../../src/project/store';

describe('canonical project store', () => {
  it('keeps a draft clone outside the canonical project until Apply', () => {
    const store = createProjectStore(createFixtureProject());
    const source = store.getSnapshot();
    const draft = store.cloneEffectDraft('fx-ring');

    draft.variantId = 'ring-b';
    draft.layout.nx = 0.2;

    expect(store.getSnapshot()).toBe(source);
    expect(store.getSnapshot().effects[0]?.variantId).toBe('ring-a');
    expect(store.getSnapshot().effects[0]?.layout.nx).toBe(0.68);
  });

  it('commits Effect Lab Apply as one undo transaction', () => {
    const store = createProjectStore(createFixtureProject());
    const draft = store.cloneEffectDraft('fx-ring');
    draft.variantId = 'ring-b';

    store.applyEffectDraft(draft);

    expect(store.getSnapshot().effects[0]?.variantId).toBe('ring-b');
    expect(store.undoDepth()).toBe(1);
  });

  it('can cancel a draft without creating an undo entry', () => {
    const store = createProjectStore(createFixtureProject());
    const draft = store.cloneEffectDraft('fx-ring');
    draft.variantId = 'ring-c';

    expect(store.getSnapshot().effects[0]?.variantId).toBe('ring-a');
    expect(store.undoDepth()).toBe(0);
  });

  it('does not create an undo entry when an invalid draft is rejected', () => {
    const store = createProjectStore(createFixtureProject());
    const draft = store.cloneEffectDraft('fx-ring');
    draft.time.endSec = draft.time.startSec;

    expect(() => store.applyEffectDraft(draft)).toThrow(/endSec/);
    expect(store.undoDepth()).toBe(0);
    expect(store.getSnapshot().effects[0]?.time.endSec).toBe(12.3);
  });

  it('stores the imported local video filename in the canonical project', () => {
    const store = createProjectStore(createFixtureProject());

    store.setVideoSourceName('talking-head.mp4');

    expect(store.getSnapshot().project.video).toEqual({ sourceFileName: 'talking-head.mp4', zIndex: 0, locked: true });
  });

  it('persists a rebindable local media reference alongside the filename', () => {
    const store = createProjectStore(createFixtureProject());

    store.setVideoReference({ name: 'talking-head.mp4', size: 42, lastModified: 123, type: 'video/mp4' });

    expect(store.getSnapshot().project.video.mediaReference).toEqual({ name: 'talking-head.mp4', size: 42, lastModified: 123, type: 'video/mp4' });
  });

  it('supports redo after undoing one canonical transaction', () => {
    const store = createProjectStore(createFixtureProject());
    const draft = store.cloneEffectDraft('fx-ring');
    draft.variantId = 'ring-b';

    store.applyEffectDraft(draft);
    store.undo();
    store.redo();

    expect(store.getSnapshot().effects[0]?.variantId).toBe('ring-b');
    expect(store.undoDepth()).toBe(1);
    expect(store.redoDepth()).toBe(0);
  });

  it('supports deleting and duplicating canonical effect clips', () => {
    const store = createProjectStore(createFixtureProject());

    store.duplicateEffect('fx-ring');
    expect(store.getSnapshot().effects).toHaveLength(4);
    expect(store.getSnapshot().effects.some((effect) => effect.effectId === 'fx-ring-copy')).toBe(true);

    store.deleteEffect('fx-ring-copy');
    expect(store.getSnapshot().effects).toHaveLength(3);
    expect(store.undoDepth()).toBe(2);
  });

  it('supports canonical subtitle and SFX timeline updates', () => {
    const store = createProjectStore(createFixtureProject());
    store.setSubtitles([{ id: 's-1', startSec: 1, endSec: 2, text: 'caption' }]);
    store.updateSubtitle('s-1', (subtitle) => ({ ...subtitle, startSec: 2, endSec: 3 }));
    store.deleteSubtitle('s-1');
    store.updateSoundEvent('sfx-1', () => ({ eventId: 'sfx-1', sfxId: 'soft-pop-03', timeSec: 2, gain: 0.5 }));

    expect(store.getSnapshot().subtitles).toEqual([]);
    expect(store.getSnapshot().soundEvents).toEqual([{ eventId: 'sfx-1', sfxId: 'soft-pop-03', timeSec: 2, gain: 0.5 }]);
  });

  it('stores host video metadata in the canonical project', () => {
    const store = createProjectStore(createFixtureProject());

    store.setVideoMetadata({ sourceFileName: 'portrait.mp4', durationSec: 42.5, fps: 60, canvasWidth: 1080, canvasHeight: 1920 });

    expect(store.getSnapshot().project).toMatchObject({
      video: { sourceFileName: 'portrait.mp4', zIndex: 0, locked: true },
      durationSec: 42.5,
      fps: 60,
      canvasWidth: 1080,
      canvasHeight: 1920,
      aspectRatio: '9:16',
    });
  });

  it('clamps canonical ranges when imported media is shorter than the draft', () => {
    const store = createProjectStore(createFixtureProject());
    store.setSubtitles([{ id: 's-1', startSec: 5, endSec: 9, text: 'caption' }]);

    store.setVideoMetadata({ sourceFileName: 'short.mp4', durationSec: 6, fps: 30, canvasWidth: 320, canvasHeight: 180 });

    expect(store.getSnapshot().effects.every((effect) => effect.time.endSec <= 6)).toBe(true);
    expect(store.getSnapshot().segments.every((segment) => segment.endSec <= 6)).toBe(true);
    expect(store.getSnapshot().subtitles.every((subtitle) => subtitle.endSec <= 6)).toBe(true);
  });

  it('stores subtitles in the canonical project with one undo transaction', () => {
    const store = createProjectStore(createFixtureProject());
    const subtitles = [{ id: 's-1', startSec: 0, endSec: 1.2, text: '中文 caption' }];

    store.setSubtitles(subtitles);

    expect(store.getSnapshot().subtitles).toEqual(subtitles);
    expect(store.undoDepth()).toBe(1);
  });

  it('imports a validated generated composition as one canonical transaction', () => {
    const store = createProjectStore(createFixtureProject());
    const generated = createFixtureProject();
    generated.project.projectId = 'generated-project';
    generated.project.video.sourceFileName = 'portrait.mp4';
    generated.effects = [generated.effects[0]!];

    store.replaceComposition(generated);

    expect(store.getSnapshot().project.projectId).toBe('generated-project');
    expect(store.getSnapshot().effects).toHaveLength(1);
    expect(store.undoDepth()).toBe(1);
  });
});
