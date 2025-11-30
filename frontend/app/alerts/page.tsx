'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getAlertList,
  updateAlert,
  deleteAlert,
  getNotificationList,
  markAllNotificationsAsRead,
} from '@/lib/api';
import type { PriceAlertItem, NotificationItem } from '@/lib/types';

export default function AlertsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'alerts' | 'notifications'>('alerts');
  const [alerts, setAlerts] = useState<PriceAlertItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 인증 확인
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/alerts');
    }
  }, [status, router]);

  // 데이터 로드
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === 'alerts') {
          const response = await getAlertList(1, 50);
          setAlerts(response.items);
        } else {
          const response = await getNotificationList(1, 50);
          setNotifications(response.items);
        }
      } catch {
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, activeTab]);

  // 알림 활성화/비활성화 토글
  const handleToggleActive = async (alert: PriceAlertItem) => {
    try {
      const updated = await updateAlert(alert.id, { isActive: !alert.isActive });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? updated : a))
      );
    } catch {
      setError('알림 상태 변경에 실패했습니다.');
    }
  };

  // 알림 삭제
  const handleDeleteAlert = async (id: string) => {
    if (!confirm('정말 이 알림을 삭제하시겠습니까?')) return;

    try {
      await deleteAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError('알림 삭제에 실패했습니다.');
    }
  };

  // 전체 알림 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      setError('읽음 처리에 실패했습니다.');
    }
  };

  if (status === 'loading') {
    return (
      <div className="container-wide py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container-wide py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">알림 관리</h1>
        <Link
          href="/price-guide"
          className="btn-primary no-underline"
        >
          새 알림 추가
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'alerts'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          가격 알림
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'notifications'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          알림 내역
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
      ) : activeTab === 'alerts' ? (
        <AlertsList
          alerts={alerts}
          onToggleActive={handleToggleActive}
          onDelete={handleDeleteAlert}
        />
      ) : (
        <NotificationsList
          notifications={notifications}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      )}
    </div>
  );
}

// 가격 알림 목록 컴포넌트
function AlertsList({
  alerts,
  onToggleActive,
  onDelete,
}: {
  alerts: PriceAlertItem[];
  onToggleActive: (alert: PriceAlertItem) => void;
  onDelete: (id: string) => void;
}) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          등록된 알림이 없습니다.
        </p>
        <Link href="/price-guide" className="btn-primary no-underline">
          첫 알림 등록하기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4
                     ${!alert.isActive ? 'opacity-60' : ''}`}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="badge badge-gray">{alert.categoryLabel}</span>
                <span className="badge badge-blue">{alert.conditionLabel}</span>
                {alert.priceReached && (
                  <span className="badge badge-green">목표 도달!</span>
                )}
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {alert.productName} {alert.modelName}
              </h3>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">목표가: </span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {alert.targetPrice.toLocaleString()}원
                  </span>
                </div>
                {alert.currentPrice && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">현재가: </span>
                    <span
                      className={`font-semibold ${
                        alert.currentPrice <= alert.targetPrice
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {alert.currentPrice.toLocaleString()}원
                    </span>
                  </div>
                )}
              </div>
              {alert.lastCheckedAt && (
                <p className="text-xs text-gray-400 mt-2">
                  마지막 확인: {new Date(alert.lastCheckedAt).toLocaleString('ko-KR')}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Toggle */}
              <button
                onClick={() => onToggleActive(alert)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  alert.isActive ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                aria-label={alert.isActive ? '알림 비활성화' : '알림 활성화'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    alert.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>

              {/* Delete */}
              <button
                onClick={() => onDelete(alert.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="삭제"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 알림 내역 목록 컴포넌트
function NotificationsList({
  notifications,
  onMarkAllAsRead,
}: {
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
}) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">
          알림 내역이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      {unreadCount > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onMarkAllAsRead}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            모두 읽음 처리
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4
                       ${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  notification.type === 'PRICE_DROP'
                    ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {notification.type === 'PRICE_DROP' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {notification.title}
                  </span>
                  {!notification.isRead && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notification.createdAt).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
