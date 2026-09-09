import type { TranscriptSegment } from '../subtitles/srt';

export const BAILIAN_ASR_ENDPOINT =
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
export const BAILIAN_ASR_MODEL = 'qwen-audio-3.0-asr-flash';

export interface BailianAsrInput {
  audioDataUri: string;
  format: 'mp3' | 'wav' | 'opus' | 'aac';
  sampleRate?: number;
  languageHints?: string[];
  context?: string[];
}

export interface BailianAsrResult {
  requestId: string;
  processedDurationSec: number;
  segments: TranscriptSegment[];
}

interface BailianAsrClientOptions {
  apiKey: string;
  endpoint?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

interface AsrSentence {
  sentence_id?: number;
  begin_time?: number;
  end_time?: number;
  text?: string;
  words?: AsrWord[];
}

interface AsrWord {
  begin_time?: number;
  end_time?: number;
  text?: string;
  punctuation?: string;
}

interface BailianAsrResponse {
  output?: {
    text?: string;
    sentence?: AsrSentence | AsrSentence[];
    sentences?: AsrSentence[];
  };
  usage?: { duration?: number };
  request_id?: string;
}

export function createBailianAsrClient(options: BailianAsrClientOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async transcribe(input: BailianAsrInput): Promise<BailianAsrResult> {
      const content: Record<string, unknown>[] = [{
        type: 'input_audio',
        input_audio: { data: input.audioDataUri },
      }];
      if (input.context?.length) {
        content.push({ text: input.context.join('\n') });
      }

      const response = await fetchImpl(options.endpoint ?? BAILIAN_ASR_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'disable',
        },
        body: JSON.stringify({
          model: options.model ?? BAILIAN_ASR_MODEL,
          input: {
            messages: [{ role: 'user', content }],
          },
          parameters: {
            format: input.format,
            ...(input.sampleRate ? { sample_rate: input.sampleRate } : {}),
            ...(input.languageHints?.length ? { language_hints: input.languageHints } : {}),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Bailian ASR request failed with HTTP ${response.status}`);
      }

      const payload = (await response.json()) as BailianAsrResponse;
      const sentenceValue = payload.output?.sentence;
      const sentences = Array.isArray(sentenceValue)
        ? sentenceValue
        : sentenceValue
          ? [sentenceValue]
          : payload.output?.sentences ?? [];
      const segments = sentences.flatMap((sentence, index) => expandSentence(sentence, index));

      if (!segments.length && payload.output?.text?.trim()) {
        segments.push({
          id: 's-1',
          startSec: 0,
          endSec: payload.usage?.duration ?? 0,
          text: payload.output.text.trim(),
        });
      }

      return {
        requestId: payload.request_id ?? '',
        processedDurationSec: payload.usage?.duration ?? 0,
        segments,
      };
    },
  };
}

function expandSentence(sentence: AsrSentence, sentenceIndex: number): TranscriptSegment[] {
  const sentenceId = sentence.sentence_id ?? sentenceIndex + 1;
  const words = sentence.words?.filter((word) => word.text?.trim()) ?? [];
  if (!words.length) {
    return sentence.text?.trim()
      ? [{
          id: `s-${sentenceId}`,
          startSec: (sentence.begin_time ?? 0) / 1000,
          endSec: (sentence.end_time ?? sentence.begin_time ?? 0) / 1000,
          text: sentence.text.trim(),
        }]
      : [];
  }

  const segments: TranscriptSegment[] = [];
  let current: Array<{ word: AsrWord; text: string }> = [];
  const flush = () => {
    if (!current.length) return;
    const first = current[0]!.word;
    const last = current[current.length - 1]!.word;
    const startMs = first.begin_time ?? sentence.begin_time ?? 0;
    const endMs = Math.max(last.end_time ?? last.begin_time ?? sentence.end_time ?? startMs, startMs + 1);
    segments.push({
      id: `s-${sentenceId}-${segments.length + 1}`,
      startSec: startMs / 1000,
      endSec: endMs / 1000,
      text: current.map((item) => item.text).join('').trim(),
    });
    current = [];
  };

  for (const word of words) {
    const text = appendPunctuation(word.text!.trim(), word.punctuation);
    if (!text) continue;
    current.push({ word, text });
    const startMs = current[0]!.word.begin_time ?? sentence.begin_time ?? 0;
    const endMs = word.end_time ?? word.begin_time ?? startMs;
    const currentText = current.map((item) => item.text).join('');
    const terminal = /[。！？!?；;]$/.test(currentText);
    const longEnough = endMs - startMs >= 4500;
    const longText = currentText.length >= 28;
    if (terminal || longEnough || longText) flush();
  }
  flush();
  return segments;
}

function appendPunctuation(text: string, punctuation: string | undefined): string {
  if (!punctuation || text.endsWith(punctuation)) return text;
  return text + punctuation;
}
