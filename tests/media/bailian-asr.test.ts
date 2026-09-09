import { describe, expect, it, vi } from 'vitest';
import { createBailianAsrClient } from '../../src/media/bailianAsr';

describe('Alibaba Bailian Qwen Audio ASR client', () => {
  it('sends one non-streaming Base64 audio request and parses sentence timestamps', async () => {
    let requestBody: Record<string, unknown> | undefined;
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({
        output: {
          text: 'Hello world',
          sentence: { sentence_id: 1, sentence_end: true, begin_time: 760, end_time: 3800, text: 'Hello world' },
        },
        usage: { duration: 4 },
        request_id: 'asr-synthetic-request',
      }), { status: 200 });
    });
    const client = createBailianAsrClient({ apiKey: 'synthetic-secret', fetchImpl });

    const result = await client.transcribe({
      audioDataUri: 'data:audio/mpeg;base64,SGk=',
      format: 'mp3',
      sampleRate: 16000,
      languageHints: ['zh'],
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(requestBody).toMatchObject({
      model: 'qwen-audio-3.0-asr-flash',
      input: { messages: [{ role: 'user', content: [{ type: 'input_audio', input_audio: { data: 'data:audio/mpeg;base64,SGk=' } }] }] },
      parameters: { format: 'mp3', sample_rate: 16000, language_hints: ['zh'] },
    });
    expect(requestBody).not.toHaveProperty('apiKey');
    expect(result).toEqual({
      requestId: 'asr-synthetic-request',
      processedDurationSec: 4,
      segments: [{ id: 's-1', startSec: 0.76, endSec: 3.8, text: 'Hello world' }],
    });
  });

  it('fails explicitly on provider errors', async () => {
    const fetchImpl = vi.fn(async () => new Response('quota', { status: 403 }));
    const client = createBailianAsrClient({ apiKey: 'synthetic-secret', fetchImpl });

    await expect(client.transcribe({
      audioDataUri: 'data:audio/mpeg;base64,SGk=',
      format: 'mp3',
    })).rejects.toThrow(/HTTP 403/);
  });

  it('splits one sentence object into timestamped subtitle segments from word timestamps', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      output: {
        text: '第一句。第二句。',
        sentence: {
          sentence_id: 7,
          begin_time: 200,
          end_time: 5200,
          text: '第一句。第二句。',
          words: [
            { begin_time: 200, end_time: 900, text: '第一句', punctuation: '。' },
            { begin_time: 1300, end_time: 2100, text: '第二句', punctuation: '。' },
          ],
        },
      },
      usage: { duration: 5.2 },
      request_id: 'asr-word-timestamps',
    }), { status: 200 }));
    const client = createBailianAsrClient({ apiKey: 'synthetic-secret', fetchImpl });

    await expect(client.transcribe({ audioDataUri: 'data:audio/mpeg;base64,SGk=', format: 'mp3' })).resolves.toMatchObject({
      segments: [
        { id: 's-7-1', startSec: 0.2, endSec: 0.9, text: '第一句。' },
        { id: 's-7-2', startSec: 1.3, endSec: 2.1, text: '第二句。' },
      ],
    });
  });
});
