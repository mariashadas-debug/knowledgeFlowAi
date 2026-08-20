interface StatCardProps {
  label: string;
  value: string;
  note: string;
}

export function StatCard({ label, value, note }: StatCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_4px_14px_rgba(15,23,42,0.035)] transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{value}</p>
      <p className="mt-3 text-xs text-slate-500">{note}</p>
    </article>
  );
}
