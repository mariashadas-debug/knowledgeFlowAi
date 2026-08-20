import type { MigrationBuilder } from 'node-pg-migrate';

export const shorthands = undefined;

export function up(pgm: MigrationBuilder): void {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS vector;

    CREATE TYPE document_status AS ENUM ('processing', 'ready', 'failed');
    CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

    CREATE TABLE documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      original_name text NOT NULL,
      mime_type text NOT NULL,
      size bigint NOT NULL CHECK (size >= 0),
      status document_status NOT NULL DEFAULT 'processing',
      error_message text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE document_chunks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      content text NOT NULL,
      chunk_index integer NOT NULL CHECK (chunk_index >= 0),
      embedding vector(1536),
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT document_chunks_document_chunk_unique UNIQUE (document_id, chunk_index)
    );

    COMMENT ON COLUMN document_chunks.embedding IS
      'Initial embedding dimension is 1536; provider integration is deferred.';

    CREATE TABLE conversations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role message_role NOT NULL,
      content text NOT NULL,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE ai_request_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
      model text NOT NULL,
      prompt_tokens integer CHECK (prompt_tokens >= 0),
      completion_tokens integer CHECK (completion_tokens >= 0),
      total_tokens integer CHECK (total_tokens >= 0),
      estimated_cost numeric(14, 8) CHECK (estimated_cost >= 0),
      latency_ms integer CHECK (latency_ms >= 0),
      retrieved_chunks jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX documents_created_at_idx ON documents (created_at DESC);
    CREATE INDEX document_chunks_created_at_idx ON document_chunks (created_at DESC);
    CREATE INDEX conversations_created_at_idx ON conversations (created_at DESC);
    CREATE INDEX messages_conversation_created_at_idx
      ON messages (conversation_id, created_at);
    CREATE INDEX ai_request_logs_conversation_created_at_idx
      ON ai_request_logs (conversation_id, created_at);
    CREATE INDEX ai_request_logs_created_at_idx ON ai_request_logs (created_at DESC);
  `);
}

export function down(pgm: MigrationBuilder): void {
  pgm.sql(`
    DROP TABLE ai_request_logs;
    DROP TABLE messages;
    DROP TABLE conversations;
    DROP TABLE document_chunks;
    DROP TABLE documents;
    DROP TYPE message_role;
    DROP TYPE document_status;
  `);
}
