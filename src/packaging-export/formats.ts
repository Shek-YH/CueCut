export type PackagingExportFormat = 'mp4' | 'webm-alpha';
export interface PackagingExportCapabilities { mp4: boolean; webmAlpha: boolean }

export function resolvePackagingExportFormat(format: PackagingExportFormat, capabilities: PackagingExportCapabilities): { format: PackagingExportFormat; mimeType: string } {
  if (format === 'mp4' && capabilities.mp4) return { format, mimeType: 'video/mp4' };
  if (format === 'webm-alpha' && capabilities.webmAlpha) return { format, mimeType: 'video/webm' };
  throw new Error(`Packaging export format is not supported: ${format}`);
}
