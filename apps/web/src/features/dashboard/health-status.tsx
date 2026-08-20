'use client';

import { useQuery } from '@tanstack/react-query';

import { StatusBadge } from '../../components/status-badge';
import type { HealthResponse } from '../../types/api';

async function getHealth(): Promise<HealthResponse> {
  const response = await fetch('/api/health');

  if (!response.ok) {
    throw new Error('Health endpoint unavailable');
  }

  return (await response.json()) as HealthResponse;
}

export function HealthStatus() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 30_000,
  });
  const state = health.isPending ? 'loading' : health.isError ? 'error' : 'ok';
  const databaseState = health.data?.database === 'ok' ? 'ok' : state;

  return (
    <section
      aria-labelledby="system-status-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 id="system-status-heading" className="text-base font-semibold text-slate-950">
            System status
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Live connectivity from the API health check.
          </p>
        </div>
        <span className="text-xs text-slate-400">Refreshes automatically</span>
      </div>
      <dl className="divide-y divide-slate-100">
        <div className="flex items-center justify-between py-4">
          <dt className="text-sm font-medium text-slate-700">API</dt>
          <dd>
            <StatusBadge state={state} />
          </dd>
        </div>
        <div className="flex items-center justify-between pt-4">
          <dt className="text-sm font-medium text-slate-700">Database</dt>
          <dd>
            <StatusBadge state={databaseState} />
          </dd>
        </div>
      </dl>
    </section>
  );
}
