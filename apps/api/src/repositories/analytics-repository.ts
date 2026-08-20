import type { Database } from '../services/database.js';

interface UsageRow {
  total_requests: string;
  prompt_tokens: string;
  completion_tokens: string;
  total_tokens: string;
  estimated_cost: string | null;
  average_latency_ms: string | null;
}

export interface UsageAnalytics {
  totalRequests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number | null;
  averageLatencyMs: number | null;
}

export class AnalyticsRepository {
  constructor(private readonly database: Database) {}

  async usage(): Promise<UsageAnalytics> {
    const result = await this.database.query<UsageRow>(`
      SELECT count(*) AS total_requests,
             COALESCE(sum(prompt_tokens), 0) AS prompt_tokens,
             COALESCE(sum(completion_tokens), 0) AS completion_tokens,
             COALESCE(sum(total_tokens), 0) AS total_tokens,
             sum(estimated_cost) AS estimated_cost,
             avg(latency_ms) AS average_latency_ms
      FROM ai_request_logs
    `);
    const row = result.rows[0]!;
    return {
      totalRequests: Number(row.total_requests),
      promptTokens: Number(row.prompt_tokens),
      completionTokens: Number(row.completion_tokens),
      totalTokens: Number(row.total_tokens),
      estimatedCost: row.estimated_cost === null ? null : Number(row.estimated_cost),
      averageLatencyMs:
        row.average_latency_ms === null ? null : Math.round(Number(row.average_latency_ms)),
    };
  }
}
