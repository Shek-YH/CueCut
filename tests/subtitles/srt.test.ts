import { describe, expect, it } from 'vitest';
import { parseSrt, serializeSrt } from '../../src/subtitles/srt';

describe('SRT parser', () => {
  it('parses comma timestamps and serializes stable SRT output', () => {
    const segments = parseSrt('1\n00:00:02,200 --> 00:00:05,700\nHello CueCut\n');

    expect(segments).toEqual([{ id: 's-1', startSec: 2.2, endSec: 5.7, text: 'Hello CueCut' }]);
    expect(serializeSrt(segments)).toContain('00:00:02,200 --> 00:00:05,700');
  });

  it('rejects a segment whose end is not after its start', () => {
    expect(() => parseSrt('1\n00:00:05,000 --> 00:00:02,000\nInvalid\n')).toThrow(/end/i);
  });
});

