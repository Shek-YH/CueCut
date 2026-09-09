import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { diffCompositions } from '../../src/preferences/diff';

describe('Preference diff', () => {
  it('detects local edits between initial and final compositions', () => {
    const initial = createFixtureProject();
    const final = structuredClone(initial);
    final.effects[0]!.variantId = 'ring-b';
    final.effects[0]!.layout.nx = 0.72;
    final.effects[0]!.motion.enter.motionId = 'pop';
    final.effects[0]!.appearance.accent = '#7868FF';
    final.effects[0]!.sfx = { sfxId: 'soft-pop-03', offsetSec: 0.06, gain: 0.7 };

    const kinds = diffCompositions(initial, final).map((change) => change.kind);

    expect(kinds).toEqual(expect.arrayContaining(['variant', 'coordinate', 'motion', 'color', 'sfx']));
  });
});

