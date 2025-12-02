/**
 * React Query 훅 - 히스토리 관리
 */

import { useQuery } from '@tanstack/react-query';
import { getHistoryList, getHistoryDetail } from '@/lib/api';

// 쿼리 키 상수
export const historyKeys = {
  all: ['history'] as const,
  lists: () => [...historyKeys.all, 'list'] as const,
  list: (page: number, limit: number) =>
    [...historyKeys.lists(), { page, limit }] as const,
  details: () => [...historyKeys.all, 'detail'] as const,
  detail: (id: string) => [...historyKeys.details(), id] as const,
};

/**
 * 히스토리 목록 조회 훅
 */
export function useHistoryList(page = 1, limit = 10, enabled = true) {
  return useQuery({
    queryKey: historyKeys.list(page, limit),
    queryFn: () => getHistoryList(page, limit),
    enabled,
    staleTime: 2 * 60 * 1000, // 2분
  });
}

/**
 * 히스토리 상세 조회 훅
 */
export function useHistoryDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: historyKeys.detail(id),
    queryFn: () => getHistoryDetail(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5분
  });
}
