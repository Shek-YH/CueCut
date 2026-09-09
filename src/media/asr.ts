import type { TranscriptSegment } from '../subtitles/srt';

export type AsrProvider = (input: { fileName: string }) => Promise<TranscriptSegment[]>;

export interface AsrAdapter {
  transcribe(input: { fileName: string }): Promise<TranscriptSegment[]>;
}

export function createAsrAdapter(provider?: AsrProvider): AsrAdapter {
  return {
    async transcribe(input) {
      if (!provider) {
        throw new Error('ASR provider is not configured');
      }
      return provider(input);
    },
  };
}

