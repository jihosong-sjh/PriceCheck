/**
 * 가격 계산 서비스
 * 시세 분석 및 추천 가격 계산 로직
 */

import type { CrawlResult } from './crawler/index.js';
import type { Condition, Category } from '../utils/validators.js';

// 가격 계산 결과
export interface PriceCalculationResult {
  recommendedPrice: number;    // 추천 가격
  priceMin: number;            // 최저 가격
  priceMax: number;            // 최고 가격
  averagePrice: number;        // 평균 가격
  medianPrice: number;         // 중앙값
  priceRange: number;          // 가격 범위 (max - min)
  sampleCount: number;         // 분석에 사용된 샘플 수
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';  // 신뢰도
  adjustments: PriceAdjustment[];  // 적용된 조정 내역
}

// 가격 조정 내역
export interface PriceAdjustment {
  type: string;
  description: string;
  percentage: number;
  amount: number;
}

// 상태별 가격 조정 비율
const CONDITION_ADJUSTMENTS: Record<Condition, number> = {
  GOOD: 0,       // 상태 '상' - 기준가격
  FAIR: -10,     // 상태 '중' - 10% 할인
  POOR: -20,     // 상태 '하' - 20% 할인
};

// 카테고리별 가격 범위 필터 (이상치 제거용)
const CATEGORY_PRICE_RANGES: Record<Category, { min: number; max: number }> = {
  SMARTPHONE: { min: 50000, max: 2000000 },
  LAPTOP: { min: 100000, max: 5000000 },
  TABLET: { min: 50000, max: 2000000 },
  SMARTWATCH: { min: 30000, max: 1000000 },
  EARPHONE: { min: 10000, max: 500000 },
  SPEAKER: { min: 20000, max: 1000000 },   // 블루투스 스피커
  MONITOR: { min: 50000, max: 3000000 },   // 모니터
  KEYBOARD_MOUSE: { min: 10000, max: 500000 },  // 키보드/마우스
  TV: { min: 100000, max: 10000000 },      // TV
};

// 기본 가격 범위 (카테고리 미지정 시)
const DEFAULT_PRICE_RANGE = { min: 10000, max: 5000000 };

/**
 * 통계 계산 유틸리티
 */
function calculateStats(prices: number[]): {
  average: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
} {
  if (prices.length === 0) {
    return { average: 0, median: 0, min: 0, max: 0, stdDev: 0 };
  }

  const sorted = [...prices].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, p) => acc + p, 0);
  const average = sum / sorted.length;

  // 중앙값 계산
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  // 표준편차 계산
  const squaredDiffs = sorted.map((p) => Math.pow(p - average, 2));
  const avgSquaredDiff = squaredDiffs.reduce((acc, d) => acc + d, 0) / sorted.length;
  const stdDev = Math.sqrt(avgSquaredDiff);

  return {
    average: Math.round(average),
    median: Math.round(median),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stdDev: Math.round(stdDev),
  };
}

/**
 * 이상치 제거 (IQR 방식)
 */
function removeOutliers(prices: number[]): number[] {
  if (prices.length < 4) {
    return prices;
  }

  const sorted = [...prices].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);

  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return sorted.filter((p) => p >= lowerBound && p <= upperBound);
}

/**
 * 카테고리 기반 가격 필터링
 */
function filterByCategory(
  prices: number[],
  category?: Category
): number[] {
  const range = category ? CATEGORY_PRICE_RANGES[category] : DEFAULT_PRICE_RANGE;
  return prices.filter((p) => p >= range.min && p <= range.max);
}

/**
 * 신뢰도 계산
 */
function calculateConfidence(
  sampleCount: number,
  stdDev: number,
  average: number
): 'HIGH' | 'MEDIUM' | 'LOW' {
  // 샘플 수 기반 평가
  if (sampleCount < 3) {
    return 'LOW';
  }

  // 변동 계수(CV) 계산: 표준편차 / 평균
  const cv = average > 0 ? stdDev / average : 1;

  if (sampleCount >= 10 && cv < 0.2) {
    return 'HIGH';
  }

  if (sampleCount >= 5 && cv < 0.3) {
    return 'MEDIUM';
  }

  return 'LOW';
}

/**
 * 상태에 따른 가격 조정
 */
function adjustForCondition(
  price: number,
  condition: Condition
): { adjustedPrice: number; adjustment: PriceAdjustment } {
  const percentage = CONDITION_ADJUSTMENTS[condition];
  const amount = Math.round(price * (percentage / 100));
  const adjustedPrice = price + amount;

  const conditionLabels: Record<Condition, string> = {
    GOOD: '상',
    FAIR: '중',
    POOR: '하',
  };

  return {
    adjustedPrice,
    adjustment: {
      type: 'CONDITION',
      description: `상태 '${conditionLabels[condition]}' 조정`,
      percentage,
      amount,
    },
  };
}

/**
 * 가격 반올림 (천원 단위)
 */
function roundToThousand(price: number): number {
  return Math.round(price / 1000) * 1000;
}

/**
 * 시세 데이터에서 추천 가격 계산
 */
export function calculatePrice(
  crawlResults: CrawlResult[],
  condition: Condition,
  category?: Category
): PriceCalculationResult {
  const adjustments: PriceAdjustment[] = [];

  // 1. 가격 추출
  let prices = crawlResults
    .map((item) => item.price)
    .filter((p) => p > 0);

  // 2. 카테고리 기반 필터링
  if (category) {
    const beforeCount = prices.length;
    prices = filterByCategory(prices, category);
    if (beforeCount > prices.length) {
      adjustments.push({
        type: 'CATEGORY_FILTER',
        description: `카테고리 범위 외 ${beforeCount - prices.length}개 제외`,
        percentage: 0,
        amount: 0,
      });
    }
  }

  // 3. 이상치 제거
  const beforeOutlierCount = prices.length;
  prices = removeOutliers(prices);
  if (beforeOutlierCount > prices.length) {
    adjustments.push({
      type: 'OUTLIER_REMOVAL',
      description: `이상치 ${beforeOutlierCount - prices.length}개 제외`,
      percentage: 0,
      amount: 0,
    });
  }

  // 4. 통계 계산
  const stats = calculateStats(prices);

  // 데이터가 없는 경우
  if (prices.length === 0) {
    return {
      recommendedPrice: 0,
      priceMin: 0,
      priceMax: 0,
      averagePrice: 0,
      medianPrice: 0,
      priceRange: 0,
      sampleCount: 0,
      confidence: 'LOW',
      adjustments,
    };
  }

  // 5. 기본 추천 가격 (중앙값 사용)
  let recommendedPrice = stats.median;

  // 6. 상태에 따른 조정
  const { adjustedPrice, adjustment } = adjustForCondition(recommendedPrice, condition);
  recommendedPrice = adjustedPrice;
  adjustments.push(adjustment);

  // 7. 가격 범위 계산 (조정된 가격 기준)
  const conditionPercentage = CONDITION_ADJUSTMENTS[condition];
  const adjustedMin = Math.round(stats.min * (1 + conditionPercentage / 100));
  const adjustedMax = Math.round(stats.max * (1 + conditionPercentage / 100));

  // 8. 천원 단위 반올림
  recommendedPrice = roundToThousand(recommendedPrice);
  const priceMin = roundToThousand(adjustedMin);
  const priceMax = roundToThousand(adjustedMax);

  // 9. 신뢰도 계산
  const confidence = calculateConfidence(prices.length, stats.stdDev, stats.average);

  return {
    recommendedPrice,
    priceMin,
    priceMax,
    averagePrice: roundToThousand(stats.average),
    medianPrice: roundToThousand(stats.median),
    priceRange: priceMax - priceMin,
    sampleCount: prices.length,
    confidence,
    adjustments,
  };
}

/**
 * 시세 스냅샷 생성 (저장용)
 */
export function createMarketSnapshot(
  crawlResults: CrawlResult[],
  maxItems: number = 10
): Array<{
  price: number;
  platform: string;
  condition?: string;
  originalUrl?: string;
  scrapedAt: string;
}> {
  // 가격순 정렬 후 상위 N개 선택
  const sorted = [...crawlResults]
    .filter((item) => item.price > 0)
    .sort((a, b) => a.price - b.price);

  // 다양한 가격대를 포함하도록 샘플링
  const selected: CrawlResult[] = [];

  if (sorted.length <= maxItems) {
    selected.push(...sorted);
  } else {
    // 최저가, 최고가, 중간가를 포함하는 샘플링
    selected.push(sorted[0]); // 최저가
    selected.push(sorted[sorted.length - 1]); // 최고가

    // 나머지 균등 분포
    const step = Math.floor(sorted.length / (maxItems - 2));
    for (let i = step; i < sorted.length - 1 && selected.length < maxItems; i += step) {
      selected.push(sorted[i]);
    }
  }

  return selected.map((item) => ({
    price: item.price,
    platform: item.platform,
    condition: item.condition,
    originalUrl: item.originalUrl,
    scrapedAt: item.scrapedAt.toISOString(),
  }));
}

/**
 * 가격 추천 서비스 메인 함수
 */
export async function getRecommendedPrice(
  crawlResults: CrawlResult[],
  condition: Condition,
  category?: Category
): Promise<{
  calculation: PriceCalculationResult;
  marketDataSnapshot: ReturnType<typeof createMarketSnapshot>;
}> {
  const calculation = calculatePrice(crawlResults, condition, category);
  const marketDataSnapshot = createMarketSnapshot(crawlResults);

  return {
    calculation,
    marketDataSnapshot,
  };
}

export default {
  calculatePrice,
  createMarketSnapshot,
  getRecommendedPrice,
};
