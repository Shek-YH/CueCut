import { describe, expect, it, vi } from 'vitest';
import { createBailianProvider } from '../../src/director/bailianProvider';

describe('Alibaba Bailian provider adapter', () => {
  it('sends one OpenAI-compatible JSON request without exposing credentials in the body', async () => {
    let requestBody: Record<string, unknown> | undefined;
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({
        id: 'synthetic-request',
        model: 'qwen-plus',
        choices: [{ message: { content: '{"schema":"cuecut.composition/1"}' } }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    const provider = createBailianProvider({ apiKey: 'synthetic-secret', model: 'qwen-plus', fetchImpl });

    await expect(provider({ messages: [{ role: 'user', content: 'Return JSON.' }] })).resolves.toBe('{"schema":"cuecut.composition/1"}');

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(requestBody).toMatchObject({
      model: 'qwen-plus',
      response_format: { type: 'json_object' },
      enable_thinking: false,
      stream: true,
      max_completion_tokens: 12000,
    });
    expect(requestBody).not.toHaveProperty('apiKey');
  });

  it('assembles streamed content chunks into one assistant response', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"{\\"ok\\":"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"true}"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    const fetchImpl: typeof fetch = async () => new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } });
    const provider = createBailianProvider({ apiKey: 'synthetic-secret', model: 'qwen3.8-flash', fetchImpl });

    await expect(provider({ messages: [{ role: 'user', content: 'Return JSON.' }] })).resolves.toBe('{"ok":true}');
  });

  it('passes an explicitly selected JSON Schema response format for strict models', async () => {
    let requestBody: Record<string, unknown> | undefined;
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({ choices: [{ message: { content: '{"schema":"cuecut.composition/1"}' } }] }), { status: 200 });
    });
    const responseFormat = { type: 'json_schema', json_schema: { name: 'cuecut_composition', strict: true, schema: { type: 'object' } } };
    const provider = createBailianProvider({ apiKey: 'synthetic-secret', model: 'qwen3.7-plus', responseFormat, fetchImpl });

    await provider({ messages: [{ role: 'user', content: 'Return JSON.' }] });

    expect(requestBody?.response_format).toEqual(responseFormat);
  });

  it('aborts an external request at the configured timeout', async () => {
    const fetchImpl: typeof fetch = async (_input, init) => await new Promise((_, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });
    const provider = createBailianProvider({ apiKey: 'synthetic-secret', model: 'qwen3.8-flash', timeoutMs: 10, fetchImpl });
    await expect(provider({ messages: [{ role: 'user', content: 'Return JSON.' }] })).rejects.toThrow('timed out');
  });
});
