/**
 * 가격 알림 API 라우트
 * @swagger
 * tags:
 *   name: Alerts
 *   description: 가격 알림 API
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { paginationSchema, CATEGORY_LABELS, CONDITION_LABELS } from '../utils/validators.js';
import prisma from '../lib/prisma.js';
const router = Router();

// 사용자당 최대 알림 개수
const MAX_ALERTS_PER_USER = 10;

// 알림 생성 요청 스키마
const createAlertSchema = z.object({
  category: z.enum([
    'SMARTPHONE',
    'LAPTOP',
    'TABLET',
    'SMARTWATCH',
    'EARPHONE',
    'SPEAKER',
    'MONITOR',
    'KEYBOARD_MOUSE',
    'TV',
  ]),
  productName: z.string().min(1, '제품명을 입력해주세요').max(200),
  modelName: z.string().max(100).optional(),
  condition: z.enum(['GOOD', 'FAIR', 'POOR']),
  targetPrice: z
    .number()
    .int()
    .min(1000, '목표 가격은 1,000원 이상이어야 합니다')
    .max(100000000, '목표 가격은 1억원 이하여야 합니다'),
});

// 알림 수정 요청 스키마
const updateAlertSchema = z.object({
  targetPrice: z
    .number()
    .int()
    .min(1000, '목표 가격은 1,000원 이상이어야 합니다')
    .max(100000000, '목표 가격은 1억원 이하여야 합니다')
    .optional(),
  isActive: z.boolean().optional(),
});

// 알림 ID 파라미터 스키마
const alertIdSchema = z.object({
  id: z.string().cuid(),
});

/**
 * @swagger
 * /api/alerts:
 *   post:
 *     summary: 가격 알림 생성
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
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
 *               - targetPrice
 *             properties:
 *               category:
 *                 $ref: '#/components/schemas/Category'
 *               productName:
 *                 type: string
 *                 example: 아이폰 15 프로
 *               modelName:
 *                 type: string
 *                 example: 256GB
 *               condition:
 *                 $ref: '#/components/schemas/Condition'
 *               targetPrice:
 *                 type: integer
 *                 minimum: 1000
 *                 maximum: 100000000
 *                 example: 1000000
 *     responses:
 *       201:
 *         description: 알림 생성 성공
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
 *                   $ref: '#/components/schemas/PriceAlert'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: 중복 알림
 */
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const data = createAlertSchema.parse(req.body);

    // 사용자의 활성 알림 개수 확인
    const activeAlertCount = await prisma.priceAlert.count({
      where: { userId, isActive: true },
    });

    if (activeAlertCount >= MAX_ALERTS_PER_USER) {
      throw new AppError(ErrorCodes.QUOTA_EXCEEDED, {
        message: `알림은 최대 ${MAX_ALERTS_PER_USER}개까지 등록할 수 있습니다.`,
      });
    }

    // 동일한 제품에 대한 알림이 이미 있는지 확인
    const existingAlert = await prisma.priceAlert.findFirst({
      where: {
        userId,
        category: data.category,
        productName: data.productName,
        modelName: data.modelName || null,
        condition: data.condition,
        isActive: true,
      },
    });

    if (existingAlert) {
      throw new AppError(ErrorCodes.DUPLICATE_RESOURCE, {
        message: '이미 동일한 제품에 대한 알림이 등록되어 있습니다.',
      });
    }

    // 알림 생성
    const alert = await prisma.priceAlert.create({
      data: {
        userId,
        category: data.category,
        productName: data.productName,
        modelName: data.modelName,
        condition: data.condition,
        targetPrice: data.targetPrice,
      },
    });

    res.status(201).json({
      success: true,
      message: '가격 알림이 등록되었습니다.',
      data: formatAlertResponse(alert),
    });
  })
);

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: 내 알림 목록 조회
 *     tags: [Alerts]
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
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *         description: 활성 알림만 조회
 *     responses:
 *       200:
 *         description: 알림 목록
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
 *                         $ref: '#/components/schemas/PriceAlert'
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

    // 활성 알림만 보기 옵션
    const activeOnly = req.query.activeOnly === 'true';

    const whereClause = {
      userId,
      ...(activeOnly && { isActive: true }),
    };

    const [alerts, totalCount] = await Promise.all([
      prisma.priceAlert.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.priceAlert.count({ where: whereClause }),
    ]);

    const items = alerts.map(formatAlertResponse);
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
 * /api/alerts/{id}:
 *   get:
 *     summary: 알림 상세 조회
 *     tags: [Alerts]
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
 *         description: 알림 상세 정보
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = alertIdSchema.parse(req.params);

    const alert = await prisma.priceAlert.findFirst({
      where: { id, userId },
      include: {
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!alert) {
      throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, {
        message: '알림을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: {
        ...formatAlertResponse(alert),
        recentNotifications: alert.notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          createdAt: n.createdAt,
        })),
      },
    });
  })
);

/**
 * @swagger
 * /api/alerts/{id}:
 *   patch:
 *     summary: 알림 수정
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetPrice:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 알림 수정 성공
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = alertIdSchema.parse(req.params);
    const data = updateAlertSchema.parse(req.body);

    // 본인의 알림인지 확인
    const existingAlert = await prisma.priceAlert.findFirst({
      where: { id, userId },
    });

    if (!existingAlert) {
      throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, {
        message: '알림을 찾을 수 없습니다.',
      });
    }

    // 알림 수정
    const alert = await prisma.priceAlert.update({
      where: { id },
      data: {
        ...(data.targetPrice !== undefined && { targetPrice: data.targetPrice }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    res.json({
      success: true,
      message: '알림이 수정되었습니다.',
      data: formatAlertResponse(alert),
    });
  })
);

/**
 * @swagger
 * /api/alerts/{id}:
 *   delete:
 *     summary: 알림 삭제
 *     tags: [Alerts]
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
 *         description: 알림 삭제 성공
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
    const { id } = alertIdSchema.parse(req.params);

    // 본인의 알림인지 확인
    const alert = await prisma.priceAlert.findFirst({
      where: { id, userId },
    });

    if (!alert) {
      throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, {
        message: '알림을 찾을 수 없습니다.',
      });
    }

    await prisma.priceAlert.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '알림이 삭제되었습니다.',
    });
  })
);

// 알림 응답 포맷팅 헬퍼 함수
function formatAlertResponse(alert: {
  id: string;
  userId: string;
  category: string;
  productName: string;
  modelName: string | null;
  condition: string;
  targetPrice: number;
  currentPrice: number | null;
  isActive: boolean;
  lastCheckedAt: Date | null;
  notifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const priceDiff = alert.currentPrice !== null ? alert.currentPrice - alert.targetPrice : null;
  const priceReached = alert.currentPrice !== null && alert.currentPrice <= alert.targetPrice;

  return {
    id: alert.id,
    category: alert.category,
    categoryLabel: CATEGORY_LABELS[alert.category as keyof typeof CATEGORY_LABELS],
    productName: alert.productName,
    modelName: alert.modelName,
    condition: alert.condition,
    conditionLabel: CONDITION_LABELS[alert.condition as keyof typeof CONDITION_LABELS],
    targetPrice: alert.targetPrice,
    currentPrice: alert.currentPrice,
    priceDiff,
    priceReached,
    isActive: alert.isActive,
    lastCheckedAt: alert.lastCheckedAt,
    notifiedAt: alert.notifiedAt,
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt,
  };
}

export default router;
