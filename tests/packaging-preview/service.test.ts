import { describe, expect, it } from 'vitest';
import { createPackagingPreview } from '../../src/packaging-preview/service';

describe('packaging preview separation', () => {
  it('samples resolved timeline frames without invoking export', () => {
    let exports = 0;
    const preview = createPackagingPreview(() => { exports += 1; });
    expect(preview.frameAt(1, [{ id: 'o', startSec: 0, endSec: 2 }])).toEqual([{ id: 'o', startSec: 0, endSec: 2 }]);
    expect(exports).toBe(0);
  });
});
