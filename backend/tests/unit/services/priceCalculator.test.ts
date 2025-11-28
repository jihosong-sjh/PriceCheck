/**
 * 가격 계산 서비스 단위 테스트
 */

import {
  calculatePrice,
  createMarketSnapshot,
  getRecommendedPrice,
} from '../../../src/services/priceCalculator';
import type { CrawlResult } from '../../../src/services/crawler';

// 테스트용 크롤링 결과 생성 헬퍼
function createMockCrawlResults(prices: number[]): CrawlResult[] {
  return prices.map((price, index) => ({
    productName: `테스트 제품 ${index + 1}`,
    modelName: '128GB',
    platform: index % 2 === 0 ? 'BUNJANG' : 'JOONGONARA' as const,
    price,
    condition: undefined,
    originalUrl: `https://example.com/product/${index}`,
    scrapedAt: new Date(),
    metadata: {},
  }));
}

describe('priceCalculator', () => {
  describe('calculatePrice', () => {
    it('빈 배열이 주어지면 0을 반환해야 함', () => {
      const result = calculatePrice([], 'GOOD');

      expect(result.recommendedPrice).toBe(0);
      expect(result.sampleCount).toBe(0);
      expect(result.confidence).toBe('LOW');
    });

    it('단일 가격이 주어지면 해당 가격을 반환해야 함', () => {
      const crawlResults = createMockCrawlResults([100000]);
      const result = calculatePrice(crawlResults, 'GOOD');

      expect(result.recommendedPrice).toBe(100000);
      expect(result.sampleCount).toBe(1);
    });

    it('여러 가격의 중앙값을 계산해야 함', () => {
      // 중앙값: 150000
      const crawlResults = createMockCrawlResults([100000, 150000, 200000]);
      const result = calculatePrice(crawlResults, 'GOOD');

      expect(result.recommendedPrice).toBe(150000);
      expect(result.priceMin).toBe(100000);
      expect(result.priceMax).toBe(200000);
    });

    it('상태 "중"에 대해 10% 할인을 적용해야 함', () => {
      const crawlResults = createMockCrawlResults([100000]);
      const result = calculatePrice(crawlResults, 'FAIR');

      expect(result.recommendedPrice).toBe(90000);
    });

    it('상태 "하"에 대해 20% 할인을 적용해야 함', () => {
      const crawlResults = createMockCrawlResults([100000]);
      const result = calculatePrice(crawlResults, 'POOR');

      expect(result.recommendedPrice).toBe(80000);
    });

    it('이상치를 제거해야 함', () => {
      // 이상치: 1000000 (너무 높음)
      const crawlResults = createMockCrawlResults([
        100000, 110000, 120000, 130000, 140000, 1000000,
      ]);
      const result = calculatePrice(crawlResults, 'GOOD');

      // 이상치 제거 후 중앙값 계산
      expect(result.sampleCount).toBeLessThan(6);
    });

    it('카테고리 범위를 벗어난 가격을 필터링해야 함', () => {
      // 스마트폰 범위: 50000 ~ 2000000
      const crawlResults = createMockCrawlResults([
        10000,  // 범위 외 (너무 낮음)
        100000, // 범위 내
        150000, // 범위 내
        200000, // 범위 내
        3000000, // 범위 외 (너무 높음)
      ]);
      const result = calculatePrice(crawlResults, 'GOOD', 'SMARTPHONE');

      expect(result.sampleCount).toBeLessThanOrEqual(3);
    });

    it('신뢰도를 계산해야 함', () => {
      // 샘플이 많고 변동성이 낮으면 HIGH
      const consistentPrices = createMockCrawlResults([
        100000, 101000, 102000, 103000, 104000,
        105000, 106000, 107000, 108000, 109000,
      ]);
      const result = calculatePrice(consistentPrices, 'GOOD');

      expect(result.confidence).toBe('HIGH');
    });

    it('가격을 천원 단위로 반올림해야 함', () => {
      const crawlResults = createMockCrawlResults([123456]);
      const result = calculatePrice(crawlResults, 'GOOD');

      expect(result.recommendedPrice % 1000).toBe(0);
    });
  });

  describe('createMarketSnapshot', () => {
    it('최대 항목 수만큼 스냅샷을 생성해야 함', () => {
      const crawlResults = createMockCrawlResults([
        100000, 110000, 120000, 130000, 140000,
        150000, 160000, 170000, 180000, 190000,
        200000, 210000, 220000, 230000, 240000,
      ]);

      const snapshot = createMarketSnapshot(crawlResults, 5);

      expect(snapshot.length).toBeLessThanOrEqual(5);
    });

    it('최저가와 최고가를 포함해야 함', () => {
      const crawlResults = createMockCrawlResults([100000, 200000, 300000]);

      const snapshot = createMarketSnapshot(crawlResults, 10);
      const prices = snapshot.map((s) => s.price);

      expect(prices).toContain(100000);
      expect(prices).toContain(300000);
    });

    it('플랫폼 정보를 포함해야 함', () => {
      const crawlResults = createMockCrawlResults([100000]);

      const snapshot = createMarketSnapshot(crawlResults, 10);

      expect(snapshot[0].platform).toBeDefined();
      expect(['BUNJANG', 'JOONGONARA']).toContain(snapshot[0].platform);
    });
  });

  describe('getRecommendedPrice', () => {
    it('계산 결과와 스냅샷을 모두 반환해야 함', async () => {
      const crawlResults = createMockCrawlResults([100000, 150000, 200000]);

      const result = await getRecommendedPrice(crawlResults, 'GOOD', 'SMARTPHONE');

      expect(result.calculation).toBeDefined();
      expect(result.marketDataSnapshot).toBeDefined();
      expect(result.calculation.recommendedPrice).toBeGreaterThan(0);
    });
  });
});
