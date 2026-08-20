import express from 'express';

import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { createHealthRouter, type HealthDatabase } from './routes/health.js';
import { createDocumentsRouter } from './routes/documents.js';
import { createAnalyticsRouter } from './routes/analytics.js';
import { createConversationsRouter } from './routes/conversations.js';
import type { AnalyticsRepository } from './repositories/analytics-repository.js';
import type { ConversationsService } from './services/conversations-service.js';
import type { DocumentsService } from './services/documents-service.js';

interface ApplicationApiOptions {
  documentsService?: DocumentsService;
  maxUploadBytes?: number;
  conversationsService?: ConversationsService;
  analyticsRepository?: AnalyticsRepository;
}

export function createApp(database: HealthDatabase, api?: ApplicationApiOptions) {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());
  app.use(requestLogger);
  app.use(createHealthRouter(database));
  if (api) {
    if (api.documentsService && api.maxUploadBytes) {
      app.use(createDocumentsRouter(api.documentsService, api.maxUploadBytes));
    }
    if (api.conversationsService) app.use(createConversationsRouter(api.conversationsService));
    if (api.analyticsRepository) app.use(createAnalyticsRouter(api.analyticsRepository));
  }
  app.use(errorHandler);

  return app;
}
