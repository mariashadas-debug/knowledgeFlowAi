import { createHash } from 'node:crypto';

import type { EmbeddingProvider } from './embedding-provider.js';

function seedFor(text: string): number {
  return createHash('sha256').update(text, 'utf8').digest().readUInt32LE(0) || 1;
}

function deterministicVector(text: string, dimension: number): number[] {
  let state = seedFor(text);
  const vector = Array.from({ length: dimension }, () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xffffffff - 0.5;
  });
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return vector.map((value) => value / magnitude);
}

export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly providerName = 'mock';
  readonly model = 'deterministic-mock-v1';

  constructor(readonly dimension: number) {}

  async createEmbedding(text: string): Promise<number[]> {
    return deterministicVector(text, this.dimension);
  }

  async createEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.createEmbedding(text)));
  }
}
