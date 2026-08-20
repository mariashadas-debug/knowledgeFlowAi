import type { Server } from 'node:http';

import { createApp } from './app.js';
import { loadEnvironment, resolveStorageDirectory } from './config/env.js';
import { DocumentsRepository } from './repositories/documents-repository.js';
import { AnalyticsRepository } from './repositories/analytics-repository.js';
import { ConversationsRepository } from './repositories/conversations-repository.js';
import { RetrievalRepository } from './repositories/retrieval-repository.js';
import { createDatabase, type Database } from './services/database.js';
import { LocalDocumentStorage } from './services/document-storage.js';
import { DocumentProcessor } from './services/document-processor.js';
import { DocumentsService } from './services/documents-service.js';
import { DocumentTextExtractor } from './services/extraction/document-text-extractor.js';
import { createEmbeddingProvider } from './services/embeddings/create-embedding-provider.js';
import { EmbeddingService } from './services/embeddings/embedding-service.js';
import { TextChunker } from './services/text-chunker.js';
import { ConversationsService } from './services/conversations-service.js';
import { createLLMProvider } from './services/llm/create-llm-provider.js';
import { RagService } from './services/rag-service.js';
import { RetrievalService } from './services/retrieval-service.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function closeHttpServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function registerShutdownHandlers(server: Server, database: Database): void {
  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.info(`${signal} received; closing HTTP server and database pool`);

    const forceShutdown = setTimeout(() => {
      console.error('Graceful shutdown timed out; forcing shutdown');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceShutdown.unref();

    try {
      await closeHttpServer(server);
      await database.close();
      console.info('HTTP server and database pool closed');
    } catch (error) {
      console.error('Failed to shut down cleanly', error);
      process.exitCode = 1;
    } finally {
      clearTimeout(forceShutdown);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function main(): Promise<void> {
  const config = loadEnvironment();
  const database = createDatabase(config.DATABASE_URL);

  try {
    await database.verifyConnection();
  } catch (error) {
    await database.close();
    throw new Error('Unable to connect to PostgreSQL during startup', { cause: error });
  }

  const documentsRepository = new DocumentsRepository(database);
  const documentStorage = new LocalDocumentStorage(
    resolveStorageDirectory(config.STORAGE_DIRECTORY),
  );
  const embeddingService = new EmbeddingService(
    createEmbeddingProvider(config),
    config.EMBEDDING_BATCH_SIZE,
    config.EMBEDDING_MAX_INPUT_CHARACTERS,
  );
  const documentProcessor = new DocumentProcessor(
    documentsRepository,
    documentStorage,
    new DocumentTextExtractor(),
    new TextChunker(config.CHUNK_SIZE, config.CHUNK_OVERLAP),
    embeddingService,
  );
  const documentsService = new DocumentsService(
    documentsRepository,
    documentStorage,
    documentProcessor,
  );
  const conversationsRepository = new ConversationsRepository(database);
  const retrievalService = new RetrievalService(
    embeddingService,
    new RetrievalRepository(database),
    config.RAG_TOP_K,
    config.RAG_MIN_SIMILARITY,
  );
  const conversationsService = new ConversationsService(
    conversationsRepository,
    new RagService(
      retrievalService,
      createLLMProvider(config),
      config.RAG_MAX_CONTEXT_CHARACTERS,
      config.RAG_MAX_HISTORY_MESSAGES,
    ),
  );
  const app = createApp(database, {
    documentsService,
    maxUploadBytes: Math.floor(config.MAX_UPLOAD_SIZE_MB * 1024 * 1024),
    conversationsService,
    analyticsRepository: new AnalyticsRepository(database),
  });
  const server = app.listen(config.API_PORT, () => {
    console.info(`knowledgeflow-api listening on port ${config.API_PORT}`);
  });

  registerShutdownHandlers(server, database);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  console.error(`API startup failed: ${message}`);
  process.exitCode = 1;
});
