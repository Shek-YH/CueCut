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
  fetchImpl?: typeof fetch;
}): DirectorProvider {
  const fetchImpl = options.fetchImpl ?? fetch;
  const endpoint = options.endpoint ?? BAILIAN_OPENAI_ENDPOINT;

  return async (input: unknown) => {
    if (!input || typeof input !== 'object' || !Array.isArray((input as BailianRequest).messages)) {
      throw new Error('Bailian provider requires a messages array');
    }

    const requestBody = {
      model: options.model,
      messages: (input as BailianRequest).messages,
      response_format: options.responseFormat ?? { type: 'json_object' },
    };
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + options.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error('Bailian request failed with HTTP ' + response.status);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error('Bailian response did not contain assistant content');
    return content;
  };
}
