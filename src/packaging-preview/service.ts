export interface PreviewTimelineItem { id: string; startSec: number; endSec: number }

export function createPackagingPreview(onExport: () => void) {
  return {
    frameAt(timeSec: number, items: PreviewTimelineItem[]): PreviewTimelineItem[] {
      return items.filter((item) => timeSec >= item.startSec && timeSec < item.endSec).map((item) => ({ ...item }));
    },
    exportFinal(): void {
      onExport();
    },
  };
}
