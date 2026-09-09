import { describe, expect, it, vi } from 'vitest';
import { createVideoSourceManager } from '../../src/media/video';

describe('local video source manager', () => {
  it('releases the previous object URL when a local file is replaced', () => {
    const revoke = vi.fn();
    const manager = createVideoSourceManager({
      createObjectUrl: (file) => 'blob:' + file.name,
      revokeObjectUrl: revoke,
    });
    const first = new File(['one'], 'first.mp4', { type: 'video/mp4' });
    const second = new File(['two'], 'second.mp4', { type: 'video/mp4' });

    expect(manager.replace(first)).toBe('blob:first.mp4');
    expect(manager.replace(second)).toBe('blob:second.mp4');
    manager.dispose();

    expect(revoke).toHaveBeenCalledWith('blob:first.mp4');
    expect(revoke).toHaveBeenCalledWith('blob:second.mp4');
  });
});

