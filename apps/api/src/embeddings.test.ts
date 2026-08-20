import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { loadEnvironment } from './config/env.js';
import { EmbeddingService } from './services/embeddings/embedding-service.js';
import { MockEmbeddingProvider } from './services/embeddings/mock-embedding-provider.js';
import {
  OpenAIEmbeddingProvider,
  type OpenAIEmbeddingsClient,
} from './services/embeddings/openai-embedding-provider.js';

describe('MockEmbeddingProvider', () => {
  it('returns deterministic 1536-dimensional vectors that vary by text', async () => {
    const provider = new MockEmbeddingProvider(1536);
    const first = await provider.createEmbedding('KnowledgeFlow');
    const repeated = await provider.createEmbedding('KnowledgeFlow');
    const different = await provider.createEmbedding('Different content');

    assert.equal(first.length, 1536);
    assert.deepEqual(first, repeated);
    assert.notDeepEqual(first, different);
  });

  it('accepts shared knowledge terms and rejects out-of-domain candidates', () => {
    const provider = new MockEmbeddingProvider(1536);
    assert.equal(
      provider.acceptsRetrievalCandidate(
        'What does the company refund policy say?',
        'Approved refunds reach the original payment method within five business days.',
      ),
      true,
    );
    assert.equal(
      provider.acceptsRetrievalCandidate(
        'What is the capital of Japan?',
        'Customer support is available Monday through Friday.',
      ),
      false,
    );
  });
});

describe('OpenAIEmbeddingProvider', () => {
  it('maps a batched SDK request and restores response index order', async () => {
    let received: unknown;
    const client: OpenAIEmbeddingsClient = {
      embeddings: {
        async create(input) {
          received = input;
          return {
            data: [
              { index: 1, embedding: [0, 1] },
              { index: 0, embedding: [1, 0] },
            ],
          };
        },
      },
    };
    const provider = new OpenAIEmbeddingProvider({
      apiKey: 'test-key',
      model: 'text-embedding-3-small',
      dimension: 2,
      timeoutMs: 1_000,
      client,
    });

    assert.deepEqual(await provider.createEmbeddings(['first', 'second']), [
      [1, 0],
      [0, 1],
    ]);
    assert.deepEqual(received, {
      input: ['first', 'second'],
      model: 'text-embedding-3-small',
      dimensions: 2,
      encoding_format: 'float',
    });
  });
});

describe('EmbeddingService', () => {
  it('rejects invalid provider output before storage', async () => {
    const provider = new MockEmbeddingProvider(1536);
    provider.createEmbeddings = async () => [[1, 2, 3]];
    const service = new EmbeddingService(provider, 32, 12_000);
    await assert.rejects(service.createEmbeddings(['content']), /invalid vector/);
  });
});

describe('embedding environment configuration', () => {
  it('coerces the documented vector dimension and requires an OpenAI key', () => {
    const config = loadEnvironment({
      DATABASE_URL: 'postgresql://localhost/test',
      EMBEDDING_DIMENSION: '1536',
    });
    assert.equal(config.EMBEDDING_DIMENSION, 1536);
    assert.throws(
      () =>
        loadEnvironment({
          DATABASE_URL: 'postgresql://localhost/test',
          AI_PROVIDER: 'openai',
          EMBEDDING_DIMENSION: '1536',
        }),
      /OPENAI_API_KEY/,
    );
  });
});
