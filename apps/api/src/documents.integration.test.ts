import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import request from 'supertest';

import { createApp } from './app.js';
import { loadEnvironment } from './config/env.js';
import { DocumentsRepository } from './repositories/documents-repository.js';
import { createDatabase, type Database } from './services/database.js';
import { LocalDocumentStorage } from './services/document-storage.js';
import { DocumentsService } from './services/documents-service.js';

interface DocumentResponse {
  id: string;
  originalName: string;
  status: string;
}

let database: Database;
let storageDirectory: string;
let app: ReturnType<typeof createApp>;

before(async () => {
  const config = loadEnvironment();
  database = createDatabase(config.DATABASE_URL);
  await database.verifyConnection();
  storageDirectory = await mkdtemp(path.join(os.tmpdir(), 'knowledgeflow-documents-'));
  const service = new DocumentsService(
    new DocumentsRepository(database),
    new LocalDocumentStorage(storageDirectory),
  );
  app = createApp(database, { documentsService: service, maxUploadBytes: 1024 });
});

after(async () => {
  await database.query(`DELETE FROM documents WHERE original_name LIKE 'phase6-test-%'`);
  await database.close();
  await rm(storageDirectory, { recursive: true, force: true });
});

describe('Document API integration', () => {
  it('uploads, lists, retrieves, and deletes a text document and its stored file', async () => {
    const originalName = `phase6-test-${Date.now()}.txt`;
    const upload = await request(app)
      .post('/api/documents')
      .attach('file', Buffer.from('KnowledgeFlow upload test'), {
        filename: originalName,
        contentType: 'text/plain',
      });

    assert.equal(upload.status, 201);
    const document = upload.body.data as DocumentResponse;
    assert.equal(document.originalName, originalName);
    assert.equal(document.status, 'processing');
    assert.equal('storageKey' in document, false);

    const stored = await database.query<{ storage_key: string }>(
      'SELECT storage_key FROM documents WHERE id = $1',
      [document.id],
    );
    const storageKey = stored.rows[0]?.storage_key;
    assert.ok(storageKey);
    await access(path.join(storageDirectory, storageKey));
    assert.equal(
      await readFile(path.join(storageDirectory, storageKey), 'utf8'),
      'KnowledgeFlow upload test',
    );

    const list = await request(app).get('/api/documents');
    assert.equal(list.status, 200);
    assert.ok((list.body.data as DocumentResponse[]).some((item) => item.id === document.id));

    const detail = await request(app).get(`/api/documents/${document.id}`);
    assert.equal(detail.status, 200);
    assert.equal((detail.body.data as DocumentResponse).id, document.id);

    const deletion = await request(app).delete(`/api/documents/${document.id}`);
    assert.equal(deletion.status, 204);
    await assert.rejects(access(path.join(storageDirectory, storageKey)));

    const missing = await request(app).get(`/api/documents/${document.id}`);
    assert.equal(missing.status, 404);
  });

  it('rejects unsupported and oversized files', async () => {
    const unsupported = await request(app)
      .post('/api/documents')
      .attach('file', Buffer.from('not executable'), {
        filename: 'phase6-test-file.exe',
        contentType: 'application/octet-stream',
      });
    assert.equal(unsupported.status, 415);
    assert.equal(unsupported.body.error.code, 'UNSUPPORTED_FILE_TYPE');

    const oversized = await request(app)
      .post('/api/documents')
      .attach('file', Buffer.alloc(2048, 'a'), {
        filename: 'phase6-test-large.txt',
        contentType: 'text/plain',
      });
    assert.equal(oversized.status, 413);
    assert.equal(oversized.body.error.code, 'FILE_TOO_LARGE');
  });

  it('returns 404 for a missing document', async () => {
    const response = await request(app).get('/api/documents/00000000-0000-4000-8000-000000000000');
    assert.equal(response.status, 404);
  });
});
