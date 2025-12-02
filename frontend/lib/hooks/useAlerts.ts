/**
 * React Query 훅 - 가격 알림 관리
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAlertList,
  createAlert,
  updateAlert,
  deleteAlert,
} from '@/lib/api';
import type { CreateAlertRequest, UpdateAlertRequest } from '@/lib/types';
import { useUIStore } from '@/lib/stores/uiStore';

// 쿼리 키 상수
export const alertKeys = {
  all: ['alerts'] as const,
  lists: () => [...alertKeys.all, 'list'] as const,
  list: (page: number, limit: number) =>
    [...alertKeys.lists(), { page, limit }] as const,
};

/**
 * 알림 목록 조회 훅
 */
export function useAlerts(page = 1, limit = 10, enabled = true) {
  return useQuery({
    queryKey: alertKeys.list(page, limit),
    queryFn: () => getAlertList(page, limit),
    enabled,
    staleTime: 2 * 60 * 1000, // 2분
  });
}

/**
 * 알림 생성 mutation 훅
 */
export function useCreateAlert() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (data: CreateAlertRequest) => createAlert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
      showToast('가격 알림이 등록되었습니다.', 'success');
    },
    onError: () => {
      showToast('알림 등록에 실패했습니다.', 'error');
    },
  });
}

/**
 * 알림 수정 mutation 훅
 */
export function useUpdateAlert() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAlertRequest }) =>
      updateAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
      showToast('알림이 수정되었습니다.', 'success');
    },
    onError: () => {
      showToast('알림 수정에 실패했습니다.', 'error');
    },
  });
}

/**
 * 알림 삭제 mutation 훅
 */
export function useDeleteAlert() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (id: string) => deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
      showToast('알림이 삭제되었습니다.', 'success');
    },
    onError: () => {
      showToast('알림 삭제에 실패했습니다.', 'error');
    },
  });
}
