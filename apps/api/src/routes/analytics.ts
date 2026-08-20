import { Router } from 'express';

import type { AnalyticsRepository } from '../repositories/analytics-repository.js';

export function createAnalyticsRouter(repository: AnalyticsRepository): Router {
  const router = Router();
  router.get('/api/analytics/usage', async (_request, response) => {
    response.status(200).json({ data: await repository.usage() });
  });
  return router;
}
