'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteDocument, getDocuments, uploadDocument } from '../../lib/api/documents';

export const documentsQueryKey = ['documents'] as const;

export function useDocuments() {
  return useQuery({ queryKey: documentsQueryKey, queryFn: getDocuments });
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
