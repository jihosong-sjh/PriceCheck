/**
 * 인증 API 라우트
 * - POST /api/auth/signup - 회원가입
 * - POST /api/auth/login - 로그인
 * - GET /api/auth/me - 현재 사용자 정보
 */

import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { signup, login, getUserById, changePassword, deleteAccount } from '../services/auth.js';
import {
  signupSchema,
  loginSchema,
  changePasswordSchema,
  deleteAccountSchema,
  validateBody,
} from '../utils/validators.js';

const router = Router();

/**
 * POST /api/auth/signup
 * 회원가입
 */
router.post(
  '/signup',
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
        token: result.token,
      },
    });
  })
);

/**
 * POST /api/auth/login
 * 로그인
 */
router.post(
  '/login',
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
        token: result.token,
      },
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
 * 비밀번호 변경
 */
router.put(
  '/password',
  requireAuth,
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
