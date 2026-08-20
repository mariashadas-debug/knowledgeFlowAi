import { Pool, type PoolConfig, type QueryResult, type QueryResultRow } from 'pg';

export class Database {
  readonly #pool: Pool;

  constructor(config: PoolConfig) {
    this.#pool = new Pool(config);
    this.#pool.on('error', (error) => {
      console.error(`Unexpected PostgreSQL pool error: ${error.message}`);
    });
  }

  async query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<QueryResult<Row>> {
    return this.#pool.query<Row>(text, [...values]);
  }

  async verifyConnection(): Promise<void> {
    await this.query('SELECT 1');
  }

  async checkHealth(): Promise<boolean> {
    await this.verifyConnection();
    return true;
  }

  async close(): Promise<void> {
    await this.#pool.end();
  }
}

export function createDatabase(connectionString: string): Database {
  return new Database({ connectionString });
}
