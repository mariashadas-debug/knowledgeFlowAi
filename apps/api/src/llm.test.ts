import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  OpenAILLMProvider,
  type OpenAIResponsesClient,
} from './services/llm/openai-llm-provider.js';

describe('OpenAILLMProvider', () => {
  it('maps Responses API input, output, and usage without a real request', async () => {
    let received: unknown;
    const client: OpenAIResponsesClient = {
      responses: {
        async create(input) {
          received = input;
          return {
            output_text: 'Grounded answer [S1]',
            model: 'gpt-4.1-mini-2025-04-14',
            usage: { input_tokens: 30, output_tokens: 8, total_tokens: 38 },
          };
        },
      },
    };
    const provider = new OpenAILLMProvider({
      apiKey: 'test-only',
      model: 'gpt-4.1-mini',
      maxOutputTokens: 400,
      timeoutMs: 1_000,
      client,
    });
    const response = await provider.generate({ systemInstruction: 'System', prompt: 'Question' });
    assert.deepEqual(received, {
      model: 'gpt-4.1-mini',
      instructions: 'System',
      input: 'Question',
      max_output_tokens: 400,
    });
    assert.equal(response.content, 'Grounded answer [S1]');
    assert.deepEqual(response.usage, { promptTokens: 30, completionTokens: 8, totalTokens: 38 });
  });
});
