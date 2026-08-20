import type { EmbeddingProvider } from './embedding-provider.js';

export class EmbeddingService {
  constructor(
    readonly provider: EmbeddingProvider,
    private readonly batchSize: number,
    private readonly maxInputCharacters: number,
  ) {}

  getBatchCount(itemCount: number): number {
    return Math.ceil(itemCount / this.batchSize);
  }

  async createEmbeddings(texts: string[]): Promise<number[][]> {
    for (const text of texts) {
      if (text.length === 0) throw new Error('Embedding input cannot be empty');
      if (text.length > this.maxInputCharacters) throw new Error('Embedding input is too large');
    }

    const embeddings: number[][] = [];
    for (let start = 0; start < texts.length; start += this.batchSize) {
      const batch = texts.slice(start, start + this.batchSize);
      const results = await this.provider.createEmbeddings(batch);
      if (results.length !== batch.length)
        throw new Error('Embedding provider returned wrong count');
      for (const vector of results) {
        if (
          vector.length !== this.provider.dimension ||
          vector.some((value) => !Number.isFinite(value))
        ) {
          throw new Error('Embedding provider returned an invalid vector');
        }
      }
      embeddings.push(...results);
    }
    return embeddings;
  }
}
