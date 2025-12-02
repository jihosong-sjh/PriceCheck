/**
 * 인증 API 라우트
 * @swagger
 * tags:
 *   name: Auth
 *   description: 인증 관련 API
 */

import { Router, type Request, type Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter, passwordChangeLimiter, refreshTokenLimiter } from '../middleware/rateLimiter.js';
import {
  signup,
  login,
  getUserById,
  changePassword,
  deleteAccount,
  refreshAccessToken,
  logout,
  logoutAll,
} from '../services/auth.js';
import {
  signupSchema,
  loginSchema,
  changePasswordSchema,
  deleteAccountSchema,
  validateBody,
} from '../utils/validators.js';
import { ErrorCodes } from '../utils/errors.js';
import { z } from 'zod';

const router = Router();

// 리프레시 토큰 스키마
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, '리프레시 토큰이 필요합니다.'),
});

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: 회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 이메일 주소
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: 비밀번호 (8자 이상, 영문+숫자 조합)
 *                 example: password123
 *     responses:
 *       201:
 *         description: 회원가입 성공
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
 *                   example: 회원가입이 완료되었습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: 이미 등록된 이메일
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post(
  '/signup',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = validateBody(signupSchema, req.body);
    const result = await signup(email, password);

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          createdAt: result.user.createdAt,
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  })
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: 로그인 성공
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
 *                   example: 로그인되었습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: 인증 실패
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = validateBody(loginSchema, req.body);
    const result = await login(email, password);

    res.json({
      success: true,
      message: '로그인되었습니다.',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          createdAt: result.user.createdAt,
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  })
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 액세스 토큰 갱신
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: 리프레시 토큰
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
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
 *                   example: 토큰이 갱신되었습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: 유효하지 않은 리프레시 토큰
 */
router.post(
  '/refresh',
  refreshTokenLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = validateBody(refreshTokenSchema, req.body);
    const result = await refreshAccessToken(refreshToken);

    res.json({
      success: true,
      message: '토큰이 갱신되었습니다.',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  })
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: 로그아웃
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그아웃 성공
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
 *                   example: 로그아웃되었습니다.
 */
router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = validateBody(refreshTokenSchema, req.body);
    await logout(refreshToken);

    res.json({
      success: true,
      message: '로그아웃되었습니다.',
    });
  })
);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: 모든 기기에서 로그아웃
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 전체 로그아웃 성공
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
 *                   example: 모든 기기에서 로그아웃되었습니다.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/logout-all',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    await logoutAll(userId);

    res.json({
      success: true,
      message: '모든 기기에서 로그아웃되었습니다.',
    });
  })
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 현재 사용자 정보 조회
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 조회 성공
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const user = await getUserById(userId);

    if (!user) {
      throw new AppError(ErrorCodes.USER_NOT_FOUND);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/auth/password:
 *   put:
 *     summary: 비밀번호 변경
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: 현재 비밀번호
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: 새 비밀번호 (8자 이상, 영문+숫자 조합)
 *     responses:
 *       200:
 *         description: 비밀번호 변경 성공
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
 *                   example: 비밀번호가 변경되었습니다.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.put(
  '/password',
  requireAuth,
  passwordChangeLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = validateBody(changePasswordSchema, req.body);

    await changePassword(userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: '비밀번호가 변경되었습니다.',
    });
  })
);

/**
 * @swagger
 * /api/auth/account:
 *   delete:
 *     summary: 회원 탈퇴
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: 현재 비밀번호 (확인용)
 *     responses:
 *       200:
 *         description: 회원 탈퇴 성공
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
 *                   example: 계정이 삭제되었습니다.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete(
  '/account',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { password } = validateBody(deleteAccountSchema, req.body);

    await deleteAccount(userId, password);

    res.json({
      success: true,
      message: '계정이 삭제되었습니다.',
    });
  })
);

export default router;
