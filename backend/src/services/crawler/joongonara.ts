/**
 * 중고나라 크롤러
 * Axios + Cheerio를 사용한 정적 페이지 크롤링
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Platform } from '../../utils/validators.js';

// 크롤링 결과 인터페이스 (번개장터와 동일)
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

// 중고나라 크롤러 옵션
export interface JoongonaraCrawlerOptions {
  maxItems?: number;       // 최대 수집 항목 수 (기본: 20)
  timeout?: number;        // 타임아웃 (ms, 기본: 10000)
}

// 기본 옵션
const DEFAULT_OPTIONS: Required<JoongonaraCrawlerOptions> = {
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
 * 중고나라 검색 URL 생성
 */
function buildSearchUrl(productName: string, modelName?: string): string {
  const query = modelName ? `${productName} ${modelName}` : productName;
  const encodedQuery = encodeURIComponent(query);
  // 중고나라 웹 검색 URL
  return `https://web.joongna.com/search/${encodedQuery}`;
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
  // 연속된 숫자+콤마 패턴만 추출 (제품명의 숫자 제외)
  const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*|\d+)\s*원/);
  if (priceMatch) {
    const cleaned = priceMatch[1].replace(/,/g, '');
    const price = parseInt(cleaned, 10);
    // 합리적인 가격 범위 검증 (1천원 ~ 1억원)
    return price >= 1000 && price <= 100000000 ? price : null;
  }

  return null;
}

/**
 * 중고나라 웹에서 상품 목록 크롤링
 */
export async function crawlJoongonara(
  productName: string,
  modelName?: string,
  options?: JoongonaraCrawlerOptions
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

    // 중고나라 웹 구조에 맞는 선택자
    // 상품 카드 선택
    const productCards = $('a[href*="/product/"]');

    productCards.each((_index, element): void | boolean => {
      if (results.length >= opts.maxItems) return false;

      const $card = $(element);

      // 상품 URL
      const href = $card.attr('href');
      const originalUrl = href
        ? (href.startsWith('http') ? href : `https://web.joongna.com${href}`)
        : undefined;

      // 가격 추출
      const priceText = $card.find('[class*="price"], [class*="Price"]').first().text() ||
                        $card.text().match(/[\d,]+\s*원|[\d.]+\s*만\s*원?/)?.[0] || '';
      const price = parsePrice(priceText);

      if (!price) return; // 가격이 없으면 스킵

      // 제목 추출
      const title = $card.find('[class*="title"], [class*="Title"], [class*="name"], [class*="Name"]').first().text().trim() ||
                    $card.find('p, span').first().text().trim();

      if (!title) return; // 제목이 없으면 스킵

      results.push({
        productName: title,
        modelName,
        platform: 'JOONGONARA' as Platform,
        price,
        condition: undefined,
        originalUrl,
        scrapedAt: new Date(),
        metadata: {
          searchQuery: modelName ? `${productName} ${modelName}` : productName,
        },
      });
    });

    return results;
  } catch (error) {
    console.error('중고나라 웹 크롤링 오류:', error);
    return results;
  }
}

/**
 * 중고나라 API를 통한 검색 (대체 방법)
 */
export async function crawlJoongonaraApi(
  productName: string,
  modelName?: string,
  options?: JoongonaraCrawlerOptions
): Promise<CrawlResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const results: CrawlResult[] = [];

  try {
    const query = modelName ? `${productName} ${modelName}` : productName;
    const encodedQuery = encodeURIComponent(query);

    // 중고나라 API 엔드포인트 (비공식)
    const apiUrl = `https://web.joongna.com/api/search?keyword=${encodedQuery}&page=1&size=${opts.maxItems}&sort=RECENT_SORT`;

    const response = await httpClient.get(apiUrl, {
      timeout: opts.timeout,
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = response.data;

    // API 응답 구조에 따라 파싱
    const items = data?.data?.items || data?.items || data?.list || [];

    if (Array.isArray(items)) {
      for (const item of items) {
        if (results.length >= opts.maxItems) break;

        const price = typeof item.price === 'string'
          ? parsePrice(item.price)
          : item.price;

        const title = item.title || item.name || item.productName;

        if (!price || !title) continue;

        results.push({
          productName: title,
          modelName,
          platform: 'JOONGONARA' as Platform,
          price,
          condition: item.condition || item.status,
          originalUrl: item.url || item.productUrl || (item.id ? `https://web.joongna.com/product/${item.id}` : undefined),
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
    console.error('중고나라 API 크롤링 오류:', error);
    return results;
  }
}

/**
 * 중고나라 크롤링 (웹 크롤링 + API 병합)
 */
export async function crawlJoongonaraWithFallback(
  productName: string,
  modelName?: string,
  options?: JoongonaraCrawlerOptions
): Promise<CrawlResult[]> {
  // 웹 크롤링과 API를 병렬로 시도
  const [webResults, apiResults] = await Promise.all([
    crawlJoongonara(productName, modelName, options),
    crawlJoongonaraApi(productName, modelName, options),
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
  crawl: crawlJoongonaraWithFallback,
  crawlWeb: crawlJoongonara,
  crawlApi: crawlJoongonaraApi,
};
