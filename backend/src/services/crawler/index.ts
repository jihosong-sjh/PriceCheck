/**
 * 크롤러 통합 관리자
 * 번개장터, 중고나라, 헬로마켓 크롤러를 통합 관리하고 병렬 실행
 */

import bunjangCrawler, { type CrawlResult } from './bunjang.js';
import joongonaraCrawler from './joongonara.js';
import hellomarketCrawler from './hellomarket.js';
import type { Platform, Category } from '../../utils/validators.js';

// 크롤러 옵션
export interface CrawlerOptions {
  maxItemsPerPlatform?: number;  // 플랫폼별 최대 수집 항목 수 (기본: 20)
  timeout?: number;              // 타임아웃 (ms, 기본: 30000)
  platforms?: Platform[];        // 크롤링할 플랫폼 (기본: 모든 플랫폼)
}

// 기본 옵션
const DEFAULT_OPTIONS: Required<CrawlerOptions> = {
  maxItemsPerPlatform: 20,
  timeout: 30000,
  platforms: ['BUNJANG', 'JOONGONARA', 'HELLOMARKET'],
};

// 크롤링 통합 결과
export interface CrawlerResult {
  items: CrawlResult[];
  stats: {
    totalItems: number;
    itemsByPlatform: Record<Platform, number>;
    crawlDuration: number;  // ms
    errors: string[];
  };
}

// CrawlResult 타입 재수출
export type { CrawlResult };

/**
 * 카테고리별 검색 키워드 보강
 * 더 정확한 검색 결과를 위해 카테고리에 맞는 키워드 추가
 */
function enhanceSearchQuery(
  productName: string,
  modelName?: string,
  category?: Category
): { productName: string; modelName?: string } {
  let enhancedProductName = productName;

  // 카테고리별 키워드 보강
  if (category) {
    const categoryKeywords: Record<Category, string[]> = {
      SMARTPHONE: ['스마트폰', '휴대폰', '핸드폰'],
      LAPTOP: ['노트북', '랩탑'],
      TABLET: ['태블릿', '패드'],
      SMARTWATCH: ['스마트워치', '워치'],
      EARPHONE: ['이어폰', '헤드폰', '에어팟', '버즈'],
      SPEAKER: ['블루투스 스피커', '스피커', '무선스피커'],
      MONITOR: ['모니터', '게이밍모니터', '울트라와이드'],
      KEYBOARD_MOUSE: ['키보드', '마우스', '기계식키보드', '게이밍마우스'],
      TV: ['TV', '티비', '텔레비전', '스마트TV'],
    };

    // 제품명에 카테고리 키워드가 없으면 추가하지 않음 (검색 정확도를 위해)
    const keywords = categoryKeywords[category] || [];
    const hasKeyword = keywords.some(
      (kw) => productName.toLowerCase().includes(kw.toLowerCase())
    );

    // 키워드가 없고, 너무 짧은 검색어인 경우에만 보강
    if (!hasKeyword && productName.length < 5) {
      enhancedProductName = `${productName} ${keywords[0] || ''}`.trim();
    }
  }

  return { productName: enhancedProductName, modelName };
}

/**
 * 모든 플랫폼에서 병렬로 크롤링
 */
export async function crawlAllPlatforms(
  productName: string,
  modelName?: string,
  category?: Category,
  options?: CrawlerOptions
): Promise<CrawlerResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  const errors: string[] = [];

  // 검색 쿼리 보강
  const { productName: enhancedName, modelName: enhancedModel } = enhanceSearchQuery(
    productName,
    modelName,
    category
  );

  // 플랫폼별 크롤링 함수 매핑
  const crawlerMap: Record<Platform, () => Promise<CrawlResult[]>> = {
    BUNJANG: () =>
      bunjangCrawler.crawl(enhancedName, enhancedModel, {
        maxItems: opts.maxItemsPerPlatform,
        timeout: opts.timeout,
      }),
    JOONGONARA: () =>
      joongonaraCrawler.crawl(enhancedName, enhancedModel, {
        maxItems: opts.maxItemsPerPlatform,
        timeout: opts.timeout,
      }),
    HELLOMARKET: () =>
      hellomarketCrawler.crawl(enhancedName, enhancedModel, {
        maxItems: opts.maxItemsPerPlatform,
        timeout: opts.timeout,
      }),
  };

  // 선택된 플랫폼만 크롤링
  const crawlPromises = opts.platforms.map(async (platform) => {
    try {
      const crawler = crawlerMap[platform];
      if (!crawler) {
        throw new Error(`알 수 없는 플랫폼: ${platform}`);
      }
      return await crawler();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`${platform}: ${errorMessage}`);
      return [];
    }
  });

  // 병렬 실행
  const results = await Promise.all(crawlPromises);

  // 결과 병합
  const allItems = results.flat();

  // 플랫폼별 통계
  const itemsByPlatform: Record<Platform, number> = {
    BUNJANG: 0,
    JOONGONARA: 0,
    HELLOMARKET: 0,
  };

  for (const item of allItems) {
    itemsByPlatform[item.platform]++;
  }

  const crawlDuration = Date.now() - startTime;

  return {
    items: allItems,
    stats: {
      totalItems: allItems.length,
      itemsByPlatform,
      crawlDuration,
      errors,
    },
  };
}

/**
 * 특정 플랫폼에서 크롤링
 */
export async function crawlPlatform(
  platform: Platform,
  productName: string,
  modelName?: string,
  options?: Omit<CrawlerOptions, 'platforms'>
): Promise<CrawlResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  switch (platform) {
    case 'BUNJANG':
      return bunjangCrawler.crawl(productName, modelName, {
        maxItems: opts.maxItemsPerPlatform,
        timeout: opts.timeout,
      });
    case 'JOONGONARA':
      return joongonaraCrawler.crawl(productName, modelName, {
        maxItems: opts.maxItemsPerPlatform,
        timeout: opts.timeout,
      });
    case 'HELLOMARKET':
      return hellomarketCrawler.crawl(productName, modelName, {
        maxItems: opts.maxItemsPerPlatform,
        timeout: opts.timeout,
      });
    default:
      throw new Error(`지원하지 않는 플랫폼: ${platform}`);
  }
}

/**
 * 크롤링 결과 필터링
 * - 이상치 제거 (너무 높거나 낮은 가격)
 * - 키워드 매칭 검증
 */
export function filterResults(
  items: CrawlResult[],
  productName: string,
  options?: {
    minPrice?: number;
    maxPrice?: number;
    requireKeyword?: boolean;
  }
): CrawlResult[] {
  const { minPrice = 1000, maxPrice = 50000000, requireKeyword = false } = options || {};

  return items.filter((item) => {
    // 가격 범위 필터
    if (item.price < minPrice || item.price > maxPrice) {
      return false;
    }

    // 키워드 매칭 (선택적)
    if (requireKeyword) {
      const searchTerms = productName.toLowerCase().split(/\s+/);
      const itemTitle = item.productName.toLowerCase();
      const hasMatch = searchTerms.some((term) => itemTitle.includes(term));
      if (!hasMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 크롤링 결과 정렬
 */
export function sortResults(
  items: CrawlResult[],
  sortBy: 'price' | 'date' = 'date',
  order: 'asc' | 'desc' = 'desc'
): CrawlResult[] {
  return [...items].sort((a, b) => {
    let comparison: number;

    if (sortBy === 'price') {
      comparison = a.price - b.price;
    } else {
      comparison = a.scrapedAt.getTime() - b.scrapedAt.getTime();
    }

    return order === 'asc' ? comparison : -comparison;
  });
}

// 기본 내보내기
export default {
  crawlAll: crawlAllPlatforms,
  crawlPlatform,
  filterResults,
  sortResults,
};
