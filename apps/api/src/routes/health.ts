import { Router } from 'express';

export interface HealthDatabase {
  checkHealth(): Promise<boolean>;
}

export function createHealthRouter(database: HealthDatabase): Router {
  const healthRouter = Router();

  healthRouter.get('/health', async (_request, response) => {
    try {
      const healthy = await database.checkHealth();

      if (!healthy) {
        response.status(503).json({
          status: 'error',
          service: 'knowledgeflow-api',
          database: 'unavailable',
        });
        return;
      }

      response.status(200).json({
        status: 'ok',
        service: 'knowledgeflow-api',
        database: 'ok',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown database error';
      console.error(`Database health check failed: ${message}`);
      response.status(503).json({
        status: 'error',
        service: 'knowledgeflow-api',
        database: 'unavailable',
      });
    }
  });

  return healthRouter;
}
