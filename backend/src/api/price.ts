/**
 * 가격 추천 API 라우트
 * GET /api/price/categories - 카테고리 목록 조회
 * POST /api/price/recommend - 가격 추천 요청
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClient, type Category, type Condition } from '@prisma/client';
import {
  priceRecommendRequestSchema,
  CategoryEnum,
  CATEGORY_LABELS,
  CONDITION_LABELS,
  type PriceRecommendRequest,
} from '../utils/validators.js';
import crawler from '../services/crawler/index.js';
import priceCalculator from '../services/priceCalculator.js';
import { optionalAuth } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

// 카테고리 정보 타입
interface CategoryInfo {
  code: string;
  name: string;
}

// 가격 추천 응답 타입
interface PriceRecommendResponse {
  success: boolean;
  data: {
    id?: string;
    input: {
      category: string;
      categoryName: string;
      productName: string;
      modelName?: string;
      condition: string;
      conditionName: string;
    };
    recommendation: {
      recommendedPrice: number;
      priceMin: number;
      priceMax: number;
      averagePrice: number;
      medianPrice: number;
      confidence: string;
      sampleCount: number;
    };
    marketDataSnapshot: Array<{
      price: number;
      platform: string;
      condition?: string;
      originalUrl?: string;
      scrapedAt: string;
    }>;
    crawlStats: {
      totalItems: number;
      itemsByPlatform: Record<string, number>;
      crawlDuration: number;
    };
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
 * GET /api/price/categories
 * 지원하는 카테고리 목록 조회
 */
router.get('/categories', (_req: Request, res: Response) => {
  const categories: CategoryInfo[] = CategoryEnum.options.map((code) => ({
    code,
    name: CATEGORY_LABELS[code],
  }));

  res.json({
    success: true,
    data: {
      categories,
    },
  });
});

/**
 * POST /api/price/recommend
 * 가격 추천 요청
 * - 로그인 사용자인 경우 히스토리에 저장하고 userId 연결
 */
router.post(
  '/recommend',
  optionalAuth,
  async (
    req: Request,
    res: Response<PriceRecommendResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    try {
      // 1. 요청 검증
      const validatedData: PriceRecommendRequest = priceRecommendRequestSchema.parse(req.body);

      const { category, productName, modelName, condition } = validatedData;

      // 2. 크롤링 실행
      console.log(`[가격 추천] 시작 - ${productName} ${modelName || ''} (${category}, ${condition})`);

      const crawlResult = await crawler.crawlAll(
        productName,
        modelName,
        category,
        {
          maxItemsPerPlatform: 20,
          timeout: 30000,
        }
      );

      console.log(`[가격 추천] 크롤링 완료 - ${crawlResult.stats.totalItems}개 수집 (${crawlResult.stats.crawlDuration}ms)`);

      // 3. 시세 데이터 부족 확인
      if (crawlResult.items.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NO_MARKET_DATA',
            message: '해당 제품의 시세 데이터를 찾을 수 없습니다. 제품명을 확인해주세요.',
          },
        });
      }

      // 4. 가격 계산
      const { calculation, marketDataSnapshot } = await priceCalculator.getRecommendedPrice(
        crawlResult.items,
        condition,
        category
      );

      // 5. 계산된 가격이 없는 경우
      if (calculation.recommendedPrice === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PRICE_CALCULATION_FAILED',
            message: '유효한 시세 데이터가 부족하여 가격을 계산할 수 없습니다.',
          },
        });
      }

      // 6. 로그인 사용자인 경우 히스토리에 저장
      let recommendationId: string | undefined;
      const userId = req.user?.userId;

      if (userId) {
        try {
          const recommendation = await prisma.priceRecommendation.create({
            data: {
              userId,
              category: category as Category,
              productName,
              modelName,
              condition: condition as Condition,
              recommendedPrice: calculation.recommendedPrice,
              priceMin: calculation.priceMin,
              priceMax: calculation.priceMax,
              marketDataSnapshot: JSON.parse(JSON.stringify(marketDataSnapshot)),
            },
          });
          recommendationId = recommendation.id;
          console.log(`[가격 추천] 히스토리 저장 완료 - ID: ${recommendationId}`);
        } catch (saveError) {
          // 히스토리 저장 실패는 로깅만 하고 응답은 정상 처리
          console.error('[가격 추천] 히스토리 저장 실패:', saveError);
        }
      }

      // 7. 성공 응답
      const response: PriceRecommendResponse = {
        success: true,
        data: {
          id: recommendationId,
          input: {
            category,
            categoryName: CATEGORY_LABELS[category],
            productName,
            modelName,
            condition,
            conditionName: CONDITION_LABELS[condition],
          },
          recommendation: {
            recommendedPrice: calculation.recommendedPrice,
            priceMin: calculation.priceMin,
            priceMax: calculation.priceMax,
            averagePrice: calculation.averagePrice,
            medianPrice: calculation.medianPrice,
            confidence: calculation.confidence,
            sampleCount: calculation.sampleCount,
          },
          marketDataSnapshot,
          crawlStats: {
            totalItems: crawlResult.stats.totalItems,
            itemsByPlatform: crawlResult.stats.itemsByPlatform,
            crawlDuration: crawlResult.stats.crawlDuration,
          },
        },
      };

      console.log(`[가격 추천] 완료 - 추천가격: ${calculation.recommendedPrice.toLocaleString()}원`);

      return res.json(response);
    } catch (error) {
      // Zod 검증 오류 처리
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력값이 올바르지 않습니다.',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }

      // 기타 에러는 전역 에러 핸들러로
      return next(error);
    }
  }
);

/**
 * GET /api/price/conditions
 * 지원하는 상태 목록 조회
 */
router.get('/conditions', (_req: Request, res: Response) => {
  const conditions = Object.entries(CONDITION_LABELS).map(([code, name]) => ({
    code,
    name,
  }));

  res.json({
    success: true,
    data: {
      conditions,
    },
  });
});

export default router;
