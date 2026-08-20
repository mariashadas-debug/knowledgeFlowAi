import express from 'express';

import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { createHealthRouter, type HealthDatabase } from './routes/health.js';

export function createApp(database: HealthDatabase) {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());
  app.use(requestLogger);
  app.use(createHealthRouter(database));
  app.use(errorHandler);

  return app;
}
