import type { Document } from '../../types/documents';

interface DataResponse<T> {
  data: T;
}

interface ErrorResponse {
  error?: {
    message?: string;
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorResponse;
    throw new Error(body.error?.message ?? 'Document request failed');
  }

  return ((await response.json()) as DataResponse<T>).data;
}

export async function getDocuments(): Promise<Document[]> {
  return parseResponse<Document[]>(await fetch('/api/documents'));
}

export async function uploadDocument(file: File): Promise<Document> {
  const formData = new FormData();
  formData.set('file', file);
  return parseResponse<Document>(
    await fetch('/api/documents', {
      method: 'POST',
      body: formData,
    }),
  );
}

export async function deleteDocument(id: string): Promise<void> {
  const response = await fetch(`/api/documents/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorResponse;
    throw new Error(body.error?.message ?? 'Unable to delete document');
  }
}
