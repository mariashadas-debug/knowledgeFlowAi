import { app } from './app.js';
import { loadEnvironment } from './config/env.js';

const config = loadEnvironment();
const server = app.listen(config.API_PORT, () => {
  console.info(`knowledgeflow-api listening on port ${config.API_PORT}`);
});

let shuttingDown = false;

function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.info(`${signal} received; closing HTTP server`);

  const forceShutdown = setTimeout(() => {
    console.error('HTTP server did not close within 10 seconds; forcing shutdown');
    process.exit(1);
  }, 10_000);
  forceShutdown.unref();

  server.close((error) => {
    clearTimeout(forceShutdown);

    if (error) {
      console.error('Failed to close HTTP server cleanly', error);
      process.exitCode = 1;
      return;
    }

    console.info('HTTP server closed');
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
