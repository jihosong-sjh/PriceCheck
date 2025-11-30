/**
 * 가격 추천 API 라우트
 * GET /api/price/categories - 카테고리 목록 조회
 * POST /api/price/recommend - 가격 추천 요청
 * POST /api/price/quick-recommend - 간편 가격 추천 (카테고리 자동 추정)
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { PrismaClient, type Category, type Condition } from '@prisma/client';
import {
  priceRecommendRequestSchema,
  CategoryEnum,
  ConditionEnum,
  CATEGORY_LABELS,
  CONDITION_LABELS,
  productNameSchema,
  modelNameSchema,
  type PriceRecommendRequest,
} from '../utils/validators.js';
import crawler from '../services/crawler/index.js';
import priceCalculator from '../services/priceCalculator.js';
import { optionalAuth } from '../middleware/auth.js';
import { detectCategoryWithConfidence } from '../services/categoryDetector.js';
import naverShoppingService from '../services/naverShopping.js';

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

// 간편 검색 요청 스키마
const quickRecommendRequestSchema = z.object({
  productName: productNameSchema,
  modelName: modelNameSchema,
  condition: ConditionEnum.optional().default('FAIR'),
});

// 간편 검색 응답 타입 (기존 응답 + 자동 추정 정보)
interface QuickRecommendResponse extends PriceRecommendResponse {
  data: PriceRecommendResponse['data'] & {
    categoryDetection?: {
      confidence: 'high' | 'medium' | 'low';
      score: number;
    };
  };
}

// 네이버 API 폴백 응답 타입
interface NaverFallbackResponse {
  success: true;
  data: {
    input: {
      productName: string;
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
      title: string;
      price: number;
      link: string;
      mallName: string;
      brand: string;
      category: string;
    }>;
    source: 'naver_shopping';
    notice: string;
  };
}

/**
 * POST /api/price/quick-recommend
 * 간편 가격 추천 (카테고리 자동 추정)
 * - 제품명만 입력하면 카테고리를 자동으로 추정하여 가격 추천
 * - 상태는 선택 (기본값: FAIR)
 */
router.post(
  '/quick-recommend',
  optionalAuth,
  async (
    req: Request,
    res: Response<QuickRecommendResponse | NaverFallbackResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    try {
      // 1. 요청 검증
      const { productName, modelName, condition } = quickRecommendRequestSchema.parse(req.body);

      // 2. 카테고리 자동 추정
      let detection = detectCategoryWithConfidence(productName);
      let categorySource: 'keyword' | 'naver' = 'keyword';

      // 3. 키워드 기반 추정 실패 시 네이버 API로 카테고리 추정 시도
      if (!detection.category) {
        console.log(`[간편 검색] 키워드 카테고리 추정 실패, 네이버 API 시도: ${productName}`);

        const naverCategory = await naverShoppingService.detectCategoryFromSearch(productName);

        if (naverCategory) {
          detection = {
            category: naverCategory,
            confidence: 'medium',
            score: 5,
          };
          categorySource = 'naver';
          console.log(`[간편 검색] 네이버 API 카테고리 추정 성공: ${naverCategory}`);
        }
      }

      // 4. 네이버 API로도 카테고리 추정 실패 시 → 네이버 쇼핑 가격 데이터로 폴백
      if (!detection.category) {
        console.log(`[간편 검색] 카테고리 추정 실패, 네이버 쇼핑 가격 데이터로 폴백: ${productName}`);

        const naverPriceData = await naverShoppingService.getPriceData(productName, 20);

        if (naverPriceData && naverPriceData.priceStats.sampleCount > 0) {
          // 중고가 추정 (신품 가격의 60~70% 적용)
          const usedPriceRatio = condition === 'GOOD' ? 0.7 : condition === 'FAIR' ? 0.6 : 0.5;
          const recommendedPrice = Math.round(naverPriceData.priceStats.median * usedPriceRatio);

          console.log(`[간편 검색] 네이버 쇼핑 폴백 완료 - 신품 중앙값: ${naverPriceData.priceStats.median}, 추천가: ${recommendedPrice}`);

          return res.json({
            success: true,
            data: {
              input: {
                productName,
                condition,
                conditionName: CONDITION_LABELS[condition],
              },
              recommendation: {
                recommendedPrice,
                priceMin: Math.round(naverPriceData.priceStats.min * usedPriceRatio),
                priceMax: Math.round(naverPriceData.priceStats.max * usedPriceRatio),
                averagePrice: Math.round(naverPriceData.priceStats.average * usedPriceRatio),
                medianPrice: Math.round(naverPriceData.priceStats.median * usedPriceRatio),
                confidence: 'low',
                sampleCount: naverPriceData.priceStats.sampleCount,
              },
              marketDataSnapshot: naverPriceData.items,
              source: 'naver_shopping',
              notice: '중고 거래 데이터가 부족하여 네이버 쇼핑 신품 가격을 기반으로 추정한 가격입니다. 실제 중고 거래가와 차이가 있을 수 있습니다.',
            },
          });
        }

        // 네이버 쇼핑에서도 데이터를 찾지 못한 경우
        return res.status(404).json({
          success: false,
          error: {
            code: 'NO_DATA_FOUND',
            message: '해당 제품의 가격 정보를 찾을 수 없습니다. 제품명을 확인해주세요.',
          },
        });
      }

      const category = detection.category;

      console.log(`[간편 검색] 카테고리 추정: ${productName} → ${category} (소스: ${categorySource}, 신뢰도: ${detection.confidence}, 점수: ${detection.score})`);

      // 5. 크롤링 실행
      console.log(`[간편 검색] 시작 - ${productName} ${modelName || ''} (${category}, ${condition})`);

      const crawlResult = await crawler.crawlAll(
        productName,
        modelName,
        category,
        {
          maxItemsPerPlatform: 20,
          timeout: 30000,
        }
      );

      console.log(`[간편 검색] 크롤링 완료 - ${crawlResult.stats.totalItems}개 수집 (${crawlResult.stats.crawlDuration}ms)`);

      // 4. 시세 데이터 부족 확인
      if (crawlResult.items.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NO_MARKET_DATA',
            message: '해당 제품의 시세 데이터를 찾을 수 없습니다. 제품명을 확인해주세요.',
          },
        });
      }

      // 5. 가격 계산
      const { calculation, marketDataSnapshot } = await priceCalculator.getRecommendedPrice(
        crawlResult.items,
        condition,
        category
      );

      // 6. 계산된 가격이 없는 경우
      if (calculation.recommendedPrice === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PRICE_CALCULATION_FAILED',
            message: '유효한 시세 데이터가 부족하여 가격을 계산할 수 없습니다.',
          },
        });
      }

      // 7. 로그인 사용자인 경우 히스토리에 저장
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
          console.log(`[간편 검색] 히스토리 저장 완료 - ID: ${recommendationId}`);
        } catch (saveError) {
          console.error('[간편 검색] 히스토리 저장 실패:', saveError);
        }
      }

      // 8. 성공 응답
      const response: QuickRecommendResponse = {
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
          categoryDetection: {
            confidence: detection.confidence as 'high' | 'medium' | 'low',
            score: detection.score,
          },
        },
      };

      console.log(`[간편 검색] 완료 - 추천가격: ${calculation.recommendedPrice.toLocaleString()}원`);

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

export default router;
