import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DashboardOverview } from './dashboard-overview';
import { HealthStatus } from './health-status';
import * as conversationsApi from '../../lib/api/conversations';
import * as documentsApi from '../../lib/api/documents';

vi.mock('../../lib/api/conversations');
vi.mock('../../lib/api/documents');

function renderWithQueryClient(component: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Dashboard', () => {
  it('renders the live workspace metric cards', async () => {
    vi.mocked(documentsApi.getDocuments).mockResolvedValue([]);
    vi.mocked(conversationsApi.listConversations).mockResolvedValue([]);
    vi.mocked(conversationsApi.getUsageAnalytics).mockResolvedValue({
      totalRequests: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCost: null,
      averageLatencyMs: null,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );
    renderWithQueryClient(<DashboardOverview />);

    for (const metric of ['Documents', 'Ready documents', 'Conversations', 'AI requests']) {
      expect(screen.getByText(metric)).toBeInTheDocument();
    }
    expect(await screen.findByText('Live workspace data')).toBeInTheDocument();
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
