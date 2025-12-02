/**
 * React Query 훅 - 알림 메시지 관리
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationList,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from '@/lib/api';

// 쿼리 키 상수
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (page: number, limit: number) =>
    [...notificationKeys.lists(), { page, limit }] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
};

/**
 * 알림 목록 조회 훅
 */
export function useNotifications(page = 1, limit = 10, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.list(page, limit),
    queryFn: () => getNotificationList(page, limit),
    enabled,
    staleTime: 30 * 1000, // 30초
  });
}

/**
 * 읽지 않은 알림 개수 조회 훅
 */
export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadNotificationCount,
    enabled,
    staleTime: 30 * 1000, // 30초
    refetchInterval: 60 * 1000, // 1분마다 자동 갱신
  });
}

/**
 * 알림 읽음 처리 mutation 훅
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * 모든 알림 읽음 처리 mutation 훅
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
