'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import type { CompareItem } from '@/lib/stores/compareStore';
import { formatPriceShort, formatPrice } from '@/lib/chartUtils';

interface CompareChartProps {
  items: CompareItem[];
}

// 색상 팔레트
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function CompareChart({ items }: CompareChartProps) {
  if (items.length === 0) return null;

  // 차트 데이터 생성
  const chartData = items.map((item, index) => {
    const displayName = item.productName.length > 15
      ? item.productName.substring(0, 15) + '...'
      : item.productName;

    return {
      name: displayName,
      fullName: item.productName,
      modelName: item.modelName,
      recommendedPrice: item.recommendedPrice,
      priceMin: item.priceMin,
      priceMax: item.priceMax,
      priceRange: item.priceMax - item.priceMin,
      color: COLORS[index % COLORS.length],
    };
  });

  // 평균 가격 계산
  const avgPrice = Math.round(
    items.reduce((sum, item) => sum + item.recommendedPrice, 0) / items.length
  );

  return (
    <div className="space-y-6">
      {/* 추천가 비교 차트 */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">추천가 비교</h4>
        <div className="h-64" role="img" aria-label="추천가 비교 차트">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                className="fill-gray-500 dark:fill-gray-400"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatPriceShort(value)}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                className="fill-gray-500 dark:fill-gray-400"
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {data.fullName}
                        </p>
                        {data.modelName && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{data.modelName}</p>
                        )}
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-primary-600 dark:text-primary-400 font-semibold">
                            추천가: {formatPrice(data.recommendedPrice)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            시세: {formatPrice(data.priceMin)} ~ {formatPrice(data.priceMax)}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                x={avgPrice}
                stroke="#9ca3af"
                strokeDasharray="5 5"
                label={{
                  value: `평균 ${formatPriceShort(avgPrice)}`,
                  position: 'top',
                  fontSize: 10,
                  fill: '#6b7280',
                }}
              />
              <Bar dataKey="recommendedPrice" radius={[0, 4, 4, 0]} maxBarSize={40}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 시세 범위 비교 */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">시세 범위 비교</h4>
        <div className="space-y-3">
          {chartData.map((item, index) => {
            const totalRange = Math.max(...items.map((i) => i.priceMax)) - Math.min(...items.map((i) => i.priceMin));
            const minOffset = (item.priceMin - Math.min(...items.map((i) => i.priceMin))) / totalRange * 100;
            const rangeWidth = (item.priceRange / totalRange) * 100;
            const recommendedOffset = (item.recommendedPrice - Math.min(...items.map((i) => i.priceMin))) / totalRange * 100;

            return (
              <div key={index} className="flex items-center gap-3">
                <div className="w-24 text-right text-xs text-gray-600 dark:text-gray-400 truncate" title={item.fullName}>
                  {item.name}
                </div>
                <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded relative">
                  {/* 시세 범위 바 */}
                  <div
                    className="absolute h-full rounded opacity-30"
                    style={{
                      left: `${minOffset}%`,
                      width: `${Math.max(rangeWidth, 2)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                  {/* 추천가 마커 */}
                  <div
                    className="absolute top-0 h-full w-1 rounded"
                    style={{
                      left: `${recommendedOffset}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <div className="w-20 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                  {formatPriceShort(item.recommendedPrice)}
                </div>
              </div>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-600 opacity-50" />
            <span>시세 범위</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-3 rounded bg-gray-500" />
            <span>추천가</span>
          </div>
        </div>
      </div>
    </div>
  );
}
