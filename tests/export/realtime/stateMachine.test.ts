import { describe, expect, it } from 'vitest';
import { createCaptureStateMachine } from '../../../src/export/realtime/stateMachine';

describe('realtime capture state machine', () => {
  it('walks the P0 happy path with explicit states', () => {
    const machine = createCaptureStateMachine();
    for (const event of ['PREPARE', 'ASSETS_READY', 'WARMUP_READY', 'RECORDER_READY', 'TIMELINE_READY', 'CAPTURE_STARTED', 'PLAYBACK_STARTED', 'END_REACHED', 'RECORDER_STOPPED', 'FINALIZED', 'VALIDATION_STARTED', 'VALIDATED'] as const) {
      machine.transition(event);
    }
    expect(machine.getState()).toBe('SUCCESS');
  });

  it('rejects skipping recorder arming and supports cancellation from active capture', () => {
    const machine = createCaptureStateMachine();
    machine.transition('PREPARE');
    expect(() => machine.transition('CAPTURE_STARTED')).toThrow(/Invalid realtime capture transition/);

    machine.transition('ASSETS_READY');
    machine.transition('WARMUP_READY');
    machine.transition('RECORDER_READY');
    machine.transition('TIMELINE_READY');
    machine.transition('CAPTURE_STARTED');
    expect(machine.transition('CANCEL')).toBe('CANCELLED');
  });
});
