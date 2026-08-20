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
import { DocumentProcessor } from './services/document-processor.js';
import { DocumentsService } from './services/documents-service.js';
import { DocumentTextExtractor } from './services/extraction/document-text-extractor.js';
import { TextChunker } from './services/text-chunker.js';

interface DocumentResponse {
  id: string;
  originalName: string;
  status: string;
}

let database: Database;
let storageDirectory: string;
let app: ReturnType<typeof createApp>;
let processor: DocumentProcessor;
let repository: DocumentsRepository;

before(async () => {
  const config = loadEnvironment();
  database = createDatabase(config.DATABASE_URL);
  await database.verifyConnection();
  storageDirectory = await mkdtemp(path.join(os.tmpdir(), 'knowledgeflow-documents-'));
  repository = new DocumentsRepository(database);
  const storage = new LocalDocumentStorage(storageDirectory);
  processor = new DocumentProcessor(
    repository,
    storage,
    new DocumentTextExtractor(),
    new TextChunker(200, 40),
  );
  const service = new DocumentsService(repository, storage, processor);
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
    assert.equal(document.status, 'ready');
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

    const chunks = await request(app).get(`/api/documents/${document.id}/chunks`);
    assert.equal(chunks.status, 200);
    assert.equal(chunks.body.items.length, 1);
    assert.match(chunks.body.items[0].content, /KnowledgeFlow upload test/);
    assert.equal('embedding' in chunks.body.items[0], false);

    const record = await repository.findById(document.id);
    assert.ok(record);
    await processor.process(record);
    await processor.process((await repository.findById(document.id))!);
    const reprocessed = await database.query<{ count: string }>(
      'SELECT count(*) FROM document_chunks WHERE document_id = $1',
      [document.id],
    );
    assert.equal(reprocessed.rows[0]?.count, '1');

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

  it('marks documents failed when extraction produces no text', async () => {
    const originalName = `phase6-test-empty-${Date.now()}.txt`;
    const response = await request(app)
      .post('/api/documents')
      .attach('file', Buffer.from('   \n\n  '), {
        filename: originalName,
        contentType: 'text/plain',
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.status, 'failed');
    assert.equal(response.body.data.errorMessage, 'No extractable text was found');
    const chunks = await database.query<{ count: string }>(
      'SELECT count(*) FROM document_chunks WHERE document_id = $1',
      [response.body.data.id],
    );
    assert.equal(chunks.rows[0]?.count, '0');
  });

  it('marks malformed PDFs failed without crashing the API', async () => {
    const malformedPdf = await readFile(new URL('./test/fixtures/malformed.pdf', import.meta.url));
    const response = await request(app)
      .post('/api/documents')
      .attach('file', malformedPdf, {
        filename: `phase6-test-malformed-${Date.now()}.pdf`,
        contentType: 'application/pdf',
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.status, 'failed');
    assert.equal(response.body.data.errorMessage, 'The PDF could not be read');
    const health = await request(app).get('/health');
    assert.equal(health.status, 200);
  });
});
