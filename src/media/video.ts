export interface VideoSourceManager {
  getSource(): string | null;
  replace(file: File): string;
  dispose(): void;
}

export function createVideoSourceManager(deps: {
  createObjectUrl: (file: File) => string;
  revokeObjectUrl: (url: string) => void;
}): VideoSourceManager {
  let currentUrl: string | null = null;

  return {
    getSource: () => currentUrl,
    replace(file) {
      if (currentUrl) deps.revokeObjectUrl(currentUrl);
      currentUrl = deps.createObjectUrl(file);
      return currentUrl;
    },
    dispose() {
      if (currentUrl) deps.revokeObjectUrl(currentUrl);
      currentUrl = null;
    },
  };
}

