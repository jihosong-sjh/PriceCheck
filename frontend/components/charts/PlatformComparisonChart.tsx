'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { MarketDataItem } from '@/lib/types';
import { PLATFORM_LABELS } from '@/lib/types';
import {
  calculatePlatformStats,
  formatPrice,
  getPlatformColor,
} from '@/lib/chartUtils';

interface PlatformComparisonChartProps {
  marketData: MarketDataItem[];
}

export default function PlatformComparisonChart({
  marketData,
}: PlatformComparisonChartProps) {
  // 플랫폼별 통계 계산
  const platformStats = useMemo(() => {
    return calculatePlatformStats(marketData);
  }, [marketData]);

  // 플랫폼이 2개 미만이면 렌더링하지 않음
  if (platformStats.length < 2) {
    return null;
  }

  // 차트 데이터 포맷
  const chartData = platformStats.map((stat) => ({
    name: PLATFORM_LABELS[stat.platform] || stat.platform,
    platform: stat.platform,
    avgPrice: stat.avgPrice,
    count: stat.count,
    minPrice: stat.minPrice,
    maxPrice: stat.maxPrice,
  }));

  // 최고가 플랫폼과 최저가 플랫폼 비교
  const highest = platformStats[0];
  const lowest = platformStats[platformStats.length - 1];
  const priceDiff = highest.avgPrice - lowest.avgPrice;
  const priceDiffPercent =
    lowest.avgPrice > 0 ? Math.round((priceDiff / lowest.avgPrice) * 100) : 0;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">플랫폼별 평균 가격</h3>

      {/* 차트 */}
      <div className="h-40 sm:h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              className="fill-gray-500 dark:fill-gray-400"
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${Math.round(value / 10000)}만`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fontWeight: 500 }}
              className="fill-gray-700 dark:fill-gray-300"
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">{data.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        평균: <span className="font-medium">{formatPrice(data.avgPrice)}</span>
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {data.count}개 매물 (
                        {formatPrice(data.minPrice)} ~ {formatPrice(data.maxPrice)})
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="avgPrice" radius={[0, 4, 4, 0]} maxBarSize={40}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getPlatformColor(entry.platform)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 가격 라벨 */}
      <div className="mt-3 space-y-2">
        {chartData.map((data) => (
          <div
            key={data.platform}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: getPlatformColor(data.platform) }}
              />
              <span className="text-gray-600 dark:text-gray-300">{data.name}</span>
              <span className="text-gray-400 dark:text-gray-500 text-xs">({data.count}개)</span>
            </div>
            <span className="font-medium text-gray-900 dark:text-white">{formatPrice(data.avgPrice)}</span>
          </div>
        ))}
      </div>

      {/* 비교 정보 */}
      {priceDiff > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
            <svg
              className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <span>
              <span className="font-medium">{PLATFORM_LABELS[highest.platform]}</span>이{' '}
              <span className="font-medium">{PLATFORM_LABELS[lowest.platform]}</span>보다 평균{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">{priceDiffPercent}%</span> 높습니다.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
