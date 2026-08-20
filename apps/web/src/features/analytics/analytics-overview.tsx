'use client';

import { EmptyState } from '../../components/empty-state';
import { PageHeader } from '../../components/page-header';
import { StatCard } from '../../components/stat-card';
import { useUsage } from './use-usage';

export function AnalyticsOverview() {
  const usage = useUsage();
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="AI analytics"
        description="Real request volume, provider-reported token usage, estimated cost, and end-to-end latency."
      />
      {usage.isPending ? (
        <p className="text-sm text-slate-500">Loading usage metrics…</p>
      ) : usage.isError ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {usage.error.message}
        </div>
      ) : usage.data.totalRequests === 0 ? (
        <EmptyState
          title="No AI requests yet"
          description="Usage metrics will appear after the assistant answers its first question."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="AI Requests"
            value={usage.data.totalRequests.toLocaleString()}
            note="Grounded assistant requests"
          />
          <StatCard
            label="Input Tokens"
            value={usage.data.promptTokens.toLocaleString()}
            note="Provider-reported tokens"
          />
          <StatCard
            label="Output Tokens"
            value={usage.data.completionTokens.toLocaleString()}
            note="Provider-reported tokens"
          />
          <StatCard
            label="Total Tokens"
            value={usage.data.totalTokens.toLocaleString()}
            note="Input plus output"
          />
          <StatCard
            label="Estimated Cost"
            value={
              usage.data.estimatedCost === null
                ? 'Not available'
                : `$${usage.data.estimatedCost.toFixed(4)}`
            }
            note="Available for configured priced models"
          />
          <StatCard
            label="Average Latency"
            value={
              usage.data.averageLatencyMs === null
                ? 'Not available'
                : `${usage.data.averageLatencyMs} ms`
            }
            note="Retrieval and generation"
          />
        </div>
      )}
    </>
  );
}
