import type { EnvironmentConfig } from '../../config/env.js';
import type { LLMProvider } from './llm-provider.js';
import { MockLLMProvider } from './mock-llm-provider.js';
import { OpenAILLMProvider } from './openai-llm-provider.js';

export function createLLMProvider(config: EnvironmentConfig): LLMProvider {
  if (config.LLM_PROVIDER === 'mock') return new MockLLMProvider();
  return new OpenAILLMProvider({
    apiKey: config.OPENAI_API_KEY!,
    model: config.LLM_MODEL,
    maxOutputTokens: config.LLM_MAX_OUTPUT_TOKENS,
    timeoutMs: config.OPENAI_TIMEOUT_MS,
  });
}
