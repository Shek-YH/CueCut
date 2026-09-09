import { describe, expect, it } from 'vitest';
import { createExportPlan } from '../../src/export/exporter';

describe('export plan', () => {
  it('plans Full Video through the unified renderer', () => {
    expect(createExportPlan({ mode: 'full-video', durationSec: 30 })).toEqual({
      mode: 'full-video',
      outputExtension: 'mp4',
      renderer: 'unified-render-runtime',
      usesPngSequence: false,
    });
  });

  it('plans Transparent MOV as alpha output, not a screenshot sequence', () => {
    expect(createExportPlan({ mode: 'transparent-mov', durationSec: 30 })).toEqual({
      mode: 'transparent-mov',
      outputExtension: 'mov',
      renderer: 'unified-render-runtime',
      usesPngSequence: false,
    });
  });
});

