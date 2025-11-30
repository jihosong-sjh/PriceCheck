/**
 * 네이버 쇼핑 검색 API 연동 서비스
 * 자동완성 기능을 위한 외부 데이터 소스
 */

import axios from 'axios';
import { mapNaverCategory } from './categoryDetector.js';
import type { Category } from '../utils/validators.js';

// 네이버 쇼핑 검색 결과 아이템 타입
export interface NaverShoppingItem {
  title: string;
  link: string;
  image: string;
  lprice: string;
  hprice: string;
  mallName: string;
  productId: string;
  productType: string;
  brand: string;
  maker: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
}

// 네이버 API 응답 타입
interface NaverShoppingResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverShoppingItem[];
}

// 검색 결과 타입 (정제된 형태)
export interface NaverSearchResult {
  title: string;
  brand: string;
  category: string;
  price: number;
}

// 메모리 캐시 (간단한 구현)
interface CacheEntry {
  data: NaverSearchResult[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5분

class NaverShoppingService {
  private clientId: string;
  private clientSecret: string;
  private baseUrl = 'https://openapi.naver.com/v1/search/shop.json';

  constructor() {
    this.clientId = process.env.NAVER_CLIENT_ID || '';
    this.clientSecret = process.env.NAVER_CLIENT_SECRET || '';
  }

  /**
   * API 키가 설정되어 있는지 확인
   */
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  /**
   * HTML 태그 제거 (네이버 API는 <b> 태그로 검색어를 강조함)
   */
  private stripHtml(text: string): string {
    return text.replace(/<[^>]*>/g, '');
  }

  /**
   * 캐시에서 결과 조회
   */
  private getCached(query: string): NaverSearchResult[] | null {
    const cached = cache.get(query);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  /**
   * 결과를 캐시에 저장
   */
  private setCache(query: string, data: NaverSearchResult[]): void {
    cache.set(query, { data, timestamp: Date.now() });

    // 캐시 크기 제한 (최대 100개)
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
  }

  /**
   * 네이버 쇼핑에서 상품 검색
   * @param query 검색어
   * @param display 결과 개수 (최대 100)
   */
  async search(query: string, display: number = 10): Promise<NaverSearchResult[]> {
    // API 키 미설정 시 빈 배열 반환
    if (!this.isConfigured()) {
      console.warn('[NaverShopping] API 키가 설정되지 않았습니다.');
      return [];
    }

    // 캐시 확인
    const cached = this.getCached(query);
    if (cached) {
      console.log(`[NaverShopping] 캐시 히트: ${query}`);
      return cached;
    }

    try {
      const response = await axios.get<NaverShoppingResponse>(this.baseUrl, {
        params: {
          query,
          display: Math.min(display, 100),
          sort: 'sim', // 정확도순
        },
        headers: {
          'X-Naver-Client-Id': this.clientId,
          'X-Naver-Client-Secret': this.clientSecret,
        },
        timeout: 5000, // 5초 타임아웃
      });

      const results: NaverSearchResult[] = response.data.items.map((item) => ({
        title: this.stripHtml(item.title),
        brand: item.brand || item.maker || '',
        category: [item.category1, item.category2, item.category3]
          .filter(Boolean)
          .join(' > '),
        price: parseInt(item.lprice, 10) || 0,
      }));

      // 캐시에 저장
      this.setCache(query, results);

      console.log(`[NaverShopping] 검색 완료: ${query} (${results.length}개)`);
      return results;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`[NaverShopping] API 오류:`, error.response?.status, error.message);
      } else {
        console.error(`[NaverShopping] 검색 실패:`, error);
      }
      return [];
    }
  }

  /**
   * 자동완성용 제품명 목록 조회
   * 검색 결과에서 중복을 제거하고 제품명만 추출
   */
  async getProductSuggestions(query: string, limit: number = 5): Promise<string[]> {
    const results = await this.search(query, limit * 2);

    // 제품명 추출 및 중복 제거
    const suggestions = new Set<string>();

    for (const item of results) {
      // 제품명 정제 (너무 긴 제품명은 잘라냄)
      let title = item.title;

      // 100자 초과 시 잘라냄
      if (title.length > 100) {
        title = title.substring(0, 100);
      }

      // 특수문자 정리
      title = title
        .replace(/\[.*?\]/g, '') // [대괄호 내용] 제거
        .replace(/\(.*?\)/g, '') // (소괄호 내용) 제거
        .replace(/\s+/g, ' ')    // 연속 공백 제거
        .trim();

      if (title.length > 2) {
        suggestions.add(title);
      }

      if (suggestions.size >= limit) break;
    }

    return Array.from(suggestions);
  }

  /**
   * 검색 결과에서 카테고리 추정
   * 여러 검색 결과의 카테고리를 분석하여 가장 많이 나온 카테고리 반환
   */
  async detectCategoryFromSearch(query: string): Promise<Category | null> {
    const items = await this.searchRaw(query, 10);

    if (items.length === 0) {
      return null;
    }

    // 카테고리별 빈도 계산
    const categoryCount = new Map<Category, number>();

    for (const item of items) {
      const category = mapNaverCategory(
        item.category1,
        item.category2,
        item.category3,
        item.category4
      );

      if (category) {
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      }
    }

    // 가장 빈도가 높은 카테고리 반환
    let maxCount = 0;
    let bestCategory: Category | null = null;

    for (const [category, count] of categoryCount) {
      if (count > maxCount) {
        maxCount = count;
        bestCategory = category;
      }
    }

    return bestCategory;
  }

  /**
   * Raw 검색 결과 반환 (NaverShoppingItem 배열)
   */
  async searchRaw(query: string, display: number = 10): Promise<NaverShoppingItem[]> {
    if (!this.isConfigured()) {
      return [];
    }

    // 캐시 키 (raw용)
    const cacheKey = `raw_${query}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as unknown as NaverShoppingItem[];
    }

    try {
      const response = await axios.get<NaverShoppingResponse>(this.baseUrl, {
        params: {
          query,
          display: Math.min(display, 100),
          sort: 'sim',
        },
        headers: {
          'X-Naver-Client-Id': this.clientId,
          'X-Naver-Client-Secret': this.clientSecret,
        },
        timeout: 5000,
      });

      const items = response.data.items.map((item) => ({
        ...item,
        title: this.stripHtml(item.title),
      }));

      // 캐시에 저장
      cache.set(cacheKey, { data: items as unknown as NaverSearchResult[], timestamp: Date.now() });

      return items;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`[NaverShopping] API 오류:`, error.response?.status, error.message);
      }
      return [];
    }
  }

  /**
   * 가격 정보 조회 (폴백용)
   * 네이버 쇼핑 API에서 가격 데이터를 가져와서 시세 정보 제공
   */
  async getPriceData(query: string, display: number = 20): Promise<NaverPriceData | null> {
    const items = await this.searchRaw(query, display);

    if (items.length === 0) {
      return null;
    }

    // 가격 추출 (0원 제외)
    const prices = items
      .map((item) => parseInt(item.lprice, 10))
      .filter((price) => price > 0);

    if (prices.length === 0) {
      return null;
    }

    // 통계 계산
    prices.sort((a, b) => a - b);
    const sum = prices.reduce((acc, p) => acc + p, 0);
    const average = Math.round(sum / prices.length);
    const median = prices[Math.floor(prices.length / 2)];
    const min = prices[0];
    const max = prices[prices.length - 1];

    // 카테고리 추정
    const category = mapNaverCategory(
      items[0].category1,
      items[0].category2,
      items[0].category3,
      items[0].category4
    );

    return {
      query,
      category,
      priceStats: {
        average,
        median,
        min,
        max,
        sampleCount: prices.length,
      },
      items: items.slice(0, 10).map((item) => ({
        title: item.title,
        price: parseInt(item.lprice, 10),
        link: item.link,
        mallName: item.mallName,
        brand: item.brand,
        category: [item.category1, item.category2, item.category3]
          .filter(Boolean)
          .join(' > '),
      })),
    };
  }
}

// 가격 데이터 타입
export interface NaverPriceData {
  query: string;
  category: Category | null;
  priceStats: {
    average: number;
    median: number;
    min: number;
    max: number;
    sampleCount: number;
  };
  items: Array<{
    title: string;
    price: number;
    link: string;
    mallName: string;
    brand: string;
    category: string;
  }>;
}

// 싱글톤 인스턴스
const naverShoppingService = new NaverShoppingService();

export default naverShoppingService;
