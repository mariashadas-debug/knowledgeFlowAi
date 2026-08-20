import type { Database } from '../services/database.js';
import type { TextChunk } from '../services/text-chunker.js';

export type DocumentStatus = 'processing' | 'ready' | 'failed';

interface DocumentRow {
  id: string;
  name: string;
  original_name: string;
  mime_type: string;
  size: string;
  status: DocumentStatus;
  error_message: string | null;
  storage_key: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentRecord {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  errorMessage: string | null;
  storageKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentInput {
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  checksumSha256: string;
}

interface DocumentChunkRow {
  id: string;
  chunk_index: number;
  content: string;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface DocumentChunkRecord {
  id: string;
  chunkIndex: number;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const DOCUMENT_COLUMNS = `
  id,
  name,
  original_name,
  mime_type,
  size,
  status,
  error_message,
  storage_key,
  created_at,
  updated_at
`;

function mapDocument(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    name: row.name,
    originalName: row.original_name,
    mimeType: row.mime_type,
    size: Number(row.size),
    status: row.status,
    errorMessage: row.error_message,
    storageKey: row.storage_key,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export class DocumentsRepository {
  constructor(private readonly database: Database) {}

  async insert(input: CreateDocumentInput): Promise<DocumentRecord> {
    const result = await this.database.query<DocumentRow>(
      `INSERT INTO documents (
         name, original_name, mime_type, size, status, storage_key, checksum_sha256
       ) VALUES ($1, $2, $3, $4, 'processing', $5, $6)
       RETURNING ${DOCUMENT_COLUMNS}`,
      [
        input.name,
        input.originalName,
        input.mimeType,
        input.size,
        input.storageKey,
        input.checksumSha256,
      ],
    );

    return mapDocument(result.rows[0]!);
  }

  async findAll(): Promise<DocumentRecord[]> {
    const result = await this.database.query<DocumentRow>(
      `SELECT ${DOCUMENT_COLUMNS} FROM documents ORDER BY created_at DESC`,
    );
    return result.rows.map(mapDocument);
  }

  async findById(id: string): Promise<DocumentRecord | null> {
    const result = await this.database.query<DocumentRow>(
      `SELECT ${DOCUMENT_COLUMNS} FROM documents WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? mapDocument(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.database.query('DELETE FROM documents WHERE id = $1', [id]);
    return result.rowCount === 1;
  }

  async replaceChunksAndMarkReady(id: string, chunks: TextChunk[]): Promise<DocumentRecord> {
    return this.database.transaction(async (transaction) => {
      await transaction.query('DELETE FROM document_chunks WHERE document_id = $1', [id]);
      for (const chunk of chunks) {
        await transaction.query(
          `INSERT INTO document_chunks (document_id, content, chunk_index, metadata)
           VALUES ($1, $2, $3, $4)`,
          [id, chunk.content, chunk.metadata.chunkIndex, chunk.metadata],
        );
      }

      const result = await transaction.query<DocumentRow>(
        `UPDATE documents
         SET status = 'ready', error_message = NULL, updated_at = now()
         WHERE id = $1
         RETURNING ${DOCUMENT_COLUMNS}`,
        [id],
      );
      const row = result.rows[0];
      if (!row) throw new Error('Document no longer exists');
      return mapDocument(row);
    });
  }

  async markFailed(id: string, errorMessage: string): Promise<DocumentRecord | null> {
    return this.database.transaction(async (transaction) => {
      await transaction.query('DELETE FROM document_chunks WHERE document_id = $1', [id]);
      const result = await transaction.query<DocumentRow>(
        `UPDATE documents
         SET status = 'failed', error_message = $2, updated_at = now()
         WHERE id = $1
         RETURNING ${DOCUMENT_COLUMNS}`,
        [id, errorMessage],
      );
      const row = result.rows[0];
      return row ? mapDocument(row) : null;
    });
  }

  async findChunks(id: string): Promise<DocumentChunkRecord[]> {
    const result = await this.database.query<DocumentChunkRow>(
      `SELECT id, chunk_index, content, metadata, created_at
       FROM document_chunks
       WHERE document_id = $1
       ORDER BY chunk_index`,
      [id],
    );
    return result.rows.map((row) => ({
      id: row.id,
      chunkIndex: row.chunk_index,
      content: row.content,
      metadata: row.metadata,
      createdAt: row.created_at.toISOString(),
    }));
  }
}
