import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';

import request from 'supertest';

import { createApp } from './app.js';
import { loadEnvironment } from './config/env.js';
import { createDatabase, type Database } from './services/database.js';

let database: Database;

before(async () => {
  const config = loadEnvironment();
  database = createDatabase(config.DATABASE_URL);
  await database.verifyConnection();
});

after(async () => {
  await database.close();
});

describe('PostgreSQL integration', () => {
  it('has the migrated schema and configured vector dimension', async () => {
    const tables = await database.query<{ table_name: string }>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY(ARRAY[
          'documents',
          'document_chunks',
          'conversations',
          'messages',
          'ai_request_logs'
        ])
      ORDER BY table_name
    `);
    assert.deepEqual(
      tables.rows.map((row) => row.table_name),
      ['ai_request_logs', 'conversations', 'document_chunks', 'documents', 'messages'],
    );

    const embedding = await database.query<{ data_type: string }>(`
      SELECT format_type(attribute.atttypid, attribute.atttypmod) AS data_type
      FROM pg_attribute AS attribute
      JOIN pg_class AS relation ON relation.oid = attribute.attrelid
      WHERE relation.relname = 'document_chunks'
        AND attribute.attname = 'embedding'
        AND NOT attribute.attisdropped
    `);
    assert.equal(embedding.rows[0]?.data_type, 'vector(1536)');
  });

  it('reports database health through the API', async () => {
    const response = await request(createApp(database)).get('/health');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      status: 'ok',
      service: 'knowledgeflow-api',
      database: 'ok',
    });
  });

  it('enforces unique chunk indexes and cascades document deletion', async () => {
    const documentId = randomUUID();

    try {
      await database.query(
        `INSERT INTO documents (id, name, original_name, mime_type, size)
         VALUES ($1, 'test.txt', 'test.txt', 'text/plain', 4)`,
        [documentId],
      );
      await database.query(
        `INSERT INTO document_chunks (document_id, content, chunk_index)
         VALUES ($1, 'test', 0)`,
        [documentId],
      );

      await assert.rejects(
        database.query(
          `INSERT INTO document_chunks (document_id, content, chunk_index)
           VALUES ($1, 'duplicate', 0)`,
          [documentId],
        ),
        (error: unknown) => (error as { code?: string }).code === '23505',
      );

      await database.query('DELETE FROM documents WHERE id = $1', [documentId]);
      const chunks = await database.query<{ count: string }>(
        'SELECT count(*) FROM document_chunks WHERE document_id = $1',
        [documentId],
      );
      assert.equal(chunks.rows[0]?.count, '0');
    } finally {
      await database.query('DELETE FROM documents WHERE id = $1', [documentId]);
    }
  });
});
