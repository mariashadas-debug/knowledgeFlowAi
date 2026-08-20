import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as documentApi from '../../lib/api/documents';
import type { Document, DocumentChunk } from '../../types/documents';
import { DocumentDetails } from './document-details';

vi.mock('../../lib/api/documents');

const readyDocument: Document = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'guide.md',
  originalName: 'guide.md',
  mimeType: 'text/markdown',
  size: 1200,
  status: 'ready',
  errorMessage: null,
  createdAt: '2026-08-20T12:00:00.000Z',
  updatedAt: '2026-08-20T12:00:00.000Z',
};

const chunk: DocumentChunk = {
  id: '22222222-2222-4222-8222-222222222222',
  chunkIndex: 0,
  content: 'Extracted knowledge content.',
  metadata: {
    documentName: 'guide.md',
    chunkIndex: 0,
    sourceFormat: 'markdown',
    heading: 'Overview',
  },
  createdAt: '2026-08-20T12:00:01.000Z',
};

function renderDetails() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DocumentDetails documentId={readyDocument.id} />
    </QueryClientProvider>,
  );
}

afterEach(() => vi.resetAllMocks());

describe('DocumentDetails', () => {
  it('renders ready status and extracted chunks', async () => {
    vi.mocked(documentApi.getDocument).mockResolvedValue(readyDocument);
    vi.mocked(documentApi.getDocumentChunks).mockResolvedValue([chunk]);
    renderDetails();

    expect(await screen.findByText('ready')).toBeInTheDocument();
    expect(await screen.findByText('Chunk 1 · Overview')).toBeInTheDocument();
    expect(screen.getByText('Extracted knowledge content.')).toBeInTheDocument();
  });

  it('renders failed status and processing error', async () => {
    vi.mocked(documentApi.getDocument).mockResolvedValue({
      ...readyDocument,
      status: 'failed',
      errorMessage: 'No extractable text was found',
    });
    vi.mocked(documentApi.getDocumentChunks).mockResolvedValue([]);
    renderDetails();

    expect(await screen.findByText('failed')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('No extractable text was found');
  });

  it('renders a loading state', () => {
    vi.mocked(documentApi.getDocument).mockReturnValue(new Promise(() => undefined));
    renderDetails();
    expect(screen.getByText('Loading document details…')).toBeInTheDocument();
  });

  it('renders a document error state', async () => {
    vi.mocked(documentApi.getDocument).mockRejectedValue(new Error('Document unavailable'));
    renderDetails();

    expect(
      await screen.findByRole('heading', { name: 'Unable to load document' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Document unavailable')).toBeInTheDocument();
  });

  it('renders a chunk error state', async () => {
    vi.mocked(documentApi.getDocument).mockResolvedValue(readyDocument);
    vi.mocked(documentApi.getDocumentChunks).mockRejectedValue(
      new Error('Chunk service unavailable'),
    );
    renderDetails();

    expect(await screen.findByRole('alert')).toHaveTextContent('Chunk service unavailable');
  });
});
