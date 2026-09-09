import type { CaptureState } from './types';

export type CaptureEvent =
  | 'PREPARE'
  | 'ASSETS_READY'
  | 'WARMUP_READY'
  | 'RECORDER_READY'
  | 'TIMELINE_READY'
  | 'CAPTURE_STARTED'
  | 'PLAYBACK_STARTED'
  | 'END_REACHED'
  | 'RECORDER_STOPPED'
  | 'FINALIZED'
  | 'VALIDATION_STARTED'
  | 'VALIDATED'
  | 'FAIL'
  | 'CANCEL';

const transitions: Partial<Record<CaptureState, Partial<Record<CaptureEvent, CaptureState>>>> = {
  IDLE: { PREPARE: 'PREPARING' },
  PREPARING: { ASSETS_READY: 'LOADING_ASSETS', FAIL: 'FAILED', CANCEL: 'CANCELLED' },
  LOADING_ASSETS: { WARMUP_READY: 'WARMING_UP', FAIL: 'FAILED', CANCEL: 'CANCELLED' },
  WARMING_UP: { RECORDER_READY: 'RECORDER_ARMED', FAIL: 'FAILED', CANCEL: 'CANCELLED' },
  RECORDER_ARMED: { TIMELINE_READY: 'TIMELINE_ARMED', FAIL: 'FAILED', CANCEL: 'CANCELLED' },
  TIMELINE_ARMED: { CAPTURE_STARTED: 'CAPTURING', FAIL: 'FAILED', CANCEL: 'CANCELLED' },
  CAPTURING: { PLAYBACK_STARTED: 'PLAYING', END_REACHED: 'END_PENDING', FAIL: 'FAILED', CANCEL: 'CANCELLED' },
  PLAYING: { END_REACHED: 'END_PENDING', FAIL: 'FAILED', CANCEL: 'CANCELLED' },
  END_PENDING: { RECORDER_STOPPED: 'STOPPING', FAIL: 'FAILED', CANCEL: 'CANCELLED' },
  STOPPING: { FINALIZED: 'FINALIZING', FAIL: 'FAILED', CANCEL: 'CANCELLED' },
  FINALIZING: { VALIDATION_STARTED: 'VALIDATING', FAIL: 'FAILED', CANCEL: 'CANCELLED' },
  VALIDATING: { VALIDATED: 'SUCCESS', FAIL: 'FAILED', CANCEL: 'CANCELLED' },
};

export function createCaptureStateMachine(initial: CaptureState = 'IDLE') {
  let state = initial;
  return {
    getState: () => state,
    transition(event: CaptureEvent): CaptureState {
      const next = transitions[state]?.[event];
      if (!next) throw new Error(`Invalid realtime capture transition: ${state} + ${event}`);
      state = next;
      return state;
    },
  };
}
