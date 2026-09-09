import { describe, expect, it } from 'vitest';
import { evaluateMotion } from '../../src/motions/runtime';

describe('Motion Runtime', () => {
  it('evaluates local enter and exit frames without a provider call', () => {
    expect(evaluateMotion('spring-in', 'enter', 0)).toEqual({ opacity: 0, translateX: 0, translateY: 24, scale: 0.75, rotationDeg: 0 });
    expect(evaluateMotion('scale-fade-out', 'exit', 1)).toEqual({ opacity: 0, translateX: 0, translateY: 0, scale: 0.72, rotationDeg: 0 });
  });
});

