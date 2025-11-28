'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getHistoryList, ApiException, setAuthToken } from '@/lib/api';
import type { HistoryListItem, HistoryListResponse } from '@/lib/types';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/lib/types';

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const [historyData, setHistoryData] = useState<HistoryListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchHistory = async () => {
      // 세션 로딩 중이면 대기
      if (status === 'loading') return;

      // 세션이 없으면 로딩 해제
      if (!session?.accessToken) {
        setIsLoading(false);
        return;
      }

      // NextAuth 세션의 accessToken을 API 클라이언트에 설정
      setAuthToken(session.accessToken);

      setIsLoading(true);
      setError(null);

      try {
        const data = await getHistoryList(currentPage, 10);
        setHistoryData(data);
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
        } else {
          setError('히스토리를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [session?.accessToken, currentPage, status]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR') + '원';
  };

  if (isLoading) {
    return (
      <div className="container-wide py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">추천 히스토리</h1>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-wide py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">추천 히스토리</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setCurrentPage(1)}
            className="mt-4 btn-primary"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!historyData || !historyData.items || historyData.items.length === 0) {
    return (
      <div className="container-wide py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">추천 히스토리</h1>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">아직 추천 기록이 없습니다</h3>
          <p className="text-gray-600 mb-4">
            가격 추천을 받으면 이곳에서 기록을 확인할 수 있습니다.
          </p>
          <Link href="/price-guide" className="btn-primary no-underline">
            가격 추천 받기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-wide py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">추천 히스토리</h1>

      <div className="space-y-4">
        {historyData.items.map((item: HistoryListItem) => (
          <Link
            key={item.id}
            href={`/history/${item.id}`}
            className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all no-underline"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                    상태: {CONDITION_LABELS[item.condition]}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  {item.productName}
                  {item.modelName && <span className="text-gray-600"> ({item.modelName})</span>}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{formatDate(item.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary-600">
                  {formatPrice(item.recommendedPrice)}
                </p>
                <p className="text-sm text-gray-500">추천가격</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 페이지네이션 */}
      {historyData.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            이전
          </button>
          <span className="px-4 py-2 text-gray-700">
            {currentPage} / {historyData.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(historyData.totalPages, p + 1))}
            disabled={currentPage === historyData.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
