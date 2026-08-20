import express from 'express';

import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { createHealthRouter, type HealthDatabase } from './routes/health.js';
import { createDocumentsRouter } from './routes/documents.js';
import type { DocumentsService } from './services/documents-service.js';

interface DocumentApiOptions {
  documentsService: DocumentsService;
  maxUploadBytes: number;
}

export function createApp(database: HealthDatabase, documentApi?: DocumentApiOptions) {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());
  app.use(requestLogger);
  app.use(createHealthRouter(database));
  if (documentApi) {
    app.use(createDocumentsRouter(documentApi.documentsService, documentApi.maxUploadBytes));
  }
  app.use(errorHandler);

  return app;
}
