export type PackagingTelemetryEventType = 'ai_generate_success' | 'ir_validation_fail' | 'registry_fallback' | 'layout_fallback' | 'collision_repair' | 'overlay_dropped' | 'render_success' | 'render_fail' | 'export_alpha' | 'manual_override';
export interface PackagingTelemetryEvent { type: PackagingTelemetryEventType; data?: Record<string, unknown> }
export interface PackagingTelemetrySnapshot { aiCallCount: number; model: string; analysisVersion: string; registryVersion: string; engineVersion: string; validatorRepairs: string[]; events: PackagingTelemetryEvent[] }

export function createPackagingTelemetry(input: { model: string; analysisVersion: string; registryVersion: string; engineVersion: string }) {
  let aiCallCount = 0;
  const events: PackagingTelemetryEvent[] = [];
  const validatorRepairs: string[] = [];
  return {
    record(type: PackagingTelemetryEventType, data?: Record<string, unknown>): void {
      events.push({ type, ...(data ? { data } : {}) });
    },
    recordAiCall(): void {
      if (aiCallCount >= 1) throw new Error('Packaging generation allows one AI call per run');
      aiCallCount += 1;
      events.push({ type: 'ai_generate_success' });
    },
    recordValidatorRepair(repair: string): void {
      validatorRepairs.push(repair);
    },
    snapshot(): PackagingTelemetrySnapshot {
      return { aiCallCount, ...input, validatorRepairs: [...validatorRepairs], events: events.map((event) => ({ ...event, ...(event.data ? { data: { ...event.data } } : {}) })) };
    },
  };
}
