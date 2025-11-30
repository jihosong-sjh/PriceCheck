'use client';

import { useState } from 'react';
import type { Condition } from '@/lib/types';
import { CONDITION_LABELS } from '@/lib/types';
import { formatPrice } from '@/lib/chartUtils';

interface PriceExplanationCardProps {
  condition: Condition;
  sampleCount: number;
  medianPrice?: number;
  averagePrice?: number;
  recommendedPrice: number;
  outlierCount?: number;
}

// 상태별 조정률
const CONDITION_ADJUSTMENTS: Record<Condition, number> = {
  GOOD: 0,
  FAIR: -10,
  POOR: -20,
};

export default function PriceExplanationCard({
  condition,
  sampleCount,
  medianPrice,
  averagePrice,
  recommendedPrice,
  outlierCount = 0,
}: PriceExplanationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 기준 가격 (중앙값 또는 평균)
  const basePrice = medianPrice || averagePrice || recommendedPrice;

  // 상태 조정률
  const adjustmentRate = CONDITION_ADJUSTMENTS[condition];
  const adjustmentAmount = Math.round(basePrice * (adjustmentRate / 100));

  // 계산 과정
  const steps = [
    {
      step: 1,
      title: '시세 데이터 수집',
      description: `${sampleCount}개 매물의 가격 정보를 수집했습니다.`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
    ...(outlierCount > 0
      ? [
          {
            step: 2,
            title: '이상치 제거',
            description: `극단적으로 높거나 낮은 가격 ${outlierCount}개를 제외했습니다.`,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            ),
          },
        ]
      : []),
    {
      step: outlierCount > 0 ? 3 : 2,
      title: '기준 가격 산출',
      description: medianPrice
        ? `정렬된 가격의 중앙값 ${formatPrice(medianPrice)}을 기준으로 합니다.`
        : `평균 가격 ${formatPrice(averagePrice || recommendedPrice)}을 기준으로 합니다.`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    ...(adjustmentRate !== 0
      ? [
          {
            step: outlierCount > 0 ? 4 : 3,
            title: `상태 '${CONDITION_LABELS[condition]}' 적용`,
            description: `제품 상태에 따라 ${adjustmentRate}% (${formatPrice(Math.abs(adjustmentAmount))}) ${
              adjustmentRate < 0 ? '할인' : '할증'
            }을 적용했습니다.`,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="card">
      {/* 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">가격 산출 과정</h3>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* 간략 요약 (접혀있을 때) */}
      {!isExpanded && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {sampleCount}개 매물의 중앙값에 상태 &apos;{CONDITION_LABELS[condition]}&apos; 조건을 적용하여
          산출된 가격입니다.
        </p>
      )}

      {/* 상세 과정 (펼쳐졌을 때) */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {steps.map((item, index) => (
            <div key={item.step} className="flex gap-3">
              {/* 아이콘 */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  {item.icon}
                </div>
              </div>

              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>

                {/* 연결선 */}
                {index < steps.length - 1 && (
                  <div className="ml-4 mt-2 mb-2 border-l-2 border-dashed border-gray-200 dark:border-gray-700 h-4" />
                )}
              </div>
            </div>
          ))}

          {/* 최종 결과 */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300 font-medium">최종 추천 가격</span>
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {formatPrice(recommendedPrice)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
