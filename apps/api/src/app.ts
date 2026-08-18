import express from 'express';

import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { healthRouter } from './routes/health.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());
  app.use(requestLogger);
  app.use(healthRouter);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
