/**
 * 크롤링 결과 캐시 서비스
 * 동일한 검색어에 대한 크롤링 결과를 메모리에 캐싱하여 응답 속도 향상
 */

import type { CrawlerResult } from './crawler/index.js';

// 캐시 엔트리 타입
interface CacheEntry {
  data: CrawlerResult;
  timestamp: number;
  hitCount: number;
}

// 캐시 키 생성용 파라미터
interface CacheKeyParams {
  productName: string;
  modelName?: string;
  category?: string;
}

class CrawlerCacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 10 * 60 * 1000; // 10분
  private readonly MAX_ENTRIES = 200; // 최대 캐시 항목 수
  private readonly MIN_ITEMS_TO_CACHE = 3; // 최소 3개 이상 결과만 캐싱

  /**
   * 캐시 키 생성
   * 제품명 + 모델명 + 카테고리를 조합하여 고유 키 생성
   */
  private generateKey(params: CacheKeyParams): string {
    const normalizedProductName = params.productName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');

    const parts = [normalizedProductName];

    if (params.modelName) {
      parts.push(params.modelName.toLowerCase().trim());
    }

    if (params.category) {
      parts.push(params.category);
    }

    return parts.join('::');
  }

  /**
   * 캐시에서 결과 조회
   */
  get(params: CacheKeyParams): CrawlerResult | null {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // TTL 체크
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      console.log(`[CrawlerCache] 캐시 만료: "${params.productName}"`);
      return null;
    }

    // 히트 카운트 증가
    entry.hitCount++;

    console.log(`[CrawlerCache] 캐시 히트: "${params.productName}" (${entry.data.items.length}개 결과, ${entry.hitCount}회 사용)`);

    return entry.data;
  }

  /**
   * 결과를 캐시에 저장
   */
  set(params: CacheKeyParams, data: CrawlerResult): void {
    // 결과가 너무 적으면 캐싱하지 않음
    if (data.items.length < this.MIN_ITEMS_TO_CACHE) {
      console.log(`[CrawlerCache] 결과 부족으로 캐싱 스킵: "${params.productName}" (${data.items.length}개)`);
      return;
    }

    const key = this.generateKey(params);

    // 캐시 크기 제한 - LRU 방식으로 오래된 항목 제거
    if (this.cache.size >= this.MAX_ENTRIES) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hitCount: 0,
    });

    console.log(`[CrawlerCache] 캐시 저장: "${params.productName}" (${data.items.length}개 결과)`);
  }

  /**
   * 가장 오래된 항목 제거 (LRU)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // 히트 카운트가 낮고 오래된 항목 우선 제거
      const score = entry.timestamp - (entry.hitCount * 60000); // 히트당 1분 보너스
      if (score < oldestTime) {
        oldestTime = score;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`[CrawlerCache] 캐시 제거 (LRU): ${oldestKey}`);
    }
  }

  /**
   * 특정 키 삭제
   */
  invalidate(params: CacheKeyParams): void {
    const key = this.generateKey(params);
    this.cache.delete(key);
  }

  /**
   * 전체 캐시 클리어
   */
  clear(): void {
    this.cache.clear();
    console.log('[CrawlerCache] 캐시 전체 클리어');
  }

  /**
   * 만료된 캐시 정리
   */
  cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[CrawlerCache] 만료 캐시 정리: ${removed}개 제거`);
    }
  }

  /**
   * 캐시 통계 조회
   */
  getStats(): {
    size: number;
    maxSize: number;
    ttlMinutes: number;
    entries: Array<{ key: string; itemCount: number; hitCount: number; ageSeconds: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      itemCount: entry.data.items.length,
      hitCount: entry.hitCount,
      ageSeconds: Math.floor((now - entry.timestamp) / 1000),
    }));

    return {
      size: this.cache.size,
      maxSize: this.MAX_ENTRIES,
      ttlMinutes: this.TTL / 60000,
      entries,
    };
  }
}

// 싱글톤 인스턴스
const crawlerCache = new CrawlerCacheService();

// 5분마다 만료 캐시 정리
setInterval(() => {
  crawlerCache.cleanup();
}, 5 * 60 * 1000);

export default crawlerCache;
