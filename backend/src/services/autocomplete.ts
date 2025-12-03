/**
 * 자동완성 서비스
 * 내부 DB + 네이버 쇼핑 API를 결합하여 자동완성 제안을 제공합니다.
 */

import naverShoppingService from './naverShopping.js';
import { detectCategory } from './categoryDetector.js';
import type { Category } from '../utils/validators.js';
import prisma from '../lib/prisma.js';

// 자동완성 제안 타입
export interface AutocompleteSuggestion {
  text: string;
  source: 'history' | 'external';
  category?: Category;
  searchCount?: number;
}

// 분리된 자동완성 응답 타입
export interface SeparatedSuggestions {
  history: AutocompleteSuggestion[];
  naver: AutocompleteSuggestion[];
}

class AutocompleteService {
  /**
   * 내부 DB에서 과거 검색 기록 조회
   * PriceRecommendation 테이블의 productName을 기반으로 검색
   */
  async searchFromHistory(query: string, limit: number = 5): Promise<AutocompleteSuggestion[]> {
    try {
      // 검색어를 포함하는 제품명을 검색 횟수(중복 count)와 함께 조회
      const results = await prisma.priceRecommendation.groupBy({
        by: ['productName', 'category'],
        where: {
          productName: {
            contains: query,
            mode: 'insensitive', // 대소문자 무시
          },
        },
        _count: {
          productName: true,
        },
        orderBy: {
          _count: {
            productName: 'desc',
          },
        },
        take: limit,
      });

      return results.map((result) => ({
        text: result.productName,
        source: 'history' as const,
        category: result.category as Category,
        searchCount: result._count.productName,
      }));
    } catch (error) {
      console.error('[Autocomplete] 내부 DB 검색 실패:', error);
      return [];
    }
  }

  /**
   * 네이버 쇼핑 API에서 제품명 조회
   */
  async searchFromNaver(query: string, limit: number = 5): Promise<AutocompleteSuggestion[]> {
    try {
      const suggestions = await naverShoppingService.getProductSuggestions(query, limit);

      return suggestions.map((text) => ({
        text,
        source: 'external' as const,
        category: detectCategory(text) ?? undefined,
      }));
    } catch (error) {
      console.error('[Autocomplete] 네이버 API 검색 실패:', error);
      return [];
    }
  }

  /**
   * 자동완성 제안 통합 조회 (기존 방식 - 병합)
   * 내부 DB 결과를 우선으로 하고, 부족한 경우 네이버 API로 보완
   */
  async getSuggestions(query: string, maxResults: number = 8): Promise<AutocompleteSuggestion[]> {
    // 최소 2글자 이상 입력 필요
    if (!query || query.trim().length < 2) {
      return [];
    }

    const trimmedQuery = query.trim();

    // 내부 DB 먼저 조회 (최대 5개)
    const historyResults = await this.searchFromHistory(trimmedQuery, 5);

    // 내부 결과가 3개 미만이면 네이버 API 호출
    let externalResults: AutocompleteSuggestion[] = [];
    if (historyResults.length < 3) {
      externalResults = await this.searchFromNaver(trimmedQuery, 5);
    }

    // 결과 병합 및 중복 제거
    const merged = this.mergeAndDeduplicate(historyResults, externalResults);

    // 최대 개수만큼 반환
    return merged.slice(0, maxResults);
  }

  /**
   * 자동완성 제안 분리 조회 (새로운 방식)
   * 검색 기록과 네이버 추천을 별도 섹션으로 반환
   */
  async getSeparatedSuggestions(query: string): Promise<SeparatedSuggestions> {
    // 최소 2글자 이상 입력 필요
    if (!query || query.trim().length < 2) {
      return { history: [], naver: [] };
    }

    const trimmedQuery = query.trim();

    // 검색 기록과 네이버 API를 병렬로 호출
    const [historyResults, naverResults] = await Promise.all([
      this.searchFromHistory(trimmedQuery, 5),
      this.searchFromNaver(trimmedQuery, 5),
    ]);

    // 네이버 결과에서 검색 기록과 중복되는 항목 제거
    const historyTexts = new Set(historyResults.map(item => item.text.toLowerCase()));
    const filteredNaverResults = naverResults.filter(
      item => !historyTexts.has(item.text.toLowerCase())
    );

    return {
      history: historyResults,
      naver: filteredNaverResults,
    };
  }

  /**
   * 결과 병합 및 중복 제거
   * 내부 DB 결과가 우선, 같은 제품명은 내부 DB 결과 유지
   */
  private mergeAndDeduplicate(
    historyResults: AutocompleteSuggestion[],
    externalResults: AutocompleteSuggestion[]
  ): AutocompleteSuggestion[] {
    const seen = new Set<string>();
    const merged: AutocompleteSuggestion[] = [];

    // 내부 DB 결과 먼저 추가
    for (const item of historyResults) {
      const key = item.text.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }

    // 네이버 API 결과 추가 (중복 제외)
    for (const item of externalResults) {
      const key = item.text.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }

    return merged;
  }

  /**
   * 인기 검색어 조회
   * 최근 일주일간 가장 많이 검색된 제품명
   */
  async getPopularSearches(category?: Category, limit: number = 10): Promise<AutocompleteSuggestion[]> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const whereClause: Record<string, unknown> = {
        createdAt: {
          gte: oneWeekAgo,
        },
      };

      if (category) {
        whereClause.category = category;
      }

      const results = await prisma.priceRecommendation.groupBy({
        by: ['productName', 'category'],
        where: whereClause,
        _count: {
          productName: true,
        },
        orderBy: {
          _count: {
            productName: 'desc',
          },
        },
        take: limit,
      });

      return results.map((result) => ({
        text: result.productName,
        source: 'history' as const,
        category: result.category as Category,
        searchCount: result._count.productName,
      }));
    } catch (error) {
      console.error('[Autocomplete] 인기 검색어 조회 실패:', error);
      return [];
    }
  }
}

// 싱글톤 인스턴스
const autocompleteService = new AutocompleteService();

export default autocompleteService;
