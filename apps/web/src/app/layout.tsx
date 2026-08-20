import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppSidebar } from '../components/app-sidebar';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'KnowledgeFlow AI',
    template: '%s | KnowledgeFlow AI',
  },
  description: 'Internal knowledge operations workspace',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
            <AppSidebar />
            <main className="min-w-0 px-4 py-7 sm:px-7 lg:px-10 lg:py-9 xl:px-14">
              <div className="mx-auto w-full max-w-[1440px]">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
