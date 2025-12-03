'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { getHistoryDetail, getSharedResult, ApiException, setAuthToken } from '@/lib/api';
import type { HistoryDetailResponse } from '@/lib/types';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/lib/types';
import MarketComparison from '@/components/MarketComparison';

export default function HistoryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session, status } = useSession();
  const [historyDetail, setHistoryDetail] = useState<HistoryDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistoryDetail = async () => {
      // 세션 로딩 중이면 대기
      if (status === 'loading') return;

      setIsLoading(true);
      setError(null);

      try {
        let data: HistoryDetailResponse;

        if (session?.accessToken) {
          // 로그인 상태: 본인 히스토리 조회 API 사용
          setAuthToken(session.accessToken);
          data = await getHistoryDetail(id);
        } else {
          // 비로그인 상태: 공개 공유 링크 API 사용 (인증 불필요)
          data = await getSharedResult(id);
        }

        setHistoryDetail(data);
      } catch (err) {
        if (err instanceof ApiException) {
          if (err.status === 404) {
            setError('해당 결과를 찾을 수 없습니다.');
          } else {
            setError(err.message);
          }
        } else {
          setError('결과를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoryDetail();
  }, [id, session?.accessToken, status]);

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
        <div className="mb-6">
          <Link href="/history" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 no-underline">
            &larr; 히스토리 목록
          </Link>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
            <div className="space-y-2">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-wide py-8">
        <div className="mb-6">
          <Link href="/history" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 no-underline">
            &larr; 히스토리 목록
          </Link>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <Link href="/history" className="mt-4 btn-primary inline-block no-underline">
            히스토리 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!historyDetail) {
    return null;
  }

  return (
    <div className="container-wide py-8">
      <div className="mb-6">
        <Link href="/history" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 no-underline">
          &larr; 히스토리 목록
        </Link>
      </div>

      {/* 제품 정보 카드 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded">
                {CATEGORY_LABELS[historyDetail.category]}
              </span>
              <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                상태: {CONDITION_LABELS[historyDetail.condition]}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {historyDetail.productName}
              {historyDetail.modelName && (
                <span className="text-gray-600 dark:text-gray-400 font-normal"> ({historyDetail.modelName})</span>
              )}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              조회일: {formatDate(historyDetail.createdAt)}
            </p>
          </div>
        </div>

        {/* 추천 결과 */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">추천 가격</p>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {formatPrice(historyDetail.recommendedPrice)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">최저 가격</p>
              <p className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
                {formatPrice(historyDetail.priceMin)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">최고 가격</p>
              <p className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
                {formatPrice(historyDetail.priceMax)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 업로드된 이미지 */}
      {historyDetail.images && historyDetail.images.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">업로드된 이미지</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {historyDetail.images.map((image) => (
              <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                <Image
                  src={image.imageUrl}
                  alt="제품 이미지"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 시세 비교 정보 */}
      {historyDetail.marketDataSnapshot && historyDetail.marketDataSnapshot.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">당시 시세 비교 정보</h2>
          <MarketComparison marketData={historyDetail.marketDataSnapshot} />
        </div>
      )}
    </div>
  );
}
