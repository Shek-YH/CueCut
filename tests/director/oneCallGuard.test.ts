import { describe, expect, it } from 'vitest';
import { createOneCallGuard } from '../../src/director/oneCallGuard';

describe('Director one-call guard', () => {
  it('allows exactly one inference per Generate operation', async () => {
    let calls = 0;
    const guard = createOneCallGuard();
    const provider = async () => {
      calls += 1;
      return { schema: 'cuecut.composition/1' };
    };

    await expect(guard.run(provider)).resolves.toEqual({ schema: 'cuecut.composition/1' });
    await expect(guard.run(provider)).rejects.toThrow(/once/i);
    expect(calls).toBe(1);
  });
});

