'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  sendConversationMessage,
} from '../../lib/api/conversations';

export const conversationsKey = ['conversations'] as const;

export function useConversations() {
  return useQuery({ queryKey: conversationsKey, queryFn: listConversations });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: [...conversationsKey, id],
    queryFn: () => getConversation(id!),
    enabled: Boolean(id),
  });
}

export function useCreateConversation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createConversation,
    onSuccess: async () => client.invalidateQueries({ queryKey: conversationsKey }),
  });
}

export function useSendMessage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      sendConversationMessage(id, message),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: [...conversationsKey, variables.id] }),
        client.invalidateQueries({ queryKey: conversationsKey }),
        client.invalidateQueries({ queryKey: ['analytics', 'usage'] }),
      ]);
    },
  });
}

export function useDeleteConversation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: async () => client.invalidateQueries({ queryKey: conversationsKey }),
  });
}
