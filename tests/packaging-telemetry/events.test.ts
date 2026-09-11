import { describe, expect, it } from 'vitest';
import { createPackagingTelemetry } from '../../src/packaging-telemetry/events';

describe('packaging telemetry', () => {
  it('records one AI call and deterministic pipeline events', () => {
    const telemetry = createPackagingTelemetry({ model: 'test-model', analysisVersion: '1.0', registryVersion: '1.0', engineVersion: '1.0' });
    telemetry.recordAiCall();
    telemetry.record('layout_fallback', { overlayId: 'o-1' });
    telemetry.record('manual_override', { overlayId: 'o-1' });
    expect(telemetry.snapshot().aiCallCount).toBe(1);
    expect(telemetry.snapshot().events.map((event) => event.type)).toEqual(['ai_generate_success', 'layout_fallback', 'manual_override']);
  });
});
