import { describe, expect, it } from 'vitest';
import { retrieveCandidates } from '../../src/director/retriever';

describe('Director candidate retriever', () => {
  it('returns a bounded candidate set ranked by semantic tag matches', () => {
    const result = retrieveCandidates(
      [
        { id: 'a', tags: ['number', 'kpi'] },
        { id: 'b', tags: ['quote'] },
        { id: 'c', tags: ['number'] },
        { id: 'd', tags: ['number', 'data'] },
        { id: 'e', tags: ['number'] },
      ],
      ['number'],
      3,
    );

    expect(result.map((item) => item.id)).toEqual(['a', 'c', 'd']);
    expect(result).toHaveLength(3);
  });
});

