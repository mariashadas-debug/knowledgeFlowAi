import type {
  ConversationDetails,
  ConversationSummary,
  SendMessageResponse,
  UsageAnalytics,
} from '../../types/conversations';

interface DataResponse<T> {
  data: T;
}
interface ErrorResponse {
  error?: { message?: string };
}

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorResponse;
    throw new Error(body.error?.message ?? 'Assistant request failed');
  }
  return ((await response.json()) as DataResponse<T>).data;
}

export async function listConversations(): Promise<ConversationSummary[]> {
  return parse(await fetch('/api/conversations'));
}

export async function createConversation(): Promise<ConversationSummary> {
  return parse(await fetch('/api/conversations', { method: 'POST' }));
}

export async function getConversation(id: string): Promise<ConversationDetails> {
  return parse(await fetch(`/api/conversations/${encodeURIComponent(id)}`));
}

export async function deleteConversation(id: string): Promise<void> {
  const response = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Unable to delete conversation');
}

export async function sendConversationMessage(
  id: string,
  message: string,
): Promise<SendMessageResponse> {
  const response = await fetch(`/api/conversations/${encodeURIComponent(id)}/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorResponse;
    throw new Error(body.error?.message ?? 'Unable to generate an answer');
  }
  return (await response.json()) as SendMessageResponse;
}

export async function getUsageAnalytics(): Promise<UsageAnalytics> {
  return parse(await fetch('/api/analytics/usage'));
}
