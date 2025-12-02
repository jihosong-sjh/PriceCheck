'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCompareStore, useCompareItems } from '@/lib/stores/compareStore';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/lib/types';

// 차트 컴포넌트 동적 로딩
const CompareChart = dynamic(() => import('@/components/charts/CompareChart'), { ssr: false });

// 가격 포맷 함수
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price);
}

export default function ComparePage() {
  const items = useCompareItems();
  const { removeItem, clearAll } = useCompareStore();

  // 빈 상태
  if (items.length === 0) {
    return (
      <div className="container-wide py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">상품 비교</h1>
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">비교할 상품이 없습니다</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            가격 조회 결과에서 비교 버튼을 눌러 상품을 추가해 보세요.
          </p>
          <Link href="/price-guide" className="btn-primary no-underline">
            가격 조회하기
          </Link>
        </div>
      </div>
    );
  }

  // 최저가 상품 찾기
  const lowestPriceItem = items.reduce((min, item) =>
    item.recommendedPrice < min.recommendedPrice ? item : min
  );

  // 최고가 상품 찾기
  const highestPriceItem = items.reduce((max, item) =>
    item.recommendedPrice > max.recommendedPrice ? item : max
  );

  return (
    <div className="container-wide py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">상품 비교</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {items.length}개 상품을 비교하고 있습니다 (최대 4개)
          </p>
        </div>
        <button
          type="button"
          onClick={clearAll}
          className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
        >
          전체 삭제
        </button>
      </div>

      {/* 비교 요약 카드 */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">가격 차이</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPrice(highestPriceItem.recommendedPrice - lowestPriceItem.recommendedPrice)}원
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">최저가 상품</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400 truncate">
              {lowestPriceItem.productName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {formatPrice(lowestPriceItem.recommendedPrice)}원
            </p>
          </div>
          <div className="hidden md:block">
            <p className="text-sm text-gray-500 dark:text-gray-400">최고가 상품</p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400 truncate">
              {highestPriceItem.productName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {formatPrice(highestPriceItem.recommendedPrice)}원
            </p>
          </div>
        </div>
      </div>

      {/* 비교 차트 */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">가격 비교 차트</h3>
        <CompareChart items={items} />
      </div>

      {/* 상품 비교 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                항목
              </th>
              {items.map((item) => (
                <th key={item.id} className="text-center py-3 px-4 min-w-[150px]">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/50 text-gray-400 hover:text-red-500"
                      aria-label={`${item.productName} 제거`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white pr-4 truncate">
                      {item.productName}
                    </p>
                    {item.modelName && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.modelName}</p>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 카테고리 */}
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">카테고리</td>
              {items.map((item) => (
                <td key={item.id} className="py-3 px-4 text-center">
                  <span className="inline-block px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded">
                    {CATEGORY_LABELS[item.category]}
                  </span>
                </td>
              ))}
            </tr>

            {/* 상태 */}
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">상태</td>
              {items.map((item) => (
                <td key={item.id} className="py-3 px-4 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                      item.condition === 'GOOD'
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                        : item.condition === 'FAIR'
                          ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
                          : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {CONDITION_LABELS[item.condition]}
                  </span>
                </td>
              ))}
            </tr>

            {/* 추천가 */}
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">추천가</td>
              {items.map((item) => (
                <td key={item.id} className="py-3 px-4 text-center">
                  <span
                    className={`text-lg font-bold ${
                      item.id === lowestPriceItem.id
                        ? 'text-green-600 dark:text-green-400'
                        : item.id === highestPriceItem.id
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {formatPrice(item.recommendedPrice)}원
                  </span>
                  {item.id === lowestPriceItem.id && items.length > 1 && (
                    <span className="block text-xs text-green-600 dark:text-green-400 mt-0.5">
                      최저가
                    </span>
                  )}
                </td>
              ))}
            </tr>

            {/* 최저 시세 */}
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">최저 시세</td>
              {items.map((item) => (
                <td key={item.id} className="py-3 px-4 text-center text-sm text-gray-700 dark:text-gray-300">
                  {formatPrice(item.priceMin)}원
                </td>
              ))}
            </tr>

            {/* 최고 시세 */}
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">최고 시세</td>
              {items.map((item) => (
                <td key={item.id} className="py-3 px-4 text-center text-sm text-gray-700 dark:text-gray-300">
                  {formatPrice(item.priceMax)}원
                </td>
              ))}
            </tr>

            {/* 시세 범위 */}
            <tr>
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">시세 범위</td>
              {items.map((item) => (
                <td key={item.id} className="py-3 px-4 text-center text-sm text-gray-700 dark:text-gray-300">
                  {formatPrice(item.priceMax - item.priceMin)}원
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* 추가 검색 안내 */}
      {items.length < 4 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {4 - items.length}개 상품을 더 추가할 수 있습니다
          </p>
          <Link href="/price-guide" className="btn-outline no-underline">
            다른 상품 조회하기
          </Link>
        </div>
      )}
    </div>
  );
}
