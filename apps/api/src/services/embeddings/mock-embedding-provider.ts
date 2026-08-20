import { createHash } from 'node:crypto';

import type { EmbeddingProvider } from './embedding-provider.js';

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'can',
  'company',
  'do',
  'does',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'say',
  'should',
  'the',
  'this',
  'to',
  'what',
  'when',
  'with',
]);

function normalizeToken(token: string): string {
  if (token.length > 5 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 5 && token.endsWith('ing')) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith('ed')) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

function tokenFeatures(text: string): string[] {
  const tokens =
    text
      .toLocaleLowerCase('en-US')
      .match(/[a-z0-9]+/g)
      ?.map(normalizeToken)
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)) ?? [];
  const bigrams = tokens.slice(1).map((token, index) => `${tokens[index]}_${token}`);
  return [...tokens, ...bigrams];
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
  readonly model = 'deterministic-mock-v2';

  constructor(readonly dimension: number) {}

  async createEmbedding(text: string): Promise<number[]> {
    return deterministicVector(text, this.dimension);
  }

  async createEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.createEmbedding(text)));
  }

  acceptsRetrievalCandidate(query: string, candidate: string): boolean {
    const queryFeatures = new Set(tokenFeatures(query));
    return tokenFeatures(candidate).some((feature) => queryFeatures.has(feature));
  }
}
