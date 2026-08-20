import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api/conversations';
import type { ConversationDetails, ConversationSummary } from '../../types/conversations';
import { AssistantWorkspace } from './assistant-workspace';

vi.mock('../../lib/api/conversations');

const summary: ConversationSummary = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Refund timing',
  createdAt: '2026-08-20T12:00:00Z',
  updatedAt: '2026-08-20T12:01:00Z',
  latestMessage: 'Refunds take five business days.',
};

const detail: ConversationDetails = {
  ...summary,
  messages: [
    {
      id: 'u1',
      conversationId: summary.id,
      role: 'user',
      content: 'When is my refund?',
      metadata: {},
      createdAt: summary.createdAt,
    },
    {
      id: 'a1',
      conversationId: summary.id,
      role: 'assistant',
      content: 'Refunds take five business days. [S1]',
      createdAt: summary.updatedAt,
      metadata: {
        sources: [
          {
            documentId: 'd1',
            documentName: 'refund-policy.md',
            chunkId: 'c1',
            chunkIndex: 0,
            excerpt: 'Refunds arrive within five business days.',
            score: 0.91,
            metadata: {},
          },
        ],
        rag: {
          model: 'deterministic-mock-llm-v1',
          promptTokens: null,
          completionTokens: null,
          totalTokens: null,
          estimatedCost: null,
          latencyMs: 12,
        },
      },
    },
  ],
};

function renderWorkspace() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AssistantWorkspace />
    </QueryClientProvider>,
  );
}

afterEach(() => vi.resetAllMocks());

describe('AssistantWorkspace', () => {
  it('renders the empty assistant state and disables an empty send', async () => {
    vi.mocked(api.listConversations).mockResolvedValue([]);
    renderWorkspace();
    expect(
      await screen.findByText('Ask a question about your company knowledge'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'What does the refund policy say?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('creates a conversation from the new conversation action', async () => {
    vi.mocked(api.listConversations).mockResolvedValue([]);
    vi.mocked(api.createConversation).mockResolvedValue({
      ...summary,
      title: null,
      latestMessage: null,
    });
    vi.mocked(api.getConversation).mockResolvedValue({
      ...detail,
      title: null,
      latestMessage: null,
      messages: [],
    });
    renderWorkspace();
    fireEvent.click(await screen.findByRole('button', { name: 'New conversation' }));
    await waitFor(() => expect(api.createConversation).toHaveBeenCalledOnce());
  });

  it('renders conversation history, messages, citations, and RAG details', async () => {
    vi.mocked(api.listConversations).mockResolvedValue([summary]);
    vi.mocked(api.getConversation).mockResolvedValue(detail);
    renderWorkspace();
    expect(await screen.findByText('When is my refund?')).toBeInTheDocument();
    expect(screen.getByText('Refunds take five business days. [S1]')).toBeInTheDocument();
    expect(screen.getByText(/refund-policy.md/)).toBeInTheDocument();
    expect(screen.getByText('Developer details')).toBeInTheDocument();
    expect(screen.getByText('91% similarity')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refund timing/ })).toBeInTheDocument();
  });

  it('shows a loading state while generating', async () => {
    vi.mocked(api.listConversations).mockResolvedValue([summary]);
    vi.mocked(api.getConversation).mockResolvedValue({ ...detail, messages: [] });
    vi.mocked(api.sendConversationMessage).mockReturnValue(new Promise(() => undefined));
    renderWorkspace();
    fireEvent.change(await screen.findByLabelText('Ask a question'), {
      target: { value: 'What is the policy?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Retrieving company knowledge');
    expect(screen.getByText('What is the policy?')).toBeInTheDocument();
  });

  it('shows an API error and restores the failed draft', async () => {
    vi.mocked(api.listConversations).mockResolvedValue([summary]);
    vi.mocked(api.getConversation).mockResolvedValue({ ...detail, messages: [] });
    vi.mocked(api.sendConversationMessage).mockRejectedValue(new Error('Generation unavailable'));
    renderWorkspace();
    const input = await screen.findByLabelText('Ask a question');
    fireEvent.change(input, { target: { value: 'What is the policy?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Generation unavailable');
    expect(screen.getByLabelText('Ask a question')).toHaveValue('What is the policy?');
  });
});
