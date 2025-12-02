'use client';

import dynamic from 'next/dynamic';
import {
  type PriceRecommendResponse,
  CATEGORY_LABELS,
  CONDITION_LABELS,
} from '@/lib/types';
import { calculateCV } from '@/lib/chartUtils';
import MarketComparison from './MarketComparison';
import BookmarkButton from './BookmarkButton';
import PriceAlertButton from './PriceAlertButton';
import ShareButton from './ShareButton';
import CompareButton from './CompareButton';

// 차트 컴포넌트 동적 로딩 (SSR 비활성화)
const ConfidenceIndicator = dynamic(
  () => import('./charts/ConfidenceIndicator'),
  { ssr: false }
);
const PriceDistributionChart = dynamic(
  () => import('./charts/PriceDistributionChart'),
  { ssr: false }
);
const PlatformComparisonChart = dynamic(
  () => import('./charts/PlatformComparisonChart'),
  { ssr: false }
);
const PriceExplanationCard = dynamic(
  () => import('./charts/PriceExplanationCard'),
  { ssr: false }
);
const PriceHistoryChart = dynamic(
  () => import('./charts/PriceHistoryChart'),
  { ssr: false }
);

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
      <div className="card border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-red-500 dark:text-red-400"
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
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">조회 실패</h3>
            <p className="mt-1 text-red-700 dark:text-red-400">{error}</p>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="mt-4 btn-outline text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
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
      <div className="card bg-gradient-to-br from-primary-50 to-blue-50 dark:from-blue-900/30 dark:to-primary-900/30 border-primary-200 dark:border-primary-700 relative">
        {/* 찜하기 & 알림 & 공유 & 비교 버튼 */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {recommendationId && (
            <CompareButton
              id={recommendationId}
              productName={productName}
              modelName={modelName}
              category={category}
              condition={condition}
              recommendedPrice={recommendedPrice}
              priceMin={priceMin}
              priceMax={priceMax}
              size="md"
            />
          )}
          <ShareButton
            productName={productName}
            modelName={modelName}
            category={category}
            condition={condition}
            recommendedPrice={recommendedPrice}
            priceMin={priceMin}
            priceMax={priceMax}
            size="md"
          />
          {recommendationId && (
            <>
              <PriceAlertButton
                category={category}
                productName={productName}
                modelName={modelName}
                condition={condition}
                currentPrice={recommendedPrice}
              />
              <BookmarkButton recommendationId={recommendationId} size="md" />
            </>
          )}
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">추천 판매가</h3>
          <div className="price-display text-4xl dark:text-white">
            {formatPrice(recommendedPrice)}
            <span className="text-2xl font-normal text-gray-500 dark:text-gray-400">원</span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="price-range">
              {formatPrice(priceMin)}원 ~ {formatPrice(priceMax)}원
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            시세 범위 내에서 추천 가격이 산출되었습니다
          </p>
        </div>
      </div>

      {/* 제품 정보 요약 */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">제품 정보</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">카테고리</dt>
            <dd className="mt-1 font-medium text-gray-900 dark:text-white">{CATEGORY_LABELS[category]}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">상태</dt>
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
            <dt className="text-sm text-gray-500 dark:text-gray-400">제품명</dt>
            <dd className="mt-1 font-medium text-gray-900 dark:text-white">{productName}</dd>
          </div>
          {modelName && (
            <div className="col-span-2">
              <dt className="text-sm text-gray-500 dark:text-gray-400">모델명</dt>
              <dd className="mt-1 font-medium text-gray-900 dark:text-white">{modelName}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* 시세 신뢰도 */}
      {result.marketDataSnapshot && result.marketDataSnapshot.length > 0 && (
        <ConfidenceIndicator
          sampleCount={result.marketDataSnapshot.length}
          coefficientOfVariation={calculateCV(result.marketDataSnapshot.map((d) => d.price))}
        />
      )}

      {/* 가격 분포 차트 */}
      {result.marketDataSnapshot && result.marketDataSnapshot.length >= 3 && (
        <PriceDistributionChart
          marketData={result.marketDataSnapshot}
          recommendedPrice={recommendedPrice}
          priceMin={priceMin}
          priceMax={priceMax}
        />
      )}

      {/* 플랫폼별 비교 차트 */}
      {result.marketDataSnapshot && result.marketDataSnapshot.length > 0 && (
        <PlatformComparisonChart marketData={result.marketDataSnapshot} />
      )}

      {/* 가격 히스토리 차트 */}
      <PriceHistoryChart productName={productName} initialDays={30} />

      {/* 시세 비교 정보 */}
      {result.marketDataSnapshot && result.marketDataSnapshot.length > 0 && (
        <MarketComparison marketData={result.marketDataSnapshot} />
      )}

      {/* 가격 산출 과정 */}
      {result.marketDataSnapshot && result.marketDataSnapshot.length > 0 && (
        <PriceExplanationCard
          condition={condition}
          sampleCount={result.marketDataSnapshot.length}
          recommendedPrice={recommendedPrice}
        />
      )}

      {/* 가격 분석 안내 */}
      <div className="card bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5"
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
            <h4 className="font-medium text-gray-900 dark:text-white">가격 분석 안내</h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              추천 가격은 번개장터, 중고나라, 헬로마켓의 최근 거래 시세를 분석하여 산출되었습니다.
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
