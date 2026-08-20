import Link from 'next/link';

const navigation = [
  { href: '/', label: 'Dashboard', marker: 'D' },
  { href: '/assistant', label: 'Assistant', marker: 'A' },
  { href: '/documents', label: 'Documents', marker: 'D' },
  { href: '/conversations', label: 'Conversations', marker: 'C' },
  { href: '/analytics', label: 'Analytics', marker: 'A' },
  { href: '/settings', label: 'Settings', marker: 'S' },
] as const;

export function AppSidebar() {
  return (
    <aside className="border-b border-white/10 bg-ink-950 text-white lg:flex lg:min-h-screen lg:flex-col lg:border-r lg:border-b-0">
      <div className="flex items-center gap-3 px-5 py-5 lg:px-6 lg:py-7">
        <div
          className="flex size-9 items-center justify-center rounded-lg bg-white text-xs font-bold tracking-tight text-ink-950"
          aria-hidden="true"
        >
          KF
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">KnowledgeFlow AI</p>
          <p className="mt-0.5 text-xs text-slate-400">Knowledge operations</p>
        </div>
      </div>

      <nav aria-label="Main navigation" className="overflow-x-auto px-3 pb-4 lg:px-4 lg:py-3">
        <ul className="flex min-w-max gap-1 lg:min-w-0 lg:flex-col">
          {navigation.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span
                  className="flex size-6 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[10px] font-semibold text-slate-400 group-hover:text-white"
                  aria-hidden="true"
                >
                  {item.marker}
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-6 mt-auto hidden border-t border-white/10 py-6 lg:block">
        <p className="text-xs font-medium text-slate-400">Internal workspace</p>
        <p className="mt-1 text-xs text-slate-500">Foundation environment</p>
      </div>
    </aside>
  );
}
