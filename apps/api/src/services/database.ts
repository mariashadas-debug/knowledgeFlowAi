import { Pool, type PoolClient, type PoolConfig, type QueryResult, type QueryResultRow } from 'pg';

export interface QueryExecutor {
  query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResult<Row>>;
}

class Transaction implements QueryExecutor {
  constructor(private readonly client: PoolClient) {}

  async query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<QueryResult<Row>> {
    return this.client.query<Row>(text, [...values]);
  }
}

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

  async transaction<Result>(
    work: (transaction: QueryExecutor) => Promise<Result>,
  ): Promise<Result> {
    const client = await this.#pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(new Transaction(client));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
