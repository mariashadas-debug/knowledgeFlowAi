import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DashboardOverview } from './dashboard-overview';
import { HealthStatus } from './health-status';

function renderWithQueryClient(component: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Dashboard', () => {
  it('renders the core placeholder metric cards', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );
    renderWithQueryClient(<DashboardOverview />);

    for (const metric of ['Documents', 'Indexed chunks', 'Conversations', 'AI requests']) {
      expect(screen.getByText(metric)).toBeInTheDocument();
    }
    expect(screen.getByText('Placeholder values')).toBeInTheDocument();
  });

  it('shows operational API and database states after a successful health response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          service: 'knowledgeflow-api',
          database: 'ok',
        }),
      }),
    );
    renderWithQueryClient(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getAllByText('Operational')).toHaveLength(2);
    });
  });
});
