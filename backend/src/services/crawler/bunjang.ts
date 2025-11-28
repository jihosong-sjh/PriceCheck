/**
 * 번개장터 크롤러
 * Playwright + Cheerio를 사용한 동적 페이지 크롤링
 */

import { chromium, type Browser, type Page } from 'playwright';
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

// 번개장터 크롤러 옵션
export interface BunjangCrawlerOptions {
  maxItems?: number;       // 최대 수집 항목 수 (기본: 20)
  timeout?: number;        // 타임아웃 (ms, 기본: 30000)
  headless?: boolean;      // 헤드리스 모드 (기본: true)
}

// 기본 옵션
const DEFAULT_OPTIONS: Required<BunjangCrawlerOptions> = {
  maxItems: 20,
  timeout: 30000,
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
 * 가격 문자열을 숫자로 변환
 * 예: "150,000원" -> 150000
 */
function parsePrice(priceText: string): number | null {
  const cleaned = priceText.replace(/[^0-9]/g, '');
  const price = parseInt(cleaned, 10);
  return isNaN(price) || price <= 0 ? null : price;
}

/**
 * 번개장터에서 상품 목록 크롤링
 */
export async function crawlBunjang(
  productName: string,
  modelName?: string,
  options?: BunjangCrawlerOptions
): Promise<CrawlResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const results: CrawlResult[] = [];
  let browser: Browser | null = null;

  try {
    // 브라우저 실행
    browser = await chromium.launch({
      headless: opts.headless,
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 375, height: 667 },
      locale: 'ko-KR',
    });

    const page: Page = await context.newPage();
    page.setDefaultTimeout(opts.timeout);

    // 검색 페이지로 이동
    const searchUrl = buildSearchUrl(productName, modelName);
    await page.goto(searchUrl, { waitUntil: 'networkidle' });

    // 동적 콘텐츠 로딩 대기
    await page.waitForTimeout(2000);

    // 스크롤하여 더 많은 상품 로드
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = globalThis as any;
        win.scrollBy(0, win.innerHeight);
      });
      await page.waitForTimeout(1000);
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
    console.error('번개장터 크롤링 오류:', error);
    // 에러 발생 시 빈 배열 반환 (다른 플랫폼 크롤링 계속 진행)
    return results;
  } finally {
    if (browser) {
      await browser.close();
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
