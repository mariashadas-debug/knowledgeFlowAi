import OpenAI from 'openai';

import type { EmbeddingProvider } from './embedding-provider.js';

interface EmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>;
}

export interface OpenAIEmbeddingsClient {
  embeddings: {
    create(input: {
      input: string[];
      model: string;
      dimensions: number;
      encoding_format: 'float';
    }): Promise<EmbeddingResponse>;
  };
}

interface OpenAIEmbeddingProviderOptions {
  apiKey: string;
  model: string;
  dimension: number;
  timeoutMs: number;
  client?: OpenAIEmbeddingsClient;
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly providerName = 'openai';
  readonly model: string;
  readonly dimension: number;
  private readonly client: OpenAIEmbeddingsClient;

  constructor(options: OpenAIEmbeddingProviderOptions) {
    this.model = options.model;
    this.dimension = options.dimension;
    this.client =
      options.client ??
      new OpenAI({
        apiKey: options.apiKey,
        timeout: options.timeoutMs,
        maxRetries: 2,
        logLevel: 'error',
      });
  }

  async createEmbedding(text: string): Promise<number[]> {
    const [embedding] = await this.createEmbeddings([text]);
    if (!embedding) throw new Error('Embedding provider returned no result');
    return embedding;
  }

  async createEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const response = await this.client.embeddings.create({
      input: texts,
      model: this.model,
      dimensions: this.dimension,
      encoding_format: 'float',
    });
    return [...response.data]
      .sort((left, right) => left.index - right.index)
      .map((item) => item.embedding);
  }
}
