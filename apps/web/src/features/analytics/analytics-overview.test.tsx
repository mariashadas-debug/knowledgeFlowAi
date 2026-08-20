import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api/conversations';
import { AnalyticsOverview } from './analytics-overview';

vi.mock('../../lib/api/conversations');

function renderAnalytics() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AnalyticsOverview />
    </QueryClientProvider>,
  );
}

afterEach(() => vi.resetAllMocks());

describe('AnalyticsOverview', () => {
  it('renders real aggregate usage values', async () => {
    vi.mocked(api.getUsageAnalytics).mockResolvedValue({
      totalRequests: 3,
      promptTokens: 120,
      completionTokens: 45,
      totalTokens: 165,
      estimatedCost: 0.0025,
      averageLatencyMs: 240,
    });
    renderAnalytics();
    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('$0.0025')).toBeInTheDocument();
    expect(screen.getByText('240 ms')).toBeInTheDocument();
  });

  it('renders a true zero-data state', async () => {
    vi.mocked(api.getUsageAnalytics).mockResolvedValue({
      totalRequests: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCost: null,
      averageLatencyMs: null,
    });
    renderAnalytics();
    expect(await screen.findByText('No AI requests yet')).toBeInTheDocument();
  });

  it('renders an API error state', async () => {
    vi.mocked(api.getUsageAnalytics).mockRejectedValue(new Error('Metrics unavailable'));
    renderAnalytics();
    expect(await screen.findByRole('alert')).toHaveTextContent('Metrics unavailable');
  });
});
