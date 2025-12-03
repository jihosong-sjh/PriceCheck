/**
 * 알림 메시지 API 라우트
 * - GET /api/notifications - 알림 메시지 목록
 * - GET /api/notifications/unread-count - 읽지 않은 알림 개수
 * - PATCH /api/notifications/:id/read - 읽음 처리
 * - POST /api/notifications/read-all - 전체 읽음 처리
 * - DELETE /api/notifications/:id - 알림 삭제
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { paginationSchema } from '../utils/validators.js';
import prisma from '../lib/prisma.js';
const router = Router();

// 알림 ID 파라미터 스키마
const notificationIdSchema = z.object({
  id: z.string().cuid(),
});

// 알림 타입 라벨
const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  PRICE_DROP: '목표가격 도달',
  PRICE_CHANGE: '가격 변동',
  SYSTEM: '시스템 알림',
};

/**
 * GET /api/notifications
 * 알림 메시지 목록 조회 (인증 필요)
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    // 읽지 않은 알림만 보기 옵션
    const unreadOnly = req.query.unreadOnly === 'true';

    const whereClause = {
      userId,
      ...(unreadOnly && { isRead: false }),
    };

    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        include: {
          alert: {
            select: {
              id: true,
              category: true,
              productName: true,
              modelName: true,
              targetPrice: true,
              currentPrice: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: whereClause }),
    ]);

    const items = notifications.map(formatNotificationResponse);
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
 * GET /api/notifications/unread-count
 * 읽지 않은 알림 개수 조회 (인증 필요)
 */
router.get(
  '/unread-count',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({
      success: true,
      data: { count },
    });
  })
);

/**
 * PATCH /api/notifications/:id/read
 * 알림 읽음 처리 (인증 필요)
 */
router.patch(
  '/:id/read',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = notificationIdSchema.parse(req.params);

    // 본인의 알림인지 확인
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new AppError('알림을 찾을 수 없습니다.', 404);
    }

    if (notification.isRead) {
      return res.json({
        success: true,
        message: '이미 읽은 알림입니다.',
      });
    }

    await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: '알림을 읽음 처리했습니다.',
    });
  })
);

/**
 * POST /api/notifications/read-all
 * 모든 알림 읽음 처리 (인증 필요)
 */
router.post(
  '/read-all',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: `${result.count}개의 알림을 읽음 처리했습니다.`,
      data: { updatedCount: result.count },
    });
  })
);

/**
 * DELETE /api/notifications/:id
 * 알림 삭제 (인증 필요)
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = notificationIdSchema.parse(req.params);

    // 본인의 알림인지 확인
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new AppError('알림을 찾을 수 없습니다.', 404);
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '알림이 삭제되었습니다.',
    });
  })
);

// 알림 응답 포맷팅 헬퍼 함수
function formatNotificationResponse(notification: {
  id: string;
  userId: string;
  alertId: string | null;
  type: string;
  title: string;
  message: string;
  data: unknown;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  alert?: {
    id: string;
    category: string;
    productName: string;
    modelName: string | null;
    targetPrice: number;
    currentPrice: number | null;
  } | null;
}) {
  return {
    id: notification.id,
    type: notification.type,
    typeLabel: NOTIFICATION_TYPE_LABELS[notification.type] || notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data,
    isRead: notification.isRead,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    alert: notification.alert
      ? {
          id: notification.alert.id,
          category: notification.alert.category,
          productName: notification.alert.productName,
          modelName: notification.alert.modelName,
          targetPrice: notification.alert.targetPrice,
          currentPrice: notification.alert.currentPrice,
        }
      : null,
  };
}

export default router;
