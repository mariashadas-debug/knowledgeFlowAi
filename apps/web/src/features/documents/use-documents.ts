'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteDocument,
  getDocument,
  getDocumentChunks,
  getDocuments,
  uploadDocument,
} from '../../lib/api/documents';

export const documentsQueryKey = ['documents'] as const;

export function useDocuments() {
  return useQuery({
    queryKey: documentsQueryKey,
    queryFn: getDocuments,
    refetchInterval: (query) =>
      query.state.data?.some((document) => document.status === 'processing') ? 2_000 : false,
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: [...documentsQueryKey, id],
    queryFn: () => getDocument(id),
    refetchInterval: (query) => (query.state.data?.status === 'processing' ? 2_000 : false),
  });
}

export function useDocumentChunks(id: string, enabled: boolean) {
  return useQuery({
    queryKey: [...documentsQueryKey, id, 'chunks'],
    queryFn: () => getDocumentChunks(id),
    enabled,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: documentsQueryKey }),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: documentsQueryKey }),
  });
}
