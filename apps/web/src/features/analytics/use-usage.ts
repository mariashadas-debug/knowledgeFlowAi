'use client';

import { useQuery } from '@tanstack/react-query';

import { getUsageAnalytics } from '../../lib/api/conversations';

export function useUsage() {
  return useQuery({ queryKey: ['analytics', 'usage'], queryFn: getUsageAnalytics });
}
