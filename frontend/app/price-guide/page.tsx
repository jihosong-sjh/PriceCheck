'use client';

import { useState } from 'react';
import PriceForm from '@/components/PriceForm';
import PriceResult from '@/components/PriceResult';
import { requestPriceRecommend, ApiException } from '@/lib/api';
import type { PriceRecommendRequest, PriceRecommendResponse } from '@/lib/types';

type ViewState = 'form' | 'result';

export default function PriceGuidePage() {
  const [viewState, setViewState] = useState<ViewState>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PriceRecommendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: PriceRecommendRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await requestPriceRecommend(data);
      setResult(response);
      setViewState('result');
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.status === 404) {
          setError('시세 데이터를 찾을 수 없습니다. 제품명을 다시 확인해주세요.');
        } else if (err.status === 400) {
          setError(err.data.message || '입력 정보를 확인해주세요.');
        } else {
          setError(err.data.message || '가격 조회 중 오류가 발생했습니다.');
        }
      } else {
        setError('서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      }
      setViewState('result');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setViewState('form');
  };

  return (
    <div className="container-narrow py-8 md:py-12">
      {/* 페이지 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">중고 전자제품 가격 가이드</h1>
        <p className="text-gray-600">
          제품 정보를 입력하면 번개장터, 중고나라 시세를 분석하여
          <br className="hidden sm:block" />
          적정 판매가를 추천해드립니다
        </p>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="card">
        {viewState === 'form' ? (
          <PriceForm onSubmit={handleSubmit} isLoading={isLoading} />
        ) : (
          <PriceResult result={result} error={error} onReset={handleReset} />
        )}
      </div>

      {/* 사용 안내 */}
      {viewState === 'form' && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">실시간 시세 분석</h3>
              <p className="text-sm text-gray-500 mt-1">
                주요 중고거래 플랫폼의 최신 시세를 분석합니다
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">상태별 가격 조정</h3>
              <p className="text-sm text-gray-500 mt-1">
                제품 상태에 따라 적정 가격을 조정합니다
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">가격 범위 제공</h3>
              <p className="text-sm text-gray-500 mt-1">
                최저-최고 가격 범위로 협상 여지를 파악합니다
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
