interface StatusBadgeProps {
  state: 'loading' | 'ok' | 'error';
}

const labels = {
  loading: 'Checking',
  ok: 'Operational',
  error: 'Unavailable',
} as const;

export function StatusBadge({ state }: StatusBadgeProps) {
  const color =
    state === 'ok'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
      : state === 'error'
        ? 'bg-rose-50 text-rose-700 ring-rose-600/20'
        : 'bg-slate-100 text-slate-600 ring-slate-500/20';

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${color}`}>
      {labels[state]}
    </span>
  );
}
