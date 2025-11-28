'use client';

import { type MarketDataItem, PLATFORM_LABELS } from '@/lib/types';

interface MarketComparisonProps {
  marketData: MarketDataItem[];
}

// 가격 포맷 함수
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price);
}

// 날짜 포맷 함수
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '오늘';
  } else if (diffDays === 1) {
    return '어제';
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

// 플랫폼별 스타일
const PLATFORM_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  BUNJANG: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  JOONGONARA: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  HELLOMARKET: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
};

// 기본 플랫폼 스타일
const DEFAULT_PLATFORM_STYLE = {
  bg: 'bg-gray-50',
  text: 'text-gray-700',
  border: 'border-gray-200',
};

export default function MarketComparison({ marketData }: MarketComparisonProps) {
  // 데이터가 없는 경우
  if (!marketData || marketData.length === 0) {
    return (
      <div className="card bg-gray-50">
        <div className="text-center py-4">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-gray-500">유사 매물 정보가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">시세 비교</h3>
        <span className="text-sm text-gray-500">
          {marketData.length}개 매물 참고
        </span>
      </div>

      {/* 테이블 - 데스크탑 */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-3 text-left text-sm font-medium text-gray-500">플랫폼</th>
              <th className="pb-3 text-right text-sm font-medium text-gray-500">가격</th>
              <th className="pb-3 text-center text-sm font-medium text-gray-500">상태</th>
              <th className="pb-3 text-right text-sm font-medium text-gray-500">등록일</th>
              <th className="pb-3 text-center text-sm font-medium text-gray-500">링크</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {marketData.map((item) => {
              const platformStyle = PLATFORM_STYLES[item.platform] || DEFAULT_PLATFORM_STYLE;

              return (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${platformStyle.bg} ${platformStyle.text}`}
                    >
                      {PLATFORM_LABELS[item.platform] || item.platform}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="font-semibold text-gray-900">
                      {formatPrice(item.price)}원
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="text-sm text-gray-600">
                      {item.condition || '-'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-sm text-gray-500">
                      {formatDate(item.scrapedAt)}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    {item.originalUrl ? (
                      <a
                        href={item.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-primary-600 hover:text-primary-800 transition-colors"
                        title="원본 매물 보기"
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
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 카드 형태 - 모바일 */}
      <div className="sm:hidden space-y-3">
        {marketData.map((item) => {
          const platformStyle = PLATFORM_STYLES[item.platform] || DEFAULT_PLATFORM_STYLE;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-lg border ${platformStyle.border} ${platformStyle.bg}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${platformStyle.text}`}
                >
                  {PLATFORM_LABELS[item.platform] || item.platform}
                </span>
                {item.originalUrl && (
                  <a
                    href={item.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-800"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(item.price)}원
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(item.scrapedAt)}
                </span>
              </div>
              {item.condition && (
                <p className="mt-1 text-sm text-gray-600">상태: {item.condition}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* 안내 문구 */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <svg
            className="w-4 h-4 flex-shrink-0"
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
          추천 가격은 위 시세 데이터를 기반으로 산출되었습니다. 링크를 클릭하면 원본 매물을 확인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
