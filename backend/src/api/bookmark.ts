/**
 * 북마크(찜하기) API 라우트
 * @swagger
 * tags:
 *   name: Bookmarks
 *   description: 북마크(찜) API
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { paginationSchema, CATEGORY_LABELS, CONDITION_LABELS } from '../utils/validators.js';
import prisma from '../lib/prisma.js';
const router = Router();

// 북마크 생성 요청 스키마
const createBookmarkSchema = z.object({
  recommendationId: z.string().cuid().optional(),
  // 독립 저장용 필드
  category: z.enum(['SMARTPHONE', 'LAPTOP', 'TABLET', 'SMARTWATCH', 'EARPHONE']).optional(),
  productName: z.string().min(1).max(200).optional(),
  modelName: z.string().max(100).optional(),
  memo: z.string().max(500).optional(),
});

// 북마크 ID 파라미터 스키마
const bookmarkIdSchema = z.object({
  id: z.string().cuid(),
});

// 추천 ID 파라미터 스키마
const recommendationIdSchema = z.object({
  recommendationId: z.string().cuid(),
});

/**
 * @swagger
 * /api/bookmarks:
 *   post:
 *     summary: 북마크 추가
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recommendationId:
 *                 type: string
 *                 description: 가격 추천 ID (선택)
 *               category:
 *                 $ref: '#/components/schemas/Category'
 *               productName:
 *                 type: string
 *               modelName:
 *                 type: string
 *               memo:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: 북마크 추가 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Bookmark'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: 이미 북마크됨
 */
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const data = createBookmarkSchema.parse(req.body);

    // recommendationId가 있는 경우 중복 확인
    if (data.recommendationId) {
      const existingBookmark = await prisma.bookmark.findUnique({
        where: {
          userId_recommendationId: {
            userId,
            recommendationId: data.recommendationId,
          },
        },
      });

      if (existingBookmark) {
        throw new AppError(ErrorCodes.DUPLICATE_RESOURCE, {
          message: '이미 찜한 항목입니다.',
        });
      }

      // 추천 기록이 존재하는지 확인
      const recommendation = await prisma.priceRecommendation.findUnique({
        where: { id: data.recommendationId },
      });

      if (!recommendation) {
        throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, {
          message: '추천 기록을 찾을 수 없습니다.',
        });
      }
    }

    // 북마크 생성
    const bookmark = await prisma.bookmark.create({
      data: {
        userId,
        recommendationId: data.recommendationId,
        category: data.category,
        productName: data.productName,
        modelName: data.modelName,
        memo: data.memo,
      },
      include: {
        recommendation: {
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
        },
      },
    });

    res.status(201).json({
      success: true,
      message: '찜 목록에 추가되었습니다.',
      data: formatBookmarkResponse(bookmark),
    });
  })
);

/**
 * @swagger
 * /api/bookmarks:
 *   get:
 *     summary: 북마크 목록 조회
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 북마크 목록
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
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Bookmark'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const [bookmarks, totalCount] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
        include: {
          recommendation: {
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
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bookmark.count({ where: { userId } }),
    ]);

    const items = bookmarks.map(formatBookmarkResponse);
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
 * @swagger
 * /api/bookmarks/check/{recommendationId}:
 *   get:
 *     summary: 북마크 여부 확인
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 북마크 여부
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
 *                     isBookmarked:
 *                       type: boolean
 *                     bookmarkId:
 *                       type: string
 *                       nullable: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/check/:recommendationId',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { recommendationId } = recommendationIdSchema.parse(req.params);

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_recommendationId: {
          userId,
          recommendationId,
        },
      },
      select: {
        id: true,
      },
    });

    res.json({
      success: true,
      data: {
        isBookmarked: !!bookmark,
        bookmarkId: bookmark?.id || null,
      },
    });
  })
);

/**
 * @swagger
 * /api/bookmarks/{id}:
 *   delete:
 *     summary: 북마크 삭제
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 북마크 삭제 성공
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = bookmarkIdSchema.parse(req.params);

    // 본인의 북마크인지 확인
    const bookmark = await prisma.bookmark.findFirst({
      where: { id, userId },
    });

    if (!bookmark) {
      throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, {
        message: '북마크를 찾을 수 없습니다.',
      });
    }

    await prisma.bookmark.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '찜 목록에서 삭제되었습니다.',
    });
  })
);

// 북마크 응답 포맷팅 헬퍼 함수
function formatBookmarkResponse(bookmark: {
  id: string;
  userId: string;
  recommendationId: string | null;
  category: string | null;
  productName: string | null;
  modelName: string | null;
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
  recommendation?: {
    id: string;
    category: string;
    productName: string;
    modelName: string | null;
    condition: string;
    recommendedPrice: number;
    priceMin: number;
    priceMax: number;
    createdAt: Date;
  } | null;
}) {
  // 추천 기록이 있는 경우
  if (bookmark.recommendation) {
    const rec = bookmark.recommendation;
    return {
      id: bookmark.id,
      type: 'recommendation' as const,
      recommendationId: rec.id,
      category: rec.category,
      categoryLabel: CATEGORY_LABELS[rec.category as keyof typeof CATEGORY_LABELS],
      productName: rec.productName,
      modelName: rec.modelName,
      condition: rec.condition,
      conditionLabel: CONDITION_LABELS[rec.condition as keyof typeof CONDITION_LABELS],
      recommendedPrice: rec.recommendedPrice,
      priceMin: rec.priceMin,
      priceMax: rec.priceMax,
      memo: bookmark.memo,
      createdAt: bookmark.createdAt,
      recommendationCreatedAt: rec.createdAt,
    };
  }

  // 독립 저장인 경우
  return {
    id: bookmark.id,
    type: 'standalone' as const,
    recommendationId: null,
    category: bookmark.category,
    categoryLabel: bookmark.category
      ? CATEGORY_LABELS[bookmark.category as keyof typeof CATEGORY_LABELS]
      : null,
    productName: bookmark.productName,
    modelName: bookmark.modelName,
    condition: null,
    conditionLabel: null,
    recommendedPrice: null,
    priceMin: null,
    priceMax: null,
    memo: bookmark.memo,
    createdAt: bookmark.createdAt,
    recommendationCreatedAt: null,
  };
}

export default router;
