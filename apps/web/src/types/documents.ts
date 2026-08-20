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

export interface DocumentChunk {
  id: string;
  chunkIndex: number;
  content: string;
  metadata: {
    documentName: string;
    chunkIndex: number;
    sourceFormat: 'pdf' | 'txt' | 'markdown';
    pageNumber?: number;
    heading?: string;
  };
  createdAt: string;
  hasEmbedding: boolean;
}
