/**
 * 가격 추천 API 라우트
 * @swagger
 * tags:
 *   name: Price
 *   description: 가격 추천 API
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
import { AppError, ErrorCodes } from '../utils/errors.js';
import crawler from '../services/crawler/index.js';
import priceCalculator from '../services/priceCalculator.js';
import { optionalAuth } from '../middleware/auth.js';
import { detectCategoryWithConfidence } from '../services/categoryDetector.js';
import naverShoppingService from '../services/naverShopping.js';
import { logBusiness, logPerformance } from '../lib/logger.js';

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
 * @swagger
 * /api/price/categories:
 *   get:
 *     summary: 카테고리 목록 조회
 *     tags: [Price]
 *     responses:
 *       200:
 *         description: 카테고리 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           code:
 *                             $ref: '#/components/schemas/Category'
 *                           name:
 *                             type: string
 *                             example: 스마트폰
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
 * @swagger
 * /api/price/conditions:
 *   get:
 *     summary: 상태 목록 조회
 *     tags: [Price]
 *     responses:
 *       200:
 *         description: 상태 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     conditions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           code:
 *                             $ref: '#/components/schemas/Condition'
 *                           name:
 *                             type: string
 *                             example: 상
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

/**
 * @swagger
 * /api/price/recommend:
 *   post:
 *     summary: 가격 추천 요청
 *     description: 카테고리, 제품명, 상태를 입력받아 적정 중고가격을 추천합니다.
 *     tags: [Price]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - productName
 *               - condition
 *             properties:
 *               category:
 *                 $ref: '#/components/schemas/Category'
 *               productName:
 *                 type: string
 *                 description: 제품명
 *                 example: 아이폰 15 프로
 *               modelName:
 *                 type: string
 *                 description: 모델명 (선택)
 *                 example: 256GB
 *               condition:
 *                 $ref: '#/components/schemas/Condition'
 *     responses:
 *       200:
 *         description: 가격 추천 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: 추천 ID (로그인 시)
 *                     input:
 *                       type: object
 *                     recommendation:
 *                       $ref: '#/components/schemas/PriceRecommendation'
 *                     marketDataSnapshot:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MarketDataItem'
 *                     crawlStats:
 *                       type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: 시세 데이터 없음
 */
router.post(
  '/recommend',
  optionalAuth,
  async (
    req: Request,
    res: Response<PriceRecommendResponse | { success: false; error: object }>,
    next: NextFunction
  ) => {
    const startTime = Date.now();

    try {
      const validatedData: PriceRecommendRequest = priceRecommendRequestSchema.parse(req.body);
      const { category, productName, modelName, condition } = validatedData;

      logBusiness('가격 추천 시작', { productName, modelName, category, condition });

      const crawlResult = await crawler.crawlAll(productName, modelName, category, {
        maxItemsPerPlatform: 20,
        timeout: 30000,
      });

      logPerformance('크롤링 완료', crawlResult.stats.crawlDuration, {
        totalItems: crawlResult.stats.totalItems,
      });

      if (crawlResult.items.length === 0) {
        throw new AppError(ErrorCodes.NO_MARKET_DATA, {
          message: '해당 제품의 시세 데이터를 찾을 수 없습니다. 제품명을 확인해주세요.',
        });
      }

      const { calculation, marketDataSnapshot } = await priceCalculator.getRecommendedPrice(
        crawlResult.items,
        condition,
        category
      );

      if (calculation.recommendedPrice === 0) {
        throw new AppError(ErrorCodes.PRICE_CALCULATION_FAILED);
      }

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
        } catch (saveError) {
          // 히스토리 저장 실패는 로깅만
          logBusiness('히스토리 저장 실패', { error: String(saveError) });
        }
      }

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

      logPerformance('가격 추천 완료', Date.now() - startTime, {
        recommendedPrice: calculation.recommendedPrice,
      });

      return res.json(response);
    } catch (error) {
      if (error instanceof ZodError) {
        const appError = new AppError(ErrorCodes.VALIDATION_ERROR, {
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return res.status(400).json({
          success: false,
          error: appError.toResponse().error,
        });
      }
      return next(error);
    }
  }
);

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

/**
 * @swagger
 * /api/price/quick-recommend:
 *   post:
 *     summary: 간편 가격 추천
 *     description: |
 *       제품명만 입력하면 카테고리를 자동 추정하여 가격을 추천합니다.
 *       카테고리 추정 실패 시 네이버 쇼핑 데이터로 폴백합니다.
 *     tags: [Price]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *             properties:
 *               productName:
 *                 type: string
 *                 description: 제품명
 *                 example: 갤럭시 S24 울트라
 *               modelName:
 *                 type: string
 *                 description: 모델명 (선택)
 *               condition:
 *                 $ref: '#/components/schemas/Condition'
 *                 default: FAIR
 *     responses:
 *       200:
 *         description: 가격 추천 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     input:
 *                       type: object
 *                     recommendation:
 *                       $ref: '#/components/schemas/PriceRecommendation'
 *                     categoryDetection:
 *                       type: object
 *                       properties:
 *                         confidence:
 *                           type: string
 *                           enum: [high, medium, low]
 *                         score:
 *                           type: number
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: 시세 데이터 없음
 */
router.post(
  '/quick-recommend',
  optionalAuth,
  async (
    req: Request,
    res: Response<QuickRecommendResponse | NaverFallbackResponse | { success: false; error: object }>,
    next: NextFunction
  ) => {
    const startTime = Date.now();

    try {
      const { productName, modelName, condition } = quickRecommendRequestSchema.parse(req.body);

      logBusiness('간편 검색 시작', { productName, modelName, condition });

      // 카테고리 자동 추정
      let detection = detectCategoryWithConfidence(productName);
      let categorySource: 'keyword' | 'naver' = 'keyword';

      // 키워드 기반 추정 실패 시 네이버 API로 카테고리 추정 시도
      if (!detection.category) {
        const naverCategory = await naverShoppingService.detectCategoryFromSearch(productName);

        if (naverCategory) {
          detection = {
            category: naverCategory,
            confidence: 'medium',
            score: 5,
          };
          categorySource = 'naver';
        }
      }

      // 네이버 API로도 카테고리 추정 실패 시 → 네이버 쇼핑 가격 데이터로 폴백
      if (!detection.category) {
        const naverPriceData = await naverShoppingService.getPriceData(productName, 20);

        if (naverPriceData && naverPriceData.priceStats.sampleCount > 0) {
          const usedPriceRatio = condition === 'GOOD' ? 0.7 : condition === 'FAIR' ? 0.6 : 0.5;
          const recommendedPrice = Math.round(naverPriceData.priceStats.median * usedPriceRatio);

          logBusiness('네이버 쇼핑 폴백', {
            median: naverPriceData.priceStats.median,
            recommendedPrice,
          });

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
              notice:
                '중고 거래 데이터가 부족하여 네이버 쇼핑 신품 가격을 기반으로 추정한 가격입니다. 실제 중고 거래가와 차이가 있을 수 있습니다.',
            },
          });
        }

        throw new AppError(ErrorCodes.NO_MARKET_DATA, {
          message: '해당 제품의 가격 정보를 찾을 수 없습니다. 제품명을 확인해주세요.',
        });
      }

      const category = detection.category;

      logBusiness('카테고리 추정', { category, source: categorySource, confidence: detection.confidence });

      // 크롤링 실행
      const crawlResult = await crawler.crawlAll(productName, modelName, category, {
        maxItemsPerPlatform: 20,
        timeout: 30000,
      });

      logPerformance('크롤링 완료', crawlResult.stats.crawlDuration, {
        totalItems: crawlResult.stats.totalItems,
      });

      if (crawlResult.items.length === 0) {
        throw new AppError(ErrorCodes.NO_MARKET_DATA);
      }

      const { calculation, marketDataSnapshot } = await priceCalculator.getRecommendedPrice(
        crawlResult.items,
        condition,
        category
      );

      if (calculation.recommendedPrice === 0) {
        throw new AppError(ErrorCodes.PRICE_CALCULATION_FAILED);
      }

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
        } catch (saveError) {
          logBusiness('히스토리 저장 실패', { error: String(saveError) });
        }
      }

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

      logPerformance('간편 검색 완료', Date.now() - startTime, {
        recommendedPrice: calculation.recommendedPrice,
      });

      return res.json(response);
    } catch (error) {
      if (error instanceof ZodError) {
        const appError = new AppError(ErrorCodes.VALIDATION_ERROR, {
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return res.status(400).json({
          success: false,
          error: appError.toResponse().error,
        });
      }
      return next(error);
    }
  }
);

export default router;
