/**
 * 차트 관련 유틸리티 함수
 */

import type { MarketDataItem, Platform } from './types';

// 가격 구간 (버킷)
export interface PriceBucket {
  range: string;
  min: number;
  max: number;
  count: number;
  midPoint: number;
}

// 플랫폼별 통계
export interface PlatformStats {
  platform: Platform;
  count: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
}

// 신뢰도 레벨
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

// 신뢰도 정보
export interface ConfidenceInfo {
  level: ConfidenceLevel;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  percentage: number;
}

/**
 * 가격 분포 버킷 계산
 */
export function calculatePriceBuckets(
  marketData: MarketDataItem[],
  bucketCount: number = 5
): PriceBucket[] {
  if (marketData.length === 0) return [];

  const prices = marketData.map((item) => item.price).sort((a, b) => a - b);
  const minPrice = prices[0];
  const maxPrice = prices[prices.length - 1];

  // 가격 범위가 너무 좁으면 단일 버킷
  if (maxPrice - minPrice < bucketCount) {
    return [
      {
        range: `${formatPriceShort(minPrice)}~${formatPriceShort(maxPrice)}`,
        min: minPrice,
        max: maxPrice,
        count: prices.length,
        midPoint: (minPrice + maxPrice) / 2,
      },
    ];
  }

  const bucketSize = (maxPrice - minPrice) / bucketCount;
  const buckets: PriceBucket[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucketMin = minPrice + i * bucketSize;
    const bucketMax = i === bucketCount - 1 ? maxPrice + 1 : minPrice + (i + 1) * bucketSize;

    const count = prices.filter((p) => p >= bucketMin && p < bucketMax).length;

    buckets.push({
      range: `${formatPriceShort(bucketMin)}~${formatPriceShort(bucketMax)}`,
      min: bucketMin,
      max: bucketMax,
      count,
      midPoint: (bucketMin + bucketMax) / 2,
    });
  }

  return buckets;
}

/**
 * 플랫폼별 통계 계산
 */
export function calculatePlatformStats(marketData: MarketDataItem[]): PlatformStats[] {
  const platformMap = new Map<Platform, number[]>();

  for (const item of marketData) {
    const prices = platformMap.get(item.platform) || [];
    prices.push(item.price);
    platformMap.set(item.platform, prices);
  }

  const stats: PlatformStats[] = [];

  platformMap.forEach((prices, platform) => {
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = sum / prices.length;
    const sorted = [...prices].sort((a, b) => a - b);

    stats.push({
      platform,
      count: prices.length,
      avgPrice: Math.round(avg),
      minPrice: sorted[0],
      maxPrice: sorted[sorted.length - 1],
    });
  });

  // 평균 가격 기준 정렬
  return stats.sort((a, b) => b.avgPrice - a.avgPrice);
}

/**
 * 신뢰도 정보 계산
 */
export function getConfidenceInfo(
  sampleCount: number,
  coefficientOfVariation?: number
): ConfidenceInfo {
  // CV가 없으면 샘플 수만으로 판단
  const cv = coefficientOfVariation ?? 0.25;

  let level: ConfidenceLevel;
  let label: string;
  let description: string;
  let color: string;
  let bgColor: string;
  let percentage: number;

  if (sampleCount >= 10 && cv < 0.2) {
    level = 'HIGH';
    label = '높음';
    description = '충분한 데이터로 신뢰할 수 있는 시세입니다.';
    color = 'text-green-700';
    bgColor = 'bg-green-500';
    percentage = 100;
  } else if (sampleCount >= 5 && cv < 0.3) {
    level = 'MEDIUM';
    label = '보통';
    description = '적정 수준의 데이터입니다. 참고용으로 활용하세요.';
    color = 'text-amber-700';
    bgColor = 'bg-amber-500';
    percentage = 66;
  } else {
    level = 'LOW';
    label = '낮음';
    description = '데이터가 부족합니다. 추가 검색을 권장합니다.';
    color = 'text-red-700';
    bgColor = 'bg-red-500';
    percentage = 33;
  }

  return { level, label, description, color, bgColor, percentage };
}

/**
 * 가격 포맷 (짧은 형태)
 * 예: 450000 -> "45만"
 */
export function formatPriceShort(price: number): string {
  if (price >= 10000) {
    const man = price / 10000;
    if (man >= 100) {
      return `${Math.round(man)}만`;
    }
    return `${Math.round(man * 10) / 10}만`;
  }
  return `${price.toLocaleString()}`;
}

/**
 * 가격 포맷 (전체 형태)
 * 예: 450000 -> "450,000원"
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

/**
 * 변동계수 계산 (표준편차 / 평균)
 */
export function calculateCV(prices: number[]): number {
  if (prices.length < 2) return 0;

  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  if (avg === 0) return 0;

  const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  return stdDev / avg;
}

/**
 * 플랫폼 색상 가져오기
 */
export function getPlatformColor(platform: Platform): string {
  const colors: Record<Platform, string> = {
    BUNJANG: '#f97316', // orange-500
    JOONGONARA: '#22c55e', // green-500
    HELLOMARKET: '#3b82f6', // blue-500
    NAVER_SHOPPING: '#03c75a', // naver green
  };
  return colors[platform] || '#6b7280';
}

/**
 * 플랫폼 배경색 가져오기
 */
export function getPlatformBgColor(platform: Platform): string {
  const colors: Record<Platform, string> = {
    BUNJANG: '#fff7ed', // orange-50
    JOONGONARA: '#f0fdf4', // green-50
    HELLOMARKET: '#eff6ff', // blue-50
    NAVER_SHOPPING: '#e8f8ee', // naver green light
  };
  return colors[platform] || '#f9fafb';
}
