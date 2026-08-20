import type { Database } from '../services/database.js';

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
}
