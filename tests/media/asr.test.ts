import { describe, expect, it } from 'vitest';
import { createAsrAdapter, type TranscriptSegment } from '../../src/media/asr';

describe('ASR adapter boundary', () => {
  it('uses an injected provider and does not create a default network call', async () => {
    const expected: TranscriptSegment[] = [{ id: 's-1', startSec: 0, endSec: 1, text: 'local result' }];
    const calls: string[] = [];
    const adapter = createAsrAdapter(async (input) => {
      calls.push(input.fileName);
      return expected;
    });

    await expect(adapter.transcribe({ fileName: 'fixture.mp4' })).resolves.toEqual(expected);
    expect(calls).toEqual(['fixture.mp4']);
  });

  it('fails explicitly when no provider is configured', async () => {
    const adapter = createAsrAdapter();

    await expect(adapter.transcribe({ fileName: 'fixture.mp4' })).rejects.toThrow(/provider/i);
  });
});

