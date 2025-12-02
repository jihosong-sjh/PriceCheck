/**
 * 번개장터 크롤러
 * Playwright + Cheerio를 사용한 동적 페이지 크롤링
 * 브라우저 풀을 활용하여 성능 최적화
 */

import { type BrowserContext } from 'playwright';
import * as cheerio from 'cheerio';
import type { Platform } from '../../utils/validators.js';
import { acquirePage, releasePage } from './browserPool.js';

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

// 번개장터 크롤러 옵션
export interface BunjangCrawlerOptions {
  maxItems?: number;       // 최대 수집 항목 수 (기본: 20)
  timeout?: number;        // 타임아웃 (ms, 기본: 15000)
  headless?: boolean;      // 헤드리스 모드 (기본: true) - 브라우저 풀에서 관리
}

// 기본 옵션 (타임아웃 30초 → 15초로 단축)
const DEFAULT_OPTIONS: Required<BunjangCrawlerOptions> = {
  maxItems: 20,
  timeout: 15000,
  headless: true,
};

/**
 * 번개장터 검색 URL 생성
 */
function buildSearchUrl(productName: string, modelName?: string): string {
  const query = modelName ? `${productName} ${modelName}` : productName;
  const encodedQuery = encodeURIComponent(query);
  return `https://m.bunjang.co.kr/search/products?q=${encodedQuery}`;
}

/**
 * 가격 문자열을 숫자로 변환 (개선된 파싱)
 * 지원 형식:
 * - "150,000원", "150000원", "150,000" -> 150000
 * - "15만원", "15만 원", "15.5만원" -> 150000, 155000
 * - "1234", "12345" -> 1234, 12345
 * - "무료나눔", "가격제안" -> null
 */
function parsePrice(priceText: string): number | null {
  if (!priceText) return null;

  // 공백 정리
  const cleaned = priceText.replace(/\s+/g, ' ').trim();

  // 무료나눔, 가격제안 등 제외
  if (/무료|나눔|제안|협의|문의/i.test(cleaned)) {
    return null;
  }

  // "만원" 처리 (예: "41만원", "41.5만원", "41만 원", "41만5천원")
  const manwonMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*만\s*(\d+)?(?:천)?\s*원?/);
  if (manwonMatch) {
    let price = Math.round(parseFloat(manwonMatch[1]) * 10000);
    // "41만5천원" 형태 처리
    if (manwonMatch[2]) {
      price += parseInt(manwonMatch[2], 10) * 1000;
    }
    // 합리적인 가격 범위 검증 (1천원 ~ 1억원)
    return price >= 1000 && price <= 100000000 ? price : null;
  }

  // 일반 가격 처리 (예: "150,000원", "150000원")
  const priceMatch = cleaned.match(/(\d{1,3}(?:,\d{3})*|\d+)\s*원/);
  if (priceMatch) {
    const numStr = priceMatch[1].replace(/,/g, '');
    const price = parseInt(numStr, 10);
    return price >= 1000 && price <= 100000000 ? price : null;
  }

  // 콤마가 있는 숫자 (예: "150,000")
  const commaNumMatch = cleaned.match(/(\d{1,3}(?:,\d{3})+)/);
  if (commaNumMatch) {
    const numStr = commaNumMatch[1].replace(/,/g, '');
    const price = parseInt(numStr, 10);
    return price >= 1000 && price <= 100000000 ? price : null;
  }

  // 순수 숫자만 있는 경우 (예: "150000", "15000")
  const pureNumMatch = cleaned.match(/^(\d{4,8})$/);
  if (pureNumMatch) {
    const price = parseInt(pureNumMatch[1], 10);
    return price >= 1000 && price <= 100000000 ? price : null;
  }

  return null;
}

/**
 * 번개장터에서 상품 목록 크롤링
 * 브라우저 풀을 사용하여 성능 최적화
 */
export async function crawlBunjang(
  productName: string,
  modelName?: string,
  options?: BunjangCrawlerOptions
): Promise<CrawlResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const results: CrawlResult[] = [];
  let context: BrowserContext | null = null;

  try {
    // 브라우저 풀에서 페이지 획득
    const acquired = await acquirePage({
      timeout: opts.timeout,
      viewport: { width: 375, height: 667 },
      locale: 'ko-KR',
    });
    context = acquired.context;
    const page = acquired.page;

    // 검색 페이지로 이동
    const searchUrl = buildSearchUrl(productName, modelName);
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: opts.timeout });

    // 동적 콘텐츠 로딩 대기 (1.5초로 단축)
    await page.waitForTimeout(1500);

    // 스크롤하여 더 많은 상품 로드 (2번으로 단축)
    for (let i = 0; i < 2; i++) {
      await page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = globalThis as any;
        win.scrollBy(0, win.innerHeight);
      });
      await page.waitForTimeout(800);
    }

    // HTML 파싱
    const html = await page.content();
    const $ = cheerio.load(html);

    // 상품 목록 파싱
    // 번개장터 모바일 웹 구조에 맞게 선택자 사용
    const productCards = $('a[href*="/products/"]');

    productCards.each((_index, element): void | boolean => {
      if (results.length >= opts.maxItems) return false;

      const $card = $(element);

      // 상품 URL
      const href = $card.attr('href');
      const originalUrl = href ? `https://m.bunjang.co.kr${href}` : undefined;

      // 가격 추출 (다양한 선택자 시도)
      const priceText = $card.find('[class*="price"], [class*="Price"]').first().text() ||
                        $card.find('div:contains("원")').first().text();
      const price = parsePrice(priceText);

      if (!price) return; // 가격이 없으면 스킵

      // 제목 추출
      const title = $card.find('[class*="name"], [class*="Name"], [class*="title"], [class*="Title"]').first().text().trim() ||
                    $card.find('div').first().text().trim();

      if (!title) return; // 제목이 없으면 스킵

      // 상태 추출 (가능한 경우)
      const conditionText = $card.find('[class*="condition"], [class*="status"]').text().trim();

      results.push({
        productName: title,
        modelName,
        platform: 'BUNJANG' as Platform,
        price,
        condition: conditionText || undefined,
        originalUrl,
        scrapedAt: new Date(),
        metadata: {
          searchQuery: modelName ? `${productName} ${modelName}` : productName,
        },
      });
    });

    return results;
  } catch (error) {
    console.error('[Bunjang] 크롤링 오류:', error instanceof Error ? error.message : error);
    // 에러 발생 시 수집된 결과까지 반환
    return results;
  } finally {
    // 브라우저 컨텍스트 반환
    if (context) {
      await releasePage(context);
    }
  }
}

/**
 * 번개장터 API를 통한 검색 (대체 방법)
 * 웹 크롤링이 실패할 경우 API 호출 시도
 */
export async function crawlBunjangApi(
  productName: string,
  modelName?: string,
  options?: BunjangCrawlerOptions
): Promise<CrawlResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const results: CrawlResult[] = [];

  try {
    const query = modelName ? `${productName} ${modelName}` : productName;
    const encodedQuery = encodeURIComponent(query);

    // 번개장터 내부 API 호출 (비공식)
    const apiUrl = `https://api.bunjang.co.kr/api/1/find_v2.json?q=${encodedQuery}&order=date&page=0&n=${opts.maxItems}`;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const data = await response.json() as {
      list?: Array<{
        name?: string;
        price?: string | number;
        pid?: string;
        status?: string;
      }>;
    };

    if (data.list && Array.isArray(data.list)) {
      for (const item of data.list) {
        if (results.length >= opts.maxItems) break;

        const price = typeof item.price === 'string'
          ? parsePrice(item.price)
          : item.price;

        if (!price || !item.name) continue;

        results.push({
          productName: item.name,
          modelName,
          platform: 'BUNJANG' as Platform,
          price,
          condition: item.status,
          originalUrl: item.pid ? `https://m.bunjang.co.kr/products/${item.pid}` : undefined,
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
    console.error('번개장터 API 크롤링 오류:', error);
    return results;
  }
}

/**
 * 번개장터 크롤링 (웹 크롤링 실패 시 API 대체)
 */
export async function crawlBunjangWithFallback(
  productName: string,
  modelName?: string,
  options?: BunjangCrawlerOptions
): Promise<CrawlResult[]> {
  // 먼저 웹 크롤링 시도
  let results = await crawlBunjang(productName, modelName, options);

  // 결과가 부족하면 API 시도
  if (results.length < 3) {
    const apiResults = await crawlBunjangApi(productName, modelName, options);
    // 중복 제거하여 병합
    const existingUrls = new Set(results.map(r => r.originalUrl));
    for (const item of apiResults) {
      if (!existingUrls.has(item.originalUrl)) {
        results.push(item);
      }
    }
  }

  return results;
}

export default {
  crawl: crawlBunjangWithFallback,
  crawlWeb: crawlBunjang,
  crawlApi: crawlBunjangApi,
};
