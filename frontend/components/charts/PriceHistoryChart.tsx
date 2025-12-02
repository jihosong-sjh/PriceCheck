'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
} from 'recharts';
import { getPriceHistory, ApiException } from '@/lib/api';
import type { PriceHistoryResponse } from '@/lib/types';
import { formatPrice, formatPriceShort, getPlatformColor } from '@/lib/chartUtils';
import { PLATFORM_LABELS, type Platform } from '@/lib/types';

interface PriceHistoryChartProps {
  productName: string;
  initialDays?: number;
  showPlatforms?: boolean;
}

export default function PriceHistoryChart({
  productName,
  initialDays = 30,
  showPlatforms = true,
}: PriceHistoryChartProps) {
  const [historyData, setHistoryData] = useState<PriceHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(initialDays);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getPriceHistory(productName, days);
        setHistoryData(data);
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
        } else {
          setError('가격 히스토리를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [productName, days]);

  // 차트 데이터 포맷
  const chartData = useMemo(() => {
    if (!historyData?.history.length) return [];

    return historyData.history.map((point) => {
      const formattedDate = new Date(point.date).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      });

      const platformData: Record<string, number> = {};
      Object.entries(point.platforms).forEach(([platform, data]) => {
        platformData[platform] = data.avgPrice;
      });

      return {
        date: formattedDate,
        fullDate: point.date,
        avgPrice: point.avgPrice,
        minPrice: point.minPrice,
        maxPrice: point.maxPrice,
        count: point.count,
        ...platformData,
      };
    });
  }, [historyData]);

  // 플랫폼 목록 추출
  const platforms = useMemo(() => {
    if (!historyData?.history.length) return [];

    const platformSet = new Set<string>();
    historyData.history.forEach((point) => {
      Object.keys(point.platforms).forEach((p) => platformSet.add(p));
    });
    return Array.from(platformSet);
  }, [historyData]);

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">가격 추이</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">가격 추이</h3>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!historyData || historyData.history.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">가격 추이</h3>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p>가격 히스토리 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  const { summary } = historyData;
  const priceChangeColor = summary.priceChange >= 0 ? 'text-red-600' : 'text-blue-600';
  const priceChangeIcon = summary.priceChange >= 0 ? '▲' : '▼';

  return (
    <div className="card">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">가격 추이</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {historyData.period.startDate} ~ {historyData.period.endDate}
          </p>
        </div>

        {/* 기간 선택 */}
        <div className="flex gap-2" role="group" aria-label="조회 기간 선택">
          {[7, 14, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                days === d
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              aria-pressed={days === d}
            >
              {d}일
            </button>
          ))}
        </div>
      </div>

      {/* 요약 정보 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">평균가</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatPrice(summary.overallAvgPrice)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">최저가</p>
          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
            {formatPrice(summary.overallMinPrice)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">최고가</p>
          <p className="text-lg font-semibold text-red-600 dark:text-red-400">
            {formatPrice(summary.overallMaxPrice)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">가격 변동</p>
          <p className={`text-lg font-semibold ${priceChangeColor}`}>
            {priceChangeIcon} {Math.abs(summary.priceChangePercent)}%
          </p>
        </div>
      </div>

      {/* 차트 */}
      <div className="h-64 sm:h-80" role="img" aria-label="가격 추이 차트">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              className="fill-gray-500 dark:fill-gray-400"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              className="fill-gray-500 dark:fill-gray-400"
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => formatPriceShort(value)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{data.fullDate}</p>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          평균: <span className="font-semibold">{formatPrice(data.avgPrice)}</span>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          범위: {formatPrice(data.minPrice)} ~ {formatPrice(data.maxPrice)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          매물 수: {data.count}개
                        </p>
                      </div>
                      {showPlatforms && platforms.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 space-y-1">
                          {platforms.map((platform) => (
                            data[platform] && (
                              <p key={platform} className="text-sm" style={{ color: getPlatformColor(platform as Platform) }}>
                                {PLATFORM_LABELS[platform as Platform] || platform}: {formatPrice(data[platform])}
                              </p>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* 가격 범위 영역 */}
            <Area
              type="monotone"
              dataKey="maxPrice"
              stroke="none"
              fill="#3b82f6"
              fillOpacity={0.1}
            />
            <Area
              type="monotone"
              dataKey="minPrice"
              stroke="none"
              fill="#ffffff"
              fillOpacity={1}
            />

            {/* 평균 가격 라인 */}
            <Line
              type="monotone"
              dataKey="avgPrice"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="평균가"
            />

            {/* 플랫폼별 라인 */}
            {showPlatforms && platforms.map((platform) => (
              <Line
                key={platform}
                type="monotone"
                dataKey={platform}
                stroke={getPlatformColor(platform as Platform)}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                name={PLATFORM_LABELS[platform as Platform] || platform}
              />
            ))}

            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => <span className="text-sm text-gray-600 dark:text-gray-300">{value}</span>}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 데이터 포인트 정보 */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-right">
        총 {summary.totalDataPoints}개 매물 데이터 기반
      </p>
    </div>
  );
}
