import { createHash } from 'node:crypto';

import type { EmbeddingProvider } from './embedding-provider.js';

function tokenFeatures(text: string): string[] {
  return (
    text
      .toLocaleLowerCase('en-US')
      .match(/[a-z0-9]+/g)
      ?.flatMap((token) => (token.length > 3 ? [token, ...token.match(/.{1,3}/g)!] : [token])) ?? []
  );
}

function deterministicVector(text: string, dimension: number): number[] {
  const vector = Array.from({ length: dimension }, () => 0);
  for (const feature of tokenFeatures(text)) {
    const digest = createHash('sha256').update(feature, 'utf8').digest();
    const index = digest.readUInt32LE(0) % dimension;
    vector[index] = vector[index]! + (digest[4]! % 2 === 0 ? 1 : -1);
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) return vector;
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
