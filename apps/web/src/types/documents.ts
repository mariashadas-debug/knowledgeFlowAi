export type DocumentStatus = 'processing' | 'ready' | 'failed';

export interface Document {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
