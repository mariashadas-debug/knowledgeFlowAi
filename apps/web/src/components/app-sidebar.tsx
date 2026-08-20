'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/', label: 'Dashboard', icon: 'grid' },
  { href: '/assistant', label: 'Assistant', icon: 'spark' },
  { href: '/documents', label: 'Documents', icon: 'file' },
  { href: '/conversations', label: 'Conversations', icon: 'chat' },
  { href: '/analytics', label: 'Analytics', icon: 'chart' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
] as const;

function NavIcon({ name }: { name: (typeof navigation)[number]['icon'] }) {
  const paths = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z" />
        <path d="m18 15 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z" />
      </>
    ),
    file: (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h4M9 13h6M9 17h6" />
      </>
    ),
    chat: (
      <>
        <path d="M4 5h16v11H9l-5 4z" />
        <path d="M8 9h8M8 12h5" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-white/10 bg-ink-950 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0">
      <div className="flex items-center gap-3 px-5 py-5 lg:px-6 lg:py-7">
        <div
          className="flex size-9 items-center justify-center rounded-lg bg-white text-xs font-bold tracking-tight text-ink-950"
          aria-hidden="true"
        >
          KF
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">KnowledgeFlow AI</p>
          <p className="mt-0.5 text-xs text-slate-400">Enterprise RAG workspace</p>
        </div>
      </div>

      <nav aria-label="Main navigation" className="overflow-x-auto px-3 pb-4 lg:px-4 lg:py-3">
        <ul className="flex min-w-max gap-1 lg:min-w-0 lg:flex-col">
          {navigation.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${active ? 'bg-white/10 text-white shadow-[inset_3px_0_0_#7c9cff]' : 'text-slate-300 hover:bg-white/7 hover:text-white'}`}
                >
                  <span
                    className={`flex size-7 items-center justify-center rounded-md ${active ? 'bg-brand-500/25 text-blue-200' : 'text-slate-400 group-hover:text-white'}`}
                  >
                    <NavIcon name={item.icon} />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mx-6 mt-auto hidden border-t border-white/10 py-6 lg:block">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          Local workspace
        </div>
        <p className="mt-1.5 text-xs leading-5 text-slate-500">
          Grounded answers from your private knowledge base.
        </p>
      </div>
    </aside>
  );
}
