export type RuntimeCapabilities = {
  ok: true;
  director: {
    configured: boolean;
    verified: boolean;
    model: string | null;
    source: 'secret-store' | 'env' | 'none';
    reason?: string;
  };
  visualAssets: {
    mode: 'ready' | 'disabled' | 'misconfigured';
    provider: 'disabled' | 'openai-compatible' | 'custom';
    model: string | null;
    reason?: string;
  };
};
