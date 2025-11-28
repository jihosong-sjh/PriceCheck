/**
 * JWT 인증 미들웨어
 * - Authorization 헤더에서 Bearer 토큰 추출
 * - 토큰 검증 및 사용자 정보 추출
 * - req.user에 사용자 정보 첨부
 */

import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JwtPayload } from '../services/auth.js';
import { AppError } from './errorHandler.js';

/**
 * Request 타입 확장 - user 필드 추가
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authorization 헤더에서 Bearer 토큰 추출
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * 필수 인증 미들웨어
 * - 토큰이 없거나 유효하지 않으면 401 에러 반환
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    throw new AppError('인증이 필요합니다.', 401);
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      throw new AppError('토큰이 만료되었습니다. 다시 로그인해주세요.', 401);
    }
    throw new AppError('유효하지 않은 토큰입니다.', 401);
  }
}

/**
 * 선택적 인증 미들웨어
 * - 토큰이 있으면 검증하고 req.user 설정
 * - 토큰이 없거나 유효하지 않아도 계속 진행
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
  } catch {
    // 토큰이 유효하지 않아도 무시하고 계속 진행
  }

  next();
}
