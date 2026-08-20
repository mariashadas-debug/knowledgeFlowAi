import pgvector from 'pgvector';

import type { Database } from '../services/database.js';

interface RetrievalRow {
  chunk_id: string;
  document_id: string;
  document_name: string;
  chunk_index: number;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export class RetrievalRepository {
  constructor(private readonly database: Database) {}

  async search(
    embedding: number[],
    limit: number,
    minimumSimilarity: number,
  ): Promise<RetrievedChunk[]> {
    const vector = pgvector.toSql(embedding);
    const result = await this.database.query<RetrievalRow>(
      `SELECT
         chunks.id AS chunk_id,
         chunks.document_id,
         documents.original_name AS document_name,
         chunks.chunk_index,
         chunks.content,
         chunks.metadata,
         1 - (chunks.embedding <=> $1::vector) AS similarity
       FROM document_chunks chunks
       JOIN documents ON documents.id = chunks.document_id
       WHERE chunks.embedding IS NOT NULL
         AND documents.status = 'ready'
         AND 1 - (chunks.embedding <=> $1::vector) >= $2
       ORDER BY chunks.embedding <=> $1::vector
       LIMIT $3`,
      [vector, minimumSimilarity, limit],
    );

    return result.rows.map((row) => ({
      chunkId: row.chunk_id,
      documentId: row.document_id,
      documentName: row.document_name,
      chunkIndex: row.chunk_index,
      content: row.content,
      metadata: row.metadata,
      similarity: Number(row.similarity),
    }));
  }
}
