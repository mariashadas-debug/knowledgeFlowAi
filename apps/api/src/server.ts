import type { Server } from 'node:http';

import { createApp } from './app.js';
import { loadEnvironment } from './config/env.js';
import { createDatabase, type Database } from './services/database.js';

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

  const app = createApp(database);
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
