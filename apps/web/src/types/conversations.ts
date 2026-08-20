export interface ConversationSummary {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  latestMessage: string | null;
}

export interface RagSource {
  documentId: string;
  documentName: string;
  chunkId: string;
  chunkIndex: number;
  excerpt: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface UsageDetails {
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  estimatedCost: number | null;
  latencyMs: number;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: {
    sources?: RagSource[];
    rag?: UsageDetails;
  };
  createdAt: string;
}

export interface ConversationDetails extends ConversationSummary {
  messages: ConversationMessage[];
}

export interface SendMessageResponse {
  message: ConversationMessage;
  sources: RagSource[];
  usage: UsageDetails;
}

export interface UsageAnalytics {
  totalRequests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number | null;
  averageLatencyMs: number | null;
}
