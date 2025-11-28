/**
 * 히스토리 API 라우트
 * - GET /api/history - 추천 히스토리 목록 조회
 * - GET /api/history/:id - 추천 히스토리 상세 조회
 */

import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import {
  paginationSchema,
  historyParamsSchema,
  CATEGORY_LABELS,
  CONDITION_LABELS,
} from '../utils/validators.js';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/history
 * 추천 히스토리 목록 조회 (인증 필요)
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // 페이지네이션 검증
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    // 히스토리 목록 조회
    const [recommendations, totalCount] = await Promise.all([
      prisma.priceRecommendation.findMany({
        where: { userId },
        select: {
          id: true,
          category: true,
          productName: true,
          modelName: true,
          condition: true,
          recommendedPrice: true,
          priceMin: true,
          priceMax: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.priceRecommendation.count({ where: { userId } }),
    ]);

    // 응답 포맷팅
    const items = recommendations.map((rec) => ({
      id: rec.id,
      category: rec.category,
      categoryLabel: CATEGORY_LABELS[rec.category],
      productName: rec.productName,
      modelName: rec.modelName,
      condition: rec.condition,
      conditionLabel: CONDITION_LABELS[rec.condition],
      recommendedPrice: rec.recommendedPrice,
      priceMin: rec.priceMin,
      priceMax: rec.priceMax,
      createdAt: rec.createdAt,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  })
);

/**
 * GET /api/history/:id
 * 추천 히스토리 상세 조회 (인증 필요)
 */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // 파라미터 검증
    const { id } = historyParamsSchema.parse(req.params);

    // 히스토리 상세 조회
    const recommendation = await prisma.priceRecommendation.findFirst({
      where: { id, userId },
      include: {
        images: {
          select: {
            id: true,
            imageUrl: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: 'asc' },
        },
      },
    });

    if (!recommendation) {
      throw new AppError('히스토리를 찾을 수 없습니다.', 404);
    }

    // 응답 포맷팅
    const response = {
      id: recommendation.id,
      category: recommendation.category,
      categoryLabel: CATEGORY_LABELS[recommendation.category],
      productName: recommendation.productName,
      modelName: recommendation.modelName,
      condition: recommendation.condition,
      conditionLabel: CONDITION_LABELS[recommendation.condition],
      recommendedPrice: recommendation.recommendedPrice,
      priceMin: recommendation.priceMin,
      priceMax: recommendation.priceMax,
      marketDataSnapshot: recommendation.marketDataSnapshot,
      images: recommendation.images,
      createdAt: recommendation.createdAt,
    };

    res.json({
      success: true,
      data: response,
    });
  })
);

export default router;
