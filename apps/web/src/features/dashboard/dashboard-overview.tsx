import { PageHeader } from '../../components/page-header';
import { StatCard } from '../../components/stat-card';
import { HealthStatus } from './health-status';

const metrics = ['Documents', 'Indexed chunks', 'Conversations', 'AI requests'] as const;

export function DashboardOverview() {
  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Monitor the knowledge workspace as document processing and assistant capabilities come online."
      />

      <section aria-labelledby="workspace-metrics-heading">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="workspace-metrics-heading" className="text-sm font-semibold text-slate-900">
            Workspace metrics
          </h2>
          <span className="rounded-md bg-slate-200/70 px-2 py-1 text-xs font-medium text-slate-600">
            Placeholder values
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <StatCard key={metric} label={metric} value="—" note="Live metrics not connected" />
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <h2 className="text-base font-semibold text-slate-950">Knowledge activity</h2>
          <div className="mt-5 flex min-h-48 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
            <div>
              <p className="text-sm font-medium text-slate-700">No activity to display</p>
              <p className="mt-1 text-sm text-slate-500">
                Real document and assistant activity will appear in a later phase.
              </p>
            </div>
          </div>
        </section>
        <HealthStatus />
      </div>
    </>
  );
}
