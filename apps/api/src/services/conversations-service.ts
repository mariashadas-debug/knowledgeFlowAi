import { AppError } from '../errors/app-error.js';
import type {
  ConversationRecord,
  ConversationsRepository,
  MessageRecord,
} from '../repositories/conversations-repository.js';
import type { RagService, RagSource } from './rag-service.js';

export interface ConversationDetails extends ConversationRecord {
  messages: MessageRecord[];
}

export interface SendMessageResult {
  message: MessageRecord;
  sources: RagSource[];
  usage: {
    model: string;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    estimatedCost: number | null;
    latencyMs: number;
  };
}

export class ConversationsService {
  constructor(
    private readonly repository: ConversationsRepository,
    private readonly rag: RagService,
  ) {}

  create(): Promise<ConversationRecord> {
    return this.repository.create();
  }

  list(): Promise<ConversationRecord[]> {
    return this.repository.list();
  }

  async get(id: string): Promise<ConversationDetails> {
    const conversation = await this.repository.findById(id);
    if (!conversation) throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
    return { ...conversation, messages: await this.repository.findMessages(id) };
  }

  async delete(id: string): Promise<void> {
    if (!(await this.repository.delete(id))) {
      throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
    }
  }

  async sendMessage(id: string, content: string): Promise<SendMessageResult> {
    const conversation = await this.repository.findById(id);
    if (!conversation) throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
    const history = await this.repository.findMessages(id);
    await this.repository.addUserMessage(id, content);

    try {
      const result = await this.rag.answer(content, history);
      const usage = {
        model: result.model,
        ...result.usage,
        estimatedCost: result.estimatedCost,
        latencyMs: result.latencyMs,
      };
      const message = await this.repository.addAssistantAndLog(
        id,
        result.content,
        { sources: result.sources, rag: usage },
        {
          conversationId: id,
          model: result.model,
          usage: result.usage,
          estimatedCost: result.estimatedCost,
          latencyMs: result.latencyMs,
          retrievedChunks: result.retrievedChunks,
        },
      );
      return { message, sources: result.sources, usage };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown RAG error';
      console.error(`RAG request failed for conversation ${id}: ${message}`);
      throw new AppError(502, 'RAG_GENERATION_FAILED', 'Unable to generate an answer');
    }
  }
}
