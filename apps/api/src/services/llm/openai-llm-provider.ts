import OpenAI from 'openai';

import type { LLMProvider, LLMRequest, LLMResponse } from './llm-provider.js';

interface OpenAIResponseResult {
  output_text: string;
  model: string;
  usage?: { input_tokens: number; output_tokens: number; total_tokens: number };
}

export interface OpenAIResponsesClient {
  responses: {
    create(input: {
      model: string;
      instructions: string;
      input: string;
      max_output_tokens: number;
    }): Promise<OpenAIResponseResult>;
  };
}

interface OpenAILLMProviderOptions {
  apiKey: string;
  model: string;
  maxOutputTokens: number;
  timeoutMs: number;
  client?: OpenAIResponsesClient;
}

export class OpenAILLMProvider implements LLMProvider {
  readonly providerName = 'openai';
  readonly model: string;
  private readonly client: OpenAIResponsesClient;
  private readonly maxOutputTokens: number;

  constructor(options: OpenAILLMProviderOptions) {
    this.model = options.model;
    this.maxOutputTokens = options.maxOutputTokens;
    this.client =
      options.client ??
      new OpenAI({
        apiKey: options.apiKey,
        timeout: options.timeoutMs,
        maxRetries: 2,
        logLevel: 'error',
      });
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const response = await this.client.responses.create({
      model: this.model,
      instructions: request.systemInstruction,
      input: request.prompt,
      max_output_tokens: this.maxOutputTokens,
    });
    if (!response.output_text.trim()) throw new Error('LLM provider returned an empty response');
    return {
      content: response.output_text.trim(),
      model: response.model || this.model,
      usage: {
        promptTokens: response.usage?.input_tokens ?? null,
        completionTokens: response.usage?.output_tokens ?? null,
        totalTokens: response.usage?.total_tokens ?? null,
      },
    };
  }
}
