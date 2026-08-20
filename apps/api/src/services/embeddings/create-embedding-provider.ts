import type { EnvironmentConfig } from '../../config/env.js';
import type { EmbeddingProvider } from './embedding-provider.js';
import { MockEmbeddingProvider } from './mock-embedding-provider.js';
import { OpenAIEmbeddingProvider } from './openai-embedding-provider.js';

export function createEmbeddingProvider(config: EnvironmentConfig): EmbeddingProvider {
  if (config.AI_PROVIDER === 'mock') return new MockEmbeddingProvider(config.EMBEDDING_DIMENSION);
  return new OpenAIEmbeddingProvider({
    apiKey: config.OPENAI_API_KEY!,
    model: config.EMBEDDING_MODEL,
    dimension: config.EMBEDDING_DIMENSION,
    timeoutMs: config.OPENAI_TIMEOUT_MS,
  });
}
