/**
 * 헬로마켓 크롤러
 * Axios + Cheerio를 사용한 정적 페이지 크롤링
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Platform } from '../../utils/validators.js';

// 크롤링 결과 인터페이스
export interface CrawlResult {
  productName: string;
  modelName?: string;
  platform: Platform;
  price: number;
  condition?: string;
  originalUrl?: string;
  scrapedAt: Date;
  metadata?: Record<string, unknown>;
}

// 헬로마켓 크롤러 옵션
export interface HellomarketCrawlerOptions {
  maxItems?: number;       // 최대 수집 항목 수 (기본: 20)
  timeout?: number;        // 타임아웃 (ms, 기본: 10000)
}

// 기본 옵션
const DEFAULT_OPTIONS: Required<HellomarketCrawlerOptions> = {
  maxItems: 20,
  timeout: 10000,
};

// HTTP 클라이언트 설정
const httpClient = axios.create({
  timeout: DEFAULT_OPTIONS.timeout,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
  },
});

/**
 * 헬로마켓 검색 URL 생성
 */
function buildSearchUrl(productName: string, modelName?: string): string {
  const query = modelName ? `${productName} ${modelName}` : productName;
  const encodedQuery = encodeURIComponent(query);
  return `https://www.hellomarket.com/search?q=${encodedQuery}`;
}

/**
 * 가격 문자열을 숫자로 변환
 * 예: "150,000원" -> 150000, "15만원" -> 150000
 */
function parsePrice(priceText: string): number | null {
  // "만원" 처리 (예: "41만원", "41.5만원", "41만 원")
  const manwonMatch = priceText.match(/(\d+(?:\.\d+)?)\s*만\s*원?/);
  if (manwonMatch) {
    const price = Math.round(parseFloat(manwonMatch[1]) * 10000);
    // 합리적인 가격 범위 검증 (1천원 ~ 1억원)
    return price >= 1000 && price <= 100000000 ? price : null;
  }

  // 일반 가격 처리 (예: "150,000원", "150000원")
  const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*|\d+)\s*원/);
  if (priceMatch) {
    const cleaned = priceMatch[1].replace(/,/g, '');
    const price = parseInt(cleaned, 10);
    return price >= 1000 && price <= 100000000 ? price : null;
  }

  // 숫자만 있는 경우 (원 단위 없이, 콤마 포함)
  const numMatch = priceText.match(/(\d{1,3}(?:,\d{3})+)/);
  if (numMatch) {
    const cleaned = numMatch[1].replace(/,/g, '');
    const price = parseInt(cleaned, 10);
    return price >= 1000 && price <= 100000000 ? price : null;
  }

  return null;
}

/**
 * 헬로마켓 웹에서 상품 목록 크롤링
 */
export async function crawlHellomarket(
  productName: string,
  modelName?: string,
  options?: HellomarketCrawlerOptions
): Promise<CrawlResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const results: CrawlResult[] = [];

  try {
    const searchUrl = buildSearchUrl(productName, modelName);

    const response = await httpClient.get(searchUrl, {
      timeout: opts.timeout,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // 헬로마켓 상품 카드 선택자 (복합 선택자)
    const productCards = $('a[href*="/item/"], [class*="product"] a, [class*="item"] a');

    productCards.each((_index, element): void | boolean => {
      if (results.length >= opts.maxItems) return false;

      const $card = $(element);

      // 상품 URL
      const href = $card.attr('href');
      if (!href || !href.includes('/item/')) return;

      const originalUrl = href.startsWith('http')
        ? href
        : `https://www.hellomarket.com${href}`;

      // 가격 추출 - 다양한 선택자 시도
      let priceText = '';
      const priceSelectors = [
        '[class*="price"]',
        '[class*="Price"]',
        '[class*="cost"]',
        'strong',
        'span',
      ];

      for (const selector of priceSelectors) {
        const text = $card.find(selector).first().text();
        if (text && (text.includes('원') || text.match(/[\d,]+/))) {
          priceText = text;
          break;
        }
      }

      if (!priceText) {
        const cardText = $card.text();
        const priceMatch = cardText.match(/[\d,]+\s*원|[\d.]+\s*만\s*원?/);
        if (priceMatch) priceText = priceMatch[0];
      }

      const price = parsePrice(priceText);
      if (!price) return;

      // 제목 추출
      let title = '';
      const titleSelectors = [
        '[class*="title"]',
        '[class*="Title"]',
        '[class*="name"]',
        '[class*="Name"]',
        'h2', 'h3', 'h4',
        'p',
      ];

      for (const selector of titleSelectors) {
        const text = $card.find(selector).first().text().trim();
        if (text && text.length > 2 && text.length < 200) {
          title = text;
          break;
        }
      }

      if (!title) return;

      results.push({
        productName: title,
        modelName,
        platform: 'HELLOMARKET' as Platform,
        price,
        condition: undefined,
        originalUrl,
        scrapedAt: new Date(),
        metadata: {
          searchQuery: modelName ? `${productName} ${modelName}` : productName,
          source: 'web',
        },
      });
    });

    return results;
  } catch (error) {
    console.error('헬로마켓 웹 크롤링 오류:', error);
    return results;
  }
}

/**
 * 헬로마켓 API를 통한 검색 (대체 방법)
 */
export async function crawlHellomarketApi(
  productName: string,
  modelName?: string,
  options?: HellomarketCrawlerOptions
): Promise<CrawlResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const results: CrawlResult[] = [];

  try {
    const query = modelName ? `${productName} ${modelName}` : productName;
    const encodedQuery = encodeURIComponent(query);

    // 헬로마켓 API 엔드포인트 (비공식)
    const apiUrl = `https://www.hellomarket.com/api/search?q=${encodedQuery}&page=1&limit=${opts.maxItems}`;

    const response = await httpClient.get(apiUrl, {
      timeout: opts.timeout,
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = response.data;

    // API 응답 구조에 따라 파싱
    const items = data?.data?.items || data?.items || data?.list || data?.products || [];

    if (Array.isArray(items)) {
      for (const item of items) {
        if (results.length >= opts.maxItems) break;

        const price = typeof item.price === 'string'
          ? parsePrice(item.price)
          : item.price;

        const title = item.title || item.name || item.productName;

        if (!price || !title) continue;

        const itemId = item.id || item.itemId || item.productId;

        results.push({
          productName: title,
          modelName,
          platform: 'HELLOMARKET' as Platform,
          price,
          condition: item.condition || item.status,
          originalUrl: item.url || (itemId ? `https://www.hellomarket.com/item/${itemId}` : undefined),
          scrapedAt: new Date(),
          metadata: {
            searchQuery: query,
            source: 'api',
          },
        });
      }
    }

    return results;
  } catch (error) {
    // API가 없거나 실패해도 조용히 처리
    console.error('헬로마켓 API 크롤링 오류:', error);
    return results;
  }
}

/**
 * 헬로마켓 크롤링 (웹 크롤링 + API 병합)
 */
export async function crawlHellomarketWithFallback(
  productName: string,
  modelName?: string,
  options?: HellomarketCrawlerOptions
): Promise<CrawlResult[]> {
  // 웹 크롤링과 API를 병렬로 시도
  const [webResults, apiResults] = await Promise.all([
    crawlHellomarket(productName, modelName, options),
    crawlHellomarketApi(productName, modelName, options),
  ]);

  // 결과 병합 (중복 제거)
  const results: CrawlResult[] = [...webResults];
  const existingUrls = new Set(results.map(r => r.originalUrl));

  for (const item of apiResults) {
    if (!existingUrls.has(item.originalUrl)) {
      results.push(item);
      existingUrls.add(item.originalUrl);
    }
  }

  // 최대 항목 수 제한
  const maxItems = options?.maxItems ?? DEFAULT_OPTIONS.maxItems;
  return results.slice(0, maxItems);
}

export default {
  crawl: crawlHellomarketWithFallback,
  crawlWeb: crawlHellomarket,
  crawlApi: crawlHellomarketApi,
};
