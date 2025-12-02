/**
 * 인증 API 라우트
 * - POST /api/auth/signup - 회원가입
 * - POST /api/auth/login - 로그인
 * - POST /api/auth/refresh - 토큰 갱신
 * - POST /api/auth/logout - 로그아웃
 * - GET /api/auth/me - 현재 사용자 정보
 * - PUT /api/auth/password - 비밀번호 변경
 * - DELETE /api/auth/account - 회원 탈퇴
 */

import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
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
import { z } from 'zod';

const router = Router();

// 리프레시 토큰 스키마
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, '리프레시 토큰이 필요합니다.'),
});

/**
 * POST /api/auth/signup
 * 회원가입 (Rate Limiting 적용)
 */
router.post(
  '/signup',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    // 입력 검증
    const { email, password } = validateBody(signupSchema, req.body);

    // 회원가입 처리
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
 * POST /api/auth/login
 * 로그인 (Rate Limiting 적용)
 */
router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    // 입력 검증
    const { email, password } = validateBody(loginSchema, req.body);

    // 로그인 처리
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
 * POST /api/auth/refresh
 * 액세스 토큰 갱신 (Rate Limiting 적용)
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
        refreshToken: result.refreshToken, // 새 리프레시 토큰이 발급된 경우에만 포함
      },
    });
  })
);

/**
 * POST /api/auth/logout
 * 로그아웃 (리프레시 토큰 폐기)
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
 * POST /api/auth/logout-all
 * 모든 기기에서 로그아웃 (인증 필요)
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
 * GET /api/auth/me
 * 현재 사용자 정보 조회
 */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    // 토큰에서 사용자 ID 추출
    const userId = req.user!.userId;

    // 사용자 정보 조회
    const user = await getUserById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
      return;
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
 * PUT /api/auth/password
 * 비밀번호 변경 (Rate Limiting 적용)
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
 * DELETE /api/auth/account
 * 회원 탈퇴
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
