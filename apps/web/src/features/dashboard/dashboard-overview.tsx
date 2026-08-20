'use client';

import { PageHeader } from '../../components/page-header';
import { StatCard } from '../../components/stat-card';
import { useUsage } from '../analytics/use-usage';
import { useConversations } from '../assistant/use-conversations';
import { useDocuments } from '../documents/use-documents';
import { HealthStatus } from './health-status';

export function DashboardOverview() {
  const documents = useDocuments();
  const conversations = useConversations();
  const usage = useUsage();
  const readyDocuments = documents.data?.filter((item) => item.status === 'ready').length;
  const metrics = [
    { label: 'Documents', value: documents.data?.length, note: 'Files in the knowledge base' },
    { label: 'Ready documents', value: readyDocuments, note: 'Extracted and embedded' },
    {
      label: 'Conversations',
      value: conversations.data?.length,
      note: 'Persisted assistant threads',
    },
    { label: 'AI requests', value: usage.data?.totalRequests, note: 'Recorded RAG requests' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A live operational view of your knowledge base, assistant activity, and system health."
      />

      <section aria-labelledby="workspace-metrics-heading">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="workspace-metrics-heading" className="text-sm font-semibold text-slate-900">
            Workspace metrics
          </h2>
          <span className="text-xs font-medium text-slate-500">Live workspace data</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <StatCard
              key={metric.label}
              label={metric.label}
              value={metric.value === undefined ? '—' : metric.value.toLocaleString()}
              note={metric.note}
            />
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <h2 className="text-base font-semibold text-slate-950">Knowledge readiness</h2>
          <p className="mt-1 text-sm text-slate-500">Current document processing distribution.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {(['ready', 'processing', 'failed'] as const).map((status) => {
              const count = documents.data?.filter((item) => item.status === status).length;
              const color =
                status === 'ready'
                  ? 'bg-emerald-500'
                  : status === 'failed'
                    ? 'bg-rose-500'
                    : 'bg-amber-500';
              return (
                <div key={status} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 capitalize">
                    <span className={`size-2 rounded-full ${color}`} />
                    {status}
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">
                    {count === undefined ? '—' : count}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
        <HealthStatus />
      </div>
    </>
  );
}
