export function isRealtimeChromaCaptureEnabled(env: Record<string, string | undefined> = import.meta.env): boolean {
  return env.VITE_REALTIME_CHROMA_CAPTURE === 'true';
}
