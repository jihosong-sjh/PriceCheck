'use client';

import {
  type PriceRecommendResponse,
  CATEGORY_LABELS,
  CONDITION_LABELS,
} from '@/lib/types';
import MarketComparison from './MarketComparison';
import BookmarkButton from './BookmarkButton';

interface PriceResultProps {
  result: PriceRecommendResponse | null;
  error: string | null;
  onReset?: () => void;
  recommendationId?: string;
}

// 가격 포맷 함수
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price);
}

export default function PriceResult({ result, error, onReset, recommendationId }: PriceResultProps) {
  // 에러 메시지 표시
  if (error) {
    return (
      <div className="card border-red-200 bg-red-50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800">조회 실패</h3>
            <p className="mt-1 text-red-700">{error}</p>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="mt-4 btn-outline text-red-600 border-red-300 hover:bg-red-50"
              >
                다시 시도하기
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 결과가 없는 경우
  if (!result) {
    return null;
  }

  const { category, productName, modelName, condition, recommendedPrice, priceMin, priceMax } =
    result;

  return (
    <div className="space-y-6">
      {/* 추천 가격 카드 */}
      <div className="card bg-gradient-to-br from-primary-50 to-blue-50 border-primary-200 relative">
        {/* 찜하기 버튼 */}
        {recommendationId && (
          <div className="absolute top-4 right-4">
            <BookmarkButton recommendationId={recommendationId} size="md" />
          </div>
        )}
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-600 mb-2">추천 판매가</h3>
          <div className="price-display text-4xl">
            {formatPrice(recommendedPrice)}
            <span className="text-2xl font-normal text-gray-500">원</span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-gray-500">
            <span className="price-range">
              {formatPrice(priceMin)}원 ~ {formatPrice(priceMax)}원
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            시세 범위 내에서 추천 가격이 산출되었습니다
          </p>
        </div>
      </div>

      {/* 제품 정보 요약 */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">제품 정보</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">카테고리</dt>
            <dd className="mt-1 font-medium text-gray-900">{CATEGORY_LABELS[category]}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">상태</dt>
            <dd className="mt-1">
              <span
                className={`badge ${
                  condition === 'GOOD'
                    ? 'badge-green'
                    : condition === 'FAIR'
                      ? 'badge-yellow'
                      : 'badge-red'
                }`}
              >
                {CONDITION_LABELS[condition]}
              </span>
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-sm text-gray-500">제품명</dt>
            <dd className="mt-1 font-medium text-gray-900">{productName}</dd>
          </div>
          {modelName && (
            <div className="col-span-2">
              <dt className="text-sm text-gray-500">모델명</dt>
              <dd className="mt-1 font-medium text-gray-900">{modelName}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* 시세 비교 정보 */}
      {result.marketDataSnapshot && result.marketDataSnapshot.length > 0 && (
        <MarketComparison marketData={result.marketDataSnapshot} />
      )}

      {/* 가격 분석 안내 */}
      <div className="card bg-gray-50">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="font-medium text-gray-900">가격 분석 안내</h4>
            <p className="mt-1 text-sm text-gray-600">
              추천 가격은 번개장터, 중고나라의 최근 거래 시세를 분석하여 산출되었습니다.
              실제 판매 시에는 제품의 구체적인 상태, 구성품, 지역 등에 따라 가격이 달라질 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 새 조회 버튼 */}
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="btn-secondary w-full"
        >
          다른 제품 조회하기
        </button>
      )}
    </div>
  );
}
