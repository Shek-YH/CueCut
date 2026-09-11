import { describe, expect, it } from 'vitest';
import { canPlaceRelativeToSubject, expandSubjectRect } from '../../src/packaging-subject/spatial';

describe('packaging subject spatial relations', () => {
  const subject = { x: 0.2, y: 0.1, width: 0.3, height: 0.7 };

  it('blocks avoid placement inside the padded subject zone', () => {
    const expanded = expandSubjectRect(subject, 0.1);
    expect(canPlaceRelativeToSubject({ x: 0.25, y: 0.2, width: 0.2, height: 0.1 }, 'avoid', [expanded])).toBe(false);
  });

  it('allows foreground placement over the subject', () => {
    expect(canPlaceRelativeToSubject({ x: 0.25, y: 0.2, width: 0.2, height: 0.1 }, 'foreground', [subject])).toBe(true);
  });
});
