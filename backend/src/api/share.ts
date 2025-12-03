/**
 * 공유 링크 API 라우트
 * - GET /api/share/:id - 공개 공유 링크로 추천 결과 조회 (인증 불필요)
 */

import { Router, type Request, type Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import {
  historyParamsSchema,
  CATEGORY_LABELS,
  CONDITION_LABELS,
} from '../utils/validators.js';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * @swagger
 * /api/share/{id}:
 *   get:
 *     summary: 공유 링크로 가격 추천 결과 조회
 *     description: 인증 없이 저장된 가격 추천 결과를 조회합니다. 공유 링크 접근 시 사용됩니다.
 *     tags: [Share]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 추천 결과 ID
 *     responses:
 *       200:
 *         description: 추천 결과 조회 성공
 *       404:
 *         description: 결과를 찾을 수 없음
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    // 파라미터 검증
    const { id } = historyParamsSchema.parse(req.params);

    // 추천 결과 조회 (userId 체크 없음 - 공개 접근)
    const recommendation = await prisma.priceRecommendation.findUnique({
      where: { id },
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
      throw new AppError('결과를 찾을 수 없습니다.', 404);
    }

    // 응답 포맷팅 (히스토리 API와 동일한 형식)
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
