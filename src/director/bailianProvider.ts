import type { DirectorProvider } from './service';

export const BAILIAN_OPENAI_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export interface BailianMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface BailianRequest {
  messages: BailianMessage[];
}

export type BailianResponseFormat =
  | { type: 'json_object' }
  | { type: 'json_schema'; json_schema: Record<string, unknown> };

export function createBailianProvider(options: {
  apiKey: string;
  model: string;
  endpoint?: string;
  responseFormat?: BailianResponseFormat;
  enableThinking?: boolean;
  maxCompletionTokens?: number;
  stream?: boolean;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): DirectorProvider {
  const fetchImpl = options.fetchImpl ?? fetch;
  const endpoint = options.endpoint ?? BAILIAN_OPENAI_ENDPOINT;
  const timeoutMs = options.timeoutMs ?? 30_000;

  return async (input: unknown) => {
    if (!input || typeof input !== 'object' || !Array.isArray((input as BailianRequest).messages)) {
      throw new Error('Bailian provider requires a messages array');
    }

    const requestBody = {
      model: options.model,
      messages: (input as BailianRequest).messages,
      response_format: options.responseFormat ?? { type: 'json_object' },
      enable_thinking: options.enableThinking ?? false,
      stream: options.stream ?? true,
      max_completion_tokens: options.maxCompletionTokens ?? 12_000,
    };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + options.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Bailian request failed with HTTP ' + response.status);
      const content = requestBody.stream && response.headers.get('content-type')?.includes('text/event-stream')
        ? await readStreamedContent(response)
        : await readJsonContent(response);
      if (!content) throw new Error('Bailian response did not contain assistant content');
      return content;
    } catch (error) {
      if (controller.signal.aborted) throw new Error('Bailian request timed out after ' + timeoutMs + 'ms');
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };
}

async function readJsonContent(response: Response): Promise<string | undefined> {
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return payload.choices?.[0]?.message?.content;
}

async function readStreamedContent(response: Response): Promise<string> {
  if (!response.body) throw new Error('Bailian streaming response did not contain a body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? '';
    for (const event of events) {
      const data = event.split(/\r?\n/).find((line) => line.startsWith('data:'))?.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      const payload = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
      const chunk = payload.choices?.[0]?.delta?.content;
      if (typeof chunk === 'string') content += chunk;
    }
  }
  return content;
}
