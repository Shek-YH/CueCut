import { describe, expect, it } from 'vitest';
import { compileProjectToRuntime } from '../../src/runtime/compiler';
import { canonicalRuntimeItemSchema } from '../../src/runtime/schema';
import { createFixtureProject } from '../../src/project/fixtures';

describe('canonical runtime compiler', () => {
  it('derives deterministic renderer-ready items without changing the project model', () => {
    const project = createFixtureProject();
    const before = structuredClone(project);
    const first = compileProjectToRuntime(project);
    const second = compileProjectToRuntime(project);

    expect(first).toEqual(second);
    expect(project).toEqual(before);
    expect(first).toHaveLength(project.effects.length);
    expect(canonicalRuntimeItemSchema.array().parse(first)).toEqual(first);
    expect(first[0]).toMatchObject({
      runtimeId: 'fx-ring',
      sourceEffectId: 'fx-ring',
      segmentId: 'seg-1',
      template: {
        effectTemplateId: 'numeric:ring-a',
        rendererId: 'numeric',
        familyId: 'numeric',
        variantId: 'ring-a',
      },
      layout: { nx: 0.68, ny: 0.14, nw: 0.22, nh: 0.27, anchor: 'top-right', zone: 'right', zIndex: 2 },
      time: { startSec: 5.7, endSec: 12.3 },
      motion: { enter: { motionId: 'spring-in' }, exit: { motionId: 'scale-fade-out' } },
      provenance: { sourceSubtitleIds: ['s-1'] },
    });
  });
});
