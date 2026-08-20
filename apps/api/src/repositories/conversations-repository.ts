import type { Database, QueryExecutor } from '../services/database.js';
import type { LLMUsage } from '../services/llm/llm-provider.js';

export type MessageRole = 'user' | 'assistant' | 'system';

interface ConversationRow {
  id: string;
  title: string | null;
  created_at: Date;
  updated_at: Date;
  latest_message: string | null;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface ConversationRecord {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  latestMessage: string | null;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AIRequestLogInput {
  conversationId: string;
  model: string;
  usage: LLMUsage;
  estimatedCost: number | null;
  latencyMs: number;
  retrievedChunks: Array<{
    chunkId: string;
    documentId: string;
    similarity: number;
    rank: number;
  }>;
}

function mapConversation(row: ConversationRow): ConversationRecord {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    latestMessage: row.latest_message,
  };
}

function mapMessage(row: MessageRow): MessageRecord {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
  };
}

const CONVERSATION_SELECT = `
  SELECT conversations.id, conversations.title, conversations.created_at,
         conversations.updated_at, latest.content AS latest_message
  FROM conversations
  LEFT JOIN LATERAL (
    SELECT content FROM messages
    WHERE conversation_id = conversations.id
    ORDER BY created_at DESC, id DESC LIMIT 1
  ) latest ON true
`;

async function insertMessage(
  executor: QueryExecutor,
  conversationId: string,
  role: MessageRole,
  content: string,
  metadata: Record<string, unknown> = {},
): Promise<MessageRecord> {
  const result = await executor.query<MessageRow>(
    `INSERT INTO messages (conversation_id, role, content, metadata)
     VALUES ($1, $2, $3, $4)
     RETURNING id, conversation_id, role, content, metadata, created_at`,
    [conversationId, role, content, metadata],
  );
  return mapMessage(result.rows[0]!);
}

export class ConversationsRepository {
  constructor(private readonly database: Database) {}

  async create(): Promise<ConversationRecord> {
    const result = await this.database.query<ConversationRow>(
      `INSERT INTO conversations DEFAULT VALUES
       RETURNING id, title, created_at, updated_at, NULL::text AS latest_message`,
    );
    return mapConversation(result.rows[0]!);
  }

  async list(): Promise<ConversationRecord[]> {
    const result = await this.database.query<ConversationRow>(
      `${CONVERSATION_SELECT} ORDER BY conversations.updated_at DESC`,
    );
    return result.rows.map(mapConversation);
  }

  async findById(id: string): Promise<ConversationRecord | null> {
    const result = await this.database.query<ConversationRow>(
      `${CONVERSATION_SELECT} WHERE conversations.id = $1`,
      [id],
    );
    return result.rows[0] ? mapConversation(result.rows[0]) : null;
  }

  async findMessages(conversationId: string): Promise<MessageRecord[]> {
    const result = await this.database.query<MessageRow>(
      `SELECT id, conversation_id, role, content, metadata, created_at
       FROM messages WHERE conversation_id = $1 ORDER BY created_at, id`,
      [conversationId],
    );
    return result.rows.map(mapMessage);
  }

  async addUserMessage(conversationId: string, content: string): Promise<MessageRecord> {
    return this.database.transaction(async (transaction) => {
      const message = await insertMessage(transaction, conversationId, 'user', content);
      await transaction.query(
        `UPDATE conversations
         SET title = COALESCE(title, $2), updated_at = now()
         WHERE id = $1`,
        [conversationId, content.length > 72 ? `${content.slice(0, 69)}...` : content],
      );
      return message;
    });
  }

  async addAssistantAndLog(
    conversationId: string,
    content: string,
    metadata: Record<string, unknown>,
    log: AIRequestLogInput,
  ): Promise<MessageRecord> {
    return this.database.transaction(async (transaction) => {
      const message = await insertMessage(
        transaction,
        conversationId,
        'assistant',
        content,
        metadata,
      );
      await transaction.query('UPDATE conversations SET updated_at = now() WHERE id = $1', [
        conversationId,
      ]);
      await transaction.query(
        `INSERT INTO ai_request_logs (
           conversation_id, model, prompt_tokens, completion_tokens, total_tokens,
           estimated_cost, latency_ms, retrieved_chunks
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          log.conversationId,
          log.model,
          log.usage.promptTokens,
          log.usage.completionTokens,
          log.usage.totalTokens,
          log.estimatedCost,
          log.latencyMs,
          JSON.stringify(log.retrievedChunks),
        ],
      );
      return message;
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.database.query('DELETE FROM conversations WHERE id = $1', [id]);
    return result.rowCount === 1;
  }
}
