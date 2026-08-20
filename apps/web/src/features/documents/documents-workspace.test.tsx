import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as documentApi from '../../lib/api/documents';
import type { Document } from '../../types/documents';
import { DocumentsWorkspace } from './documents-workspace';

vi.mock('../../lib/api/documents');

const document: Document = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'handbook.md',
  originalName: 'handbook.md',
  mimeType: 'text/markdown',
  size: 2048,
  status: 'processing',
  errorMessage: null,
  createdAt: '2026-08-20T12:00:00.000Z',
  updatedAt: '2026-08-20T12:00:00.000Z',
};

function renderWorkspace() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DocumentsWorkspace />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('DocumentsWorkspace', () => {
  it('renders the empty documents state', async () => {
    vi.mocked(documentApi.getDocuments).mockResolvedValue([]);
    renderWorkspace();

    expect(await screen.findByRole('heading', { name: 'No documents yet' })).toBeInTheDocument();
  });

  it('renders documents returned by the API', async () => {
    vi.mocked(documentApi.getDocuments).mockResolvedValue([document]);
    renderWorkspace();

    expect(await screen.findByText('handbook.md')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    expect(screen.getByText('processing')).toBeInTheDocument();
  });

  it('uploads the selected document', async () => {
    vi.mocked(documentApi.getDocuments).mockResolvedValue([]);
    vi.mocked(documentApi.uploadDocument).mockResolvedValue(document);
    renderWorkspace();
    const file = new File(['# Handbook'], 'handbook.md', { type: 'text/markdown' });

    fireEvent.change(screen.getByLabelText('Choose document'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Upload document' }));

    await waitFor(() =>
      expect(documentApi.uploadDocument).toHaveBeenCalledWith(file, expect.anything()),
    );
  });

  it('requires confirmation and deletes a document', async () => {
    vi.mocked(documentApi.getDocuments).mockResolvedValue([document]);
    vi.mocked(documentApi.deleteDocument).mockResolvedValue();
    renderWorkspace();

    fireEvent.click(await screen.findByRole('button', { name: 'Delete handbook.md' }));
    expect(screen.getByText('Delete this file?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() =>
      expect(documentApi.deleteDocument).toHaveBeenCalledWith(document.id, expect.anything()),
    );
  });

  it('renders a document loading error', async () => {
    vi.mocked(documentApi.getDocuments).mockRejectedValue(new Error('Network unavailable'));
    renderWorkspace();

    expect(
      await screen.findByRole('heading', { name: 'Unable to load documents' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Network unavailable')).toBeInTheDocument();
  });
});
