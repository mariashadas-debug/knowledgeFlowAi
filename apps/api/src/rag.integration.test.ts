import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import pgvector from 'pgvector';
import request from 'supertest';

import { createApp } from './app.js';
import { loadEnvironment } from './config/env.js';
import { AnalyticsRepository } from './repositories/analytics-repository.js';
import { ConversationsRepository } from './repositories/conversations-repository.js';
import { RetrievalRepository } from './repositories/retrieval-repository.js';
import { createDatabase, type Database } from './services/database.js';
import { ConversationsService } from './services/conversations-service.js';
import { EmbeddingService } from './services/embeddings/embedding-service.js';
import { MockEmbeddingProvider } from './services/embeddings/mock-embedding-provider.js';
import { MockLLMProvider } from './services/llm/mock-llm-provider.js';
import { INSUFFICIENT_KNOWLEDGE, RagService } from './services/rag-service.js';
import { RetrievalService } from './services/retrieval-service.js';

let database: Database;
let relevantDocumentId: string;
let unrelatedDocumentId: string;
const conversationIds: string[] = [];
const embeddings = new EmbeddingService(new MockEmbeddingProvider(1536), 32, 12_000);

async function insertDocument(name: string, content: string): Promise<string> {
  const document = await database.query<{ id: string }>(
    `INSERT INTO documents (name, original_name, mime_type, size, status)
     VALUES ($1, $1, 'text/markdown', $2, 'ready') RETURNING id`,
    [name, content.length],
  );
  const [embedding] = await embeddings.createEmbeddings([content]);
  await database.query(
    `INSERT INTO document_chunks (document_id, content, chunk_index, metadata, embedding)
     VALUES ($1, $2, 0, $3, $4::vector)`,
    [
      document.rows[0]!.id,
      content,
      { documentName: name, chunkIndex: 0, sourceFormat: 'markdown' },
      pgvector.toSql(embedding!),
    ],
  );
  return document.rows[0]!.id;
}

function createTestApp(minimumSimilarity: number) {
  const conversations = new ConversationsRepository(database);
  const retrieval = new RetrievalService(
    embeddings,
    new RetrievalRepository(database),
    5,
    minimumSimilarity,
  );
  const service = new ConversationsService(
    conversations,
    new RagService(retrieval, new MockLLMProvider(), 12_000, 10),
  );
  return createApp(database, {
    conversationsService: service,
    analyticsRepository: new AnalyticsRepository(database),
  });
}

before(async () => {
  database = createDatabase(loadEnvironment().DATABASE_URL);
  await database.verifyConnection();
  relevantDocumentId = await insertDocument(
    `phase9-test-refund-${Date.now()}.md`,
    'Damaged parcel refunds are approved after photo verification. Refunds reach the original payment method within five business days.',
  );
  unrelatedDocumentId = await insertDocument(
    `phase9-test-security-${Date.now()}.md`,
    'Employees must use multi-factor authentication and rotate recovery codes every year.',
  );
});

after(async () => {
  await database.query('DELETE FROM ai_request_logs WHERE conversation_id = ANY($1::uuid[])', [
    conversationIds,
  ]);
  await database.query('DELETE FROM conversations WHERE id = ANY($1::uuid[])', [conversationIds]);
  await database.query('DELETE FROM documents WHERE id = ANY($1::uuid[])', [
    [relevantDocumentId, unrelatedDocumentId],
  ]);
  await database.close();
});

describe('RAG and conversation integration', () => {
  it('returns the nearest semantic chunk with source mapping and no embeddings', async () => {
    const retrieval = new RetrievalService(embeddings, new RetrievalRepository(database), 5, 0.1);
    const results = await retrieval.retrieve('How long does a damaged parcel refund take?');
    assert.equal(results[0]?.documentId, relevantDocumentId);

    const app = createTestApp(0.1);
    const beforeUsage = (await request(app).get('/api/analytics/usage')).body.data;
    const created = await request(app).post('/api/conversations');
    conversationIds.push(created.body.data.id);
    const answer = await request(app)
      .post(`/api/conversations/${created.body.data.id}/messages`)
      .send({ message: 'How long does a damaged parcel refund take?' });
    assert.equal(answer.status, 201);
    assert.match(answer.body.message.content, /five business days/i);
    assert.equal(answer.body.sources[0].documentId, relevantDocumentId);
    assert.equal(JSON.stringify(answer.body).includes('embedding'), false);

    const stored = await request(app).get(`/api/conversations/${created.body.data.id}`);
    assert.equal(stored.body.data.messages.length, 2);
    assert.deepEqual(
      stored.body.data.messages.map((message: { role: string }) => message.role),
      ['user', 'assistant'],
    );
    const logs = await database.query<{ count: string }>(
      'SELECT count(*) FROM ai_request_logs WHERE conversation_id = $1',
      [created.body.data.id],
    );
    assert.equal(logs.rows[0]?.count, '1');
    const analytics = await request(app).get('/api/analytics/usage');
    assert.equal(analytics.body.data.totalRequests, beforeUsage.totalRequests + 1);
    assert.equal(analytics.body.data.totalTokens, beforeUsage.totalTokens);
  });

  it('does not call the LLM when similarity is below threshold', async () => {
    const app = createTestApp(0.99);
    const created = await request(app).post('/api/conversations');
    conversationIds.push(created.body.data.id);
    const answer = await request(app)
      .post(`/api/conversations/${created.body.data.id}/messages`)
      .send({ message: 'What is the office cafeteria soup today?' });
    assert.equal(answer.status, 201);
    assert.equal(answer.body.message.content, INSUFFICIENT_KNOWLEDGE);
    assert.deepEqual(answer.body.sources, []);
    assert.equal(answer.body.usage.model, 'retrieval-only');
  });

  it('deletes conversations and cascades their messages', async () => {
    const app = createTestApp(0.99);
    const created = await request(app).post('/api/conversations');
    const id = created.body.data.id;
    await request(app)
      .post(`/api/conversations/${id}/messages`)
      .send({ message: 'Unknown question' });
    await database.query('DELETE FROM ai_request_logs WHERE conversation_id = $1', [id]);
    assert.equal((await request(app).delete(`/api/conversations/${id}`)).status, 204);
    const messages = await database.query<{ count: string }>(
      'SELECT count(*) FROM messages WHERE conversation_id = $1',
      [id],
    );
    assert.equal(messages.rows[0]?.count, '0');
  });
});
