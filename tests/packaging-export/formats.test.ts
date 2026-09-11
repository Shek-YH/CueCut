import { describe, expect, it } from 'vitest';
import { resolvePackagingExportFormat } from '../../src/packaging-export/formats';

describe('packaging export formats', () => {
  it('selects MP4 or transparent WebM only when capability exists', () => {
    expect(resolvePackagingExportFormat('mp4', { mp4: true, webmAlpha: false })).toEqual({ format: 'mp4', mimeType: 'video/mp4' });
    expect(resolvePackagingExportFormat('webm-alpha', { mp4: true, webmAlpha: true })).toEqual({ format: 'webm-alpha', mimeType: 'video/webm' });
    expect(() => resolvePackagingExportFormat('webm-alpha', { mp4: true, webmAlpha: false })).toThrow();
  });
});
