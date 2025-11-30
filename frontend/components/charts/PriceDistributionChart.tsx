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
  ReferenceLine,
} from 'recharts';
import type { MarketDataItem } from '@/lib/types';
import { calculatePriceBuckets, formatPriceShort, formatPrice } from '@/lib/chartUtils';

interface PriceDistributionChartProps {
  marketData: MarketDataItem[];
  recommendedPrice: number;
  priceMin?: number;
  priceMax?: number;
}

export default function PriceDistributionChart({
  marketData,
  recommendedPrice,
  priceMin,
  priceMax,
}: PriceDistributionChartProps) {
  // 가격 분포 계산
  const buckets = useMemo(() => {
    return calculatePriceBuckets(marketData, 5);
  }, [marketData]);

  // 데이터가 없으면 렌더링하지 않음
  if (buckets.length === 0) {
    return null;
  }

  // 차트 데이터 포맷
  const chartData = buckets.map((bucket) => ({
    name: formatPriceShort(bucket.midPoint),
    range: bucket.range,
    count: bucket.count,
    midPoint: bucket.midPoint,
  }));

  // 추천가가 어느 버킷에 속하는지 확인
  const recommendedBucket = buckets.find(
    (b) => recommendedPrice >= b.min && recommendedPrice < b.max
  );

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">가격 분포</h3>

      {/* 차트 */}
      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              className="fill-gray-500 dark:fill-gray-400"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-gray-500 dark:fill-gray-400"
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{data.range}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {data.count}개 매물
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="count"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            />
            {/* 추천가 위치 표시 */}
            {recommendedBucket && (
              <ReferenceLine
                x={formatPriceShort(recommendedBucket.midPoint)}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-gray-600 dark:text-gray-300">매물 수</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-red-500" style={{ borderTop: '2px dashed #ef4444' }} />
            <span className="text-gray-600 dark:text-gray-300">추천가</span>
          </div>
        </div>
        <div className="text-gray-500 dark:text-gray-400">
          추천가: <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(recommendedPrice)}</span>
        </div>
      </div>

      {/* 가격 범위 */}
      {priceMin !== undefined && priceMax !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">예상 거래 범위</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {formatPrice(priceMin)} ~ {formatPrice(priceMax)}
          </span>
        </div>
      )}
    </div>
  );
}
