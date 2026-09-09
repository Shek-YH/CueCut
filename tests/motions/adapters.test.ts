import { describe, expect, it } from 'vitest';
import { findMotionAdapter, motionRegistry } from '../../src/motions/registry';
import { evaluateMotion } from '../../src/motions/runtime';
import { effectRegistry } from '../../src/effects/registry';

const officialAdapterIds = [
  'text-morph',
  'text-roll',
  'text-scramble',
  'text-shimmer',
  'animated-shiny-text',
  'animated-number',
  'number-ticker',
  'animated-list',
  'animated-group',
] as const;

const motionLayerIds = [
  'fade',
  'slide',
  'scale',
  'blur',
  'blur-slide',
  'zoom',
  'flip',
  'bounce',
  'rotate',
  'swing',
] as const;

describe('CueCut motion adapter contract', () => {
  it('indexes the official adapters and motion layers with provenance and parameter defaults', () => {
    const definitions = officialAdapterIds.map((id) => motionRegistry.find((motion) => motion.motionId === id));
    expect(definitions.every(Boolean)).toBe(true);
    expect(new Set(motionRegistry.map((motion) => motion.motionId)).size).toBe(motionRegistry.length);
    expect(motionLayerIds.every((id) => motionRegistry.some((motion) => motion.motionId === id && motion.category === 'motion-layer'))).toBe(true);

    const textMorph = motionRegistry.find((motion) => motion.motionId === 'text-morph') as unknown as Record<string, unknown>;
    expect(textMorph).toMatchObject({
      displayName: 'Text Morph',
      license: 'MIT',
      source: expect.any(String),
      semanticTags: expect.arrayContaining(['text', 'emphasis']),
      timingCapabilities: expect.any(Array),
      layoutCapabilities: expect.any(Array),
    });
    expect(textMorph.defaultProps).toMatchObject({
      common: expect.objectContaining({
        start: 0,
        duration: expect.any(Number),
        position: expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
        opacity: 1,
      }),
      text: expect.objectContaining({ text: '' }),
    });
    expect(typeof (textMorph.adapter as { evaluate?: unknown }).evaluate).toBe('function');
  });

  it('exposes every official motion through the existing effect registry', () => {
    const officialEffects = effectRegistry.filter((effect) => officialAdapterIds.includes(effect.variantId as (typeof officialAdapterIds)[number]) || motionLayerIds.includes(effect.variantId as (typeof motionLayerIds)[number]));
    expect(officialEffects).toHaveLength(19);
    expect(new Set(officialEffects.map((effect) => `${effect.familyId}:${effect.variantId}`)).size).toBe(19);
    expect(officialEffects.every((effect) => effect.license === 'MIT' && effect.defaultProps && effect.timingCapabilities && effect.layoutCapabilities)).toBe(true);
  });

  it('evaluates motion-layer presets deterministically with the local runtime', () => {
    const first = evaluateMotion('bounce', 'enter', 0);
    const second = evaluateMotion('bounce', 'enter', 0);

    expect(first).toEqual(second);
    expect(first).toMatchObject({ opacity: 0, translateY: -50, scale: 1, rotationDeg: 0 });
  });

  it('offers a frame-based adapter model for downstream renderers', () => {
    const adapter = findMotionAdapter('number-ticker');
    expect(adapter).toBeDefined();
    expect(typeof (adapter as unknown as { evaluateAtFrame?: unknown }).evaluateAtFrame).toBe('function');

    const evaluateAtFrame = (adapter as unknown as {
      evaluateAtFrame: (input: {
        frame: number;
        fps: number;
        role: 'enter' | 'exit';
        props: { common: { start: number; duration: number }; number: { value: number; startValue: number; decimalPlaces: number; prefix: string; suffix: string } };
      }) => unknown;
    }).evaluateAtFrame;
    const input = {
      frame: 30,
      fps: 30,
      role: 'enter' as const,
      props: {
        common: { start: 0, duration: 2 },
        number: { value: 100, startValue: 0, decimalPlaces: 0, prefix: '', suffix: '' },
      },
    };
    expect(evaluateAtFrame(input)).toEqual(evaluateAtFrame(input));
    expect(evaluateAtFrame(input)).toMatchObject({ adapterId: 'number-ticker', value: 50, formattedValue: '50' });
  });
});
