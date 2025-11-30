/**
 * 검색 API 라우트
 * GET /api/search/autocomplete - 자동완성 제안
 * GET /api/search/popular - 인기 검색어
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import autocompleteService, { type AutocompleteSuggestion } from '../services/autocomplete.js';
import { CategoryEnum, CATEGORY_LABELS } from '../utils/validators.js';
import type { Category } from '../utils/validators.js';

const router = Router();

// 자동완성 요청 스키마
const autocompleteQuerySchema = z.object({
  q: z.string().min(2, '검색어는 2글자 이상 입력해주세요.').max(100),
});

// 인기 검색어 요청 스키마
const popularQuerySchema = z.object({
  category: CategoryEnum.optional(),
  limit: z.string().optional().transform((val) => {
    const num = parseInt(val || '10', 10);
    return Math.min(Math.max(1, num), 20); // 1~20 범위
  }),
});

// 자동완성 응답 타입
interface AutocompleteResponse {
  success: true;
  data: {
    suggestions: Array<{
      text: string;
      source: 'history' | 'external';
      category?: string;
      categoryName?: string;
      searchCount?: number;
    }>;
  };
}

// 인기 검색어 응답 타입
interface PopularSearchResponse {
  success: true;
  data: {
    items: Array<{
      productName: string;
      category: string;
      categoryName: string;
      searchCount: number;
    }>;
  };
}

// 에러 응답 타입
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * GET /api/search/autocomplete
 * 자동완성 제안 조회
 */
router.get(
  '/autocomplete',
  async (
    req: Request,
    res: Response<AutocompleteResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    try {
      // 요청 검증
      const { q } = autocompleteQuerySchema.parse(req.query);

      // 자동완성 제안 조회
      const suggestions = await autocompleteService.getSuggestions(q, 8);

      // 응답 변환 (카테고리 이름 추가)
      const formattedSuggestions = suggestions.map((item: AutocompleteSuggestion) => ({
        text: item.text,
        source: item.source,
        category: item.category,
        categoryName: item.category ? CATEGORY_LABELS[item.category] : undefined,
        searchCount: item.searchCount,
      }));

      return res.json({
        success: true,
        data: {
          suggestions: formattedSuggestions,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || '입력값이 올바르지 않습니다.',
          },
        });
      }
      return next(error);
    }
  }
);

/**
 * GET /api/search/popular
 * 인기 검색어 조회
 */
router.get(
  '/popular',
  async (
    req: Request,
    res: Response<PopularSearchResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    try {
      // 요청 검증
      const { category, limit } = popularQuerySchema.parse(req.query);

      // 인기 검색어 조회
      const items = await autocompleteService.getPopularSearches(category, limit);

      // 응답 변환
      const formattedItems = items.map((item: AutocompleteSuggestion) => ({
        productName: item.text,
        category: item.category || '',
        categoryName: item.category ? CATEGORY_LABELS[item.category as Category] : '',
        searchCount: item.searchCount || 0,
      }));

      return res.json({
        success: true,
        data: {
          items: formattedItems,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || '입력값이 올바르지 않습니다.',
          },
        });
      }
      return next(error);
    }
  }
);

export default router;
