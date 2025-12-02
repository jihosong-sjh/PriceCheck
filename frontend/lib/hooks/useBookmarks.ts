/**
 * React Query 훅 - 북마크 관리
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBookmarkList,
  createBookmark,
  deleteBookmark,
  checkBookmark,
} from '@/lib/api';
import type { CreateBookmarkRequest } from '@/lib/types';
import { useUIStore } from '@/lib/stores/uiStore';

// 쿼리 키 상수
export const bookmarkKeys = {
  all: ['bookmarks'] as const,
  lists: () => [...bookmarkKeys.all, 'list'] as const,
  list: (page: number, limit: number) =>
    [...bookmarkKeys.lists(), { page, limit }] as const,
  check: (recommendationId: string) =>
    [...bookmarkKeys.all, 'check', recommendationId] as const,
};

/**
 * 북마크 목록 조회 훅
 */
export function useBookmarks(page = 1, limit = 10, enabled = true) {
  return useQuery({
    queryKey: bookmarkKeys.list(page, limit),
    queryFn: () => getBookmarkList(page, limit),
    enabled,
    staleTime: 5 * 60 * 1000, // 5분
  });
}

/**
 * 북마크 존재 여부 확인 훅
 */
export function useBookmarkCheck(recommendationId: string, enabled = true) {
  return useQuery({
    queryKey: bookmarkKeys.check(recommendationId),
    queryFn: () => checkBookmark(recommendationId),
    enabled: enabled && !!recommendationId,
    staleTime: 30 * 1000, // 30초
  });
}

/**
 * 북마크 생성 mutation 훅
 */
export function useCreateBookmark() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (data: CreateBookmarkRequest) => createBookmark(data),
    onSuccess: () => {
      // 북마크 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
      showToast('찜 목록에 추가되었습니다.', 'success');
    },
    onError: () => {
      showToast('찜 추가에 실패했습니다.', 'error');
    },
  });
}

/**
 * 북마크 삭제 mutation 훅
 */
export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (id: string) => deleteBookmark(id),
    onSuccess: () => {
      // 북마크 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
      showToast('찜 목록에서 삭제되었습니다.', 'success');
    },
    onError: () => {
      showToast('찜 삭제에 실패했습니다.', 'error');
    },
  });
}

/**
 * 북마크 토글 훅 (추가/삭제)
 */
export function useToggleBookmark() {
  const createMutation = useCreateBookmark();
  const deleteMutation = useDeleteBookmark();

  const toggle = async (
    isBookmarked: boolean,
    bookmarkId: string | null,
    data: CreateBookmarkRequest
  ) => {
    if (isBookmarked && bookmarkId) {
      await deleteMutation.mutateAsync(bookmarkId);
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return {
    toggle,
    isLoading: createMutation.isPending || deleteMutation.isPending,
  };
}
