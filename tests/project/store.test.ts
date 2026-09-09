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
