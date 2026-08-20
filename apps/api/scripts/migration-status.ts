import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { loadEnvironment } from '../src/config/env.js';
import { createDatabase } from '../src/services/database.js';

const MIGRATIONS_DIRECTORY = path.resolve('migrations');
const MIGRATIONS_TABLE = 'pgmigrations';

async function main(): Promise<void> {
  const config = loadEnvironment();
  const database = createDatabase(config.DATABASE_URL);

  try {
    const files = (await readdir(MIGRATIONS_DIRECTORY))
      .filter((file) => /^\d+.*\.(?:js|ts|cjs|mjs|sql)$/.test(file))
      .sort();
    const tableResult = await database.query<{ exists: boolean }>(
      `SELECT to_regclass($1) IS NOT NULL AS exists`,
      [`public.${MIGRATIONS_TABLE}`],
    );
    const applied = new Set<string>();

    if (tableResult.rows[0]?.exists) {
      const appliedResult = await database.query<{ name: string }>(
        `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY run_on, id`,
      );
      for (const row of appliedResult.rows) {
        applied.add(row.name);
      }
    }

    for (const file of files) {
      const migrationName = path.parse(file).name;
      console.info(`${applied.has(migrationName) ? 'applied' : 'pending'}  ${migrationName}`);
    }

    console.info(`Summary: ${applied.size} applied, ${files.length - applied.size} pending`);
  } finally {
    await database.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown migration status error';
  console.error(`Unable to read migration status: ${message}`);
  process.exitCode = 1;
});
